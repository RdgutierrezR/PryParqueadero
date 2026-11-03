"""Controller de personas: registro y gestión (solo administrador)."""
from flask import Blueprint, request

from app.extensions import db
from app.models.person import PERSON_TYPES, Person
from app.utils.decorators import admin_required, csrf_protect
from app.views import error, ok

persons_bp = Blueprint("persons", __name__, url_prefix="/api/persons")


def _validate_payload(payload, person_id=None):
    """Valida los campos de una persona. Devuelve (errores, datos_limpios)."""
    errors = {}
    full_name = (payload.get("full_name") or "").strip()
    person_type = (payload.get("person_type") or "").strip()
    institutional_code = (payload.get("institutional_code") or "").strip() or None
    contact = (payload.get("contact") or "").strip() or None

    if len(full_name) < 3:
        errors["full_name"] = "El nombre completo debe tener al menos 3 caracteres."
    if person_type not in PERSON_TYPES:
        errors["person_type"] = f"El tipo de persona debe ser uno de: {', '.join(PERSON_TYPES)}."
    if contact and len(contact) > 120:
        errors["contact"] = "El contacto no puede superar los 120 caracteres."

    clean = {
        "full_name": full_name,
        "person_type": person_type,
        "institutional_code": institutional_code,
        "contact": contact,
    }
    return errors, clean


@persons_bp.route("", methods=["GET"])
@admin_required
def list_persons():
    """Lista las personas registradas, con búsqueda opcional por nombre."""
    query = (request.args.get("q") or "").strip()
    stmt = Person.query
    if query:
        stmt = stmt.filter(Person.full_name.ilike(f"%{query}%"))
    persons = stmt.order_by(Person.full_name.asc()).all()
    return ok(data=[p.to_dict() for p in persons])


@persons_bp.route("", methods=["POST"])
@admin_required
@csrf_protect
def create_person():
    payload = request.get_json(silent=True) or {}
    errors, clean = _validate_payload(payload)
    if errors:
        return error("Datos inválidos.", 422, errors)

    person = Person(**clean)
    db.session.add(person)
    db.session.commit()
    return ok(data=person.to_dict(), message="Persona registrada correctamente.", status=201)


@persons_bp.route("/<int:person_id>", methods=["GET"])
@admin_required
def get_person(person_id):
    person = db.session.get(Person, person_id)
    if person is None:
        return error("Persona no encontrada.", 404)
    return ok(data=person.to_dict())


@persons_bp.route("/<int:person_id>", methods=["PUT"])
@admin_required
@csrf_protect
def update_person(person_id):
    person = db.session.get(Person, person_id)
    if person is None:
        return error("Persona no encontrada.", 404)

    payload = request.get_json(silent=True) or {}
    errors, clean = _validate_payload(payload, person_id)
    if errors:
        return error("Datos inválidos.", 422, errors)

    for key, value in clean.items():
        setattr(person, key, value)
    db.session.commit()
    return ok(data=person.to_dict(), message="Persona actualizada correctamente.")


@persons_bp.route("/<int:person_id>", methods=["DELETE"])
@admin_required
@csrf_protect
def delete_person(person_id):
    person = db.session.get(Person, person_id)
    if person is None:
        return error("Persona no encontrada.", 404)

    if person.vehicles.count() > 0:
        return error(
            "No se puede eliminar: la persona tiene vehículos registrados.", 409
        )

    db.session.delete(person)
    db.session.commit()
    return ok(message="Persona eliminada correctamente.")
