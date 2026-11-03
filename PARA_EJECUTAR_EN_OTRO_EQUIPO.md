# Ejecutar el proyecto en otro computador

Guía rápida para llevar el **Sistema Web de Control y Gestión del Parqueadero CUL**
a otro equipo Windows. Todo está automatizado en dos scripts `.bat` located en la
raíz del proyecto.

---

## 1. Requisitos del otro equipo

| Requisito | Versión | Nota |
|---|---|---|
| Windows | 10 u 11 | También funciona en Windows 7+ con versiones modernas |
| Python | 3.11 o superior | <https://www.python.org/downloads/> → marcar **"Add Python to PATH"** |
| Node.js | 18 o superior | <https://nodejs.org/> (incluye npm) |
| Navegador | Chrome/Edge/Firefox actual | Para el escaneo de QR se necesita la cámara |
| Espacio en disco | ~250 MB | Proyecto + dependencias |
| RAM | 2 GB libres | Es un proyecto académico, corre bien en equipos modestos |

No se necesita instalar **ningún servidor de base de datos**: la base es un
archivo SQLite que se crea solo.

---

## 2. Opción recomendada (con internet)

### Paso 1 — Copiar la carpeta

Copia **toda la carpeta** `Pry Parqueadero` al otro equipo (USB, red, zip, etc.).

**Qué SÍ copiar:** todo el código (`back\app`, `back\tests`, `front\src`,
`front\package.json`, `front\vite.config.js`, `README.md`, los `.bat`).

**Qué NO hace falta copiar:**

| Carpeta | ¿Copiar? | Motivo |
|---|---|---|
| `back\venv\` | **No** | El entorno virtual guarda rutas absolutas de esta máquina y **no** funciona en otro equipo. `instalar.bat` lo recrea. |
| `front\node_modules\` | Opcional | ~46 MB. Si lo copias, el otro equipo ya tiene las dependencias (solo válido para otro Windows x64). |
| `back\instance\parqueadero.db` | Opcional | Si lo copias, el otro equipo arranca **con los datos de demostración**. Si no, arranca vacío y `instalar.bat` crea la base desde cero. |

> Copiar `back\venv\` además deloatar espacio: ocupa 47 MB y no sirve de nada.

### Paso 2 — Instalar (una sola vez)

En el otro equipo, doble clic en **`instalar.bat`**. El script:

1. Verifica que Python y Node.js estén instalados (y avisa si no).
2. Crea `back\venv` e instala las dependencias del backend (`back\requirements.txt`).
3. Instala las dependencias del frontend (`npm install` en `front`).
4. Crea la base de datos (`init-db`, no borra nada) y pregunta si quieres cargar
   los datos de demostración.

Tarda entre 2 y 6 minutos según la conexión. Al final dice
*"Instalación completada correctamente"*.

### Paso 3 — Ejecutar (cada vez que se vaya a usar)

Doble clic en **`iniciar.bat`**. Se abren dos ventanas negras:

| Ventana | Contenido | Dirección |
|---|---|---|
| `Parqueadero CUL - Backend` | Flask | http://127.0.0.1:5000 |
| `Parqueadero CUL - Frontend` | Vite | http://127.0.0.1:5173 |

El navegador se abre solo en `http://127.0.0.1:5173`.

**Para detener:** `Ctrl + C` en cada ventana, o simplemente cerrar las dos
ventanas negras.

Credenciales de demostración (si cargaste los datos):

- Administrador → `admin` / `Admin12345`
- Vigilante → `vigilante` / `Vigilante123`

### Paso 4 — Opcional: abrir desde el celular por WiFi

1. Conecta el celular a la **misma red WiFi** del computador.
2. Ejecuta **`iniciar_wifi.bat`** (o `iniciar.bat wifi`).
3. En la ventana del frontend busca la línea **`Network:`**, por ejemplo:
   `http://192.168.1.25:5173/`.
4. Abre esa dirección en el navegador del celular. **No uses `localhost`** en el
   teléfono: esa dirección apunta al propio teléfono.

Si no carga, permite Node.js en el Firewall de Windows (red privada o pública,
según cómo esté configurada tu WiFi). Como alternativa, en PowerShell **como
administrador**:

```powershell
netsh advfirewall firewall add rule name="Parqueadero CUL 5173" dir=in action=allow protocol=TCP localport=5173
```

> El backend Flask **no** se expone a la red: sigue en `127.0.0.1:5000` y Vite
> reenvía `/api`. Solo el frontend queda visible para el celular.
>
> La cámara para escanear QR requiere un contexto seguro (`localhost` o HTTPS),
> así que por WiFi desde el celular usa la **búsqueda manual por placa**.

---

## 3. Opción sin internet

Si el otro equipo **no tiene conexión**, prepara antes las dependencias en un
equipo con internet.

### 3.1 Backend (Python)

En el equipo con internet, dentro de `back`:

```powershell
.\venv\Scripts\python.exe -m pip download -r requirements.txt -d wheels
```

