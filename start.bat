@echo off
echo ==========================================
echo   Liberty CRM - Iniciando aplicacion...
echo ==========================================
echo.

echo [1/2] Instalando dependencias (esto tarda ~1 minuto)...
call npm install

echo.
echo [2/2] Arrancando servidor...
echo.
echo La app estara lista en: http://localhost:5173
echo Presiona Ctrl+C para detener el servidor.
echo.

call npm run dev
pause
