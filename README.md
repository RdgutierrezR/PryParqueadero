# Sistema Web de Control y Gestión del Parqueadero CUL

Aplicación web académica para el control y la gestión del parqueadero de la
**Corporación Universitaria Latinoamericana (CUL)**.

> ⚠️ **Aviso:** este es un proyecto académico de demostración. No está instalado,
> aprobado ni avalado por la universidad. Los datos incluidos por los scripts de
> demostración son ficticios y la capacidad inicial es un valor provisional.

---

## 1. Descripción general

El sistema permite:

- Registrar previamente **personas** y **vehículos**.
- Que el **administrador** revise y **apruebe o rechace** cada solicitud.
- Que el **vigilante** valide vehículos por **placa** o **código QR** y registre
  **entradas** y **salidas**.
- Consultar la **ocupación** en tiempo real (calculada desde los movimientos).
- Consultar el **historial de movimientos** (administrador y vigilante) con
  filtros por fecha, placa y estado (**Adentro ahora / Ya salieron**).
  El filtro "Adentro ahora" ignora las fechas y responde directo a
  **quién está dentro del parqueadero en este momento**.
- Generar **reportes** por fecha y exportarlos a **CSV** (solo administrador).

### Reglas de negocio aplicadas en el backend

1. Los vehículos se registran previamente y **quedan "pendiente"**; registrarlos
   **no** los autoriza.
2. Solo un vehículo **autorizado** puede entrar.
3. Un vehículo **pendiente, rechazado o suspendido** no puede entrar.
4. No se permiten **entradas duplicadas** (un vehículo no puede estar dos veces dentro).
4. No se permiten entradas si el **parqueadero está lleno**.
5. Solo se registra **salida** si el vehículo tiene una entrada activa.
5. La salida **cierra** el movimiento; **no borra** el historial.
6. Las fechas y horas las genera **el servidor** (UTC).
5. La ocupación y los reportes se calculan con **datos persistidos**.
6. No se usa visión por computador ni reconocimiento automático de placas.

---

## 2. Arquitectura MVC

El proyecto separa **frontend** y **backend**:

```
React (front/)  ──HTTP/JSON (fetch + cookie de sesión)──▶  Flask (back/)
      │                                                        │
  Componentes, páginas,                         Controllers (Blueprints)
  layouts, servicios (fetch)                    → validan entradas y coordinan
                                                        │
                                                Services (lógica de negocio)
                                                  autorización, ocupación,
                                                  entradas/salidas, reportes
                                                        │
                                                Models (SQLAlchemy)
                                                        │
                                                  SQLite (instance/)
```

- **Models** (`back/app/models`): entidades y relaciones de la base de datos.
- **Controllers** (`back/app/controllers`): reciben las peticiones HTTP, validan
  entradas y coordinan las operaciones. Se organizan con **Blueprints**.
- **Views** (`back/app/views`): serialización y respuestas **JSON** consistentes.
  No se generan páginas React desde Flask (React consume la API REST).
- **Services** (`back/app/services`): lógica de negocio reutilizable
  (autorización, control de ocupación, entradas/salidas, reportes, QR).

---

## 3. Estructura de carpetas

```
PryParqueadero/
├── back/                          # Backend (Flask + SQLAlchemy + SQLite)
│   ├── app/
│   │   ├── __init__.py            # Application factory, CORS, CLI
│   │   ├── config.py              # Configuración y variables de entorno
│   │   ├── extensions.py          # db, login_manager
│   │   ├── models/                # User, Person, Vehicle, Authorization, Movement, Setting
│   │   ├── controllers/           # Blueprints: auth, persons, vehicles, access, reports, settings, users
│   │   ├── services/              # access_service, report_service, qr_service
│   │   ├── views/                 # ok(), error() y serialización JSON
│   │   └── utils/                 # decoradores de rol y CSRF
│   ├── tests/                     # Pruebas automatizadas (pytest)
│   ├── instance/                  # Base de datos SQLite (se crea sola; NO se versiona)
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── seed_demo.py               # Datos y cuentas de demostración
│   └── run.py                     # Punto de entrada del backend
├── front/                         # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/            # Alert, Modal, Badge, StatCard, QRScanner, VehicleQR
│   │   ├── context/               # AuthContext
│   │   ├── hooks/                 # usePolling, useNotification
│   │   ├── layouts/               # AdminLayout, GuardLayout
│   │   ├── pages/                 # Login, Dashboard, Solicitudes, Vehículos, Personas,
│   │   │                          # Historial, Reportes, Configuración, Acceso, Ocupación
│   │   ├── services/              # Cliente HTTP centralizado + servicios por recurso
│   │   ├── styles/                # global.css
│   │   ├── utils/                 # formato y validaciones
│   │   ├── App.jsx                # Rutas y protección por rol
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js             # Proxy /api -> backend Flask
├── instalar.bat                   # Instalación automática (una vez por equipo)
├── iniciar.bat                    # Levanta backend + frontend y abre el navegador
├── iniciar_wifi.bat               # Igual, pero permite abrirlo desde el celular por WiFi
├── .gitignore
├── README.md
└── PARA_EJECUTAR_EN_OTRO_EQUIPO.md
```

