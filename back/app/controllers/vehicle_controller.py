"""Controller de vehículos: registro previo, autorizaciones y QR.

Registrar un vehículo NO lo autoriza: queda 'pendiente' hasta que un
administrador tome una decisión explícita (aprobar / rechazar / suspender).
"""
import re

from flask import Blueprint, Response, request

from app.extensions import db
from app.models.authorization import (
    DECISIONS,
    DECISION_APPROVED,
    DECISION_REJECTED,
    DECISION_SUSPENDED,
    Authorization,
)
from app.models.person import Person
from app.models.vehicle import (
    STATUS_AUTHORIZED,
    STATUS_PENDING,
    STATUS_REJECTED,
    STATUS_SUSPENDED,
    VEHICLE_TYPES,
    Vehicle,
    generate_qr_token,
)
from app.services.qr_service import generate_qr_png
from app.utils.decorators import admin_required, csrf_protect
from app.views import error, ok

vehicles_bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")

# Mapeo decisión -> estado final del vehículo.
DECISION_TO_STATUS = {
    DECISION_APPROVED: STATUS_AUTHORIZED,
    DECISION_REJECTED: STATUS_REJECTED,
    DECISION_SUSPENDED: STATUS_SUSPENDED,
}

# Patrón razonable de placa (letras y números, 3 a 10 caracteres tras normalizar).
PLATE_PATTERN = re.compile(r"^[A-Z0-9]{3,10}$")


@vehicles_bp.route("", methods=["GET"])
@admin_required
def list_vehicles():
    """Lista vehículos con filtros opcionales por estado, tipo y placa."""
    status = (request.args.get("status") or "").strip()
    vtype = (request.args.get("type") or "").strip()
    plate = (request.args.get("plate") or "").strip()

    stmt = Vehicle.query
    if status:
        stmt = stmt.filter_by(status=status)
    if vtype:
        stmt = stmt.filter_by(vehicle_type=vtype)
    if plate:
        normalized = Vehicle.normalize_plate(plate)
        stmt = stmt.filter(Vehicle.plate.ilike(f"%{normalized}%"))

    vehicles = stmt.order_by(Vehicle.created_at.desc()).all()
    return ok(data=[v.to_dict() for v in vehicles])


@vehicles_bp.route("", methods=["POST"])
@admin_required
@csrf_protect
def create_vehicle():
    """Registra un vehículo nuevo. Siempre nace 'pendiente'."""
    payload = request.get_json(silent=True) or {}

    raw_plate = payload.get("plate") or ""
    vehicle_type = (payload.get("vehicle_type") or "").strip()
    person_id = payload.get("person_id")

    plate = Vehicle.normalize_plate(raw_plate)
    errors = {}
    if not plate or not PLATE_PATTERN.match(plate):
        errors["plate"] = "La placa debe tener entre 3 y 10 letras o números (sin espacios ni guiones)."
    if vehicle_type not in VEHICLE_TYPES:
        errors["vehicle_type"] = f"El tipo de vehículo debe ser uno de: {', '.join(VEHICLE_TYPES)}."
    if not person_id:
        errors["person_id"] = "Debes seleccionar la persona responsable."
    else:
        person = db.session.get(Person, int(person_id))
        if person is None:
            errors["person_id"] = "La persona responsable no existe."

    if errors:
        return error("Datos inválidos.", 422, errors)

    # Evitar placas duplicadas.
    if Vehicle.query.filter_by(plate=plate).first():
        return error(f"Ya existe un vehículo registrado con la placa {plate}.", 409)

    vehicle = Vehicle(
        plate=plate,
        vehicle_type=vehicle_type,
        person_id=int(person_id),
        status=STATUS_PENDING,
        qr_token=generate_qr_token(),
    )

    db.session.add(vehicle)
    db.session.commit()

    return ok(
        data=vehicle.to_dict(),
        message="Vehículo registrado. Queda PENDIENTE de autorización administrativa.",
        status=201,
    )


@vehicles_bp.route("/<int:vehicle_id>", methods=["GET"])
@admin_required
def get_vehicle(vehicle_id):
    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        return error("Vehículo no encontrado.", 404)
    return ok(data=vehicle.to_dict())


