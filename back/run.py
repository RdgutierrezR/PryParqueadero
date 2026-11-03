"""Punto de entrada del backend (Flask).

Uso:
    python run.py

El servidor queda disponible en http://127.0.0.1:5000
"""
import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="127.0.0.1", port=5000, debug=debug)
