"""Datos de demostración (ficticios) para probar el sistema.

Crea cuentas de administrador y vigilante, personas y vehículos de ejemplo.
Es idempotente: si ya existen, no duplica registros.

Uso (desde la carpeta back, con el entorno virtual activo):
    python seed_demo.py

Cuentas demo:
    Administrador -> usuario: admin       contraseña: Admin12345
    Vigilante     -> usuario: vigilante   contraseña: Vigilante123

ADVERTENCIA: son credenciales de demostración. Cámbialas antes de cualquier
uso real y no las publiques.
"""
from app import create_app
from app.extensions import db
from app.models.person import Person
from app.models.vehicle import Vehicle, generate_qr_token


def seed():
    app = create_app()
    created = []

    with app.app_context():
        from app.models.user import User

        def ensure_user(name, username, password, role):
            if User.query.filter_by(username=username).first():
                return
            user = User(name=name, username=username, role=role, is_active=True)
            user.set_password(password)
            db.session.add(user)
            created.append(f"cuenta: {username} ({role})")

        def ensure_person(full_name, person_type, code=None, contact=None):
            person = Person.query.filter_by(full_name=full_name).first()
            if person:
                return person
            person = Person(
                full_name=full_name,
                person_type=person_type,
                institutional_code=code,
                contact=contact,
            )
            db.session.add(person)
            db.session.flush()
            created.append(f"persona: {full_name}")
            return person

        def ensure_vehicle(plate, vtype, person, status):
            if Vehicle.query.filter_by(plate=plate).first():
                return
            vehicle = Vehicle(
                plate=plate,
                vehicle_type=vtype,
                person_id=person.id,
                status=status,
                qr_token=generate_qr_token(),
            )
            db.session.add(vehicle)
            created.append(f"vehículo: {plate} ({status})")

        # Cuentas de acceso.
        ensure_user("Administrador Demo", "admin", "Admin12345", "administrador")
        ensure_user("Vigilante Demo", "vigilante", "Vigilante123", "vigilante")

        # Personas ficticias (no representan personas reales de la CUL).
        estudiante = ensure_person("Estudiante Demo Uno", "estudiante", code="EST-DEMO-01")
        docente = ensure_person("Docente Demo Dos", "docente", code="DOC-DEMO-02")
        visitante = ensure_person("Visitante Demo Tres", "visitante", contact="demo@example.com")

        # Vehículos de ejemplo en distintos estados.
        ensure_vehicle("DEM001", "automovil", estudiante, "autorizado")
        ensure_vehicle("DEM002", "motocicleta", docente, "autorizado")
        ensure_vehicle("DEM003", "automovil", visitante, "pendiente")
        ensure_vehicle("DEM004", "motocicleta", estudiante, "pendiente")

        db.session.commit()

    if created:
        print("Datos de demostración creados:")
        for item in created:
            print(f"  - {item}")
    else:
        print("Los datos de demostración ya existían. No se duplicó nada.")

    print("\nCuentas demo:")
    print("  Administrador -> usuario: admin       contraseña: Admin12345")
    print("  Vigilante     -> usuario: vigilante   contraseña: Vigilante123")


if __name__ == "__main__":
    seed()
