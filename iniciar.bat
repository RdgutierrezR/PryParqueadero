@echo off
rem ============================================================
rem  Parqueadero CUL - Inicio de los servidores
rem  Levanta el backend (Flask) y el frontend (Vite) en dos
rem  ventanas separadas y abre el navegador.
rem
rem  Uso normal:  iniciar.bat
rem  Modo WiFi:   iniciar.bat wifi   (o iniciar_wifi.bat)
rem ============================================================
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "MODO=local"
if /i "%~1"=="wifi" set "MODO=wifi"

echo.
echo ============================================
echo   Parqueadero CUL - Iniciando servidores
echo ============================================
echo.

if not exist "back\venv\Scripts\python.exe" (
    echo [X] Falta el entorno virtual del backend.
    echo     Ejecuta primero: instalar.bat
    echo.
    pause
    exit /b 1
)
if not exist "front\node_modules" (
    echo [X] Faltan las dependencias del frontend.
    echo     Ejecuta primero: instalar.bat
    echo.
    pause
    exit /b 1
)

netstat -ano | findstr /r /c:":5000 .*LISTENING" >nul
if not errorlevel 1 (
    echo [X] El puerto 5000 ya esta ocupado.
    echo     Cierra la ventana del backend anterior y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)
netstat -ano | findstr /r /c:":5173 .*LISTENING" >nul
if not errorlevel 1 (
    echo [X] El puerto 5173 ya esta ocupado.
    echo     Cierra la ventana del frontend anterior y vuelve a ejecutar este script.
    echo.
    pause
    exit /b 1
)

echo [1/2] Backend Flask en http://127.0.0.1:5000
start "Parqueadero CUL - Backend" /D "%~dp0back" cmd /k "venv\Scripts\python.exe run.py"

if /i "%MODO%"=="wifi" (
    echo [2/2] Frontend Vite en todas las interfaces de red
    start "Parqueadero CUL - Frontend" /D "%~dp0front" cmd /k "npm run dev:wifi"
) else (
    echo [2/2] Frontend Vite en https://127.0.0.1:5173
    start "Parqueadero CUL - Frontend" /D "%~dp0front" cmd /k "npm run dev"
)

echo.
echo Esperando unos segundos a que arranquen los servidores...
ping -n 7 127.0.0.1 >nul
start "" "https://127.0.0.1:5173"

echo.
echo ============================================
echo   Listo. Se abrio el navegador.
echo ============================================
echo   Administrador ^> admin       / Admin12345
echo   Vigilante     ^> vigilante   / Vigilante123
echo.

if /i "%MODO%"=="wifi" (
    echo   ACCESO DESDE EL CELULAR
    echo   1. Conecta el celular a la misma red WiFi del PC.
    echo   2. En la ventana del Frontend busca la linea "Network:".
    echo   3. Abre en el celular esa direccion. Ejemplo:
    echo        https://192.168.1.25:5173
    echo.
    echo   Si el celular no carga, permite Node.js en el Firewall de Windows
    echo   para redes privadas. Tambien puedes ejecutar PowerShell como administrador:
    echo     netsh advfirewall firewall add rule name="Parqueadero CUL 5173" dir=in action=allow protocol=TCP localport=5173
    echo.
    echo   Nota: la camara para escanear QR solo funciona en localhost o con HTTPS.
    echo   Desde el celular por WiFi usa la busqueda manual por placa.
    echo.
)

echo   Para detener cada servidor: presiona Ctrl+C en su ventana.
echo   Para apagar todo: cierra las dos ventanas negras.
echo.
pause

