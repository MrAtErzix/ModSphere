import http.server
import socketserver
import os
import sys
import json

PORT = 8000
DB_FILE = 'db.json'

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/sync':
            try:
                if os.path.exists(DB_FILE):
                    with open(DB_FILE, 'r', encoding='utf-8') as f:
                        data = f.read()
                else:
                    data = "{}"
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data.encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/sync':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    f.write(post_data.decode('utf-8'))
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
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

script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print("=" * 60)
print("             ModSphere Local Dev Server")
print("=" * 60)
print(f" Адрес сайта:   http://localhost:{PORT}")
print(" Для выхода:    Нажмите Ctrl + C")
print("=" * 60)

try:
    with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n[!] Сервер остановлен пользователем.")
    sys.exit(0)
except Exception as e:
    print(f"\n[!] Ошибка запуска сервера: {e}")
    sys.exit(1)
