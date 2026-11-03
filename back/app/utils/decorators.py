"""Decoradores de permisos y protección CSRF.

La seguridad NO depende de ocultar botones en React: cada endpoint
está protegido aquí según el rol del usuario autenticado.
"""
import hmac
from functools import wraps

from flask import current_app, jsonify, request, session
from flask_login import current_user, login_required

from app.models.user import ROLE_ADMIN, ROLE_GUARD


def _json_error(message: str, code: int):
    return jsonify({"error": message}), code


def role_required(*roles):
    """Exige que el usuario esté autenticado y tenga uno de los roles indicados."""

    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not current_user.is_authenticated:
                return _json_error("Debes iniciar sesión para acceder.", 401)
            if current_user.role not in roles:
                return _json_error("No tienes permisos para realizar esta operación.", 403)
            if not current_user.is_active:
                return _json_error("La cuenta está desactivada.", 403)
            return view(*args, **kwargs)

        return wrapped

    return decorator


admin_required = role_required(ROLE_ADMIN)
guard_or_admin_required = role_required(ROLE_GUARD, ROLE_ADMIN)


# ---------------------------------------------------------------- CSRF ----
def generate_csrf_token() -> str:
    """Genera (o recupera) el token CSRF de la sesión actual."""
    if "_csrf_token" not in session:
        import secrets

        session["_csrf_token"] = secrets.token_urlsafe(32)
    return session["_csrf_token"]


def validate_csrf() -> bool:
    """Valida el token CSRF en peticiones que modifican datos (POST/PUT/DELETE)."""
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        expected = session.get("_csrf_token")
        received = request.headers.get("X-CSRF-Token", "")
        if not expected or not hmac.compare_digest(expected, received):
            return False
    return True


def csrf_protect(view):
    """Aplica validación CSRF a un endpoint (excepto el login, que aún no tiene sesión)."""

    @wraps(view)
    def wrapped(*args, **kwargs):
        if not validate_csrf():
            return _json_error("Token CSRF inválido o ausente. Recarga la página e inténtalo de nuevo.", 403)
        return view(*args, **kwargs)

    return wrapped
