@echo off
chcp 65001 >nul
title TechStock
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] No se encontro Node.js. Instala la version LTS desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo.
echo  === TechStock: preparando la aplicacion ===
echo.

if not exist node_modules call npm install
if not exist backend\node_modules call npm install --prefix backend
if not exist frontend\node_modules call npm install --prefix frontend
if not exist backend\.env copy backend\.env.example backend\.env >nul

call npm run build
if errorlevel 1 (
  echo.
  echo  [!] Ocurrio un error al compilar.
  pause
  exit /b 1
)

echo.
echo  Abriendo http://localhost:3000 ...  (cierra esta ventana para detener el servidor)
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
call npm start
pause
