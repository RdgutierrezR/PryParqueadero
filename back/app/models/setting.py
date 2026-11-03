"""Modelo de configuración general del parqueadero (fila única)."""
from app.extensions import db


class Setting(db.Model):
    """Parámetros de la aplicación. Existe una sola fila (id=1)."""

    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    # Capacidad total. Valor de demostración hasta conocer la real.
    capacity = db.Column(db.Integer, nullable=False, default=50)
    # Marca informativa para dejar claro que la capacidad es provisional.
    capacity_is_demo = db.Column(db.Boolean, nullable=False, default=True)

    @classmethod
    def get(cls) -> "Setting":
        """Obtiene la configuración actual, creándola si no existe (sin borrar datos)."""
        setting = db.session.get(cls, 1)
        if setting is None:
            setting = cls(id=1, capacity=50, capacity_is_demo=True)
            db.session.add(setting)
            db.session.commit()
        return setting

    def to_dict(self):
        return {
            "capacity": self.capacity,
            "capacity_is_demo": self.capacity_is_demo,
        }

    def __repr__(self):
        return f"<Setting capacity={self.capacity}>"
