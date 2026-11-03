"""Prueba de persistencia: los datos sobreviven al reinicio del servidor.

Usa una base de datos SQLite temporal en disco (no en memoria) para
comprobar que al recrear la aplicación los datos siguen existiendo.
"""
import os
import tempfile

from app import create_app
from app.config import Config
from app.extensions import db


class PersistenceConfig(Config):
    TESTING = True
    SECRET_KEY = "test-persist"


def _make_app(db_path):
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    config = type("Cfg", (PersistenceConfig,), {})
    config.SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
    return create_app(config)


def test_persistencia_tras_reinicio(tmp_path):
    db_file = tmp_path / "persist.db"

    # Primer "arranque": crear datos.
    app1 = _make_app(db_file)
    with app1.app_context():
        from app.models.person import Person
        from app.models.user import ROLE_ADMIN, User
        from app.models.vehicle import Vehicle, generate_qr_token

        admin = User(name="Admin Persist", username="persist", role=ROLE_ADMIN)
        admin.set_password("persist12345")
        person = Person(full_name="Persona Persistente", person_type="docente")
        db.session.add_all([admin, person])
        db.session.flush()
        vehicle = Vehicle(
            plate="PER123", vehicle_type="automovil",
            person_id=person.id, status="autorizado",
            qr_token=generate_qr_token(),
        )
        db.session.add(vehicle)
        db.session.commit()
        vehicle_id = vehicle.id

        # Simular cierre de la aplicación (liberar la conexión a disco).
        db.session.remove()
        db.engine.dispose()

    # Segundo "arranque": los datos deben seguir ahí.
    app2 = _make_app(db_file)
    with app2.app_context():
        from app.models.user import User
        from app.models.vehicle import Vehicle

        assert User.query.filter_by(username="persist").first() is not None
        restored = db.session.get(Vehicle, vehicle_id)
        assert restored is not None
        assert restored.plate == "PER123"
        assert restored.status == "autorizado"
