#!/usr/bin/env python3
"""Regenerate charm tier PNGs — stars/diamonds for 1k–160k, badge crowns for 300k+."""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "charm" / "badge-sheet.png"
OUT = ROOT / "public" / "charm"
COLS = 6
ROWS = 6

CROWN_CELLS: dict[int, tuple[int, int]] = {
    7: (1, 4),
    8: (0, 3),
    9: (0, 4),
    10: (0, 2),
    11: (1, 1),
    12: (1, 2),
    13: (1, 3),
    14: (1, 5),
    15: (2, 2),
    16: (2, 5),
    17: (3, 3),
    18: (5, 1),
    19: (5, 2),
    20: (5, 3),
    21: (5, 4),
}


def level_filename(level: int) -> str:
    n = f"{level:02d}"
    if level <= 3:
        return f"star-{n}.png"
    if level <= 6:
        return f"diamond-{n}.png"
    return f"crown-{n}.png"


def component_masks(mask: np.ndarray) -> dict[int, list[tuple[int, int]]]:
    h, w = mask.shape
    labels = np.zeros((h, w), np.int32)
    comps: dict[int, list[tuple[int, int]]] = {}
    current = 0
    for y in range(h):
        for x in range(w):
            if not mask[y, x] or labels[y, x]:
                continue
            current += 1
            stack = [(y, x)]
            labels[y, x] = current
            pixels: list[tuple[int, int]] = []
            while stack:
                cy, cx = stack.pop()
                pixels.append((cy, cx))
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and labels[ny, nx] == 0:
                        labels[ny, nx] = current
                        stack.append((ny, nx))
            comps[current] = pixels
    return comps


