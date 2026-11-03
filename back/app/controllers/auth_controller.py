"""Controller de autenticación: login, logout, perfil y token CSRF."""
from flask import Blueprint, jsonify, request, session
from flask_login import current_user, login_required, login_user, logout_user

from app.extensions import db
from app.models.user import User
from app.utils.decorators import csrf_protect, generate_csrf_token
from app.views import error, ok

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Inicia sesión con usuario y contraseña. Devuelve el token CSRF."""
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return error("Usuario y contraseña son obligatorios.", 400)

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        # Mensaje genérico: no revelar si el usuario existe.
        return error("Credenciales incorrectas.", 401)

    if not user.is_active:
        return error("La cuenta está desactivada. Contacta al administrador.", 403)

    login_user(user)
    session.permanent = True
    csrf = generate_csrf_token()

    return ok(
        data={"user": user.to_dict(), "csrf_token": csrf},
        message=f"Bienvenido(a), {user.name}.",
    )


@auth_bp.route("/logout", methods=["POST"])
@login_required
@csrf_protect
def logout():
    logout_user()
    session.clear()
    return ok(message="Sesión cerrada correctamente.")


@auth_bp.route("/me", methods=["GET"])
def me():
    """Devuelve el usuario actual (o null) y el token CSRF de la sesión."""
    user_data = current_user.to_dict() if current_user.is_authenticated else None
    csrf = generate_csrf_token() if current_user.is_authenticated else None
    return ok(data={"user": user_data, "csrf_token": csrf})
