# Checklist de QA — Parqueadero CUL

> **Uso:** marcar cada caso como `OK`, `FALLA` o `N/A`. Todo defecto debe
> registrarse en la tabla final con severidad y pasos para reproducirlo.
>
> **Regla de seguridad:** las pruebas que crean, modifican o eliminan datos
> (vehículos, personas, entradas/salidas, capacidad, cuentas) se hacen **solo
> sobre `parqueadero.demo.db`**. La base real no se toca.

---

## Datos de la ejecución

| Campo | Valor |
|---|---|
| Fecha | |
| Responsable | |
| Commit / versión | |
| Base de datos | `parqueadero.demo.db` |
| Navegador y versión | |
| Sistema operativo | Windows |
| Backend | `http://127.0.0.1:5000` |
| Frontend | `https://127.0.0.1:5173` |
| Viewports probados | 360 × 740 / 768 × 1024 / 1280 × 800 |
| Usuarios | `admin` / `vigilante` |

---

## 0. Preparación

- [ ] Respaldo de la base real creado y verificado.
- [ ] Base demo separada disponible.
- [ ] Backend y frontend arrancados sin errores.
- [ ] `npm run build` correcto.
- [ ] Pruebas backend en verde.
- [ ] Consola del navegador limpia al iniciar.
- [ ] Datos demo cargados (personas, vehículos y movimientos recientes).

---

## 1. Autenticación y autorización

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| AUTH-01 | Login administrador con credenciales correctas | OK (API) | qa_full_demo.py |
| AUTH-02 | Login vigilante con credenciales correctas | OK (API) | qa_full_demo.py |
| AUTH-03 | Login con contraseña incorrecta muestra error claro | | |
| AUTH-04 | Login con usuario inexistente muestra error claro | | |
| AUTH-05 | Logout pide confirmación y cierra la sesión | OK (API) | qa_full_demo.py |
| AUTH-06 | Tras logout, una ruta protegida redirige al login | | |
| AUTH-07 | Administrador no puede abrir rutas exclusivas de vigilante | | |
| AUTH-08 | Vigilante no puede abrir rutas exclusivas de administrador | | |
| AUTH-09 | La sesión persiste al recargar la página | | |
| AUTH-10 | El token CSRF viaja en las peticiones que modifican datos | OK (API) | qa_full_demo.py |

---

## 2. Dashboard

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| DASH-01 | KPIs de capacidad, dentro, disponibles, entradas y salidas son coherentes | | |
| DASH-02 | Dona de ocupación coincide con los movimientos activos | | |
| DASH-03 | Gráficas usan datos reales del backend | | |
| DASH-04 | Estado de carga visible antes de recibir datos | | |
| DASH-05 | Si falla el backend, se muestra error y opción de reintentar | | |

---

## 3. Solicitudes

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| REQ-01 | Lista de solicitudes pendientes carga correctamente | OK (API) | qa_full_demo.py |
| REQ-02 | Estado vacío se muestra cuando no hay solicitudes | | |
| REQ-03 | Aprobar una solicitud actualiza la lista y muestra toast | OK (API) | qa_full_demo.py |
| REQ-04 | Rechazar una solicitud actualiza la lista y muestra toast | | |
| REQ-05 | Suspender un vehículo ya autorizado funciona | | |
| REQ-06 | Error del servidor no muestra un toast de éxito falso | | |

---

## 4. Vehículos

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| VEH-01 | Listado y filtros por estado funcionan | OK (API) | qa_full_demo.py |
| VEH-02 | Crear vehículo con datos válidos | OK (API) | qa_full_demo.py |
| VEH-03 | Validación inline para placa vacía o inválida | OK (API) | qa_full_demo.py |
| VEH-04 | Placa duplicada muestra error del backend | OK (API) | qa_full_demo.py |
| VEH-05 | Persona inexistente o inválida muestra error | | |
| VEH-06 | Cambiar decisión del vehículo funciona | OK (API) | qa_full_demo.py |
| VEH-07 | QR se genera y se puede descargar/ver | OK (API) | qa_full_demo.py |
| VEH-08 | Historial del vehículo carga | | |
| VEH-09 | Búsqueda/filtro no deja la tabla en estado inconsistente | | |

---

