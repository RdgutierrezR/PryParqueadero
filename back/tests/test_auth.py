"""Pruebas de autenticación y permisos."""
from tests.conftest import auth_headers


def test_login_correcto(client):
    response = client.post(
        "/api/auth/login", json={"username": "admin_test", "password": "admin12345"}
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["success"] is True
    assert body["data"]["user"]["role"] == "administrador"
    assert body["data"]["csrf_token"]


def test_login_incorrecto(client):
    response = client.post(
        "/api/auth/login", json={"username": "admin_test", "password": "mala"}
    )
    assert response.status_code == 401
    assert response.get_json()["success"] is False


def test_login_usuario_inexistente(client):
    response = client.post(
        "/api/auth/login", json={"username": "nadie", "password": "loquesea12"}
    )
    assert response.status_code == 401


def test_endpoint_protegido_sin_sesion(client):
    response = client.get("/api/vehicles")
    assert response.status_code == 401


def test_vigilante_no_puede_listar_vehiculos(client, csrf_guard):
    response = client.get("/api/vehicles")
    assert response.status_code == 403


def test_vigilante_no_puede_registrar_vehiculos(client, csrf_guard):
    response = client.post(
        "/api/vehicles",
        json={"plate": "NEW123", "vehicle_type": "automovil", "person_id": 1},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 403


def test_admin_puede_listar_vehiculos(client, csrf_admin):
    response = client.get("/api/vehicles")
    assert response.status_code == 200


def test_csrf_requerido_en_escritura(client, csrf_admin):
    # Sin encabezado CSRF debe rechazarse.
    response = client.post(
        "/api/persons",
        json={"full_name": "Nueva Persona", "person_type": "docente"},
    )
    assert response.status_code == 403


def test_logout(client, csrf_admin):
    response = client.post("/api/auth/logout", headers=auth_headers(csrf_admin))
    assert response.status_code == 200
    assert client.get("/api/vehicles").status_code == 401