---

## 4. Requisitos previos (Windows)

- **Python 3.11 o superior** (probado con 3.13).
- **Node.js 18 o superior** y **npm** (probado con Node 24 / npm 11).
- No se requiere instalar ningún servidor de base de datos (se usa SQLite).

---

## 5. Instalación y ejecución en Windows

### 5.0 Opción rápida: los dos scripts `.bat`

En la raíz del proyecto hay dos scripts que hacen todo:

| Script | Cuándo se usa | Qué hace |
|---|---|---|
| `instalar.bat` | **Una sola vez** por equipo | Comprueba Python/Node, crea `back\venv`, instala las dependencias del backend y del frontend, crea la base de datos y pregunta si quieres cargar los datos demo |
| `iniciar.bat` | Cada vez que se vaya a usar | Levanta el backend y el frontend en dos ventanas y abre el navegador en `http://127.0.0.1:5173` |
| `iniciar_wifi.bat` | Para abrirlo también desde el celular | Levanta todo y expone **solo el frontend** en la red WiFi local; la ventana de Vite muestra la dirección `Network` que debes abrir en el teléfono |

Doble clic en `instalar.bat` → espera al mensaje *"Instalación completada
correctamente"* → doble clic en `iniciar.bat` → listo. Para detener los
servidores: `Ctrl + C` en sus ventanas (o cerrarlas).

> **No copies `back\venv\` a otro equipo**: guarda rutas absolutas de esta
> máquina y no funciona. `instalar.bat` lo recrea en segundos.

### 5.1 Instalación manual (opción equivalente)

Abre **dos terminales** (PowerShell): una para el backend y otra para el frontend.

### 5.2 Backend (Flask)

```powershell
cd back

# 1) Crear y activar el entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1

# Si PowerShell bloquea la activación, ejecuta primero:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 2) Instalar dependencias
pip install -r requirements.txt

# 3) Inicializar la base de datos (crea back/instance/parqueadero.db, no borra datos)
python -m flask --app run init-db

# 4a. Crear la PRIMERA cuenta administradora (te pedirá usuario y contraseña)
python -m flask --app run create-admin

# 4b. (Alternativa) Cargar datos y cuentas de DEMOSTRACIÓN
python seed_demo.py

# 5. Iniciar el servidor backend
python run.py
```

El backend queda en **http://127.0.0.1:5000** (endpoint de salud: `/api/health`).

> **Cuentas creadas por `seed_demo.py`** (solo demostración):
> - Administrador → usuario `admin`, contraseña `Admin12345`
> - Vigilante → usuario `vigilante`, contraseña `Vigilante123`

### 5.3 Frontend (React + Vite)

```powershell
cd front
npm install
npm run dev
```

Abre **http://127.0.0.1:5173** en el navegador. Vite redirige `/api` al backend
Flask automáticamente, por lo que no hay que configurar nada más.

Para compilar una versión de producción del frontend:

```powershell
npm run build
```

### 5.4 Acceso desde el celular por WiFi

El frontend puede abrirse desde un teléfono conectado a la **misma red WiFi**
del computador. El backend sigue escuchando solo en `127.0.0.1`; Vite se encarga
de reenviar `/api`, así que **no hay que cambiar CORS** ni exponer Flask a la red.

**Opción rápida:** doble clic en **`iniciar_wifi.bat`** (o ejecuta
`iniciar.bat wifi`). La ventana del frontend mostrará algo similar a:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.25:5173/
```

En el celular abre la dirección **Network** (en este ejemplo,
`http://192.168.1.25:5173`). No uses `localhost` en el celular: esa dirección
apunta al propio teléfono.

También puedes iniciarlo manualmente:

```powershell
cd front
npm run dev:wifi
```

**Si el celular no carga la página:**

1. Verifica que el celular y el PC estén en la **misma WiFi** (no en una red de
   invitados ni en datos móviles).
2. Consulta la IP del PC con `ipconfig` y usa la IPv4 del adaptador **Wi-Fi**.
3. Permite Node.js en el Firewall de Windows (red **privada o pública**, según
   cómo esté configurada tu WiFi). Si no aparece el aviso, ejecuta PowerShell
   **como administrador**:

```powershell
netsh advfirewall firewall add rule name="Parqueadero CUL 5173" dir=in action=allow protocol=TCP localport=5173
```

