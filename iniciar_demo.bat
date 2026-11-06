@echo off
rem ============================================================
rem  Parqueadero CUL - Inicio en modo DEMO (datos ficticios)
rem  Levanta el backend apuntando a la base demo
rem  (back\instance\parqueadero.demo.db) y el frontend en HTTPS.
rem
rem  Uso normal:   iniciar_demo.bat
rem  Modo local:   iniciar_demo.bat local
rem               (sin acceso desde el celular)
rem  Regenerar:   iniciar_demo.bat reset
rem ============================================================
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "MODO=wifi"
if /i "%~1"=="local" set "MODO=local"
set "RESET_FLAG="
if /i "%~1"=="reset" set "RESET_FLAG=--reset"

echo.
echo ============================================
echo   Parqueadero CUL - Modo DEMO
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

set "DEMO_URI=sqlite:///%~dp0back\instance\parqueadero.demo.db"

echo [1/3] Creando/regenerando la base de datos DEMO (datos ficticios)...
pushd back
set "DATABASE_URL=%DEMO_URI%"
venv\Scripts\python.exe seed_demo.py
venv\Scripts\python.exe seed_demo_scenario.py %RESET_FLAG%
popd

echo [2/3] Backend Flask en http://127.0.0.1:5000 (base DEMO)
start "Parqueadero CUL - Backend (DEMO)" /D "%~dp0back" cmd /k "set DATABASE_URL=%DEMO_URI% && venv\Scripts\python.exe run.py"

echo [3/3] Frontend Vite...
if /i "%MODO%"=="wifi" (
    echo        Acceso por WiFi/HTTPS disponible.
    start "Parqueadero CUL - Frontend (DEMO)" /D "%~dp0front" cmd /k "npm run dev:wifi"
) else (
    echo        Solo el PC local. HTTPS en 5173.
    start "Parqueadero CUL - Frontend (DEMO)" /D "%~dp0front" cmd /k "npm run dev"
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
echo   Importante:
echo     - Esta base es una DEMO separada y ficticia.
echo     - Los datos reales Parqueadero CUL siguen intactos.
echo     - Para regenerar los datos demo usa: iniciar_demo.bat reset
echo     - Para desactivar el modo demo ejecuta iniciar.bat   (base real)
echo.

if /i "%MODO%"=="wifi" (
    echo   ACCESO DESDE EL CELULAR
    echo   1. Conecta el celular a la misma red WiFi del PC.
    echo   2. En la ventana del Frontend busca la linea "Network:".
    echo   3. Abre en el celular esa direccion (HTTPS). Ejemplo:
    echo        https://192.168.1.25:5173
    echo.
    echo   Para instalar como app (PWA) usa el boton "Instalar app".
    echo.
)

echo   Para detener cada servidor: presiona Ctrl+C en su ventana.
echo   Para apagar todo: cierra las dos ventanas negras.
echo.
pause
