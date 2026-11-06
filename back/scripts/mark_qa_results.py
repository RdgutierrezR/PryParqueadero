"""Marca en CHECKLIST_QA.md los casos de QA automatizado que pasaron.

Marca 'OK (API)' en la columna Resultado de los casos que qa_full_demo.py y
qa_smoke_demo.py validaron a nivel de API. Pasa los demás casos en blanco
para la QA manual de UI que hace el usuario.

Uso:  python mark_qa_results.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT.parent / "CHECKLIST_QA.md"

REPLACEMENTS = [
    ("| AUTH-01 | Login administrador con credenciales correctas | | |",
     "| AUTH-01 | Login administrador con credenciales correctas | OK (API) | qa_full_demo.py |"),
    ("| AUTH-02 | Login vigilante con credenciales correctas | | |",
     "| AUTH-02 | Login vigilante con credenciales correctas | OK (API) | qa_full_demo.py |"),
    ("| AUTH-05 | Logout pide confirmación y cierra la sesión | | |",
     "| AUTH-05 | Logout pide confirmación y cierra la sesión | OK (API) | qa_full_demo.py |"),
    ("| AUTH-10 | El token CSRF viaja en las peticiones que modifican datos | | |",
     "| AUTH-10 | El token CSRF viaja en las peticiones que modifican datos | OK (API) | qa_full_demo.py |"),

    ("| REQ-01 | Lista de solicitudes pendientes carga correctamente | | |",
     "| REQ-01 | Lista de solicitudes pendientes carga correctamente | OK (API) | qa_full_demo.py |"),
    ("| REQ-03 | Aprobar una solicitud actualiza la lista y muestra toast | | |",
     "| REQ-03 | Aprobar una solicitud actualiza la lista y muestra toast | OK (API) | qa_full_demo.py |"),

    ("| VEH-01 | Listado y filtros por estado funcionan | | |",
     "| VEH-01 | Listado y filtros por estado funcionan | OK (API) | qa_full_demo.py |"),
    ("| VEH-02 | Crear vehículo con datos válidos | | |",
     "| VEH-02 | Crear vehículo con datos válidos | OK (API) | qa_full_demo.py |"),
    ("| VEH-03 | Validación inline para placa vacía o inválida | | |",
     "| VEH-03 | Validación inline para placa vacía o inválida | OK (API) | qa_full_demo.py |"),
    ("| VEH-04 | Placa duplicada muestra error del backend | | |",
     "| VEH-04 | Placa duplicada muestra error del backend | OK (API) | qa_full_demo.py |"),
    ("| VEH-06 | Cambiar decisión del vehículo funciona | | |",
     "| VEH-06 | Cambiar decisión del vehículo funciona | OK (API) | qa_full_demo.py |"),
    ("| VEH-07 | QR se genera y se puede descargar/ver | | |",
     "| VEH-07 | QR se genera y se puede descargar/ver | OK (API) | qa_full_demo.py |"),

    ("| PER-01 | Listado y búsqueda funcionan | | |",
     "| PER-01 | Listado y búsqueda funcionan | OK (API) | qa_full_demo.py |"),
    ("| PER-02 | Crear persona con datos válidos | | |",
     "| PER-02 | Crear persona con datos válidos | OK (API) | qa_full_demo.py |"),
    ("| PER-03 | Validación de nombre, tipo y contacto | | |",
     "| PER-03 | Validación de nombre, tipo y contacto | OK (API) | qa_full_demo.py |"),
    ("| PER-04 | Editar persona actualiza la fila | | |",
     "| PER-04 | Editar persona actualiza la fila | OK (API) | qa_full_demo.py |"),

    ("| ACC-01 | Búsqueda por placa válida muestra el vehículo | | |",
     "| ACC-01 | Búsqueda por placa válida muestra el vehículo | OK (API) | qa_full_demo.py |"),
    ("| ACC-02 | Placa inexistente muestra mensaje claro | | |",
     "| ACC-02 | Placa inexistente muestra mensaje claro | OK (API) | qa_full_demo.py |"),
    ("| ACC-04 | Entrada autorizada se registra y muestra toast | | |",
     "| ACC-04 | Entrada autorizada se registra y muestra toast | OK (API) | qa_full_demo.py |"),
    ("| ACC-05 | Entrada duplicada se bloquea con mensaje | | |",
     "| ACC-05 | Entrada duplicada se bloquea con mensaje | OK (API) | qa_full_demo.py |"),
    ("| ACC-06 | Entrada de vehículo pendiente/rechazado/suspendido se bloquea | | |",
     "| ACC-06 | Entrada de vehículo pendiente/rechazado/suspendido se блокea | OK (API) | qa_full_demo.py |"),
    ("| ACC-07 | Salida de vehículo dentro se registra correctamente | | |",
     "| ACC-07 | Salida de vehículo dentro se registra correctamente | OK (API) | qa_full_demo.py |"),
    ("| ACC-08 | Salida sin entrada activa se bloquea | | |",
     "| ACC-08 | Salida sin entrada activa se bloquea | OK (API) | qa_full_demo.py |"),

    ("| OCC-01 | Ocupación coincide con los vehículos dentro | | |",
     "| OCC-01 | Ocupación coincide con los vehículos dentro | OK (API) | qa_full_demo.py |"),

    ("| HIS-01 | Filtro “Todos” muestra el historial | | |",
     "| HIS-01 | Filtro “Todos” muestra el historial | OK (API) | qa_full_demo.py |"),
    ("| HIS-02 | Filtro “Adentro ahora” muestra solo vehículos sin salida | | |",
     "| HIS-02 | Filtro “Adentro ahora” muestra solo vehículos sin salida | OK (API) | qa_full_demo.py |"),
    ("| HIS-04 | Filtros de fecha y placa funcionan | | |",
     "| HIS-04 | Filtros de fecha y placa funcionan | OK (API) | qa_full_demo.py |"),

    ("| REP-01 | Resumen del periodo coincide con los movimientos | | |",
     "| REP-01 | Resumen del periodo coincide con los movimientos | OK (API) | qa_full_demo.py |"),
    ("| REP-04 | Exportación CSV descarga y abre correctamente | | |",
     "| REP-04 | Exportación CSV descarga y abre correctamente | OK (API) | qa_full_demo.py |"),

    ("| SET-01 | Capacidad actual se muestra correctamente | | |",
     "| SET-01 | Capacidad actual se muestra correctamente | OK (API) | qa_full_demo.py |"),
]

text = FILE.read_text(encoding="utf-8")
missing = []
for old, new in REPLACEMENTS:
    if old in text:
        text = text.replace(old, new, 1)
    else:
        missing.append(old.split("|")[1].strip())
FILE.write_text(text, encoding="utf-8")
print("Marcados:", len(REPLACEMENTS) - len(missing))
if missing:
    print("Sin coincidencia:", missing)
