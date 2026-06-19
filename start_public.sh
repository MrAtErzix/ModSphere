#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
echo ""
echo "=============================================="
echo "   ModSphere — Публичный запуск"
echo "   Сайт будет доступен из любой точки мира!"
echo "=============================================="
echo ""
python3 server.py --public
read -p "Нажмите Enter для выхода..."
