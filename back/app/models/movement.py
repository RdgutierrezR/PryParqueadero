"""Modelo de movimientos (entradas y salidas) del parqueadero."""
from datetime import datetime, timezone

from sqlalchemy import Index, text

from app.extensions import db


def _utcnow():
    """Fecha y hora generadas en el servidor (hora UTC)."""
    return datetime.now(timezone.utc)


def _iso_utc(value: datetime | None) -> str | None:
    """Serializa una hora ISO 8601 indicando que está en UTC.

    La base de datos guarda las horas sin zona horaria (naive); al añadir
    ``+00:00`` el navegador las convierte correctamente a la hora local.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


class Movement(db.Model):
    """Registro de entrada/salida de un vehículo.

    - `entry_at` siempre tiene valor (momento de la entrada).
    - `exit_at` es NULL mientras el vehículo sigue dentro del parqueadero.
    - La ocupación se calcula contando movimientos con `exit_at IS NULL`.
    """

    __tablename__ = "movements"

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False, index=True)
    entry_at = db.Column(db.DateTime, nullable=False, default=_utcnow, index=True)
    exit_at = db.Column(db.DateTime, nullable=True, index=True)

    # Vigilante que registró cada operación (cuando corresponda).
    entry_guard_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    exit_guard_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    vehicle = db.relationship("Vehicle", back_populates="movements")
    entry_guard = db.relationship("User", foreign_keys=[entry_guard_id], back_populates="entries_registered")
    exit_guard = db.relationship("User", foreign_keys=[exit_guard_id], back_populates="exits_registered")

    # Restricción a nivel de base de datos: un vehículo solo puede tener
    # UN movimiento activo (exit_at IS NULL). Evita entradas duplicadas
    # incluso ante solicitudes simultáneas.
    __table_args__ = (
        Index(
            "uq_movements_active",
            "vehicle_id",
            unique=True,
            sqlite_where=text("exit_at IS NULL"),
        ),
    )

    @property
    def is_active(self) -> bool:
        return self.exit_at is None

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "vehicle": self.vehicle.to_dict() if self.vehicle else None,
            "entry_at": _iso_utc(self.entry_at),
            "exit_at": _iso_utc(self.exit_at),
            "active": self.is_active,
            "entry_guard": self.entry_guard.name if self.entry_guard else None,
            "exit_guard": self.exit_guard.name if self.exit_guard else None,
        }

    def __repr__(self):
        return f"<Movement vehicle={self.vehicle_id} active={self.is_active}>"
