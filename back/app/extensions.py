"""Extensiones reutilizables de Flask (DB, Login Manager)."""
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = "auth.login"  # type: ignore[assignment]
login_manager.login_message = "Debes iniciar sesión para acceder."


@login_manager.user_loader
def load_user(user_id):
    from app.models.user import User

    return db.session.get(User, int(user_id))