@vehicles_bp.route("/<int:vehicle_id>", methods=["PUT"])
@admin_required
@csrf_protect
def update_vehicle(vehicle_id):
    """Actualiza datos del vehículo (tipo y responsable). NO cambia la autorización."""
    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        return error("Vehículo no encontrado.", 404)

    payload = request.get_json(silent=True) or {}
    errors = {}

    vehicle_type = (payload.get("vehicle_type") or vehicle.vehicle_type).strip()
    if vehicle_type not in VEHICLE_TYPES:
        errors["vehicle_type"] = f"El tipo de vehículo debe ser uno de: {', '.join(VEHICLE_TYPES)}."

    if "person_id" in payload:
        person = db.session.get(Person, int(payload["person_id"] or 0))
        if person is None:
            errors["person_id"] = "La persona responsable no existe."
        else:
            vehicle.person_id = person.id

    if errors:
        return error("Datos inválidos.", 422, errors)

    vehicle.vehicle_type = vehicle_type
    db.session.commit()
    return ok(data=vehicle.to_dict(), message="Vehículo actualizado correctamente.")


@vehicles_bp.route("/<int:vehicle_id>/decision", methods=["POST"])
@admin_required
@csrf_protect
def decide_vehicle(vehicle_id):
    """Aprueba, rechaza o suspende un vehículo. Solo un administrador puede hacerlo."""
    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        return error("Vehículo no encontrado.", 404)

    payload = request.get_json(silent=True) or {}
    decision = (payload.get("decision") or "").strip()
    observation = (payload.get("observation") or "").strip() or None

    if decision not in DECISIONS:
        return error(
            f"La decisión debe ser una de: {', '.join(DECISIONS)}.", 422
        )

    new_status = DECISION_TO_STATUS[decision]

    # Se registra la decisión de forma inmutable (quién, cuándo y por qué).
    auth_record = Authorization(
        vehicle_id=vehicle.id,
        admin_id=current_user_id(),
        decision=decision,
        observation=observation,
    )
    vehicle.status = new_status
    db.session.add(auth_record)
    db.session.commit()

    messages = {
        DECISION_APPROVED: "Vehículo AUTORIZADO. Ya puede ingresar al parqueadero.",
        DECISION_REJECTED: "Vehículo RECHAZADO. No podrá ingresar al parqueadero.",
        DECISION_SUSPENDED: "Vehículo SUSPENDIDO. No podrá ingresar al parqueadero.",
    }
    return ok(data=vehicle.to_dict(), message=messages[decision])


@vehicles_bp.route("/<int:vehicle_id>/history", methods=["GET"])
@admin_required
def vehicle_history(vehicle_id):
    """Historial de decisiones administrativas de un vehículo."""
    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        return error("Vehículo no encontrado.", 404)
    records = vehicle.authorizations.order_by(Authorization.decided_at.desc()).all()
    return ok(data=[r.to_dict() for r in records])


@vehicles_bp.route("/<int:vehicle_id>/qr.png", methods=["GET"])
def vehicle_qr(vehicle_id):
    """Sirve el código QR del vehículo como PNG (requiere sesión de admin o vigilante)."""
    from flask_login import current_user

    if not current_user.is_authenticated:
        return error("Debes iniciar sesión para acceder.", 401)

    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        return error("Vehículo no encontrado.", 404)

    png = generate_qr_png(vehicle)
    return Response(
        png,
        mimetype="image/png",
        headers={
            "Content-Disposition": f'inline; filename="qr_{vehicle.plate}.png"',
            "Cache-Control": "no-store",
        },
    )


@vehicles_bp.route("/pending", methods=["GET"])
@admin_required
def pending_requests():
    """Lista de solicitudes pendientes de revisión."""
    vehicles = (
        Vehicle.query.filter_by(status=STATUS_PENDING)
        .order_by(Vehicle.created_at.asc())
        .all()
    )
    return ok(data=[v.to_dict() for v in vehicles])


def current_user_id():
    from flask_login import current_user

    return current_user.id
