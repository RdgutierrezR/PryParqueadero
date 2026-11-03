"""Pruebas del control de acceso: entradas, salidas, reglas y ocupación."""
from app.extensions import db
from app.models.vehicle import STATUS_AUTHORIZED, Vehicle
from tests.conftest import auth_headers


def test_busqueda_por_placa(client, csrf_guard):
    response = client.get(
        "/api/access/search?plate=aut123",
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["vehicle"]["plate"] == "AUT123"
    assert data["can_enter"] is True


def test_busqueda_placa_inexistente(client, csrf_guard):
    response = client.get("/api/access/search?plate=NOPE", headers=auth_headers(csrf_guard))
    assert response.status_code == 404


def test_entrada_autorizada(client, csrf_guard):
    response = client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 201
    data = response.get_json()["data"]
    assert data["movement"]["vehicle"]["plate"] == "AUT123"
    assert data["occupancy"]["inside"] == 1


def test_vehiculo_pendiente_no_entra(client, csrf_guard):
    response = client.post(
        "/api/access/entry",
        json={"plate": "PEN123"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 403


def test_vehiculo_rechazado_no_entra(client, csrf_guard):
    response = client.post(
        "/api/access/entry",
        json={"plate": "REC123"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 403


def test_vehiculo_suspendido_no_entra(client, csrf_guard):
    response = client.post(
        "/api/access/entry",
        json={"plate": "SUS123"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 403


def test_vehiculo_inexistente_no_entra(client, csrf_guard):
    response = client.post(
        "/api/access/entry",
        json={"plate": "NOEXISTE"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 404


def test_entrada_duplicada_rechazada(client, csrf_guard):
    headers = auth_headers(csrf_guard)
    first = client.post("/api/access/entry", json={"plate": "AUT123"}, headers=headers)
    assert first.status_code == 201
    second = client.post("/api/access/entry", json={"plate": "AUT123"}, headers=headers)
    assert second.status_code == 409


def test_salida_correcta(client, csrf_guard):
    headers = auth_headers(csrf_guard)
    client.post("/api/access/entry", json={"plate": "AUT123"}, headers=headers)
    response = client.post("/api/access/exit", json={"plate": "AUT123"}, headers=headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["movement"]["exit_at"] is not None
    assert data["occupancy"]["inside"] == 0


def test_salida_sin_entrada_activa(client, csrf_guard):
    response = client.post(
        "/api/access/exit",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 409


def test_parqueadero_lleno(client, csrf_guard, app):
    # Reducir la capacidad a 1 y llenarlo.
    with app.app_context():
        from app.models.setting import Setting

        Setting.get().capacity = 1
        db.session.commit()

    headers = auth_headers(csrf_guard)
    assert client.post("/api/access/entry", json={"plate": "AUT123"}, headers=headers).status_code == 201

    # Autorizar un segundo vehículo directamente en la BD para la prueba.
    with app.app_context():
        vehicle = Vehicle.query.filter_by(plate="REC123").first()
        vehicle.status = STATUS_AUTHORIZED
        db.session.commit()

    response = client.post("/api/access/entry", json={"plate": "REC123"}, headers=headers)
    assert response.status_code == 409
    assert "lleno" in response.get_json()["error"].lower()


def test_validacion_por_token_qr(client, csrf_guard, app):
    with app.app_context():
        vehicle = Vehicle.query.filter_by(plate="AUT123").first()
        token = vehicle.qr_token

    response = client.post(
        "/api/access/validate",
        json={"token": token},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["vehicle"]["plate"] == "AUT123"
    assert data["can_enter"] is True


def test_token_qr_inexistente(client, csrf_guard):
    response = client.post(
        "/api/access/validate",
        json={"token": "token-falso"},
        headers=auth_headers(csrf_guard),
    )
    assert response.status_code == 404


def test_ocupacion_actual(client, csrf_guard):
    headers = auth_headers(csrf_guard)
    client.post("/api/access/entry", json={"plate": "AUT123"}, headers=headers)
    response = client.get("/api/access/occupancy", headers=headers)
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["inside"] == 1
    assert data["available"] == data["capacity"] - 1
