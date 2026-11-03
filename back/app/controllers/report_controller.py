"""Controller de reportes: historial, resumen, vehículos dentro y exportación CSV."""
from flask import Blueprint, Response, request

from app.services import report_service
from app.services.report_service import ReportError
from app.utils.decorators import admin_required, guard_or_admin_required
from app.views import error, ok

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _handle_report(fn):
    """Envuelve la llamada al servicio traduciendo errores de negocio."""
    try:
        return fn()
    except ReportError as exc:
        return error(exc.message, exc.code)


@reports_bp.route("/summary", methods=["GET"])
@admin_required
def summary():
    start = request.args.get("start")
    end = request.args.get("end")
    return _handle_report(lambda: ok(data=report_service.get_summary(start, end)))


@reports_bp.route("/history", methods=["GET"])
@guard_or_admin_required
def history():
    start = request.args.get("start")
    end = request.args.get("end")
    plate = request.args.get("plate")
    status = request.args.get("status")
    return _handle_report(
        lambda: ok(data=report_service.get_history(start, end, plate, status))
    )


@reports_bp.route("/inside", methods=["GET"])
@admin_required
def inside():
    return ok(data=report_service.get_inside_now())


@reports_bp.route("/export", methods=["GET"])
@admin_required
def export_csv():
    start = request.args.get("start")
    end = request.args.get("end")

    try:
        content = report_service.export_history_csv(start, end)
    except ReportError as exc:
        return error(exc.message, exc.code)

    return Response(
        content,
        mimetype="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=reporte_parqueadero.csv"
        },
    )
