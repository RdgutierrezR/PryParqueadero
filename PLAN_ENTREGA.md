# Plan integral de cierre — 3 al 6 de noviembre de 2026

> **Supuesto de trabajo:** el sistema ya está construido y funcional. El objetivo
> de esta semana es **dejarlo listo para entrega y demostración**, agregando
> además una **vista móvil del vigilante como PWA** sobre HTTPS local, sin
> rehacer el sistema ni agregar funcionalidades grandes. Si el objetivo es otro,
> ajustamos el plan.

## Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Fecha límite | **Viernes 6 de noviembre de 2026** |
| Datos demo | **Opción A: base demo separada y ficticia** (`parqueadero.demo.db`) |
| Protección | **Autorizado:** respaldo de la base e inicialización de Git |
| Fin de semana | Sábado 7 y domingo 8 quedan como respaldo/contingencia |
| Alcance móvil | El vigilante puede buscar por placa, registrar entrada/salida, ver ocupación e historial |
| Móvil/PWA | Sí, se agrega instalación como app (PWA) |
| Esqueleto del parqueadero | Sí, vista esquemática con la capacidad real configurada |
| HTTPS en el teléfono | Sí, certificado auto-firmado aceptado (habilita cámara QR e instalación PWA) |
| Escaneo QR en el móvil | Sí, se valida sobre HTTPS |
| Offline | No requerido: misma WiFi, sin modo offline |

---

## 1. Estado de partida y base del plan

### 1.1 Evidencia revisada (3 de noviembre)

| Evidencia | Resultado | Qué implica |
|---|---|---|
| `pytest` en `back/` | 51 pruebas, 0 fallos | El backend está sano; no se reescribe |
| `npm run build` en `front/` | 86 módulos, build correcto | El frontend compila; no se rehace |
| Consulta a SQLite | 6 personas, 7 vehículos, 8 movimientos, 0 dentro; último movimiento el 31-oct | Los KPIs de “hoy” se ven vacíos; hace falta un escenario demo |
| `git status` | El proyecto no era repositorio | Riesgo de pérdida; ya se creó Git |
| `PARA_EJECUTAR_EN_OTRO_EQUIPO.md` | Decía “43 passed” | Documentación desactualizada |
| Prueba por LAN | Vite en `0.0.0.0:5173`, Flask en `127.0.0.1:5000`, login por IP correcto | El WiFi sirve; la cámara QR requiere HTTPS |
| Búsqueda de `TODO/FIXME` | Sin pendientes marcados | No hay deuda crítica evidente |
| Pruebas E2E y lint | No existen | El cierre se apoya en QA manual con checklist |
| Responsive | Verificado solo a 800 px | Falta probar 360/768/1280 px |
| Datos reales | `KLA897`, “Cristian Camilo Arango Mora” | No se tocan; la demo va en base aparte |

### 1.2 Estado actual

| Área | Estado |
|---|---|
| Backend | Flask + SQLAlchemy + SQLite, sesión y CSRF |
| Frontend | React + Vite, componentes reutilizables |
| Roles | Administrador y vigilante con rutas protegidas |
| Módulos | Login, dashboard, solicitudes, vehículos, personas, historial, reportes, configuración, acceso y ocupación |
| Pruebas backend | **51 pruebas, 0 fallos** |
| Build frontend | **Correcto** (86 módulos) |
| Acceso WiFi | Funcionando; Vite expuesto en la red, Flask solo local |
| Respaldo | `backups/parqueadero_20261103_101801.db`, SHA256 verificado, integridad `ok` |
| Git | Inicializado; commits `857c9f1` y `0bb68a5` |
| Documentación | Conteo de pruebas corregido; manual de usuario pendiente |
| Demo | Pendiente: base ficticia separada con movimientos recientes |
| QA | `CHECKLIST_QA.md` y `GUION_DEMO.md` creados; ejecución pendiente |

### 1.3 Brechas que justifican el plan

1. Los datos actuales son de octubre y no hay vehículos dentro: la demo se vería
   vacía en los indicadores de “hoy”.
2. La cámara QR no funciona por WiFi HTTP: hay que documentarlo y usar la
   búsqueda por placa en el celular.
3. El responsive solo se probó a 800 px: faltan 360, 768 y 1280 px.
4. No hay manual de usuario.
5. No hay pruebas E2E ni lint: el cierre se hace con QA manual.
6. Quedan detalles de documentación por revisar.
7. No hay despliegue de producción ni HTTPS; está fuera de alcance salvo que sea
   un requisito explícito.

### 1.4 Qué cambia y qué no cambia

