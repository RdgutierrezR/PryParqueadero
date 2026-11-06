# Manual de usuario — Parqueadero CUL

> Guía práctica para usar el sistema por rol. Los pasos aplican tanto en el
> navegador del PC como en el teléfono (PWA), salvo donde se indique lo
> contrario.

---

## 1. Requisitos previos

- Navegador actualizado (Chrome recomendado, también funciona Edge).
- El sistema arrancado con `iniciar.bat` (o `iniciar_demo.bat` para ensayo).
- Credenciales entregadas por el administrador:
  - **Administrador:** usuario `admin`
  - **Vigilante:** usuario `vigilante`

En el PC se abre `https://127.0.0.1:5173`. Desde el celular (misma WiFi) usa la
dirección **Network** que muestra la ventana del frontend, por ejemplo
`https://192.168.1.86:5173`.

> Si el navegador advierte sobre el certificado local, es el HTTPS auto-firmado
> del modo desarrollo; es seguro aceptarlo en una red de confianza.

---

## 2. Acceso al sistema

1. Abre la dirección del sistema.
2. Ingresa tu **usuario** y **contraseña**.
3. El menú que ves depende de tu rol:
   - **Administrador:** puede ver todo el sistema.
   - **Vigilante:** ve Acceso, Ocupación e Historial.
4. Al terminar tu turno, cierra sesión con **Salir** (pide confirmación).

> **Seguridad:** no compartas tu contraseña. El sistema registra qué cuenta
> registra cada entrada y salida.

---

## 3. Guía para el vigilante

### 3.1 Registrar entrada por placa

1. Entra al menú **Acceso**.
2. Escribe la **placa** (o escanea el código QR del vehículo según el caso).
3. El sistema muestra:
   - Datos del vehículo.
   - Estado de la autorización: *autorizado, pendiente, suspendido o rechazado*.
4. Si está **autorizado**, presiona **Registrar entrada**.
5. Verás una notificación de confirmación y la ocupación se actualiza sola.

> **Reglas automáticas:**
> - No se puede registrar entrada de un vehículo **pendiente, suspendido o
>   rechazado**.
> - No se puede registrar dos veces la misma entrada (parqueadero lleno
>   también bloquea).

### 3.2 Registrar salida

1. En **Acceso**, busca la placa del vehículo que está dentro.
2. Presiona **Registrar salida**.
3. El sistema guarda la hora y libera el espacio.

> Si el vehículo ya salió, el sistema bloquea la salida duplicada.

### 3.3 Ver ocupación

1. Entra al menú **Ocupación**.
2. Verás:
   - Ocupados / disponibles.
   - Barra o dona con el porcentaje de ocupación.
   - **Esqueleto del parqueadero:** cuadrícula con la capacidad configurada y
     los espacios ocupados marcados en verde.

### 3.4 Consultar historial

1. Entra al menú **Historial**.
2. Filtra por **Todos / Adentro ahora / Ya salieron**.
3. Puedes buscar por placa y por rango de fechas.
4. La columna de guardia muestra quién registró cada operación.

---

## 4. Guía para el administrador

### 4.1 Dashboard

Abre **Dashboard** para ver, en un solo lugar:

- Capacidad total y espacios disponibles.
- Vehículos dentro ahora y porcentaje de ocupación.
- Entradas/salidas del día.
- Gráficas de comportamiento.

### 4.2 Solicitudes de vehículos

1. Entra al menú **Solicitudes**.
2. Cada tarjeta muestra placa, tipo, persona solicitante y su estado.
3. Acciones disponibles:
   - **Aprobar:** el vehículo queda listo para entrar.
   - **Rechazar:** queda bloqueado.
   - **Suspender:** se retira un permiso ya otorgado.
4. El sistema confirma cada acción y la lista se actualiza.

### 4.3 Personas

1. Entra al menú **Personas**.
2. Botón **Nueva persona:** llena nombre, tipo (estudiante / docente /
   visitante) y contacto si aplica.
3. Puedes buscar, editar y eliminar (con confirmación).
4. No se puede eliminar una persona que aún tiene vehículos asociados.

### 4.4 Vehículos

1. Entra al menú **Vehículos**.
2. Botón **Nuevo vehículo:** selecciona la persona, escribe la **placa** (en
   mayúsculas), elige el tipo y guarda.
3. En el detalle puedes:
   - Ver/editar la información.
   - Ver y **descargar el QR** (se usa en la validación con cámara).
   - Aprobar / rechazar / suspender.
4. El estado controla si el vehículo puede entrar.

### 4.5 Historial y reportes

- **Historial:** igual que el vigilante, pero con todos los módulos.
- **Reportes:** elige un rango de fechas y obtén un resumen
  (entradas, salidas, por tipo de vehículo). Puedes **exportar a CSV**.

### 4.6 Configuración

1. Entra al menú **Configuración**.
2. Puedes:
   - Cambiar la **capacidad** del parqueadero (número de espacios).
   - Crear o gestionar cuentas de **administrador y vigilante**.
   - Desactivar cuentas (no se puede dejar el sistema sin administrador activo).

---

## 5. Usar el sistema como app en el celular (PWA)

1. Conecta el celular a la **misma WiFi** que el PC servidor.
2. Ejecuta `iniciar.bat wifi` (o `iniciar_demo.bat`) en el PC.
3. En el celular abre la dirección **Network** del frontend, por ejemplo:
   `https://192.168.1.86:5173`
4. Acepta el certificado local si el navegador lo pide (una sola vez).
5. Toca el botón **“Instalar app”** que aparece en la barra superior, o usa el
   menú del navegador: **Instalar aplicación / Adicionar a la pantalla inicial**.
6. El ícono queda en el teléfono y abre el sistema a pantalla completa.

> **Cámara QR (solo móvil/HTTPS):** la validación por QR con cámara funciona
> desde `https://…` local. Si no está disponible, siempre puedes usar la
> búsqueda manual por placa.

---

## 6. Problemas frecuentes

| Problema | Qué hacer |
|---|---|
| No carga la página | Verifica que las dos ventanas del servidor estén abiertas y sin errores. |
| No abre desde el celular | Confirma mismo WiFi, la dirección **Network** del frontend y que el firewall permita Node.js en el puerto 5173. |
| No aparece "Instalar app" | Recarga la página; si persiste, usa el menú del navegador → **Instalar aplicación**. |
| Dique que el parqueadero está lleno | Es correcto: capacidad al 100 %. Espera una salida. |
| Registro con error 403 | Tu sesión o rol no tiene permiso; vuelve a iniciar sesión con la cuenta correcta. |
| Datos desactualizados | La vista se actualiza sola; si no, recarga la página. |
