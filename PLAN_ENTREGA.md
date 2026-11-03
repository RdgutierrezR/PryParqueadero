# Plan integral de cierre — 3 al 6 de noviembre de 2026

> **Supuesto de trabajo:** el sistema ya está construido y funcional. El objetivo
> de esta semana es **dejarlo listo para entrega y demostración**, no rehacerlo
> ni agregar funcionalidades grandes. Si el objetivo es otro, ajustamos el plan.

## Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Fecha límite | **Viernes 6 de noviembre de 2026** |
| Datos demo | **Opción A: base demo separada** (`parqueadero.demo.db`) |
| Protección | **Autorizado:** respaldo de la base e inicialización de Git |
| Fin de semana | Sábado 7 y domingo 8 quedan como respaldo/contingencia |

---

## 1. Estado de partida (verificado)

| Área | Estado actual |
|---|---|
| Backend | Flask + SQLAlchemy + SQLite, autenticación por sesión y CSRF |
| Frontend | React + Vite, diseño responsive, componentes reutilizables |
| Roles | Administrador y vigilante con rutas protegidas |
| Módulos | Login, dashboard, solicitudes, vehículos, personas, historial, reportes, configuración, acceso y ocupación |
| Pruebas backend | **51 pruebas ejecutadas, sin fallos** |
| Build frontend | **Correcto** (86 módulos) |
| Acceso WiFi | Funcionando; Vite en `0.0.0.0:5173`, Flask solo en `127.0.0.1:5000` |
| Datos actuales | 6 personas, 7 vehículos, 8 movimientos, 0 dentro |
| Datos de usuario | `KLA897` y “Cristian Camilo Arango Mora” **no deben borrarse** |
| Control de versiones | **No hay repositorio Git** |
| Calidad automatizada | Sin lint ni pruebas E2E; QA manual |
| Documentación | README y guía de otro equipo, con algunos datos desactualizados |

### Brechas detectadas

1. No hay respaldo formal de la base de datos ni procedimiento de restauración.
2. No hay repositorio Git ni historial de cambios.
3. La documentación aún dice “43 passed” en la guía de otro equipo.
4. Los datos demo tienen fechas de octubre; para una demo en noviembre los KPIs
   de “hoy” se ven vacíos.
5. La cámara QR no funciona por WiFi HTTP (limitación del navegador).
6. Solo se verificó el responsive a 800 px; faltan 360/768/1280 px.
7. No hay manual de usuario ni guion de demostración.
8. No hay checklist de aceptación ni registro formal de defectos.

---

## 2. Objetivo y criterios de éxito

Al finalizar el **viernes 6 de noviembre**:

- [ ] El proyecto arranca desde cero con `instalar.bat` e `iniciar.bat`.
- [ ] Administrador y vigilante completan todos sus flujos sin errores P0/P1.
- [ ] La demo se puede repetir con datos recientes y sin depender de la fecha.
- [ ] Existe un respaldo de la base y se probó su restauración.
- [ ] El proyecto está en Git con un commit base.
- [ ] README, guía de otro equipo y manual de usuario están al día.
- [ ] Guion de demo de 5–7 minutos ensayado.
- [ ] Acceso desde celular probado en la red WiFi real.

**Definición de “listo”:** build correcto, 51 pruebas en verde, checklist QA
completo y demo ensayada sin bloqueos.

---

## 3. Alcance

### Incluido

- Auditoría funcional y corrección de defectos.
- Respaldo/restauración y control de versiones.
- Escenario de datos demo reproducible.
- QA de roles, formularios, errores de red, responsive y accesibilidad básica.
- Documentación y guion de sustentación.
- Prueba de acceso desde el celular.

### No incluido (salvo que sea requisito explícito)

- Nuevas funcionalidades (pagos, reservas, reportes PDF, etc.).
- Despliegue en internet, HTTPS o dominio.
- Aplicación móvil nativa.
- Reescritura del diseño o cambio de arquitectura.
- Migración a PostgreSQL.

---

## 4. Backlog priorizado

### P0 — Obligatorio para entregar

