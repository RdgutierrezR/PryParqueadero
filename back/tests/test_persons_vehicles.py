"""Pruebas de registro de personas y vehículos, y normalización de placas."""
from tests.conftest import auth_headers


def test_registrar_persona(client, csrf_admin):
    response = client.post(
        "/api/persons",
        json={
            "full_name": "Juan Pérez",
            "person_type": "estudiante",
            "institutional_code": "CUL-2024-001",
        },
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 201
    assert response.get_json()["data"]["full_name"] == "Juan Pérez"


def test_registrar_persona_datos_invalidos(client, csrf_admin):
    response = client.post(
        "/api/persons",
        json={"full_name": "AB", "person_type": "desconocido"},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 422
    assert "errors" in response.get_json()


def test_registrar_vehiculo_queda_pendiente(client, csrf_admin):
    # Obtener id de la persona de prueba.
    persons = client.get("/api/persons").get_json()["data"]
    person_id = persons[0]["id"]

    response = client.post(
        "/api/vehicles",
        json={"plate": "xyz-123", "vehicle_type": "automovil", "person_id": person_id},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 201
    data = response.get_json()["data"]
    # La placa se normaliza (mayúsculas, sin guiones).
    assert data["plate"] == "XYZ123"
    # Registrar NO autoriza.
    assert data["status"] == "pendiente"
    # El vehículo tiene token QR.
    assert data["qr_token"]


def test_placa_duplicada_rechazada(client, csrf_admin):
    persons = client.get("/api/persons").get_json()["data"]
    person_id = persons[0]["id"]

    response = client.post(
        "/api/vehicles",
        json={"plate": "AUT123", "vehicle_type": "automovil", "person_id": person_id},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 409


def test_normalizacion_placa_equivale(client, csrf_admin):
    persons = client.get("/api/persons").get_json()["data"]
    person_id = persons[0]["id"]
    # "aut 123" normaliza a "AUT123", que ya existe -> duplicado.
    response = client.post(
        "/api/vehicles",
        json={"plate": "aut 123", "vehicle_type": "automovil", "person_id": person_id},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 409


def test_tipo_vehiculo_invalido(client, csrf_admin):
    persons = client.get("/api/persons").get_json()["data"]
    person_id = persons[0]["id"]
    response = client.post(
        "/api/vehicles",
        json={"plate": "ZZZ999", "vehicle_type": "bicicleta", "person_id": person_id},
        headers=auth_headers(csrf_admin),
    )
    assert response.status_code == 422