4. Algunos routers tienen **aislamiento de clientes (AP isolation)** activado;
   si es el caso, desactívalo o usa otra red.

> **Cámara y QR:** abrir la app por `http://192.168.x.x:5173` **no** es un
> contexto seguro, por lo que el navegador del celular bloqueará la cámara para
> escanear QR. Desde el celular usa la **búsqueda manual por placa**; el escáner
> con cámara sigue funcionando en el PC con `localhost`.

> **Seguridad:** mientras el modo WiFi esté activo, cualquier dispositivo de la
> red puede llegar a la pantalla de login. Úsalo en una red de confianza, cambia
> las credenciales de demostración y detén los servidores al terminar.

---

## 6. Inicialización de la base de datos

- La base de datos SQLite se guarda en `back/instance/parqueadero.db`.
- La carpeta `instance/` se crea automáticamente si no existe.
- Al arrancar, la aplicación llama a `db.create_all()`: **crea las tablas que
  falten sin borrar los datos existentes**. Reiniciar el servidor **no** elimina
  información.
- Se crea automáticamente una fila de configuración (capacidad inicial 50,
  marcada como valor de demostración).

---

## 7. Creación de cuentas

### Primera cuenta administradora (recomendado)

```powershell
cd back
.\venv\Scripts\python.exe -m flask --app run create-admin
```

Pedirá nombre, usuario y contraseña (mínimo 8 caracteres). La contraseña se
guarda **hasheada**; nunca en texto plano ni dentro del código.

### Cuentas adicionales

El administrador puede crear cuentas de vigilante o administrador desde
**Configuración → Cuentas del sistema**.

---

## 8. API REST (resumen)

Todas las respuestas son JSON con la forma `{ success, data | error }`.
Las peticiones que modifican datos requieren el encabezado `X-CSRF-Token`.

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| POST | `/api/auth/login` | público | Iniciar sesión |
| POST | `/api/auth/logout` | autenticado | Cerrar sesión |
| GET | `/api/auth/me` | autenticado | Usuario actual + CSRF |
| GET/POST | `/api/persons` | administrador | Listar / registrar personas |
| GET/POST | `/api/vehicles` | administrador | Listar / registrar vehículos |
| POST | `/api/vehicles/<id>/decision` | administrador | Aprobar / rechazar / suspender |
| GET | `/api/vehicles/<id>/qr.png` | admin/vigilante | Código QR del vehículo |
| POST | `/api/access/validate` | vigilante/admin | Validar por placa o token QR |
| GET | `/api/access/search?plate=` | vigilante/admin | Búsqueda por placa |
| POST | `/api/access/entry` | vigilante/admin | Registrar entrada |
| POST | `/api/access/exit` | vigilante/admin | Registrar salida |
| GET | `/api/access/occupancy` | vigilante/admin | Ocupación actual |
| GET | `/api/reports/summary` | administrador | Resumen por periodo |
| GET | `/api/reports/history` | admin/vigilante | Historial de movimientos (`?status=inside` = adentro ahora, `?status=outside` = ya salieron) |
| GET | `/api/reports/inside` | administrador | Vehículos dentro |
| GET | `/api/reports/export` | administrador | Exportar CSV |
| GET/PUT | `/api/settings` | administrador | Consultar/actualizar capacidad |

---

## 9. Códigos QR

- Cada vehículo recibe un **token aleatorio** al registrarse (`secrets.token_urlsafe`).
- El QR contiene **solo ese token**, nunca datos personales ni credenciales.
- La **validación siempre consulta al backend**: un QR válido no implica que el
  vehículo esté autorizado.
- El administrador puede **ver e imprimir** el QR (Vehículos → QR → Imprimir).
- En el navegador, el vigilante puede **escanear** con la cámara (librería ligera
  **jsQR**). Requiere permiso de cámara y un contexto seguro (`localhost` cuenta
  como seguro). Si no está disponible, se muestra un mensaje claro y **siempre**
  queda la búsqueda manual por placa.

---

## 10. Pruebas automatizadas

Usan una **base de datos de prueba separada** (en memoria) y no afectan tus datos
reales.

```powershell
cd back
.\venv\Scripts\python.exe -m pytest
```

Cubren, entre otros:

- Autenticación correcta e incorrecta.
- Permisos de administrador y vigilante (el vigilante no puede aprobar ni registrar vehículos).
- Registro de personas y vehículos (con normalización de placa y control de duplicados).
- Aprobación, rechazo y suspensión.
- Denegación de vehículos pendientes, rechazados y suspendidos.
- Búsqueda por placa y validación por token QR.
- Entrada autorizada, **entrada duplicada** y **parqueadero lleno**.
- Salida correcta y denegación de salida sin entrada activa.
- Actualización de ocupación desde los movimientos persistidos.
- Historial accesible para **administrador y vigilante**, y denegación del resto
  de reportes (resumen, exportación, vehículos dentro) al vigilante.