| # | Tarea | Resultado esperado |
|---|---|---|
| 1 | Congelar alcance y acordar fecha exacta | Lista cerrada de lo que se entrega |
| 2 | Respaldar `parqueadero.db` | Copia con fecha + procedimiento de restauración |
| 3 | Inicializar Git y commit base | Repositorio limpio, sin `venv`, `node_modules` ni base |
| 4 | Corregir documentación desactualizada | README y guía coherentes con el estado real |
| 5 | Definir escenario demo | Datos recientes y repetibles sin tocar datos reales |
| 6 | QA integral de ambos roles | Checklist completo y defectos registrados |
| 7 | Corregir defectos P0/P1 | Cero bloqueos conocidos |
| 8 | Prueba de instalación/arranque limpio | `instalar.bat` + `iniciar.bat` funcionando |
| 9 | Prueba desde celular por WiFi | Login y operación básica desde el teléfono |
| 10 | Ensayo de demo | Guion cronometrado y contingencia lista |

### P1 — Recomendado

| # | Tarea | Resultado esperado |
|---|---|---|
| 11 | Manual de usuario | Guía por rol con capturas o pasos |
| 12 | Responsive 360 / 768 / 1280 px | Sin desbordes ni menús inaccesibles |
| 13 | Accesibilidad básica | Foco visible, labels, contraste, teclado |
| 14 | Errores de red y backend apagado | Mensajes claros, sin pantallas rotas |
| 15 | Limpieza de código/documentos | Quitar restos no usados y duplicados |
| 16 | Copia offline del proyecto | USB/carpeta comprimida con base y build |

### P2 — Solo si sobra tiempo

| # | Tarea | Resultado esperado |
|---|---|---|
| 17 | Smoke tests E2E con Playwright | Flujos críticos automatizados |
| 18 | Modo producción | Build servido sin depender de Vite dev |
| 19 | Auditoría Lighthouse completa | Métricas y mejoras opcionales |

---

## 5. Plan por días

### Martes 3 — Base y respaldo

- Confirmar objetivo, fecha y alcance.
- Crear respaldo de la base de datos.
- Inicializar Git y hacer commit base.
- Ejecutar build y pruebas para registrar la línea base.
- Crear checklist QA y esqueleto del guion de demo.

**Entregable:** respaldo + repositorio + línea base + checklist.

### Miércoles 4 — Datos demo y documentación

- Implementar el escenario demo elegido (base separada o respaldo/restauración).
- Actualizar README y guía de otro equipo.
- Redactar manual de usuario.
- Corregir defectos P0 detectados en la auditoría.

**Entregable:** demo reproducible + documentación v1.

### Jueves 5 — QA funcional (pasada 1)

- Login, logout, roles y rutas protegidas.
- Dashboard, solicitudes, vehículos, personas.
- Historial, reportes y configuración.
- Acceso, ocupación y códigos QR.
- Registrar cada defecto con pasos y severidad.

**Entregable:** informe QA con defectos priorizados.

### Viernes 6 — QA final, cierre y entrega

- Validaciones inline y errores del servidor.
- Toasts y confirmaciones.
- Backend apagado / errores de red.
- Responsive 360/768/1280 y teclado.
- Instalación y arranque limpio.
- Prueba real desde el celular.
- Ensayo completo de la demo con cronómetro.
- Respaldo final, commit de cierre y entrega.

**Entregable:** versión final sin P0/P1 abiertos + paquete de entrega.

### Sábado 7 — Buffer de contingencia

- Solo si el viernes queda algo pendiente: corregir, revalidar y volver a ensayar.
- Verificar copia offline y restauración de la base demo.
- No agregar funcionalidades nuevas.

**Entregable:** cierre definitivo si el viernes no se completó.

### Domingo 8 — Reserva

- Día libre. Solo se usa si hay un bloqueo imprevisto.
- No se planifica trabajo nuevo.

---

## 6. Checklist QA mínimo

### Autenticación y roles

- [ ] Login administrador.
- [ ] Login vigilante.
- [ ] Credenciales incorrectas.
- [ ] Logout con confirmación.
- [ ] Administrador no entra a rutas de vigilante.
- [ ] Vigilante no entra a rutas de administrador.

### Administrador

