"""Capa de vistas/serialización: respuestas JSON consistentes de la API."""
from flask import jsonify


def ok(data=None, message=None, status=200):
    """Respuesta JSON de éxito con estructura consistente."""
    body = {"success": True}
    if message:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def error(message, status=400, errors=None):
    """Respuesta JSON de error con estructura consistente."""
    body = {"success": False, "error": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), status
