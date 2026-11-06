"""QA rápido (solicitudes HTTP reales) contra la base DEMO.

Verifica: login admin/vigilante, occupancy, historial, reportes, resumen,
y bloqueos de seguridad. No modifica nada que no esté en la base demo.

Uso (con el backend corriendo en modo demo):
    back/venv/Scripts/python.exe qa_smoke_demo.py
"""
import json
import sys
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

BASE = "http://127.0.0.1:5000"

_cj = CookieJar()
_opener = build_opener(HTTPCookieProcessor(_cj))
_csrf_token = None


def _request(path, method="GET", body=None, auth=False):
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None

    req = Request(BASE + path, data=data, headers=headers, method=method)
    if auth and _csrf_token:
        req.add_header("X-CSRF-Token", _csrf_token)
    try:
        with _opener.open(req) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except HTTPError as e:
        try:
            payload = json.loads(e.read().decode() or "{}")
        except Exception:
            payload = {}
        return e.code, payload


def _capture_csrf(payload):
    global _csrf_token
    if isinstance(payload, dict):
        data = payload.get("data") or {}
        token = data.get("csrf_token") or payload.get("csrf_token")
        if token:
            _csrf_token = token


def result(name, ok, detail=""):
    flag = "OK " if ok else "FALLA"
    print(f"[{flag}] {name} {detail}")
    return bool(ok)


def main():
    ok = True

    st, payload = _request(
        "/api/auth/login", method="POST", body={"username": "admin", "password": "Admin12345"}
    )
    _capture_csrf(payload)
    ok &= result("Admin login", st == 200, f"status={st}")
    if st != 200:
        return 1

    st, _ = _request("/api/access/occupancy")
    ok &= result("Occupancy", st == 200, f"status={st}")

    st, _ = _request("/api/reports/summary?start=2026-11-01&end=2026-11-06")
    ok &= result("Reportes resumen", st == 200, f"status={st}")
    st, _ = _request("/api/reports/history?start=2026-11-01&end=2026-11-06")
    ok &= result("Historial", st == 200, f"status={st}")

    # Cerrar sesión del admin.
    st, _ = _request("/api/auth/logout", method="POST", body={}, auth=True)
    ok &= result("Logout admin", st == 200, f"status={st}")

    st, payload = _request(
        "/api/auth/login", method="POST", body={"username": "vigilante", "password": "Vigilante123"}
    )
    _capture_csrf(payload)
    ok &= result("Vigilante login", st == 200, f"status={st}")
    if st != 200:
        return 1

    st, _ = _request("/api/access/occupancy")
    ok &= result("Occupancy (vigilante)", st == 200, f"status={st}")
    st, _ = _request("/api/reports/history?start=2026-11-01&end=2026-11-06")
    ok &= result("Historial (vigilante)", st == 200, f"status={st}")

    st, _ = _request("/api/users")
    ok &= result(
        "Vigilante bloqueado en /api/users",
        st in (401, 403),
        f"status={st}",
    )
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