| Tipo | Cambio propuesto | Archivos | ¿Toca datos reales? |
|---|---|---|---|
| Datos demo | Crear una base **ficticia** separada con movimientos recientes | `back/instance/parqueadero.demo.db`, `back/seed_demo_scenario.py` (nuevo) | No |
| Arranque | Iniciar el backend apuntando a la base demo | `iniciar_demo.bat` (nuevo) | No |
| Documentación | Manual de usuario y ajustes de guías | `MANUAL_USUARIO.md` (nuevo), `README.md`, `PARA_EJECUTAR_EN_OTRO_EQUIPO.md` | No |
| QA | Ejecutar el checklist y registrar defectos | `CHECKLIST_QA.md` | No |
| Móvil/PWA | Habilitar HTTPS en dev y convertir la vista del vigilante en app móvil instalable | `vite.config.js`, `manifest.json`, service worker, `AppLayout.jsx`/`Topbar.jsx` | No |
| Esqueleto del parqueadero | Vista esquemática basada en la capacidad configurada | Nuevo componente (por ejemplo `ParkingMap.jsx`) y página móvil | No |
| Código | Solo corregir defectos confirmados por QA | `front/src/**` o `back/app/**` puntual | No |
| Diseño | Solo ajustes si QA detecta problemas de responsive o accesibilidad | `global.css` o JSX puntual | No |

**Lo que NO se toca:**

- Esquema de la base de datos, rutas, autenticación, roles ni lógica de negocio.
- La base de datos real.
- El rediseño visual ya terminado.
- Despliegue en internet o dominio público (el HTTPS es solo de red local).

**Dependencia nueva justificada:** `@vitejs/plugin-basic-ssl` (o equivalente) solo
para servir HTTPS en desarrollo y poder usar la cámara e instalar la PWA en el
teléfono. No entra en producción.

**Regla de decisión:** si un cambio no ayuda a entregar/demostrar el sistema y no
corrige un defecto confirmado, no entra en esta semana.

---

## 2. Objetivo y criterios de éxito

Al finalizar el **viernes 6 de noviembre**:

- [ ] El proyecto arranca desde cero con `instalar.bat` e `iniciar.bat`.
- [ ] Administrador y vigilante completan todos sus flujos sin errores P0/P1.
- [ ] El vigilante puede usar la vista móvil por WiFi con HTTPS: placa, entrada/salida,
      ocupación e historial.
- [ ] La vista móvil del vigilante se puede instalar como PWA en el teléfono.
- [ ] La vista del parqueadero muestra un esqueleto esquemático con la capacidad real.
- [ ] El escaneo QR con cámara funciona en el teléfono sobre HTTPS.
- [ ] La demo se puede repetir con datos recientes y sin depender de la fecha.
- [ ] Existe un respaldo de la base y se probó su restauración.
- [ ] El proyecto está en Git con un commit base.
- [ ] README, guía de otro equipo y manual de usuario están al día.
- [ ] Guion de demo de 5–7 minutos ensayado.

**Definición de “listo”:** build correcto, 51 pruebas en verde, checklist QA
completo, PWA del vigilante probada en el teléfono y demo ensayada sin bloqueos.

---

## 3. Alcance

### Incluido

- Auditoría funcional y corrección de defectos.
- Respaldo/restauración y control de versiones.
- Escenario de datos demo reproducible.
- QA de roles, formularios, errores de red, responsive y accesibilidad básica.
- Documentación y guion de sustentación.
- **Vista móvil del vigilante (PWA) sobre HTTPS:** placa, entrada/salida,
  ocupación, historial y esqueleto esquemático del parqueadero.
- Escaneo QR con cámara validado en el teléfono (depende del HTTPS local).
- Prueba de acceso desde el celular.

### No incluido (salvo que sea requisito explícito)

- Nuevas funcionalidades distintas a la vista móvil (pagos, reservas, PDF…).
- Despliegue en internet, dominio público o HTTPS con autoridad válida,
  más allá del certificado auto-firmado de la red local.
- Aplicación móvil nativa.
- Modo offline / sincronización sin conexión.
- Plano real del parqueadero con sectores y espacios fijos (se deja esquemático).
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

### P0 extendido — Vista móvil del vigilante

| # | Tarea | Resultado esperado |
|---|---|---|
| 11 | HTTPS local con certificado auto-firmado | Vite accesible por HTTPS en la red; teléfono acepta el certificado |
| 12 | Manifest y service worker de la PWA | Iconos y metadatos correctos; app instalable en el teléfono |
| 13 | Vista móvil del vigilante | Placa, entrada/salida, ocupación e historial usables en 360 px |
| 14 | Esqueleto esquemático del parqueadero | Cuadrícula con la capacidad real y espacios ocupados marcados |
| 15 | Escaneo QR con cámara en el móvil | Validación por token sobre HTTPS |

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

### Miércoles 4 — Datos demo, móvil y PWA

