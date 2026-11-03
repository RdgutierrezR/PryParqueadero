"""Pruebas de reportes y su consistencia con los datos persistidos."""
from datetime import datetime, timedelta, timezone

from tests.conftest import auth_headers


def test_reporte_resumen(client, csrf_admin):
    # Generar un movimiento de entrada (el admin también puede registrarlo).
    client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_admin),
    )
    today = datetime.now().astimezone().date().isoformat()
    response = client.get(f"/api/reports/summary?start={today}&end={today}")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["entries"] >= 1
    assert "by_person_type" in data
    assert "by_vehicle_type" in data


def test_reporte_historial(client, csrf_admin):
    today = datetime.now().astimezone().date().isoformat()
    response = client.get(f"/api/reports/history?start={today}&end={today}")
    assert response.status_code == 200
    assert isinstance(response.get_json()["data"], list)


def test_reporte_periodo_sin_resultados(client, csrf_admin):
    response = client.get("/api/reports/summary?start=2000-01-01&end=2000-01-02")
    assert response.status_code == 200
    assert response.get_json()["data"]["entries"] == 0


def test_reporte_fecha_invalida(client, csrf_admin):
    response = client.get("/api/reports/summary?start=2024-13-99&end=2024-01-01")
    assert response.status_code == 400


def test_reporte_vehiculos_dentro(client, csrf_admin):
    client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_admin),
    )
    response = client.get("/api/reports/inside")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert any(m["vehicle"]["plate"] == "AUT123" for m in data)


def test_reporte_export_csv(client, csrf_admin):
    today = datetime.now().astimezone().date().isoformat()
    response = client.get(f"/api/reports/export?start={today}&end={today}")
    assert response.status_code == 200
    assert response.mimetype == "text/csv"
    assert "Placa" in response.get_data(as_text=True)


def test_vigilante_no_accede_reportes(client, csrf_guard):
    response = client.get("/api/reports/summary")
    assert response.status_code == 403


def test_vigilante_puede_ver_historial(client, csrf_guard):
    """El vigilante puede consultar el historial de movimientos."""
    today = datetime.now().astimezone().date().isoformat()

    # Registra una entrada y luego la busca en el historial.
    client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_guard),
    )
    response = client.get(f"/api/reports/history?start={today}&end={today}")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert isinstance(data, list)
    assert any(m["vehicle"]["plate"] == "AUT123" for m in data)


def test_vigilante_sigue_sin_acceso_a_resumen_exportacion_y_dentro(
    client, csrf_guard
):
    """Ver el historial no le da acceso al resto de reportes."""
    assert client.get("/api/reports/summary").status_code == 403
    assert client.get("/api/reports/export").status_code == 403
    assert client.get("/api/reports/inside").status_code == 403


def test_historial_adentro_ignora_las_fechas(app, client, csrf_admin):
    """"Adentro ahora" describe el estado actual, aunque la entrada sea antigua."""
    from app.extensions import db
    from app.models.movement import Movement
    from app.models.vehicle import Vehicle

    with app.app_context():
        vehicle = Vehicle.query.filter_by(plate="AUT123").first()
        db.session.add(
            Movement(
                vehicle_id=vehicle.id,
                entry_at=datetime.now(timezone.utc) - timedelta(days=30),
            )
        )
        db.session.commit()

    # Rango de fechas: hoy. El vehículo entró hace 30 días y debe aparecer igual.
    today = datetime.now().astimezone().date().isoformat()
    response = client.get(
        f"/api/reports/history?start={today}&end={today}&status=inside"
    )
    assert response.status_code == 200
    rows = response.get_json()["data"]
    assert [r["vehicle"]["plate"] for r in rows] == ["AUT123"]
    assert rows[0]["exit_at"] is None


def test_historial_afuera_excluye_los_que_estan_dentro(app, client, csrf_admin):
    client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_admin),
    )
    today = datetime.now().astimezone().date().isoformat()
    response = client.get(
        f"/api/reports/history?start={today}&end={today}&status=outside"
    )
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_historial_estado_invalido(client, csrf_admin):
    response = client.get("/api/reports/history?status=cualquiera")
    assert response.status_code == 400


def test_historial_usa_la_fecha_local_no_la_utc(app, client, csrf_admin):
    """Una entrada de las 23:30 locales pertenece a ese día local, aunque en UTC
    ya sea el día siguiente (evita que los movimientos de la noche desaparezcan)."""
    from app.extensions import db
    from app.models.movement import Movement
    from app.models.vehicle import Vehicle

    local_today = datetime.now().astimezone().date()
    late_local = datetime.combine(local_today, datetime.min.time()).replace(
        hour=23, minute=30
    )
    late_utc = late_local.astimezone(timezone.utc).replace(tzinfo=None)

    with app.app_context():
        vehicle = Vehicle.query.filter_by(plate="AUT123").first()
        db.session.add(Movement(vehicle_id=vehicle.id, entry_at=late_utc))
        db.session.commit()

    day = local_today.isoformat()
    response = client.get(f"/api/reports/history?start={day}&end={day}")
    assert response.status_code == 200
    assert any(
        m["vehicle"]["plate"] == "AUT123" for m in response.get_json()["data"]
    )


def test_fechas_se_serializan_en_utc(client, csrf_admin):
    """Las horas viajan con zona horaria explícita para que el navegador las
    convierta a hora local."""
    client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_admin),
    )
    response = client.get("/api/reports/history?status=inside")
    movement = response.get_json()["data"][0]
    assert movement["entry_at"].endswith("+00:00")
    assert movement["exit_at"] is None


def test_vigilante_puede_filtrar_quienes_estan_adentro(client, csrf_guard):
    client.post(
        "/api/access/entry",
        json={"plate": "AUT123"},
        headers=auth_headers(csrf_guard),
    )
    response = client.get("/api/reports/history?status=inside")
    assert response.status_code == 200
    rows = response.get_json()["data"]
    assert [r["vehicle"]["plate"] for r in rows] == ["AUT123"]
