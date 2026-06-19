import http.server
import socketserver
import os
import sys
import json
import socket
import subprocess
import threading
import signal
import time
from datetime import datetime

PORT = int(os.environ.get("PORT", "8080"))
DB_FILE = os.environ.get("DB_FILE", 'db.json')


def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except (json.JSONDecodeError, OSError):
            pass
    return {"mods": [], "users": [], "siteSettings": {}, "activityLog": []}


def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def parse_time(value):
    if not value:
        return 0
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()
    except (ValueError, TypeError):
        return 0


def merge_users(existing, incoming):
    by_uid = {u.get('uid'): u for u in existing if u.get('uid')}
    for user in incoming:
        uid = user.get('uid')
        if not uid:
            continue
        current = by_uid.get(uid)
        if not current:
            by_uid[uid] = user
            continue
        if parse_time(user.get('updatedAt')) >= parse_time(current.get('updatedAt')):
            merged = {**current, **user}
        else:
            merged = {**user, **current}
        if current.get('settings') or user.get('settings'):
            merged['settings'] = {**(current.get('settings') or {}), **(user.get('settings') or {})}
        by_uid[uid] = merged
    return list(by_uid.values())


def merge_mods(existing, incoming):
    by_id = {m.get('id'): m for m in existing if m.get('id')}
    for mod in incoming:
        mod_id = mod.get('id')
        if not mod_id:
            continue
        current = by_id.get(mod_id)
        if not current:
            by_id[mod_id] = mod
            continue
        if parse_time(mod.get('updatedAt')) >= parse_time(current.get('updatedAt')):
            merged = {**current, **mod}
        else:
            merged = {**mod, **current}
        merged['downloads'] = max(current.get('downloads') or 0, mod.get('downloads') or 0)
        merged['follows'] = max(current.get('follows') or 0, mod.get('follows') or 0)
        merged['views'] = max(current.get('views') or 0, mod.get('views') or 0)
        by_id[mod_id] = merged
    return list(by_id.values())


def merge_activity(existing, incoming, limit=200):
    combined = (existing or []) + (incoming or [])
    seen = set()
    unique = []
    for entry in reversed(combined):
        key = json.dumps(entry, sort_keys=True, ensure_ascii=False)
        if key in seen:
            continue
        seen.add(key)
        unique.append(entry)
        if len(unique) >= limit:
            break
    return list(reversed(unique))


class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/sync':
            try:
                data = load_db()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/sync':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                incoming = json.loads(post_data.decode('utf-8'))

                existing = load_db()
                merged = {
                    "mods": merge_mods(existing.get('mods', []), incoming.get('mods', [])),
                    "users": merge_users(existing.get('users', []), incoming.get('users', [])),
                    "siteSettings": {**(existing.get('siteSettings') or {}), **(incoming.get('siteSettings') or {})},
                    "activityLog": merge_activity(
                        existing.get('activityLog', []),
                        incoming.get('activityLog', [])
                    ),
                    "lastSync": datetime.utcnow().isoformat() + 'Z'
                }

                save_db(merged)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "data": merged}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
            return
        super().do_POST()


def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.1)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        try:
            return [ip for ip in socket.gethostbyname_ex(socket.gethostname())[2] if not ip.startswith("127.")][0]
        except:
            return "127.0.0.1"


tunnel_proc = None
public_url = None


def start_tunnel_background(port):
    global tunnel_proc, public_url

    def read_ssh_output(proc, keyword_filter, url_extractor):
        global public_url
        for line in iter(proc.stdout.readline, ""):
            line = line.rstrip()
            if line:
                print(f"     {line}")
            if keyword_filter(line):
                url = url_extractor(line)
                if url:
                    public_url = url
                    print()
                    print("=" * 60)
                    print(" 🎉  САЙТ ДОСТУПЕН ИЗ ЛЮБОЙ ТОЧКИ МИРА!")
                    print("=" * 60)
                    print(f" 🔗 {public_url}")
                    print("=" * 60)
                    print(" Отправьте эту ссылку вашим друзьям!")
                    print()
                    return

    def try_localtunnel():
        global tunnel_proc
        print(" [*] Пробуем localhost.run (SSH)...")
        try:
            proc = subprocess.Popen(
                ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30",
                 "-R", f"80:localhost:{port}", "nokey@localhost.run"],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
            )
            tunnel_proc = proc
            t = threading.Thread(target=read_ssh_output, args=(
                proc,
                lambda l: "https://" in l and ".lhr.life" in l,
                lambda l: next((w.rstrip() for w in l.split() if "https://" in w and ".lhr.life" in w), None)
            ), daemon=True)
            t.start()
            return True
        except Exception as e:
            print(f"     [!] {e}")
            return False

    def try_serveo():
        global tunnel_proc
        print(" [*] Пробуем serveo.net...")
        try:
            proc = subprocess.Popen(
                ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30",
                 "-R", f"80:localhost:{port}", "serveo.net"],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
            )
            tunnel_proc = proc
            t = threading.Thread(target=read_ssh_output, args=(
                proc,
                lambda l: "https://" in l,
                lambda l: next((w.rstrip() for w in l.split() if "https://" in w), None)
            ), daemon=True)
            t.start()
            return True
        except Exception as e:
            print(f"     [!] {e}")
            return False

    def try_pyngrok():
        global public_url
        print(" [*] Пробуем pyngrok...")
        try:
            from pyngrok import ngrok
            public_url = ngrok.connect(port).public_url
            print(f"     ➜ {public_url}")
            return True
        except ImportError:
            print("     [!] pyngrok не установлен")
            return False
        except Exception as e:
            print(f"     [!] {e}")
            return False

    for method in [try_localtunnel, try_serveo, try_pyngrok]:
        if method():
            return True

    print(" [!] Не удалось создать туннель.")
    print("     Установите pyngrok: pip install pyngrok && ngrok authtoken <token>")
    return False


# --- MAIN ---
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

host = os.environ.get("HOST", "0.0.0.0")
is_render = "RENDER" in os.environ or "PORT" in os.environ
use_public = "--public" in sys.argv or os.environ.get("PUBLIC") == "1"
lan_ip = get_lan_ip()

sys.argv = [a for a in sys.argv if a != "--public"]

print("=" * 62)
print("               ModSphere Server")
print("=" * 62)
print(f" Локально:      http://localhost:{PORT}")
print(f"                http://127.0.0.1:{PORT}")
if not is_render:
    print(f" LAN:           http://{lan_ip}:{PORT}")
print("=" * 62)

if use_public and not is_render:
    print(" 🌐 РЕЖИМ ПУБЛИЧНОГО ДОСТУПА (--public)")
    print("    Туннель создаётся в фоне, сервер запущен сразу.")
    print()
    start_tunnel_background(PORT)
    print()

print(" Для выхода:    Нажмите Ctrl + C")
print("=" * 62)

def cleanup(*args):
    print("\n[!] Остановка сервера...")
    if tunnel_proc:
        tunnel_proc.terminate()
        tunnel_proc.wait()
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

try:
    with socketserver.TCPServer((host, PORT), MyHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    cleanup()
except Exception as e:
    print(f"\n[!] Ошибка запуска сервера: {e}")
    sys.exit(1)
