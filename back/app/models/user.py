"""Modelo de cuentas del sistema (administradores y vigilantes)."""
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db

# Roles del sistema.
ROLE_ADMIN = "administrador"
ROLE_GUARD = "vigilante"
ROLES = [ROLE_ADMIN, ROLE_GUARD]


class User(UserMixin, db.Model):
    """Cuenta de acceso al sistema."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=ROLE_GUARD, index=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # Relaciones: decisiones tomadas como admin y movimientos registrados como vigilante.
    authorizations = db.relationship(
        "Authorization", back_populates="admin", lazy="dynamic",
        foreign_keys="Authorization.admin_id",
    )
    entries_registered = db.relationship(
        "Movement", back_populates="entry_guard", lazy="dynamic",
        foreign_keys="Movement.entry_guard_id",
    )
    exits_registered = db.relationship(
        "Movement", back_populates="exit_guard", lazy="dynamic",
        foreign_keys="Movement.exit_guard_id",
    )

    def set_password(self, password: str) -> None:
        """Guarda la contraseña solo como hash seguro (nunca en texto plano)."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username,
            "role": self.role,
            "is_active": self.is_active,
        }

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
