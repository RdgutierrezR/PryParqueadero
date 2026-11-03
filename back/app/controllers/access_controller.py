"""Controller de control de acceso: validación, entrada, salida y disponibilidad.

Disponible para el vigilante (y el administrador). El vigilante SOLO puede
validar vehículos existentes y autorizados y registrar movimientos: no puede
alterar autorizaciones ni registrar vehículos.
"""
from flask import Blueprint, request

from app.services import access_service
from app.services.access_service import AccessError
from app.utils.decorators import csrf_protect, guard_or_admin_required
from app.views import error, ok

access_bp = Blueprint("access", __name__, url_prefix="/api/access")


def _resolve_vehicle(payload):
    """Obtiene el vehículo desde placa o token QR. Devuelve (vehicle, error)."""
    plate = (payload.get("plate") or "").strip()
    token = (payload.get("token") or "").strip()

    if token:
        vehicle = access_service.find_vehicle_by_token(token)
        if vehicle is None:
            return None, ("Código QR no reconocido. Verifica el código o busca por placa.", 404)
        return vehicle, None

    if plate:
        vehicle = access_service.find_vehicle_by_plate(plate)
        if vehicle is None:
            return None, (f"No existe un vehículo registrado con la placa {plate.upper()}.", 404)
        return vehicle, None

    return None, ("Debes enviar una placa o un token QR.", 400)


@access_bp.route("/validate", methods=["POST"])
@guard_or_admin_required
def validate():
    """Valida un vehículo por placa o QR y devuelve si puede entrar o salir."""
    payload = request.get_json(silent=True) or {}
    vehicle, err = _resolve_vehicle(payload)
    if err:
        return error(err[0], err[1])

    return ok(data=access_service.validate_access(vehicle))


@access_bp.route("/entry", methods=["POST"])
@guard_or_admin_required
@csrf_protect
def entry():
    """Registra la entrada de un vehículo autorizado."""
    payload = request.get_json(silent=True) or {}
    vehicle, err = _resolve_vehicle(payload)
    if err:
        return error(err[0], err[1])

    from flask_login import current_user

    try:
        movement = access_service.register_entry(vehicle, current_user)
    except AccessError as exc:
        return error(exc.message, exc.code)

    return ok(
        data={
            "movement": movement.to_dict(),
            "occupancy": access_service.get_occupancy(),
        },
        message=f"Entrada registrada para {vehicle.plate}.",
        status=201,
    )


@access_bp.route("/exit", methods=["POST"])
@guard_or_admin_required
@csrf_protect
def exit_vehicle():
    """Registra la salida de un vehículo que está dentro."""
    payload = request.get_json(silent=True) or {}
    vehicle, err = _resolve_vehicle(payload)
    if err:
        return error(err[0], err[1])

    from flask_login import current_user

    try:
        movement = access_service.register_exit(vehicle, current_user)
    except AccessError as exc:
        return error(exc.message, exc.code)

    return ok(
        data={
            "movement": movement.to_dict(),
            "occupancy": access_service.get_occupancy(),
        },
        message=f"Salida registrada para {vehicle.plate}.",
    )


@access_bp.route("/occupancy", methods=["GET"])
@guard_or_admin_required
def occupancy():
    """Disponibilidad actual: capacidad, dentro y espacios libres."""
    return ok(data=access_service.get_occupancy())


@access_bp.route("/search", methods=["GET"])
@guard_or_admin_required
def search():
    """Búsqueda manual por placa (alternativa al escaneo de QR)."""
    plate = (request.args.get("plate") or "").strip()
    vehicle = access_service.find_vehicle_by_plate(plate) if plate else None
    if vehicle is None:
        return error("No se encontró un vehículo con esa placa.", 404)
    return ok(data=access_service.validate_access(vehicle))
