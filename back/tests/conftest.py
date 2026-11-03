"""Configuración de pruebas (fixtures).

Usa una base de datos de prueba SEPARADA (en memoria) y crea fixtures
para cliente HTTP, usuarios (admin y vigilante) y datos de apoyo.
"""
import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from app.config import TestConfig
from app.extensions import db as _db
from app.models.person import Person
from app.models.user import ROLE_ADMIN, ROLE_GUARD, User
from app.models.vehicle import Vehicle, generate_qr_token


@pytest.fixture()
def app():
    """Crea la app de prueba con base de datos en memoria y datos base."""
    application = create_app(TestConfig)

    with application.app_context():
        _db.create_all()

        # Cuentas de prueba (contraseñas de PRUEBA, solo para tests).
        admin = User(name="Admin Prueba", username="admin_test", role=ROLE_ADMIN)
        admin.set_password("admin12345")
        guard = User(name="Vigilante Prueba", username="guard_test", role=ROLE_GUARD)
        guard.set_password("guard12345")
        _db.session.add_all([admin, guard])

        # Persona y vehículos de apoyo.
        person = Person(full_name="Persona Prueba", person_type="estudiante",
                        institutional_code="TEST-001")
        _db.session.add(person)
        _db.session.flush()

        authorized = Vehicle(
            plate="AUT123", vehicle_type="automovil", person_id=person.id,
            status="autorizado", qr_token=generate_qr_token(),
        )
        pending = Vehicle(
            plate="PEN123", vehicle_type="motocicleta", person_id=person.id,
            status="pendiente", qr_token=generate_qr_token(),
        )
        rejected = Vehicle(
            plate="REC123", vehicle_type="automovil", person_id=person.id,
            status="rechazado", qr_token=generate_qr_token(),
        )
        suspended = Vehicle(
            plate="SUS123", vehicle_type="automovil", person_id=person.id,
            status="suspendido", qr_token=generate_qr_token(),
        )
        _db.session.add_all([authorized, pending, rejected, suspended])
        _db.session.commit()

        yield application

        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    """Cliente HTTP de pruebas."""
    return app.test_client()


def _login(client, username, password):
    response = client.post(
        "/api/auth/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200, response.get_json()
    return response.get_json()["data"]["csrf_token"]


@pytest.fixture()
def csrf_admin(client):
    """Inicia sesión como administrador y devuelve el token CSRF."""
    return _login(client, "admin_test", "admin12345")


@pytest.fixture()
def csrf_guard(client):
    """Inicia sesión como vigilante y devuelve el token CSRF."""
    return _login(client, "guard_test", "guard12345")


def auth_headers(token):
    """Encabezados con el token CSRF para peticiones que modifican datos."""
    return {"X-CSRF-Token": token}