- Filtro **"Adentro ahora"** del historial (ignora las fechas y lista solo los
  vehículos con entrada activa) y filtro **"Ya salieron"**.
- **Fechas en hora local**: una entrada de las 23:30 pertenece a ese día local
  (aunque en UTC ya sea el día siguiente) y las horas viajan en UTC explícito.
- Generación de reportes (incluye periodos sin resultados y fechas inválidas).
- **Persistencia** de datos tras reiniciar el servidor (base de datos en disco).

---

## 11. Flujo de demostración

1. Inicia el backend (`python run.py`) y el frontend (`npm run dev`).
2. Carga los datos demo (`python seed_demo.py`).
3. Entra a **http://127.0.0.1:5173** e inicia sesión como **admin**.
4. **Solicitudes**: aprueba una solicitud pendiente (p. ej. `DEM003`).
5. **Vehículos → QR**: visualiza e imprime el QR de un vehículo autorizado.
6. **Configuración**: ajusta la capacidad (o déjala como demo).
7. Cierra sesión e inicia como **vigilante**.
8. **Registrar entrada / salida**: busca la placa `DEM001` (autorizado) → *Registrar entrada*.
   - Intenta de nuevo `DEM001` → verás el rechazo por **entrada duplicada**.
   - Prueba `DEM003` antes de aprobarlo → **rechazado** (pendiente).
   - Escanea un QR (o pega el token) → valida el vehículo.
   - Registra la **salida**.
9. **Ocupación**: observa los indicadores actualizarse cada 10 segundos.
10. **Historial** (también disponible para el vigilante en el menú lateral):
    filtra por fecha o placa y consulta las entradas y salidas registradas.
    El botón **"Adentro ahora"** lista al instante quiénes están dentro
    (no depende del rango de fechas).
11. Como **admin**, revisa **Historial** y **Reportes**, y prueba **Exportar CSV**.

---

## 12. Seguridad implementada

- Contraseñas con **hash seguro** (Werkzeug).
- Autenticación por **sesión** (cookie HttpOnly, `SameSite=Lax`) + **token CSRF**
  obligatorio en POST/PUT/DELETE.
- **Autorización por rol en el backend** (los decoradores, no los botones de React).
- **CORS restringido** al origen del frontend local.
- Validación de entradas en el servidor y manejo de errores que no expone
  datos internos ni contraseñas.
- **Claves y secretos por variables de entorno** (`SECRET_KEY`, `DATABASE_URL`,
  `FRONTEND_ORIGIN`). El valor por defecto de `SECRET_KEY` es solo para desarrollo.

---

## 13. Limitaciones conocidas

- La **capacidad inicial (50)** es un valor de demostración. Debe ajustarse a la
  capacidad real desde **Configuración**.
- El **escaneo de QR** depende del navegador, del permiso de cámara y de un
  contexto seguro; si falla, la búsqueda por placa sigue funcionando.
- SQLite es suficiente para un uso académico/local. Para concurrencia alta se
  recomendaría un servidor como PostgreSQL (la capa de datos está abstraída con
  SQLAlchemy).
- Las fechas se almacenan en **UTC**. El backend interpreta los filtros por fecha
  en la **hora local del equipo** y el frontend muestra las horas en la zona local
  del navegador (por eso una entrada de las 8:27 p. m. se ve como 8:27 p. m.).
- No se implementó **visión por computador ni reconocimiento automático de placas**
  (fuera del alcance por diseño).
- Los scripts de demo usan credenciales de ejemplo que **deben cambiarse** en
  cualquier uso real.

---

## 14. Ejecutar el proyecto en otro computador

La guía completa está en **[PARA_EJECUTAR_EN_OTRO_EQUIPO.md](PARA_EJECUTAR_EN_OTRO_EQUIPO.md)**.
Resumen:

1. **Requisitos**: Python 3.11+, Node.js 18+, ~250 MB de disco. No hace falta
   servidor de base de datos.
2. **Copiar la carpeta** al otro equipo. No copies `back\venv\` (guarda rutas
   absolutas y no es portable); `front\node_modules\` es opcional.
3. **Doble clic en `instalar.bat`** → deja el entorno listo (2 a 6 minutos).
4. **Doble clic en `iniciar.bat`** → abre la aplicación en
   `http://127.0.0.1:5173`.

Alternativas documentadas: Git (`git clone` + `instalar.bat`), instalación sin
internet (descargar `wheels` de Python y copiar `node_modules`), y Docker.
