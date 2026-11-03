"""Pruebas de aprobación / rechazo / suspensión de vehículos."""
from tests.conftest import auth_headers


def _get_vehicle(client, plate):
    vehicles = client.get("/api/vehicles").get_json()["data"]
    return next(v for v in vehicles if v["plate"] == plate)


def test_solicitudes_pendientes(client, csrf_admin):
    response = client.get("/api/vehicles")
    pending = [v for v in response.get_json()["data"] if v["status"] == "pendiente"]
    assert any(v["plate"] == "PEN123" for v in pending)


def test_aprobar_vehiculo(client, csrf_admin):
    vehicle = _get_vehicle(client, "PEN123")
    response = client.post(
        f"/api/vehicles/{vehicle['id']}/decision",
        json={"decision": "aprobado", "observation": "Documentos en orden"},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "autorizado"


def test_rechazar_vehiculo(client, csrf_admin):
    vehicle = _get_vehicle(client, "PEN123")
    response = client.post(
        f"/api/vehicles/{vehicle['id']}/decision",
        json={"decision": "rechazado", "observation": "Sin cupo"},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "rechazado"


def test_decision_invalida(client, csrf_admin):
    vehicle = _get_vehicle(client, "PEN123")
    response = client.post(
        f"/api/vehicles/{vehicle['id']}/decision",
        json={"decision": "quizas"},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 422


def test_decision_registra_historial(client, csrf_admin):
    vehicle = _get_vehicle(client, "PEN123")
    client.post(
        f"/api/vehicles/{vehicle['id']}/decision",
        json={"decision": "aprobado"},
        headers=auth_headers(csrf_admin),
    )
    history = client.get(f"/api/vehicles/{vehicle['id']}/history").get_json()["data"]
    assert len(history) >= 1
    assert history[0]["decision"] == "aprobado"
    assert history[0]["admin_name"] == "Admin Prueba"


def test_vigilante_no_puede_decidir(client, csrf_admin, csrf_guard):
    # Asegurar sesión de administrador para obtener el vehículo.
    from tests.conftest import _login

    _login(client, "admin_test", "admin12345")
    vehicle = _get_vehicle(client, "PEN123")
    # ...y luego se inicia sesión como vigilante para intentar decidir.
    _login(client, "guard_test", "guard12345")
    response = client.post(
        f"/api/vehicles/{vehicle['id']}/decision",
        json={"decision": "aprobado"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 403