def remove_noise_pixels(rgba: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    rgb = out[:, :, :3].astype(np.float32)
    mx = np.max(rgb, axis=2)
    mn = np.min(rgb, axis=2)
    sat = mx - mn
    alpha = out[:, :, 3]

    banner = (
        alpha > 0
    ) & (
        ((mn > 175) & (sat < 40))
        | ((rgb[:, :, 0] > 80) & (rgb[:, :, 1] < 130) & (rgb[:, :, 2] > 130))
        | ((mx > 120) & (sat < 14))
    )
    out[banner, 3] = 0
    return out


def keep_main_icon(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[:, :, 3] > 96
    if not alpha.any():
        return rgba

    comps = component_masks(alpha)
    if not comps:
        return rgba

    max_area = max(len(p) for p in comps.values())
    keep = np.zeros_like(alpha)

    for pixels in comps.values():
        if len(pixels) < max(max_area * 0.028, 32):
            continue
        xs = [p[1] for p in pixels]
        bw = max(xs) - min(xs) + 1
        if bw < 8:
            continue
        for y, x in pixels:
            keep[y, x] = True

    if not keep.any():
        return rgba

    out = rgba.copy()
    out[:, :, 3] = np.where(keep, out[:, :, 3], 0)
    return out


def drop_edge_fringe(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[:, :, 3] > 96
    if not alpha.any():
        return rgba

    h, w = alpha.shape
    keep = alpha.copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    mx = np.max(rgb, axis=2)
    mn = np.min(rgb, axis=2)
    sat = mx - mn

    for y in range(h):
        for x in range(w):
            if not alpha[y, x]:
                continue
            neighbors = 0
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx]:
                    neighbors += 1
            if neighbors >= 2:
                continue
            if mx[y, x] < 110 or (mn[y, x] > 165 and sat[y, x] < 40):
                keep[y, x] = False

    out = rgba.copy()
    out[:, :, 3] = np.where(keep, out[:, :, 3], 0)
    return out


def remove_detached_top_bands(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[:, :, 3] > 96
    if not alpha.any():
        return rgba

    comps = component_masks(alpha)
    if not comps:
        return rgba

    main_id = max(comps, key=lambda k: len(comps[k]))
    main_pixels = comps[main_id]
    main_ys = [p[0] for p in main_pixels]
    main_y0 = min(main_ys)

    keep = np.zeros_like(alpha)
    for comp_id, pixels in comps.items():
        ys = [p[0] for p in pixels]
        xs = [p[1] for p in pixels]
        y0, y1 = min(ys), max(ys)
        x0, x1 = min(xs), max(xs)
        height = y1 - y0 + 1
        width = x1 - x0 + 1

        if comp_id != main_id:
            if y1 < main_y0 - 1:
                continue
            if height <= 5 and width >= 18:
                continue
            if height / max(width, 1) < 0.05 and height <= 8:
                continue

        for y, x in pixels:
            keep[y, x] = True

    out = rgba.copy()
    out[:, :, 3] = np.where(keep, out[:, :, 3], 0)
    return out


def trim_fringe_rows(rgba: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    h = out.shape[0]
    limit = max(3, int(h * 0.2))

    for y in range(limit):
        row = out[y]
        if row[:, 3].mean() < 18:
            continue
        occupied = row[:, 3] > 96
        if occupied.mean() < 0.12:
            out[y, :, 3] = 0
            continue
        rgb = row[:, :3]
        if (rgb.min(axis=1) > 168).mean() > 0.08:
            out[y, :, 3] = 0
            continue
        break

    return out


def defringe_for_white_bg(rgba: np.ndarray) -> np.ndarray:
    out = rgba.astype(np.float32).copy()
    rgb = out[:, :, :3]
    mx = np.max(rgb, axis=2)
    a = out[:, :, 3] / 255.0
    eff = mx * a + 255.0 * (1.0 - a)

    fringe = (out[:, :, 3] > 0) & (
        ((eff > 165) & (mx < 120))
        | ((eff > 200) & (a < 0.55))
        | ((eff > 225) & (a < 0.9))
    )
    out[fringe, 3] = 0

    rgb = out[:, :, :3]
    mx = np.max(rgb, axis=2)
    a = out[:, :, 3] / 255.0
    eff = mx * a + 255.0 * (1.0 - a)
    fringe = (out[:, :, 3] > 0) & (eff > 175) & (mx < 95) & (a < 0.85)
    out[fringe, 3] = 0
    return out.astype(np.uint8)


def clean_rgba(rgba: np.ndarray) -> np.ndarray:
    rgb = rgba[:, :, :3].astype(np.float32)
    mx = np.max(rgb, axis=2)
    out = rgba.copy()
    out[:, :, 3] = np.where(mx > 26, 255, 0).astype(np.uint8)
    out = remove_noise_pixels(out)
    out = keep_main_icon(out)
    out = remove_detached_top_bands(out)
    out = trim_fringe_rows(out)
    out = drop_edge_fringe(out)
    out = defringe_for_white_bg(out)
    out = remove_noise_pixels(out)
    return out


def pad_square(im: Image.Image, size: int = 96, pad: int = 5) -> Image.Image:
    if im.getbbox() is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    max_side = max(im.size)
    scale = (size - pad * 2) / max_side
    nw = max(1, int(im.width * scale))
    nh = max(1, int(im.height * scale))
    resized = Image.fromarray(defringe_for_white_bg(np.array(im.resize((nw, nh), Image.Resampling.LANCZOS))))
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return Image.fromarray(defringe_for_white_bg(np.array(canvas)))


def star_points(cx: float, cy: float, outer: float, inner: float) -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = []
    for k in range(10):
        ang = math.radians(-90 + k * 36)
        rad = outer if k % 2 == 0 else inner
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    return pts


def draw_star(tier: int) -> Image.Image:
    size = 96
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    scale = 1.05 + tier * 0.14
    outer = 36 * scale
    inner = outer * 0.38
    cx, cy = size / 2, size / 2 + 1
    pts = star_points(cx, cy, outer, inner)
    draw.polygon(pts, fill=(251, 191, 36, 255), outline=(180, 83, 9, 255))
    return canvas


def draw_diamond(tier: int) -> Image.Image:
    size = 96
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    scale = 0.98 + tier * 0.11
    hw = 37 * scale
    hh = 46 * scale
    cx, cy = size / 2, size / 2
    pts = [(cx, cy - hh), (cx + hw, cy), (cx, cy + hh), (cx - hw, cy)]
    draw.polygon(pts, fill=(59, 130, 246, 255), outline=(29, 78, 216, 255))
    draw.polygon(
        [(cx, cy - hh), (cx + hw, cy), (cx, cy), (cx - hw, cy)],
        fill=(147, 197, 253, 210),
    )
    draw.polygon(
        [(cx, cy), (cx + hw * 0.35, cy + hh * 0.35), (cx, cy + hh), (cx - hw * 0.35, cy + hh * 0.35)],
        fill=(37, 99, 235, 120),
    )
    return canvas


def extract_cell(sheet: Image.Image, row: int, col: int) -> Image.Image:
    w, h = sheet.size
    cell_w, cell_h = w // COLS, h // ROWS
    if row == 0:
        inset_top, inset_bottom, inset_side = 0.10, 0.03, 0.08
    elif row >= 3:
        inset_top, inset_bottom, inset_side = 0.005, 0.005, 0.03
    else:
        inset_top, inset_bottom, inset_side = 0.06, 0.04, 0.1
    inset_left = inset_side if col > 0 else inset_side * 0.75
    inset_right = inset_side if col < COLS - 1 else inset_side * 0.75
    if col >= 4:
        inset_left = min(inset_left, 0.035)
    if col <= 1:
        inset_right = min(inset_right, 0.035)
    x0 = col * cell_w + int(cell_w * inset_left)
    y0 = row * cell_h + int(cell_h * inset_top)
    x1 = (col + 1) * cell_w - int(cell_w * inset_right)
    y1 = (row + 1) * cell_h - int(cell_h * inset_bottom)
    crop = sheet.crop((x0, y0, x1, y1))
    rgba = clean_rgba(np.array(crop.convert("RGBA")))
    im = Image.fromarray(rgba)
    if im.getbbox():
        im = im.crop(im.getbbox())
    return im


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SRC).convert("RGB") if SRC.exists() else None

    for tier in (1, 2, 3):
        level = tier
        pad_square(draw_star(tier), 96, pad=2).save(OUT / level_filename(level), optimize=True)
        print(f"Lv.{level:02d} star {tier}")

    for tier in (1, 2, 3):
        level = tier + 3
        pad_square(draw_diamond(tier), 96, pad=2).save(OUT / level_filename(level), optimize=True)
        print(f"Lv.{level:02d} diamond {tier}")

    if not sheet:
        raise SystemExit(f"Missing sprite sheet for crowns: {SRC}")

    for level, (row, col) in sorted(CROWN_CELLS.items()):
        icon = extract_cell(sheet, row, col)
        pad_square(icon, 96, pad=7).save(OUT / level_filename(level), optimize=True)
        print(f"Lv.{level:02d} crown grid[{row},{col}] ({icon.size[0]}x{icon.size[1]})")

    print("done")


if __name__ == "__main__":
    main()
