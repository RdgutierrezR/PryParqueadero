"""Modelo de personas registradas (responsables de vehículos)."""
from app.extensions import db

# Tipos de persona admitidos.
TYPE_STUDENT = "estudiante"
TYPE_TEACHER = "docente"
TYPE_STAFF = "administrativo"
TYPE_VISITOR = "visitante"
PERSON_TYPES = [TYPE_STUDENT, TYPE_TEACHER, TYPE_STAFF, TYPE_VISITOR]


class Person(db.Model):
    """Persona responsable de uno o varios vehículos."""

    __tablename__ = "persons"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False, index=True)
    person_type = db.Column(db.String(20), nullable=False, index=True)
    institutional_code = db.Column(db.String(40), nullable=True)  # Solo si aplica.
    contact = db.Column(db.String(120), nullable=True)  # Email o teléfono mínimo.

    vehicles = db.relationship("Vehicle", back_populates="person", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "person_type": self.person_type,
            "institutional_code": self.institutional_code,
            "contact": self.contact,
            "vehicle_count": self.vehicles.count(),
        }

    def __repr__(self):
        return f"<Person {self.full_name}>"
