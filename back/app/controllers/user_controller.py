"""Controller de cuentas del sistema (solo administrador)."""
from flask import Blueprint, request

from app.extensions import db
from app.models.user import ROLE_GUARD, ROLES, User
from app.utils.decorators import admin_required, csrf_protect
from app.views import error, ok

users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("", methods=["GET"])
@admin_required
def list_users():
    users = User.query.order_by(User.name.asc()).all()
    return ok(data=[u.to_dict() for u in users])


@users_bp.route("", methods=["POST"])
@admin_required
@csrf_protect
def create_user():
    """Crea una cuenta de vigilante (o administrativa). Nunca contraseñas por defecto."""
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    role = (payload.get("role") or ROLE_GUARD).strip()

    errors = {}
    if len(name) < 3:
        errors["name"] = "El nombre debe tener al menos 3 caracteres."
    if len(username) < 4:
        errors["username"] = "El usuario debe tener al menos 4 caracteres."
    if len(password) < 8:
        errors["password"] = "La contraseña debe tener al menos 8 caracteres."
    if role not in ROLES:
        errors["role"] = f"El rol debe ser uno de: {', '.join(ROLES)}."

    if errors:
        return error("Datos inválidos.", 422, errors)

    if User.query.filter_by(username=username).first():
        return error("Ya existe una cuenta con ese usuario.", 409)

    user = User(name=name, username=username, role=role, is_active=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return ok(data=user.to_dict(), message="Cuenta creada correctamente.", status=201)


@users_bp.route("/<int:user_id>/status", methods=["PUT"])
@admin_required
@csrf_protect
def toggle_user(user_id):
    """Activa o desactiva una cuenta."""
    user = db.session.get(User, user_id)
    if user is None:
        return error("Cuenta no encontrada.", 404)

    payload = request.get_json(silent=True) or {}
    is_active = payload.get("is_active")
    if not isinstance(is_active, bool):
        return error("El campo 'is_active' debe ser booleano.", 422)

    if not is_active:
        # Evitar quedarse sin administradores activos.
        active_admins = User.query.filter_by(role="administrador", is_active=True).count()
        if user.role == "administrador" and active_admins <= 1:
            return error("Debe existir al menos un administrador activo.", 409)

    user.is_active = is_active
    db.session.commit()
    return ok(data=user.to_dict(), message="Estado de la cuenta actualizado.")
