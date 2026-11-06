"""QA funcional completo por HTTP sobre la base DEMO.

Cubre: personas, vehículos/solicitudes, decision, QR, acceso entrada/salida,
ocupación, historial, reportes, configuración y bloqueos por rol.

El backend debe estar corriendo en modo DEMO (iniciar_demo.bat). La base
de datos real NO se toca: cualquier dato QA se limpia al final.

Uso:
    back/venv/Scripts/python.exe qa_full_demo.py
"""
import json
import sys
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

BASE = "http://127.0.0.1:5000"
PLATE_A = "QAQA01"
PLATE_B = "QAQA02"
PLATE_C = "QAQA03"
PERSON_NAME = "QA Persona Prueba"

_cj = CookieJar()
_opener = build_opener(HTTPCookieProcessor(_cj))
_csrf = None
_results: list[bool] = []


def _request(path, method="GET", body=None, auth=False):
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    if auth and _csrf:
        headers["X-CSRF-Token"] = _csrf
    req = Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with _opener.open(req) as r:
            ctype = (r.headers.get("Content-Type") or "").lower()
            if "image/" in ctype or "text/csv" in ctype or "application/octet-stream" in ctype:
                raw = r.read()
                return r.status, {"bytes": len(raw)}
            payload = json.loads(r.read().decode() or "{}")
            return r.status, payload
    except HTTPError as e:
        try:
            payload = json.loads(e.read().decode() or "{}")
        except Exception:
            payload = {}
        return e.code, payload


def _set_csrf(payload):
    global _csrf
    if isinstance(payload, dict):
        data = payload.get("data") or payload
        token = (payload.get("csrf_token") or payload.get("data", {}).get("csrf_token"))
        if token is None and isinstance(data, dict):
            token = data.get("csrf_token")
        if token:
            _csrf = token


def check(name, ok, detail=""):
    flag = "OK  " if ok else "FALLA"
    safe_name = name.encode("cp1252", errors="replace").decode("cp1252")
    print(f"[{flag}] {safe_name} {detail}".rstrip())
    _results.append(bool(ok))
    return bool(ok)


def login(username, password):
    st, payload = _request(
        "/api/auth/login", method="POST", body={"username": username, "password": password}
    )
    _set_csrf(payload)
    return st, payload


