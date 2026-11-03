"""Application factory de Flask.

Crea la aplicación, inicializa extensiones, registra los Blueprints de la API,
configura CORS restringido al frontend local y define los comandos CLI
(init-db, create-admin) para inicializar el sistema de forma segura.
"""
import os

import click
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from app.config import Config
from app.extensions import db, login_manager


def create_app(config_class=Config) -> Flask:
    """Crea y configura la instancia de Flask."""
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # Asegurar que exista la carpeta instance/ (base de datos persistente).
    os.makedirs(app.instance_path, exist_ok=True)

    # Extensiones.
    db.init_app(app)
    login_manager.init_app(app)

    # CORS restringido SOLO al origen del frontend local, con credenciales.
    CORS(
        app,
        resources={r"/api/*": {"origins": [app.config["FRONTEND_ORIGIN"]]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "X-CSRF-Token"],
    )

    _register_blueprints(app)
    _register_error_handlers(app)
    _register_cli(app)

    # Asegurar la fila de configuración sin borrar datos existentes.
    with app.app_context():
        db.create_all()
        from app.models.setting import Setting

        Setting.get()

    return app


def _register_blueprints(app: Flask) -> None:
    from app.controllers.access_controller import access_bp
    from app.controllers.auth_controller import auth_bp
    from app.controllers.person_controller import persons_bp
    from app.controllers.report_controller import reports_bp
    from app.controllers.setting_controller import settings_bp
    from app.controllers.user_controller import users_bp
    from app.controllers.vehicle_controller import vehicles_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(persons_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(access_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(users_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"success": True, "data": {"status": "ok"}})


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(HTTPException)
    def handle_http_error(exc: HTTPException):
        return jsonify({"success": False, "error": exc.description}), exc.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc: Exception):
        app.logger.exception("Error inesperado")
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Ocurrió un error interno. Revisa los registros del servidor.",
                }
            ),
            500,
        )


def _register_cli(app: Flask) -> None:
    @app.cli.command("init-db")
    def init_db():
        """Crea las tablas de la base de datos sin borrar datos existentes."""
        db.create_all()
        from app.models.setting import Setting

        setting = Setting.get()
        click.echo(f"Base de datos inicializada. Capacidad actual: {setting.capacity}.")

    @app.cli.command("create-admin")
    @click.option("--name", prompt="Nombre completo del administrador", help="Nombre.")
    @click.option("--username", prompt="Usuario de inicio de sesión", help="Usuario.")
    @click.option(
        "--password",
        prompt="Contraseña (mínimo 8 caracteres)",
        hide_input=True,
        confirmation_prompt=True,
        help="Contraseña.",
    )
    def create_admin(name, username, password):
        """Crea la primera cuenta administradora (o una adicional)."""
        from app.models.user import ROLE_ADMIN, User

        name = name.strip()
        username = username.strip()

        if len(name) < 3:
            raise click.ClickException("El nombre debe tener al menos 3 caracteres.")
        if len(username) < 4:
            raise click.ClickException("El usuario debe tener al menos 4 caracteres.")
        if len(password) < 8:
            raise click.ClickException("La contraseña debe tener al menos 8 caracteres.")
        if User.query.filter_by(username=username).first():
            raise click.ClickException(f"Ya existe una cuenta con el usuario '{username}'.")

        user = User(name=name, username=username, role=ROLE_ADMIN, is_active=True)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Administrador '{username}' creado correctamente.")
