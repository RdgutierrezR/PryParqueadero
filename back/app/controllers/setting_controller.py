"""Controller de configuración del parqueadero (capacidad)."""
from flask import Blueprint, request

from app.extensions import db
from app.models.setting import Setting
from app.services import access_service
from app.utils.decorators import admin_required, csrf_protect
from app.views import error, ok

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


@settings_bp.route("", methods=["GET"])
@admin_required
def get_settings():
    return ok(data=Setting.get().to_dict())


@settings_bp.route("", methods=["PUT"])
@admin_required
@csrf_protect
def update_settings():
    """Actualiza la capacidad total del parqueadero."""
    payload = request.get_json(silent=True) or {}
    capacity = payload.get("capacity")

    try:
        capacity = int(capacity)
    except (TypeError, ValueError):
        return error("La capacidad debe ser un número entero.", 422)

    if capacity < 1 or capacity > 100000:
        return error("La capacidad debe estar entre 1 y 100000.", 422)

    setting = Setting.get()
    occupancy = access_service.get_occupancy()

    if capacity < occupancy["inside"]:
        return error(
            f"No se puede reducir la capacidad a {capacity}: hay {occupancy['inside']} "
            "vehículos dentro del parqueadero.",
            409,
        )

    setting.capacity = capacity
    # Si el admin define un valor explícito, deja de ser la demo por defecto.
    setting.capacity_is_demo = False
    db.session.commit()
    return ok(data=setting.to_dict(), message="Configuración actualizada correctamente.")