Copia la carpeta `back\wheels` al otro equipo y, en `back`:

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install --no-index --find-links=wheels -r requirements.txt
```

### 3.2 Frontend (React)

Copia la carpeta `front\node_modules` completa al otro equipo (46 MB). Vite y
jsQR son JavaScript puro, así que funciona igual en otro Windows x64. Si el
equipo es de otra arquitectura (ARM), instálalo con `npm install` en vez de
copiarlo.

### 3.3 Base de datos

Copia también `back\instance\parqueadero.db` si quieres llevar los datos, o deja
que `instalar.bat` la cree vacía.

---

## 4. Alternativas

### Opción Git (recomendada si el equipo ya usa Git)

```powershell
git init
git add .
git commit -m "Sistema de parqueadero CUL"
```

En `.gitignore` ya están excluidos `back/venv/`, `front/node_modules/` y
`back/instance/`, así que el repositorio queda limpio. En el otro equipo:

```powershell
git clone <url-del-repositorio>
cd PryParqueadero
instalar.bat
iniciar.bat
```

### Opción Docker (avanzada)

Requiere Docker Desktop (más pesado, ~2 GB). Sirve si el equipo destino es
Linux, WSL o si quieres que todos tengan exactamente el mismo entorno:

```powershell
docker run --rm -it -p 5000:5000 -v "${PWD}/back/instance:/app/instance" imagen-flask
docker run --rm -it -p 5173:5173 -v "${PWD}/front:/app" imagen-node
```

Para este proyecto académico los scripts `.bat` son más sencillos.

### Opción "pendrive portable"

Lleva el proyecto en una memoria USB con Python y Node "portatiles" y ejecuta
`instalar.bat` una vez en el equipo destino. Funciona, pero deja el `venv`
apuntando al USB, lo que ralentiza el arranque.

---

## 5. Verificación en el equipo nuevo

```powershell
# 1) Backend vivo
Invoke-WebRequest http://127.0.0.1:5000/api/health -UseBasicParsing | Select-Object -ExpandProperty Content
# Debe devolver: {"data":{"status":"ok"},"success":true}

# 2) Frontend vivo
Invoke-WebRequest http://127.0.0.1:5173/ -UseBasicParsing | Select-Object -ExpandProperty StatusCode
# Debe devolver: 200

# 3) Pruebas automaticas del backend (opcional pero recomendado)
cd back
.\venv\Scripts\python.exe -m pytest
# Debe devolver: 43 passed
```

---

## 6. Problemas frecuentes en el equipo nuevo

| Síntoma | Causa probable | Solución |
|---|---|---|
| `[X] No se encontro Python en el PATH` | Python no instalado o sin PATH | Reinstala marcando *"Add Python to PATH"* y abre una terminal nueva |
| `[X] No se encontro Node.js en el PATH` | Node no instalado | Instala Node 18+ y abre una terminal nueva |
| `[X] El puerto 5000 ya esta ocupado` | Quedó un backend anterior | Cierra la ventana vieja, o ejecuta `Get-NetTCPConnection -LocalPort 5000 -State Listen` y `Stop-Process -Id <ID> -Force` |
| La app carga pero todo falla al iniciar sesión | El backend no está corriendo | Mira la ventana negra del backend: debe decir *Running on http://127.0.0.1:5000* |
| `npm install` se queda colgado | Proxy corporativo o sin red | Configura el proxy o usa la opción sin internet (sección 3) |
| La cámara no funciona al escanear QR | El navegador exige contexto seguro | Usa `http://127.0.0.1:5173` o `http://localhost:5173` (no la IP de red) y acepta el permiso de cámara |
| Desde el celular no carga `http://IP:5173` | Firewall de Windows o aislamiento de clientes en el router | Ejecuta `iniciar_wifi.bat`, permite Node.js en redes privadas y revisa que no sea una red de invitados. Si el router tiene *AP isolation*, desactívalo |
| El celular muestra la página pero no inicia sesión | El celular está en otra red o usando datos móviles | Conéctalo a la misma WiFi del PC y vuelve a abrir la dirección `Network` que muestra Vite |
| `Access is denied` al ejecutar un `.bat` | Política de la empresa | Ejecuta PowerShell como administrador o pide a TI que habilite `.bat` |
| Error de zone information / fecha y hora | Reloj del equipo desfasado | Ajusta la fecha y hora del sistema |

---

## 7. Datos y configuración

- **Base de datos:** `back\instance\parqueadero.db` (SQLite). Se crea sola.
- **Secretos:** define `SECRET_KEY`, `DATABASE_URL` y `FRONTEND_ORIGIN` como
  variables de entorno si vas a cambiar los valores por defecto.
- **Puerto del backend:** fijo en 5000 (`back\run.py`). Si está ocupado, cambia
  `port=5000` y actualiza el proxy de `front\vite.config.js`.
- **Capacidad inicial:** 50 (valor de demostración), ajustable en
  *Configuración* del panel.
