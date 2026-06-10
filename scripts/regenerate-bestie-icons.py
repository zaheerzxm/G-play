#!/usr/bin/env python3
"""Regenerate 6 bestie bow PNGs from public/charm/bestie-sheet.png (pre-cut, transparent)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "charm" / "bestie-sheet.png"
OUT = ROOT / "public" / "charm"
COLS = 3
ROWS = 2
CELL_PAD = 3
ICON_PAD = 6


def content_bounds(sheet: Image.Image, *, alpha_min: int = 16) -> tuple[int, int, int, int]:
    arr = np.array(sheet.convert("RGBA"))
    mask = arr[:, :, 3] > alpha_min
    if not mask.any():
        w, h = sheet.size
        return 0, 0, w, h
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def extract_bow(sheet: Image.Image, level: int, bounds: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = bounds
    idx = level - 1
    row, col = divmod(idx, COLS)
    cw = (x1 - x0 + 1) / COLS
    rh = (y1 - y0 + 1) / ROWS
    cx0 = int(x0 + col * cw + CELL_PAD)
    cx1 = int(x0 + (col + 1) * cw - CELL_PAD)
    cy0 = int(y0 + row * rh + CELL_PAD)
    cy1 = int(y0 + (row + 1) * rh - CELL_PAD)
    cell = sheet.crop((cx0, cy0, cx1, cy1))
    if cell.getbbox():
        cell = cell.crop(cell.getbbox())
    return cell


def pad_square(im: Image.Image, size: int = 96, pad: int = ICON_PAD) -> Image.Image:
    if im.getbbox() is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))

    tight = im.crop(im.getbbox())
    arr = np.array(tight)
    alpha = arr[:, :, 3].astype(np.float64)
    total = alpha.sum()
    if total <= 0:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))

    max_side = max(tight.size)
    scale = (size - pad * 2) / max_side
    nw = max(1, int(tight.width * scale))
    nh = max(1, int(tight.height * scale))
    resized = tight.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing bestie sheet: {SRC}")
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SRC).convert("RGBA")
    bounds = content_bounds(sheet)
    print("content bounds", bounds)

    for level in range(1, 7):
        icon = extract_bow(sheet, level, bounds)
        pad_square(icon, 96).save(OUT / f"bestie-{level:02d}.png", optimize=True)
        print(f"Lv.{level} bestie {icon.size[0]}x{icon.size[1]}")

    print("done")


if __name__ == "__main__":
    main()
