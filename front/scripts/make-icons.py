"""Genera los iconos PNG de la PWA del frontend.

Se ejecuta una vez con el Python del entorno de back/:

    ..\\..\\back\\venv\\Scripts\\python.exe make-icons.py

Genera íconos azul/blanco con letra P para el manifest de la app.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE = Path(__file__).resolve().parent.parent / "public" / "icons"
FONT = "C:/Windows/Fonts/arialbd.ttf"
SIZES = [(192, "icon-192.png"), (512, "icon-512.png")]


def make_icon(size: int, name: str) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = int(size * 0.06)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=int(size * 0.16),
        fill=(37, 99, 235, 255),
        outline=(255, 255, 255, 255),
        width=max(2, size // 24),
    )
    font = ImageFont.truetype(FONT, int(size * 0.56))
    bbox = draw.textbbox((0, 0), "P", font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    draw.text(
        ((size - width) / 2 - bbox[0], (size - height) / 2 - bbox[1]),
        "P",
        font=font,
        fill=(255, 255, 255, 255),
    )
    img.save(BASE / name)
    print(f"{name}: {img.size}")


if __name__ == "__main__":
    BASE.mkdir(parents=True, exist_ok=True)
    for size, name in SIZES:
        make_icon(size, name)
