"""Verifica (solo lectura) el estado de la base de datos DEMO.

Uso:
    python check_demo.py
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEMO_DB = ROOT / "instance" / "parqueadero.demo.db"
os.environ.setdefault("DATABASE_URL", f"sqlite:///{DEMO_DB.as_posix()}")

from app import create_app  # noqa: E402

app = create_app()

with app.app_context():
    from app.models.movement import Movement
    from app.models.person import Person
    from app.models.setting import Setting
    from app.models.user import User
    from app.models.vehicle import Vehicle

    print("Base demo:", DEMO_DB)
    print("Usuarios:", User.query.count())
    print("Personas:", Person.query.count())
    print("Vehículos:", Vehicle.query.count())
    print("Movimientos:", Movement.query.count())
    print("Adentro ahora:", Movement.query.filter_by(exit_at=None).count())
    print("Capacidad configurada:", Setting.get().capacity)
