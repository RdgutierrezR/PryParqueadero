"""Modelo de decisiones administrativas sobre vehículos."""
from datetime import datetime, timezone

from app.extensions import db

# Decisiones posibles.
DECISION_APPROVED = "aprobado"
DECISION_REJECTED = "rechazado"
DECISION_SUSPENDED = "suspendido"
DECISIONS = [DECISION_APPROVED, DECISION_REJECTED, DECISION_SUSPENDED]


def _utcnow():
    return datetime.now(timezone.utc)


class Authorization(db.Model):
    """Registro inmutable de la decisión tomada por un administrador."""

    __tablename__ = "authorizations"

    id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False, index=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    decision = db.Column(db.String(20), nullable=False)
    decided_at = db.Column(db.DateTime, nullable=False, default=_utcnow)
    observation = db.Column(db.String(300), nullable=True)

    vehicle = db.relationship("Vehicle", back_populates="authorizations")
    admin = db.relationship("User", back_populates="authorizations")

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "vehicle_plate": self.vehicle.plate if self.vehicle else None,
            "admin_id": self.admin_id,
            "admin_name": self.admin.name if self.admin else None,
            "decision": self.decision,
            "decided_at": self.decided_at.isoformat() if self.decided_at else None,
            "observation": self.observation,
        }

    def __repr__(self):
        return f"<Authorization vehicle={self.vehicle_id} decision={self.decision}>"
