import http.server
import socketserver
import os
import sys

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

class MyHandler(Handler):
    # Disable caching to make sure code changes are visible immediately
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

# Set working directory to the script's directory
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