def main():
    # Fase 0: login admin
    _cleanup()
    st, payload = login("admin", "Admin12345")
    check("Admin login", st == 200, f"status={st}")
    if st != 200:
        return 1

    # Fase 1: personas
    st, payload = _request("/api/persons", body=None)
    check("Listar personas", st == 200, f"status={st}")
    st, payload = _request(
        "/api/persons",
        method="POST",
        auth=True,
        body={"full_name": PERSON_NAME, "person_type": "estudiante"},
    )
    check("Crear persona", st in (200, 201), f"status={st}")
    person_id = (payload.get("data") or {}).get("id")
    check("Persona creada con id", bool(person_id), f"id={person_id}")

    st, payload = _request(
        "/api/persons",
        method="POST",
        auth=True,
        body={"full_name": "x", "person_type": "estudiante"},
    )
    check("Crear persona inválida → 422", st == 422, f"status={st}")

    st, payload = _request(
        f"/api/persons/{person_id}",
        method="PUT",
        auth=True,
        body={"full_name": PERSON_NAME, "person_type": "docente"},
    )
    check("Actualizar persona", st == 200, f"status={st}")

    # Fase 2: vehículos y decisiones
    st, payload = _request(
        "/api/vehicles",
        method="POST",
        auth=True,
        body={"plate": PLATE_A, "vehicle_type": "automovil", "person_id": person_id},
    )
    check("Crear vehículo A (pendiente)", st in (200, 201), f"status={st}")
    vid_a = (payload.get("data") or {}).get("id")

    st, payload = _request(
        "/api/vehicles",
        method="POST",
        auth=True,
        body={"plate": PLATE_A, "vehicle_type": "automovil", "person_id": person_id},
    )
    check("Placa duplicada → 409", st == 409, f"status={st}")

    st, payload = _request(
        "/api/vehicles",
        method="POST",
        auth=True,
        body={"plate": PLATE_B, "vehicle_type": "automovil", "person_id": person_id},
    )
    check("Crear vehículo B (pendiente)", st in (200, 201), f"status={st}")
    vid_b = (payload.get("data") or {}).get("id")

    st, payload = _request("/api/vehicles/pending")
    check("Solicitudes pendientes", st == 200, f"status={st}")
    plates = [v.get("plate") for v in (payload.get("data") or [])]
    check("A/B están pendientes", PLATE_A in plates and PLATE_B in plates)

    st, payload = _request(
        f"/api/vehicles/{vid_a}/decision",
        method="POST",
        auth=True,
        body={"decision": "aprobado"},
    )
    check("Aprobar vehículo A", st == 200, f"status={st}")

    st, payload = _request(
        f"/api/vehicles/{vid_b}/decision",
        method="POST",
        auth=True,
        body={"decision": "invalida"},
    )
    check("Decisión inválida → 422", st == 422, f"status={st}")

    st, payload = _request("/api/vehicles?status=autorizado")
    check("Filtro por autorizados", st == 200, f"status={st}")
    plates = [v.get("plate") for v in (payload.get("data") or [])]
    check("A aparece como autorizado", PLATE_A in plates)

    st, payload = _request(f"/api/vehicles/{vid_a}/qr.png")
    check("QR PNG de A", st == 200, f"status={st}")

    # Fase 3: acceso (admin, luego vigilante reutilizado)
    st, payload = _request(
        "/api/access/search?plate=" + PLATE_A, method="GET"
    )
    check("Buscar A por placa", st == 200, f"status={st}")

    st, payload = _request("/api/access/search?plate=NOEXISTE999", method="GET")
    check("Placa inexistente → 404", st == 404, f"status={st}")

    st, payload = _request(
        "/api/access/entry", method="POST", auth=True, body={"plate": PLATE_A}
    )
    check("Entrada de A registrada", st in (200, 201), f"status={st}")

    st, payload = _request(
        "/api/access/entry", method="POST", auth=True, body={"plate": PLATE_A}
    )
    check("Entrada duplicada de A → 409", st == 409, f"status={st}")

    st, payload = _request(
        "/api/access/entry", method="POST", auth=True, body={"plate": PLATE_B}
    )
    check("Entrada pendiente B bloqueada", st in (403, 409), f"status={st}")

    st, payload = _request("/api/access/occupancy")
    dentro = ((payload.get("data") or {}).get("inside")) or 0
    check("Ocupación coherentemente mayor a 0", dentro >= 1, f"inside={dentro}")

    st, payload = _request(
        "/api/access/exit", method="POST", auth=True, body={"plate": PLATE_A}
    )
    check("Salida de A registrada", st == 200, f"status={st}")

    st, payload = _request(
        "/api/access/exit", method="POST", auth=True, body={"plate": PLATE_A}
    )
    check("Salida duplicada → 409", st == 409, f"status={st}")

    # Fase 4: reportes y configuración
    st, payload = _request("/api/reports/summary?start=2026-11-01&end=2026-11-06")
    check("Resumen reportes", st == 200, f"status={st}")
    st, payload = _request("/api/reports/history?start=2026-11-01&end=2026-11-06")
    check("Historial", st == 200, f"status={st}")
    st, payload = _request("/api/reports/inside")
    check("Adentro ahora", st == 200, f"status={st}")
    st, payload = _request("/api/reports/export?start=2026-11-01&end=2026-11-06")
    check("Export CSV", st == 200, f"status={st}")
    st, payload = _request("/api/settings")
    check("Settings GET", st == 200, f"status={st}")

    # Fase 5: bloqueos por rol
    st, payload = _request("/api/users")
    check("Admin puede listar usuarios", st == 200, f"status={st}")

    st, payload = _request("/api/auth/logout", method="POST", auth=True, body={})
    check("Logout admin", st == 200, f"status={st}")

    st, payload = login("vigilante", "Vigilante123")
    check("Vigilante login", st == 200, f"status={st}")

    st, payload = _request("/api/access/occupancy")
    check("Occupancy vigilante", st == 200, f"status={st}")

    st, payload = _request("/api/users")
    check("Vigilante bloqueado /users", st in (401, 403), f"status={st}")

    st, payload = _request("/api/persons", method="POST", auth=True, body=None)
    check("Vigilante bloqueado crear persona", st in (401, 403), f"status={st}")

    st, payload = _request("/api/auth/logout", method="POST", auth=True, body={})
    check("Logout vigilante", st == 200, f"status={st}")

    # Cleanup QA data (limpia base demo para demo final)
    _cleanup()
    return 0 if all(_results) else 1


def _cleanup():
    from pathlib import Path
    root = Path(__file__).resolve().parent
    import os
    os.environ.setdefault(
        "DATABASE_URL", f"sqlite:///{(root / 'instance' / 'parqueadero.demo.db').as_posix()}"
    )
    from app import create_app
    from app.extensions import db
    from app.models.movement import Movement
    from app.models.person import Person
    from app.models.vehicle import Vehicle

    app = create_app()
    with app.app_context():
        plates = (PLATE_A, PLATE_B, PLATE_C)
        ids = [v.id for v in Vehicle.query.filter(Vehicle.plate.in_(plates)).all()]
        if ids:
            Movement.query.filter(Movement.vehicle_id.in_(ids)).delete(
                synchronize_session=False
            )
            Vehicle.query.filter(Vehicle.id.in_(ids)).delete(synchronize_session=False)
        Person.query.filter_by(full_name=PERSON_NAME).delete(synchronize_session=False)
        db.session.commit()
        print("Limpieza de datos QA en la demo: hecha.")


if __name__ == "__main__":
    sys.exit(main())
