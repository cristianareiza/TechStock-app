#!/usr/bin/env bash
# Inicia TechStock en macOS / Linux: ./iniciar.sh
set -e
cd "$(dirname "$0")"

command -v node >/dev/null || { echo "Instala Node.js LTS desde https://nodejs.org"; exit 1; }

[ -d node_modules ] || npm install
[ -d backend/node_modules ] || npm install --prefix backend
[ -d frontend/node_modules ] || npm install --prefix frontend
[ -f backend/.env ] || cp backend/.env.example backend/.env

npm run build
echo ""
echo "Abre http://localhost:3000 en tu navegador (Ctrl+C para detener)"
npm start
