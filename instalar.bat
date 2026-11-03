@echo off
rem ============================================================
rem  Parqueadero CUL - Instalacion inicial (ejecutar UNA vez)
rem  Crea el entorno virtual, instala dependencias del backend
rem  y del frontend, y prepara la base de datos SQLite.
rem ============================================================
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo   Parqueadero CUL - Instalacion inicial
echo ============================================
echo.

rem ---------- 1) Comprobaciones previas ----------
where python >nul 2>nul
if errorlevel 1 (
    echo [X] No se encontro Python en el PATH.
    echo     Instala Python 3.11 o superior: https://www.python.org/downloads/
    echo     Marca la casilla "Add Python to PATH" durante la instalacion.
    goto :error
)
where node >nul 2>nul
if errorlevel 1 (
    echo [X] No se encontro Node.js en el PATH.
    echo     Instala Node.js 18 o superior: https://nodejs.org/
    goto :error
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PYVER=%%v
for /f "tokens=*" %%v in ('node --version 2^>^&1') do set NOVER=%%v
echo [i] Python: !PYVER!
echo [i] Node.js: !NOVER!
echo.

rem ---------- 2) Entorno virtual + dependencias backend ----------
if not exist "back\venv\Scripts\python.exe" (
    echo [1/4] Creando el entorno virtual del backend...
    python -m venv "back\venv"
    if errorlevel 1 goto :error
) else (
    echo [1/4] El entorno virtual ya existe: se reutiliza.
)

echo [2/4] Instalando dependencias del backend (Flask, SQLAlchemy, QR...)...
call "back\venv\Scripts\activate.bat"
python -m pip install -r "back\requirements.txt"
if errorlevel 1 goto :error
call deactivate
echo.

rem ---------- 3) Dependencias del frontend ----------
if exist "front\node_modules" (
    echo [3/4] Revisando dependencias del frontend: React, Vite, jsQR...
) else (
    echo [3/4] Instalando dependencias del frontend: React, Vite, jsQR...
)
pushd "front"
call npm install
if errorlevel 1 (
    popd
    goto :error
)
popd
echo.

rem ---------- 4) Base de datos ----------
echo [4/4] Preparando la base de datos SQLite...
pushd "back"
call "venv\Scripts\activate.bat"
python -m flask --app run init-db
if errorlevel 1 (
    popd
    goto :error
)
echo.
choice /c SN /n /m "  Cargar datos y cuentas de DEMOSTRACION (admin/Admin12345, vigilante/Vigilante123)? [S/N]: "
if errorlevel 2 goto :sinDatos
python seed_demo.py
:sinDatos
popd
echo.

echo ============================================
echo   Instalacion completada correctamente
echo ============================================
echo   1) Cierra esta ventana
echo   2) Ejecuta iniciar.bat
echo   3) Abre http://127.0.0.1:5173
echo.
pause
exit /b 0

:error
echo.
echo [X] La instalacion no pudo completarse. Revisa el mensaje anterior.
echo     Revisa la conexion a internet y que Python/Node esten instalados.
echo.
pause
exit /b 1
