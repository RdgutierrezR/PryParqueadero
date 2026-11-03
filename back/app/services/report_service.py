"""Servicio de generación de reportes e indicadores.

Todos los reportes se calculan consultando la base de datos persistida.
Maneja periodos vacíos, filtros inválidos y devuelve estructuras consistentes.
"""
import csv
import io
from datetime import datetime, timedelta, timezone

from app.extensions import db
from app.models.movement import Movement
from app.models.person import PERSON_TYPES
from app.models.vehicle import VEHICLE_TYPES, Vehicle


class ReportError(Exception):
    """Error de negocio en la generación de reportes."""

    def __init__(self, message: str, code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code


def _parse_date(value: str, field: str, days: int = 0) -> datetime:
    """Convierte una fecha local 'YYYY-MM-DD' al inicio del día en UTC.

    La base de datos guarda las horas en UTC, pero el usuario escribe y lee
    fechas en la hora local del equipo. Este es el único punto de conversión
    para los filtros por fecha.
    """
    if not value:
        raise ReportError(f"El campo '{field}' es obligatorio (formato YYYY-MM-DD).")
    try:
        local_date = datetime.strptime(value, "%Y-%m-%d") + timedelta(days=days)
    except ValueError:
        raise ReportError(f"Fecha inválida en '{field}'. Usa el formato YYYY-MM-DD.")
    return local_date.astimezone(timezone.utc)


def _to_local(value: datetime) -> datetime:
    """Convierte una hora guardada en UTC (naive) a la hora local del equipo."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone()


def resolve_period(start: str | None, end: str | None) -> tuple[datetime, datetime]:
    """Resuelve y valida el rango de fechas del reporte.

    Las fechas se interpretan en hora local y se convierten a UTC para
    consultar la base de datos. Si no se envía nada se usa el día local de hoy.
    """
    if start:
        start_dt = _parse_date(start, "start")
    else:
        start_dt = datetime.now().astimezone().replace(
            hour=0, minute=0, second=0, microsecond=0
        ).astimezone(timezone.utc)

    if end:
        end_dt = _parse_date(end, "end", days=1)  # inclusive del día final.
    else:
        end_dt = start_dt + timedelta(days=1)

    if start_dt >= end_dt:
        raise ReportError("El periodo es inválido: la fecha inicial debe ser menor que la final.")

    return start_dt, end_dt


def _movements_in_period(start_dt: datetime, end_dt: datetime):
    """Movimientos cuya ENTRADA cae dentro del periodo."""
    return (
        Movement.query
        .filter(Movement.entry_at >= start_dt, Movement.entry_at < end_dt)
        .order_by(Movement.entry_at.desc())
        .all()
    )


def get_summary(start: str | None, end: str | None) -> dict:
    """Resumen del periodo: totales, vehículos dentro, estadísticas por tipo."""
    start_dt, end_dt = resolve_period(start, end)
    movements = _movements_in_period(start_dt, end_dt)

    entries = len(movements)
    # Salidas: movimientos cuya salida ocurrió dentro del periodo.
    exits = Movement.query.filter(
        Movement.exit_at.isnot(None),
        Movement.exit_at >= start_dt,
        Movement.exit_at < end_dt,
    ).count()

    inside_now = Movement.query.filter(Movement.exit_at.is_(None)).count()

    # Estadísticas por tipo de persona (del responsable del vehículo).
    by_person_type = {pt: 0 for pt in PERSON_TYPES}
    # Estadísticas por tipo de vehículo.
    by_vehicle_type = {vt: 0 for vt in VEHICLE_TYPES}

    for m in movements:
        vehicle = m.vehicle
        if vehicle:
            by_vehicle_type[vehicle.vehicle_type] = by_vehicle_type.get(vehicle.vehicle_type, 0) + 1
            if vehicle.person:
                pt = vehicle.person.person_type
                by_person_type[pt] = by_person_type.get(pt, 0) + 1

    # Entradas agrupadas por hora local (0-23) para detectar horas pico.
    hourly = [0] * 24
    for m in movements:
        hourly[_to_local(m.entry_at).hour] += 1
    hourly_distribution = [{"hour": h, "count": c} for h, c in enumerate(hourly) if c > 0]

    return {
        "period": {
            "start": _to_local(start_dt).date().isoformat(),
            "end": _to_local(end_dt - timedelta(microseconds=1)).date().isoformat(),
        },
        "entries": entries,
        "exits": exits,
        "inside_now": inside_now,
        "by_person_type": by_person_type,
        "by_vehicle_type": by_vehicle_type,
        "hourly_distribution": hourly_distribution,
    }


def get_history(
    start: str | None,
    end: str | None,
    plate: str | None = None,
    status: str | None = None,
) -> list[dict]:
    """Historial de entradas y salidas, con filtros opcionales.

    - ``status="inside"``: vehículos que están DENTRO ahora mismo. No usa el
      rango de fechas, porque describe el estado actual (un vehículo puede
      llevar días adentro y aun así debe aparecer).
    - ``status="outside"``: solo movimientos ya cerrados del periodo.
    - ``status=None``: todos los movimientos del periodo (comportamiento clásico).
    """
    if status and status not in ("inside", "outside"):
        raise ReportError("El filtro de estado debe ser 'inside' o 'outside'.")

    if status == "inside":
        # Estado actual: ordenado por entrada más antigua primero.
        movements = (
            Movement.query
            .filter(Movement.exit_at.is_(None))
            .order_by(Movement.entry_at.asc())
            .all()
        )
    else:
        start_dt, end_dt = resolve_period(start, end)
        query = Movement.query.filter(
            Movement.entry_at >= start_dt, Movement.entry_at < end_dt
        )
        if status == "outside":
            query = query.filter(Movement.exit_at.isnot(None))
        movements = query.order_by(Movement.entry_at.desc()).all()

    if plate:
        normalized = Vehicle.normalize_plate(plate)
        movements = [m for m in movements if m.vehicle and normalized in m.vehicle.plate]

    return [m.to_dict() for m in movements]


def get_inside_now() -> list[dict]:
    """Vehículos que se encuentran actualmente dentro del parqueadero."""
    movements = (
        Movement.query
        .filter(Movement.exit_at.is_(None))
        .order_by(Movement.entry_at.asc())
        .all()
    )
    return [m.to_dict() for m in movements]


def export_history_csv(start: str | None, end: str | None) -> str:
    """Exporta el historial del periodo como contenido CSV."""
    start_dt, end_dt = resolve_period(start, end)
    movements = _movements_in_period(start_dt, end_dt)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Placa", "Tipo vehiculo", "Responsable", "Tipo persona",
        "Entrada", "Salida", "Estado",
    ])
    for m in movements:
        vehicle = m.vehicle
        person = vehicle.person if vehicle else None
        writer.writerow([
            m.id,
            vehicle.plate if vehicle else "",
            vehicle.vehicle_type if vehicle else "",
            person.full_name if person else "",
            person.person_type if person else "",
            _to_local(m.entry_at).strftime("%Y-%m-%d %H:%M") if m.entry_at else "",
            _to_local(m.exit_at).strftime("%Y-%m-%d %H:%M") if m.exit_at else "",
            "Dentro" if m.is_active else "Salió",
        ])
    return output.getvalue()
