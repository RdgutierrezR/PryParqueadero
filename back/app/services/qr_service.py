"""Servicio de generación de códigos QR.

El QR contiene ÚNICAMENTE un token aleatorio. No incluye datos personales,
credenciales ni información sensible. La validación siempre consulta al
backend: un QR válido no implica que el vehículo esté autorizado.
"""
import io

import qrcode

from app.models.vehicle import Vehicle


def generate_qr_png(vehicle: Vehicle) -> bytes:
    """Genera el código QR del vehículo como PNG (para visualizar e imprimir)."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    # El QR solo contiene el token aleatorio del vehículo.
    qr.add_data(vehicle.qr_token)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer)
    return buffer.getvalue()
