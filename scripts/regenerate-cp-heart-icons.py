#!/usr/bin/env python3
"""Regenerate 6 CP heart PNGs from individual source files in public/charm/heart-src/."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "public" / "charm" / "heart-src"
OUT = ROOT / "public" / "charm"
ICON_SIZE = 96
ICON_PAD = 6


def remove_purple_backdrop(im: Image.Image) -> Image.Image:
    """Remove only the lavender sheet background — keep white heart shines."""
    rgba = np.array(im.convert("RGBA"))
    edge_alpha = rgba[[0, 0, -1, -1], [0, -1, 0, -1], 3]

    if edge_alpha.mean() < 200:
        result = Image.fromarray(rgba)
        if result.getbbox():
            result = result.crop(result.getbbox())
        return result

    arr = rgba.astype(np.float32)
    h, w = arr.shape[:2]
    corners = np.array([arr[2, 2, :3], arr[2, w - 3, :3], arr[h - 3, 2, :3], arr[h - 3, w - 3, :3]])
    bg = corners.mean(axis=0)
    rgb = arr[:, :, :3]
    dist = np.linalg.norm(rgb - bg, axis=2)

    alpha = np.ones((h, w), dtype=np.float32)
    alpha[dist < 34] = 0
    fringe = (dist >= 34) & (dist < 52)
    alpha[fringe] = np.clip((dist[fringe] - 34) / 18, 0, 1)

    out = arr.copy()
    out[:, :, 3] = (alpha * 255).astype(np.uint8)
    out[out[:, :, 3] < 12, 3] = 0

    result = Image.fromarray(out.astype(np.uint8))
    if result.getbbox():
        result = result.crop(result.getbbox())
    return result


def pad_square(im: Image.Image, size: int = ICON_SIZE, pad: int = ICON_PAD) -> Image.Image:
    if im.getbbox() is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))

    tight = im.crop(im.getbbox())
    max_side = max(tight.size)
    scale = (size - pad * 2) / max_side
    nw = max(1, int(tight.width * scale))
    nh = max(1, int(tight.height * scale))
    resized = tight.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    SRC_DIR.mkdir(parents=True, exist_ok=True)

    for level in range(1, 7):
        src = SRC_DIR / f"level-{level:02d}.png"
        if not src.exists():
            raise SystemExit(f"Missing source heart: {src}")

        icon = remove_purple_backdrop(Image.open(src))
        pad_square(icon).save(OUT / f"heart-{level:02d}.png", optimize=True)
        print(f"Lv.{level} heart {icon.size[0]}x{icon.size[1]}")

    print("done")


if __name__ == "__main__":
    main()
