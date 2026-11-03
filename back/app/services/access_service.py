"""Servicio de control de acceso: entradas, salidas y ocupación.

Todas las reglas del negocio de acceso se aplican AQUÍ, en el backend,
usando transacciones para mantener la integridad ante concurrencia.
"""
from datetime import datetime, timezone

from app.extensions import db
from app.models.movement import Movement
from app.models.setting import Setting
from app.models.vehicle import (
    STATUS_AUTHORIZED,
    Vehicle,
)


class AccessError(Exception):
    """Error de negocio del control de acceso (se traduce a un código HTTP)."""

    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code


def get_occupancy() -> dict:
    """Calcula la ocupación desde los movimientos activos persistidos.

    No se mantiene un contador independiente: siempre se cuenta
    movimientos con exit_at IS NULL, evitando desincronizaciones.
    """
    setting = Setting.get()
    inside = Movement.query.filter(Movement.exit_at.is_(None)).count()
    available = max(setting.capacity - inside, 0)
    return {
        "capacity": setting.capacity,
        "capacity_is_demo": setting.capacity_is_demo,
        "inside": inside,
        "available": available,
        "is_full": available <= 0,
    }


def find_vehicle_by_plate(raw_plate: str) -> Vehicle | None:
    """Busca un vehículo por placa normalizada."""
    plate = Vehicle.normalize_plate(raw_plate)
    if not plate:
        return None
    return Vehicle.query.filter_by(plate=plate).first()


def find_vehicle_by_token(token: str) -> Vehicle | None:
    """Busca un vehículo por el token contenido en su QR."""
    if not token:
        return None
    return Vehicle.query.filter_by(qr_token=token.strip()).first()


def validate_access(vehicle: Vehicle) -> dict:
    """Evalúa si un vehículo puede entrar o salir. No modifica datos."""
    occupancy = get_occupancy()
    active = vehicle.movements.filter_by(exit_at=None).first()

    can_enter = (
        vehicle.status == STATUS_AUTHORIZED
        and active is None
        and not occupancy["is_full"]
    )
    can_exit = active is not None

    reasons = []
    if vehicle.status != STATUS_AUTHORIZED:
        reasons.append(f"El vehículo está {vehicle.status}, no autorizado para ingresar.")
    if active is not None:
        reasons.append("El vehículo ya se encuentra dentro del parqueadero.")
    if vehicle.status == STATUS_AUTHORIZED and active is None and occupancy["is_full"]:
        reasons.append("El parqueadero está lleno (sin espacios disponibles).")

    return {
        "vehicle": vehicle.to_dict(),
        "occupancy": occupancy,
        "can_enter": can_enter,
        "can_exit": can_exit,
        "reasons": reasons,
    }


def register_entry(vehicle: Vehicle, guard) -> Movement:
    """Registra la entrada de un vehículo autorizado.

    Reglas aplicadas:
    1. Debe estar autorizado.
    2. No debe tener una entrada activa (sin salida).
    3. Debe haber espacios disponibles.
    Se usa una transacción + índice único parcial para garantizar
    consistencia ante solicitudes simultáneas.
    """
    occupancy = get_occupancy()

    if vehicle.status != STATUS_AUTHORIZED:
        raise AccessError(
            f"El vehículo está {vehicle.status}. Solo los vehículos autorizados pueden ingresar.",
            code=403,
        )

    if vehicle.movements.filter_by(exit_at=None).count() > 0:
        raise AccessError(
            "El vehículo ya se encuentra dentro del parqueadero (entrada duplicada).",
            code=409,
        )

    if occupancy["is_full"]:
        raise AccessError(
            "No hay espacios disponibles: el parqueadero está lleno.",
            code=409,
        )

    try:
        movement = Movement(
            vehicle_id=vehicle.id,
            entry_at=datetime.now(timezone.utc),
            entry_guard_id=getattr(guard, "id", None),
        )
        db.session.add(movement)
        db.session.commit()
    except Exception:
        # Si otra sesión insertó el mismo movimiento primero, el índice
        # único parcial lanza IntegrityError y aquí se revierte todo.
        db.session.rollback()
        raise AccessError(
            "No se pudo registrar la entrada: el vehículo ya tiene un movimiento activo.",
            code=409,
        )

    return movement


def register_exit(vehicle: Vehicle, guard) -> Movement:
    """Registra la salida de un vehículo que está dentro del parqueadero."""
    movement = vehicle.movements.filter_by(exit_at=None).first()

    if movement is None:
        raise AccessError(
            "El vehículo no tiene una entrada activa; no se puede registrar la salida.",
            code=409,
        )

    movement.exit_at = datetime.now(timezone.utc)
    movement.exit_guard_id = getattr(guard, "id", None)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise AccessError("No se pudo registrar la salida.", code=500)

    return movement
