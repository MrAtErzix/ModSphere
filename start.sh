#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Останавливаю серверы..."
    kill $SERVER_PID $TUNNEL_PID 2>/dev/null || true
    wait $SERVER_PID $TUNNEL_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "============================================"
echo "  ModSphere — Локальный сервер + туннель"
echo "============================================"

# 1. Kill old processes on port 8080
lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# 2. Start server.py in background
python3 server.py &
SERVER_PID=$!
sleep 2

# 3. Start cloudflared tunnel (public URL)
/tmp/cloudflared tunnel --url http://localhost:8080 &>/tmp/cloudflared.log &
TUNNEL_PID=$!
echo "Жду туннель..."
sleep 4

# 4. Extract public URL from cloudflared log
PUBLIC_URL=$(grep -oP 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/cloudflared.log | head -1)

echo ""
echo "============================================"
echo "  ✅ Локально:    http://localhost:8080"
if [ -n "$PUBLIC_URL" ]; then
    echo "  🌍 Публично:    $PUBLIC_URL"
fi
echo "  ❌ Выход:       Ctrl+C"
echo "============================================"
echo ""

# 5. Wait for either process to exit
wait
