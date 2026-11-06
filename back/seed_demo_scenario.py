"""Escenario de movimientos para la base de datos de demostración.

Se ejecuta DESPUÉS de ``seed_demo.py`` sobre la base demo
(``parqueadero.demo.db``) y agrega movimientos recientes (hoy, ayer y días
previos) para que el dashboard y los reportes no se vean vacíos.

Es idempotente: si ya existen movimientos en la base demo, no duplica nada
salvo que se invoque con la opción ``--reset``.

Uso (desde la carpeta ``back``, con el entorno virtual activo)::

    set DATABASE_URL=sqlite:///instance/parqueadero.demo.db
    venv\\Scripts\\python.exe seed_demo_scenario.py            # solo si está vacía
    venv\\Scripts\\python.exe seed_demo_scenario.py --reset   # regenera movimientos

ADVERTENCIA: solo debe apuntar a la base de datos **demo** ficticia, nunca a
``parqueadero.db`` (datos reales).
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import timedelta
from datetime import datetime
from pathlib import Path

# El escenario siempre opera sobre la demo; si el usuario no fijó DATABASE_URL,
# lo fijamos aquí para no tocar nunca la base real.
ROOT = Path(__file__).resolve().parent
DEMO_DB = ROOT / "instance" / "parqueadero.demo.db"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = f"sqlite:///{DEMO_DB.as_posix()}"

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import movement  # noqa: E402

from seed_demo import seed as seed_demo_base  # noqa: E402


def _ensure_demo_database() -> None:
    """Crea la carpeta y la base demo si no existen (sin borrar nada)."""
    DEMO_DB.parent.mkdir(parents=True, exist_ok=True)


def _reset_movements() -> None:
    """Borra los movimientos de la base demo (datos ficticios, no reales)."""
    print("-- Borrando movimientos previos de la demo (datos ficticios)...")
    movement.Movement.query.delete()
    db.session.commit()


def scenario_movements() -> list[dict]:
    """Letra del escenario: 2 vehículos adentro, historial reciente."""
    utc_now = datetime.now(movement._utcnow().tzinfo)

    def yesterday(hour: int, minute: int = 0) -> datetime:
        base = (utc_now - timedelta(days=1)).replace(minute=0, second=0, microsecond=0)
        return base + timedelta(hours=hour - base.hour, minutes=minute)

    def today(hour: int, minute: int = 0) -> datetime:
        base = utc_now.replace(minute=0, second=0, microsecond=0)
        return base + timedelta(hours=hour - base.hour, minutes=minute)

    return [
        # Vehículos actualmente adentro (ocupación activa).
        {"plate": "DEM001", "entry": today(8, 15), "exit": None},
        {"plate": "DEM002", "entry": utc_now - timedelta(minutes=25), "exit": None},
        # Entrada/salida del día de hoy.
        {"plate": "DEM001", "entry": today(11, 30), "exit": today(12, 45)},
        {"plate": "DEM002", "entry": today(9, 0), "exit": today(10, 20)},
        # Ayer (2 entradas/salidas por vehículo autorizado).
        {"plate": "DEM001", "entry": yesterday(8, 0), "exit": yesterday(12, 0)},
        {"plate": "DEM002", "entry": yesterday(14, 30), "exit": yesterday(17, 0)},
        # Vehículo pendiente NO entra: se deja fuera para reflejar la regla real.
        {"plate": "DEM003", "entry": yesterday(10, 0), "exit": yesterday(10, 40)},
        # Historial de unos pocos días.
        {"plate": "DEM001", "entry": utc_now - timedelta(days=3, hours=4), "exit": utc_now - timedelta(days=3)},
        {"plate": "DEM002", "entry": utc_now - timedelta(days=5, hours=2), "exit": utc_now - timedelta(days=5)},
    ]


def run(reset: bool) -> int:
    _ensure_demo_database()

    # El escenario depende de usuarios/personas/vehículos creados por seed_demo.
    seed_demo_base()

    app = create_app()

    with app.app_context():
        from app.models.movement import Movement
        from app.models.user import User
        from app.models.vehicle import Vehicle

        # Regla: nunca tocar la base real. Solo permettre reset en la demo.
        if DEMO_DB.name not in os.environ.get("DATABASE_URL", ""):
            print("[X] La base seleccionada no es la demo:", os.environ["DATABASE_URL"])
            return 1

        existing = Movement.query.count()
        if reset:
            _reset_movements()
            existing = 0
        elif existing > 0:
            print("El escenario de demostración ya estaba cargado. No se duplicó nada.")
            print(f"Cantidad de movimientos en la demo: {existing}")
            return 0

        guard = User.query.filter_by(username="vigilante").first()
        if guard is None:
            print("[X] No existe el usuario vigilante. Ejecuta primero seed_demo.py")
            return 1

        created = 0
        for item in scenario_movements():
            vehicle = Vehicle.query.filter_by(plate=item["plate"]).first()
            if vehicle is None:
                continue
            mv = Movement(
                vehicle_id=vehicle.id,
                entry_at=item["entry"],
                exit_at=item["exit"],
                entry_guard_id=guard.id,
                exit_guard_id=guard.id if item["exit"] else None,
            )
            db.session.add(mv)
            created += 1

        db.session.commit()
        print(f"Escenario de demostración cargado: {created} movimientos.")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Carga el escenario demo en la base ficticia.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Borra los movimientos ficticios previos antes de cargarlos de nuevo.",
    )
    args = parser.parse_args()
    return run(args.reset)


if __name__ == "__main__":
    sys.exit(main())