## 5. Personas

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| PER-01 | Listado y búsqueda funcionan | OK (API) | qa_full_demo.py |
| PER-02 | Crear persona con datos válidos | OK (API) | qa_full_demo.py |
| PER-03 | Validación de nombre, tipo y contacto | OK (API) | qa_full_demo.py |
| PER-04 | Editar persona actualiza la fila | OK (API) | qa_full_demo.py |
| PER-05 | Eliminar persona pide confirmación | | |
| PER-06 | No se permite eliminar una persona con vehículos asociados | | |
| PER-07 | Estado vacío de búsqueda es claro | | |

> Las pruebas de creación/edición/eliminación se hacen con una persona de
> prueba en la base demo. No usar “Cristian Camilo Arango Mora”.

---

## 6. Historial

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| HIS-01 | Filtro “Todos” muestra el historial | OK (API) | qa_full_demo.py |
| HIS-02 | Filtro “Adentro ahora” muestra solo vehículos sin salida | OK (API) | qa_full_demo.py |
| HIS-03 | Filtro “Ya salieron” muestra solo movimientos cerrados | | |
| HIS-04 | Filtros de fecha y placa funcionan | OK (API) | qa_full_demo.py |
| HIS-05 | Orden por columnas funciona con teclado | | |
| HIS-06 | El vigilante también puede consultar el historial | | |
| HIS-07 | No aparecen vehículos ya salidos en “Adentro ahora” | | |

---

## 7. Reportes

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| REP-01 | Resumen del periodo coincide con los movimientos | OK (API) | qa_full_demo.py |
| REP-02 | Totales por tipo de vehículo son correctos | | |
| REP-03 | Lista de vehículos dentro es correcta | | |
| REP-04 | Exportación CSV descarga y abre correctamente | OK (API) | qa_full_demo.py |
| REP-05 | Fechas se interpretan en hora local sin desfase | | |
| REP-06 | Rango inválido muestra error de validación | | |

---

## 8. Configuración

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| SET-01 | Capacidad actual se muestra correctamente | OK (API) | qa_full_demo.py |
| SET-02 | Cambiar capacidad válida actualiza el dashboard | | |
| SET-03 | Capacidad inválida muestra validación inline | | |
| SET-04 | Crear usuario administrador/vigilante funciona | | |
| SET-05 | Desactivar cuenta pide confirmación | | |
| SET-06 | Usuario desactivado no puede iniciar sesión | | |
| SET-07 | No se puede dejar el sistema sin administrador activo | | |

---

## 9. Acceso (vigilante)

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| ACC-01 | Búsqueda por placa válida muestra el vehículo | OK (API) | qa_full_demo.py |
| ACC-02 | Placa inexistente muestra mensaje claro | OK (API) | qa_full_demo.py |
| ACC-03 | Validación por QR funciona en el PC (`localhost`) | | |
| ACC-04 | Entrada autorizada se registra y muestra toast | OK (API) | qa_full_demo.py |
| ACC-05 | Entrada duplicada se bloquea con mensaje | OK (API) | qa_full_demo.py |
| ACC-06 | Entrada de vehículo pendiente/rechazado/suspendido se блокea | OK (API) | qa_full_demo.py |
| ACC-07 | Salida de vehículo dentro se registra correctamente | OK (API) | qa_full_demo.py |
| ACC-08 | Salida sin entrada activa se bloquea | OK (API) | qa_full_demo.py |
| ACC-09 | Parqueadero lleno se bloquea (si se puede simular en demo) | | |
| ACC-10 | El resultado de la operación se ve claro y sin ambigüedad | | |

---

## 10. Ocupación

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| OCC-01 | Ocupación coincide con los vehículos dentro | OK (API) | qa_full_demo.py |
| OCC-02 | La vista se actualiza al entrar o salir | | |
| OCC-03 | Capacidad y porcentaje son coherentes | | |
| OCC-04 | Estado vacío se muestra cuando no hay vehículos | | |

---

## 11. Vista móvil y PWA

> Se hacen con el backend en la base demo y el sistema expuesto por HTTPS.
> El teléfono debe estar en la misma WiFi del PC. No se usa ni modo offline ni
> datos sembrados en el teléfono.

### Backend / HTTPS

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| PWA-01 | El frontend responde en `https://127.0.0.1:5173` desde el PC | | |
| PWA-02 | El certificado auto-firmado se puede aceptar sin romper la app | | |
| PWA-03 | `/manifest.webmanifest` está disponible | | |
| PWA-04 | `/sw.js` se registra sin errores en la consola | | |
| PWA-05 | Los iconos `/icons/icon-192.png` y `/icons/icon-512.png` cargan | | |

