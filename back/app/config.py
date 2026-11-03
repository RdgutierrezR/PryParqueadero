"""Configuración centralizada de la aplicación Flask."""
import os
from pathlib import Path

# Carpeta base del backend (back/)
BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    """Configuración base. Los secretos provienen de variables de entorno."""

    # Secreto de sesión: en producción SIEMPRE definir SECRET_KEY en el entorno.
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-cambiar-en-produccion")

    # Carpeta instance/ para la base de datos SQLite persistente.
    INSTANCE_DIR = BASE_DIR / "instance"
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{INSTANCE_DIR / 'parqueadero.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Origen del frontend permitido (Vite en local).
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://127.0.0.1:5173")

    # Capacidad inicial de demostración (se puede cambiar desde el panel admin).
    DEFAULT_CAPACITY = int(os.environ.get("DEFAULT_CAPACITY", "50"))

    # Sesión segura.
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 8  # 8 horas


class TestConfig(Config):
    """Configuración para pruebas: base de datos separada y en memoria."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    SECRET_KEY = "test-secret"