- [ ] Dashboard con KPIs, dona y gráficas reales.
- [ ] Solicitudes: estado vacío y decisión aprobar/rechazar/suspender.
- [ ] Vehículos: listar, filtrar, crear con validación, placa duplicada, decisión y QR.
- [ ] Personas: listar, buscar, crear, editar y eliminar (solo datos de prueba).
- [ ] Historial: todos / adentro ahora / ya salieron.
- [ ] Reportes: periodo, totales, vehículos dentro y CSV.
- [ ] Configuración: capacidad, cuentas y activación/desactivación.
- [ ] Mensajes de éxito solo después de respuesta real del backend.

### Vigilante

- [ ] Búsqueda por placa.
- [ ] Validación por QR.
- [ ] Entrada autorizada.
- [ ] Entrada duplicada.
- [ ] Entrada de vehículo pendiente/rechazado/suspendido.
- [ ] Salida correcta.
- [ ] Salida sin entrada activa.
- [ ] Parqueadero lleno (si se puede simular sin afectar datos reales).
- [ ] Ocupación actualizada.
- [ ] Historial disponible.

### Calidad transversal

- [ ] Sin errores en consola del navegador.
- [ ] Sin respuestas 4xx/5xx inesperadas.
- [ ] Responsive 360/768/1280.
- [ ] Navegación por teclado y foco visible.
- [ ] Modales cierran con Escape y restauran foco.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Acceso desde celular por WiFi.

---

## 7. Estrategia de datos demo

**Restricción:** la base actual contiene datos que parecen reales o de pruebas del
usuario (`KLA897`, “Cristian Camilo Arango Mora”). No se deben borrar.

### Opción A — Base demo separada (recomendada)

- Copiar la base actual a `back/instance/parqueadero.demo.db`.
- Crear un script que genere movimientos recientes sobre esa copia.
- Añadir un `iniciar_demo.bat` que arranque con `DATABASE_URL` apuntando a la
  base demo.
- La base real queda intacta.

**Ventaja:** demos repetibles sin riesgo.
**Costo:** un script y un `.bat` adicionales.

### Opción B — Respaldo y restauración

- Respaldar la base actual.
- Generar datos recientes en la base principal.
- Restaurar la copia al terminar la demo.

**Ventaja:** menos archivos.
**Riesgo:** si se olvida restaurar, se mezclan datos.

### Opción C — No tocar datos

- Usar la base actual tal como está.
- La demo se apoya en historial y reportes, no en KPIs de “hoy”.

**Ventaja:** cero riesgo.
**Desventaja:** la demo puede verse vacía en “hoy”.

---

## 8. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Pérdida de datos | Media | Alto | Respaldo antes de cualquier cambio + base demo separada |
| Firewall/router bloquea el celular | Media | Medio | Probar antes; regla de firewall; fallback en PC |
| Cámara QR no funciona por HTTP | Alta | Bajo | Búsqueda manual por placa; demo QR en el PC |
| Datos demo con fechas viejas | Alta | Medio | Escenario demo reciente |
| Falta de tiempo | Media | Alto | Congelar alcance; solo P0 |
| No hay Git | Alta | Medio | Inicializar hoy y commit base |
| Documentación desactualizada | Alta | Bajo | Revisión el miércoles |
| Falla el día de la demo | Baja | Alto | Copia offline + ensayo + video/capturas |

---

## 9. Decisiones pendientes

1. **Fecha exacta de entrega o sustentación.**
2. **¿Es una entrega académica con demostración?** ¿Habrá jurado/preguntas?
3. **¿Qué opción de datos demo usamos?** A, B o C.
4. **¿Se necesita manual de usuario y/o diapositivas?**
5. **¿Autorizas crear respaldo e inicializar Git?**
6. **¿Basta con ejecución local/WiFi o se exige despliegue en internet?**

---

## 10. Primer bloque de trabajo (hoy)

Si se confirma el plan, el primer bloque es:

1. Crear respaldo de `back/instance/parqueadero.db`.
2. Inicializar Git con `.gitignore` verificado.
3. Ejecutar build y pruebas para registrar la línea base.
4. Crear `CHECKLIST_QA.md` y esqueleto de `GUION_DEMO.md`.
5. Confirmar la opción de datos demo.

Con eso queda protegido el proyecto antes de tocar cualquier otra cosa.