- Implementar la base demo ficticia y el escenario de movimientos recientes.
- Crear `iniciar_demo.bat` para arrancar con la base demo.
- Habilitar HTTPS en Vite (certificado auto-firmado) para servir la vista móvil.
- Preparar manifest y service worker de la PWA.
- Crear la vista esquemática del parqueadero (cuadrícula con capacidad real).
- Integrar la búsqueda por placa, entrada/salida, ocupación e historial en el móvil.
- Corregir defectos P0 detectados.

**Entregable:** demo reproducible + vista móvil del vigilante funcionando por HTTPS.

### Jueves 5 — QA funcional, QR en móvil y manual

- Login, logout, roles y rutas protegidas.
- Dashboard, solicitudes, vehículos, personas.
- Historial, reportes y configuración.
- Acceso, ocupación y códigos QR en PC y **en el teléfono**.
- Probar la PWA instalada en el celular (placa, entrada/salida, mapa, historial).
- Registrar cada defecto con pasos y severidad.
- Redactar manual de usuario y ajustar documentación.

**Entregable:** informe QA con defectos priorizados + manual de usuario.

### Viernes 6 — QA final, PWA y entrega

- Validaciones inline y errores del servidor.
- Toasts y confirmaciones.
- Backend apagado / errores de red.
- Responsive 360/768/1280 y teclado.
- Instalación y arranque limpio.
- Prueba real de la PWA en el celular (placa, entrada/salida, QR, mapa).
- Ensayo completo de la demo con cronómetro.
- Respaldo final, commit de cierre y entrega.

**Entregable:** versión final sin P0/P1 abiertos + PWA del vigilante probada + paquete de entrega.

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

### Opción A — Base demo separada y ficticia (recomendada)

- Crear `back/instance/parqueadero.demo.db` **desde cero**, sin copiar los datos
  reales.
- Reutilizar `seed_demo.py` para usuarios, personas y vehículos ficticios.
- Crear `back/seed_demo_scenario.py` para agregar movimientos recientes y un
  vehículo dentro.
- Añadir `iniciar_demo.bat` que arranque con `DATABASE_URL` apuntando a la base
  demo.
- La base real queda intacta y la demo no muestra datos personales reales.

**Ventaja:** demo repetible, sin riesgo y sin exponer datos reales.
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
| Cámara QR no funciona por HTTP | Baja (con HTTPS) | Bajo | Fallback a búsqueda manual por placa; demo QR en el PC |
| Certificado auto-firmado bloquea la instalación PWA | Media | Medio | Fallback: instalar vía Chrome flag / mkcert, o usar la app como web normal con placa |
| Datos demo con fechas viejas | Alta | Medio | Escenario demo reciente |
| Falta de tiempo | Media | Alto | Congelar alcance; solo P0 |
| Cambios sin historial previo | Alta | Medio | Mitigado: commit base `857c9f1` |
| Documentación desactualizada | Alta | Bajo | Revisión el miércoles |
| Falla el día de la demo | Baja | Alto | Copia offline + ensayo + video/capturas |

---

## 9. Decisiones

### Confirmadas

1. **Fecha límite:** viernes 6 de noviembre de 2026.
2. **Datos demo:** opción A, base ficticia separada `parqueadero.demo.db`.
3. **Protección:** respaldo de la base e inicialización de Git autorizados.

### Pendientes

1. **¿Es una entrega académica con demostración?** ¿Habrá jurado/preguntas?
2. **¿Se necesita manual de usuario y/o diapositivas?**
3. **¿Basta con ejecución local/WiFi o se exige despliegue en internet?**

---

## 10. Primer bloque ejecutado (martes 3)

- [x] Respaldo de `back/instance/parqueadero.db` creado y verificado.
- [x] Integridad SQLite comprobada (`ok`).
- [x] Repositorio Git inicializado con `.gitignore` verificado.
- [x] Commit base creado: `857c9f1`.
- [x] Pruebas backend: **51 recolectadas, 0 fallos**.
- [x] Build frontend: **correcto**, 86 módulos.
- [x] `CHECKLIST_QA.md` creado.
- [x] `GUION_DEMO.md` creado.
- [x] Opción de datos demo confirmada.

**Respaldo:**

```text
backups/parqueadero_20261103_101801.db
SHA256: 86EF556CD04CD618F41C2579821586F34D55B0E66C221CBE09EA5EB7AB7E1394
Integridad: ok
```

**Commit base:** `857c9f1 chore: linea base del proyecto y plan de cierre`

---

## 11. Siguiente bloque (miércoles 4)

1. Crear `parqueadero.demo.db` desde cero con datos ficticios.
2. Implementar el escenario demo con movimientos recientes.
3. Crear `iniciar_demo.bat` para arrancar con la base demo.
4. Actualizar README y guía de otro equipo.
5. Corregir defectos P0 detectados.