### Instalación como app

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| PWA-06 | El botón "Instalar app" se muestra cuando el navegador lo permite | | |
| PWA-07 | Al aceptar, la app queda instalada y se abre sin barra de navegador | | |
| PWA-08 | La app instalada respeta sesión y roles | | |
| PWA-09 | Se puede desinstalar y volver a instalar sin romper el sistema | | |
| PWA-10 | La app no muestra errores críticos al abrir (foco, responsive) | | |

### Vista móvil del vigilante

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| PWA-11 | El menú inferior muestra las rutas del vigilante | | |
| PWA-12 | Búsqueda por placa usable a 360 px | | |
| PWA-13 | Validación y registro de entrada/salida usable a 360 px | | |
| PWA-14 | Ocupación con esqueleto esquemático visible a 360 px | | |
| PWA-15 | Historial usable a 360 px y sin desbordes | | |
| PWA-16 | QR por cámara desde el móvil sobre HTTPS | | |
| PWA-17 | El vigilante no accede a rutas de administrador en el móvil | | |

> **Nota:** si el teléfono todavía no puede abrir la app, se marca como defecto
> **P0** del frente móvil para resolverlo antes de la demo.

---

## 12. Calidad transversal

### Responsive

- [ ] 360 px: sidebar móvil, sin desbordes horizontales.
- [ ] 360 px: tablas y formularios utilizables.
- [ ] 768 px: navegación y contenido legibles.
- [ ] 1280 px: layout de escritorio correcto.
- [ ] El menú móvil cierra con Escape y al navegar.
- [ ] El scroll se bloquea al abrir modal/sidebar y se restaura al cerrar.

### Accesibilidad y teclado

- [ ] Todos los campos tienen label o nombre accesible.
- [ ] El foco es visible en botones, enlaces y campos.
- [ ] Se puede navegar el menú con Tab.
- [ ] Los encabezados ordenables son botones y anuncian `aria-sort`.
- [ ] Los filtros anuncian `aria-pressed`.
- [ ] Los modales atrapan el foco y lo restauran al cerrar.
- [ ] Escape cierra modales y menú móvil.
- [ ] `prefers-reduced-motion` desactiva animaciones no esenciales.

### Errores y red

- [ ] Backend apagado: las vistas muestran error, no pantalla en blanco.
- [ ] Reintentar recupera la vista cuando el backend vuelve.
- [ ] Error 401 redirige al login.
- [ ] Error 403 muestra mensaje de permisos.
- [ ] Error 500 muestra mensaje genérico sin datos sensibles.
- [ ] Los toasts de éxito solo aparecen tras una respuesta real exitosa.
- [ ] Los diálogos de confirmación no se cierran solos.

### Consola y red

- [ ] Sin errores de consola al navegar por todos los módulos.
- [ ] Sin peticiones 4xx/5xx inesperadas.
- [ ] Sin recursos faltantes (imágenes, fuentes, iconos).
- [ ] Sin botones decorativos o sin acción.

---

## 13. Regresión y cierre

- [ ] Build de producción correcto.
- [ ] Pruebas backend en verde.
- [ ] `instalar.bat` funciona en una copia limpia (sin `venv` ni `node_modules`).
- [ ] `iniciar.bat` arranca ambos servidores.
- [ ] `iniciar_wifi.bat` permite abrir desde el celular.
- [ ] Login y operación básica desde el celular.
- [ ] La base demo se puede recrear/restaurar.
- [ ] Respaldo final creado.
- [ ] Commit de cierre creado.
- [ ] Documentación actualizada.

---

## 14. Registro de defectos

| ID | Módulo | Severidad | Descripción | Pasos para reproducir | Evidencia | Estado |
|---|---|---|---|---|---|---|
| | | P0/P1/P2 | | | | Abierto/Cerrado |
| | | | | | | |
| | | | | | | |

**Severidades:**

- **P0:** bloquea la entrega o la demo (login, datos, caída, pérdida de información).
- **P1:** flujo importante con error o mensaje confuso.
- **P2:** detalle visual, texto o mejora menor.

---

## 15. Resultado final

| Campo | Valor |
|---|---|
| Casos ejecutados | |
| Casos OK | |
| Casos con falla | |
| P0 abiertos | |
| P1 abiertos | |
| P2 abiertos | |
| ¿Aprobado para entrega? | Sí / No |
| Firma / fecha | |
