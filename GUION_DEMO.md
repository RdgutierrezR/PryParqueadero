# Guion de demostración — Parqueadero CUL

> **Duración objetivo:** 7 minutos.
> **Base de datos:** `parqueadero.demo.db` (nunca la base real).
> **Objetivo:** mostrar el flujo completo administrador → vigilante sin explicar
> código ni entrar en detalles técnicos innecesarios.

---

## 1. Antes de empezar (5 minutos antes)

- [ ] Backend y frontend funcionando.
- [ ] Base demo cargada con movimientos recientes (`iniciar_demo.bat`).
- [ ] Un vehículo dentro del parqueadero para mostrar ocupación.
- [ ] Una solicitud pendiente para mostrar aprobación.
- [ ] Sesión de administrador iniciada en una pestaña.
- [ ] Sesión de vigilante lista en otra pestaña o navegador.
- [ ] Celular conectado a la misma WiFi (si se va a mostrar).
- [ ] Notificaciones de Windows silenciadas.
- [ ] Zoom del navegador al 100 %.
- [ ] Respaldo de la base demo y capturas/video de contingencia.
- [ ] Cronómetro listo.

**Frase de apertura:**

> “Este es el Sistema Web de Control y Gestión del Parqueadero CUL. Permite
> registrar personas y vehículos, aprobar solicitudes y controlar entradas y
> salidas con placa o código QR.”

---

## 2. Recorrido cronometrado

### 0:00–0:30 — Contexto

- Nombre del proyecto y objetivo.
- Dos roles: administrador y vigilante.
- Aclarar que los datos son de demostración.

### 0:30–1:00 — Login administrador

- Abrir `https://127.0.0.1:5173`.
- Iniciar sesión como `admin`.
- Mencionar que la sesión y los permisos están protegidos por rol.

### 1:00–2:00 — Dashboard

Mostrar:

- Capacidad total y espacios disponibles.
- Vehículos dentro y porcentaje de ocupación.
- Entradas y salidas del día.
- Gráficas de ocupación y comportamiento.

**Mensaje clave:** los indicadores se calculan con movimientos reales, no con
datos escritos a mano.

### 2:00–3:00 — Solicitudes y vehículos

- Abrir **Solicitudes**.
- Mostrar una solicitud pendiente.
- Aprobar o rechazar y señalar el toast de confirmación.
- Ir a **Vehículos**.
- Mostrar filtros, estado, persona asociada y QR.
- Abrir el QR de un vehículo.

**Mensaje clave:** el administrador controla qué vehículos pueden ingresar.

### 3:00–3:30 — Personas

- Abrir **Personas**.
- Buscar un registro.
- Mostrar que un vehículo siempre está asociado a una persona.

### 3:30–4:30 — Historial y reportes

- Abrir **Historial**.
- Alternar **Todos / Adentro ahora / Ya salieron**.
- Mostrar que “Adentro ahora” solo lista vehículos sin salida.
- Abrir **Reportes**.
- Mostrar el resumen del periodo y descargar el CSV.

**Mensaje clave:** el sistema deja trazabilidad y permite exportar información.

### 4:30–5:00 — Configuración

- Abrir **Configuración**.
- Mostrar la capacidad del parqueadero.
- Mencionar la gestión de cuentas y la activación/desactivación.

### 5:00–5:30 — Cambio a vigilante

- Cerrar sesión del administrador (mostrar confirmación).
- Iniciar sesión como `vigilante`.
- Señalar que el menú cambia según el rol.

### 5:30–6:30 — Acceso por placa

- Abrir **Acceso**.
- Buscar una placa autorizada.
- Mostrar la validación y el botón de entrada o salida según corresponda.
- Registrar una entrada (o una salida si el vehículo ya está dentro).
- Mostrar el resultado y el toast.
- Intentar una operación inválida para mostrar el bloqueo (por ejemplo, salida
  sin entrada activa).

**Mensaje clave:** el vigilante no puede saltarse las reglas del sistema.

### 6:30–7:00 — Ocupación, esqueleto y PWA

- Abrir **Ocupación**.
- Mostrar el vehículo que acaba de ingresar y el porcentaje actualizado.
- Señalar el **esqueleto esquemático del parqueadero** (cuadrícula con la
  capacidad real y los espacios ocupados en verde).
- Mostrar el botón **“Instalar app”** encima del usuario y explicar:
  la vista del vigilante se puede usar desde el teléfono como app (PWA)
  cuando el navegador permite la instalación y el carrito del PC queda
  expuesto por HTTPS.
- Cerrar con:

> “El sistema centraliza el control del parqueadero, separa las funciones por
> rol, deja un historial completo de cada movimiento y el vigilante también
> puede operarlo desde el móvil como app instalada.”

---

## 3. Contingencias

| Problema | Plan B |
|---|---|
| El celular no conecta por WiFi | Hacer la demo en el PC con `localhost`. Mostrar la dirección `Network` solo como referencia. |
| La cámara QR no funciona en el celular | Usar búsqueda manual por placa. Explicar que la cámara requiere HTTPS. |
| El botón "Instalar app" no aparece | Abrir el menú del navegador y usar "Instalar página como aplicación" / "Adicionar à tela inicial". |
| El backend no responde | Reiniciar con `iniciar.bat`; si falla, usar capturas/video. |
| La base demo no tiene datos recientes | Restaurar el respaldo demo o usar el historial existente. |
| Un botón no responde | No improvisar; pasar al siguiente paso y reportarlo después. |
| Se acaba el tiempo | Saltar personas y configuración; priorizar dashboard, acceso e historial. |
| Falla el proyector | Tener capturas en una carpeta local y el video de respaldo. |

---

## 4. Preguntas probables

**¿Dónde se guardan los datos?**
En SQLite, un archivo local. El frontend nunca accede directamente a la base:
todo pasa por la API de Flask.

**¿Cómo se controlan los permisos?**
Con sesión de usuario y roles. El backend valida cada endpoint; el frontend
oculta rutas, pero la seguridad real está en el servidor.

**¿Cómo se evita un doble ingreso?**
Con una restricción de unicidad para movimientos activos y validación en el
servicio de acceso.

**¿Qué pasa si el parqueadero está lleno?**
El sistema bloquea nuevas entradas y muestra el mensaje correspondiente.

**¿Cómo funciona el QR?**
Cada vehículo tiene un token único; el QR se genera como imagen PNG y se valida
contra la base.

**¿Por qué la cámara no funciona en el celular?**
Los navegadores exigen HTTPS para acceder a la cámara; por HTTP solo se permite
la búsqueda manual por placa.

**¿Se puede usar en otro computador?**
Sí. `instalar.bat` prepara el entorno y `iniciar.bat` levanta el sistema. La
guía está en `PARA_EJECUTAR_EN_OTRO_EQUIPO.md`.

**¿Qué mejoraría en el futuro?**
Despliegue con HTTPS, pruebas E2E automatizadas, reportes PDF y respaldos
programados. No se incluyeron por alcance académico.

---

## 5. Reglas durante la demo

- No borrar personas, vehículos ni movimientos reales.
- No cambiar la capacidad real.
- No mostrar claves en pantalla más allá de las cuentas demo.
- No abrir la base de datos ni la consola del navegador.
- No prometer funciones que no existen.
- Si algo falla, mantener la calma y usar el plan B.

---

## 6. Cierre

**Frase final:**

> “El proyecto queda funcional, documentado y probado. La base real está
> respaldada y la demostración se hace sobre una copia separada para no poner en
> riesgo los datos.”
