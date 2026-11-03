"""Modelo de vehículos registrados previamente."""
import secrets
from datetime import datetime, timezone

from app.extensions import db

# Estados de autorización posibles.
STATUS_PENDING = "pendiente"
STATUS_AUTHORIZED = "autorizado"
STATUS_REJECTED = "rechazado"
STATUS_SUSPENDED = "suspendido"
STATUSES = [STATUS_PENDING, STATUS_AUTHORIZED, STATUS_REJECTED, STATUS_SUSPENDED]

# Tipos de vehículo.
VEHICLE_MOTORCYCLE = "motocicleta"
VEHICLE_CAR = "automovil"
VEHICLE_TYPES = [VEHICLE_MOTORCYCLE, VEHICLE_CAR]


def _utcnow():
    return datetime.now(timezone.utc)


def generate_qr_token() -> str:
    """Genera un token aleatorio e irreversible para el QR del vehículo."""
    return secrets.token_urlsafe(24)


class Vehicle(db.Model):
    """Vehículo registrado previamente en el sistema."""

    __tablename__ = "vehicles"

    id = db.Column(db.Integer, primary_key=True)
    # Placa normalizada (mayúsculas, sin espacios ni guiones) y única.
    plate = db.Column(db.String(20), unique=True, nullable=False, index=True)
    vehicle_type = db.Column(db.String(20), nullable=False, index=True)

    person_id = db.Column(db.Integer, db.ForeignKey("persons.id"), nullable=False, index=True)
    person = db.relationship("Person", back_populates="vehicles")

    status = db.Column(db.String(20), nullable=False, default=STATUS_PENDING, index=True)
    # Token QR único: el QR solo contiene este token, nunca datos personales.
    qr_token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)

    authorizations = db.relationship(
        "Authorization", back_populates="vehicle", lazy="dynamic",
        cascade="all, delete-orphan",
    )
    movements = db.relationship(
        "Movement", back_populates="vehicle", lazy="dynamic",
        cascade="all, delete-orphan",
    )

    @staticmethod
    def normalize_plate(raw: str) -> str:
        """Normaliza la placa: mayúsculas y sin espacios ni guiones."""
        return "".join(ch for ch in raw.strip().upper() if ch.isalnum())

    @property
    def has_active_movement(self) -> bool:
        """Indica si el vehículo se encuentra dentro del parqueadero."""
        return self.movements.filter_by(exit_at=None).count() > 0

    def to_dict(self):
        return {
            "id": self.id,
            "plate": self.plate,
            "vehicle_type": self.vehicle_type,
            "status": self.status,
            "qr_token": self.qr_token,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "inside": self.has_active_movement,
            "person": self.person.to_dict() if self.person else None,
        }

    def __repr__(self):
        return f"<Vehicle {self.plate} [{self.status}]>"
