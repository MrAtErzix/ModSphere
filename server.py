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

    def do_POST(self):
        if self.path == '/api/send-code':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                import json
                import smtplib
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart

                data = json.loads(post_data.decode('utf-8'))
                recipient_email = data.get('email')
                code = data.get('code')
                
                if not recipient_email or not code:
                    raise ValueError("Missing email or code")

                sender_email = "ModSphere3@gmail.com"
                sender_password = "ModSphere1999.G"

                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"Код подтверждения регистрации: {code}"
                msg['From'] = f"ModSphere <{sender_email}>"
                msg['To'] = recipient_email

                html = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; background-color: #0b0c15; color: #ffffff; padding: 24px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #121826; border: 1px solid #262930; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #10b981; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">ModSphere</h1>
                        <p style="color: #9ca3af; font-size: 14px; margin-top: 4px;">Платформа для модов Minecraft</p>
                      </div>
                      <div style="border-top: 1px solid #262930; padding-top: 24px; margin-bottom: 24px;">
                        <h3 style="font-size: 18px; margin-bottom: 12px; color: #ffffff;">Подтверждение регистрации</h3>
                        <p style="color: #d1d5db; font-size: 15px; line-height: 1.6;">Благодарим вас за регистрацию на платформе <strong>ModSphere</strong>! Используйте код ниже для завершения регистрации вашего аккаунта:</p>
                        <div style="text-align: center; margin: 32px 0;">
                          <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; color: #10b981; font-size: 32px; font-weight: 800; letter-spacing: 4px; padding: 12px 36px; border-radius: 8px; font-family: monospace;">{code}</span>
                        </div>
                        <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">Этот код действителен в течение 10 минут. Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
                      </div>
                      <div style="border-top: 1px solid #262930; padding-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                        &copy; 2026 ModSphere. Все права защищены.
                      </div>
                    </div>
                  </body>
                </html>
                """
                msg.attach(MIMEText(html, 'html', 'utf-8'))

                server = smtplib.SMTP("smtp.gmail.com", 587)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(sender_email, sender_password)
                server.sendmail(sender_email, recipient_email, msg.as_string())
                server.quit()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
                print(f"[SMTP] Успешно отправлен код {code} на {recipient_email}")
            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
        else:
            super().do_POST()

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
