"""Respaldo de la base real y de la demo a la carpeta backups/.

Hace una copia con fecha y hora + imprime el SHA256 e integridad.

Uso:
    back/venv/Scripts/python.exe backup_databases.py
"""
import hashlib
import shutil
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INSTANCE = ROOT / "instance"
BACKUPS = ROOT.parent / "backups"
BACKUPS.mkdir(exist_ok=True)


def now():
    from datetime import datetime

    return datetime.now().strftime("%Y%m%d_%H%M%S")


def handle(src: Path, name: str) -> None:
    dest = BACKUPS / f"{name}_{now()}.db"
    shutil.copyfile(src, dest)
    h = hashlib.sha256(dest.read_bytes()).hexdigest().upper()
    con = sqlite3.connect(dest)
    ok = con.execute("PRAGMA integrity_check").fetchone()[0]
    con.close()
    print(f"{name} -> {dest.name}")
    print(f"  SHA256: {h}")
    print(f"  integridad: {ok}")


def main():
    dbs = [
        (INSTANCE / "parqueadero.db", "parqueadero"),
        (INSTANCE / "parqueadero.demo.db", "parqueadero_demo"),
    ]
    for src, name in dbs:
        if src.exists():
            handle(src, name)


if __name__ == "__main__":
    main()
