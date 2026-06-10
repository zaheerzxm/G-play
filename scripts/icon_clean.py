"""Shared RGBA cleanup for bond/charm icon extraction."""
from __future__ import annotations

import numpy as np
from PIL import Image


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


def keep_main_icon(rgba: np.ndarray, *, min_ratio: float = 0.028) -> np.ndarray:
    alpha = rgba[:, :, 3] > 96
    if not alpha.any():
        return rgba

    comps = component_masks(alpha)
    if not comps:
        return rgba

    max_area = max(len(p) for p in comps.values())
    keep = np.zeros_like(alpha)

    for pixels in comps.values():
        if len(pixels) < max(max_area * min_ratio, 32):
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
    main_y1 = max(main_ys)
    main_height = main_y1 - main_y0 + 1

    keep = np.zeros_like(alpha)
    for comp_id, pixels in comps.items():
        ys = [p[0] for p in pixels]
        xs = [p[1] for p in pixels]
        y0, y1 = min(ys), max(ys)
        x0, x1 = min(xs), max(xs)
        height = y1 - y0 + 1
        width = x1 - x0 + 1

        if comp_id != main_id:
            if y1 < main_y0 + int(main_height * 0.08):
                continue
            if height <= 6 and width >= 16:
                continue
            if height / max(width, 1) < 0.06 and height <= 10:
                continue
            if len(pixels) < len(main_pixels) * 0.12:
                continue

        for y, x in pixels:
            keep[y, x] = True

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


def trim_fringe_rows(rgba: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    h = out.shape[0]
    limit = max(4, int(h * 0.22))

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

    for y in range(h - 1, h - limit - 1, -1):
        row = out[y]
        if row[:, 3].mean() < 18:
            continue
        occupied = row[:, 3] > 96
        if occupied.mean() < 0.1:
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


def remove_sheet_backdrop(crop: Image.Image) -> np.ndarray:
    arr = np.array(crop.convert("RGBA")).astype(np.float32)
    h, w = arr.shape[:2]
    corners = np.array([arr[2, 2, :3], arr[2, w - 3, :3], arr[h - 3, 2, :3], arr[h - 3, w - 3, :3]])
    bg = corners.mean(axis=0)
    dist = np.linalg.norm(arr[:, :, :3] - bg, axis=2)
    mx = arr[:, :, :3].max(axis=2)
    mn = arr[:, :, :3].min(axis=2)
    sat = mx - mn
    backdrop = (dist < 42) | ((sat < 55) & (arr[:, :, 0] > 170)) | ((sat < 40) & (mx > 200))
    alpha = np.clip((dist - 18) / 36, 0, 1)
    alpha[backdrop] = 0
    alpha[mx < 24] = 0
    out = arr.copy()
    out[:, :, 3] = (alpha * 255).astype(np.uint8)
    return out.astype(np.uint8)


def clean_bond_icon(crop: Image.Image) -> Image.Image:
    rgba = remove_sheet_backdrop(crop)
    rgba = defringe_for_white_bg(rgba)
    solid = rgba[:, :, 3] > 48
    rgba[~solid, 3] = 0
    rgba = trim_fringe_rows(rgba)
    rgba = drop_edge_fringe(rgba)
    rgba = defringe_for_white_bg(rgba)
    im = Image.fromarray(rgba)
    if im.getbbox():
        im = im.crop(im.getbbox())
    return im


def grid_bounds_from_rect(
    left: int,
    top: int,
    right: int,
    bottom: int,
    *,
    cols: int,
    rows: int,
) -> tuple[list[int], list[int]]:
    col_bounds = [left]
    for i in range(1, cols):
        col_bounds.append(int(left + (right - left) * i / cols))
    col_bounds.append(right)

    row_bounds = [top]
    for i in range(1, rows):
        row_bounds.append(int(top + (bottom - top) * i / rows))
    row_bounds.append(bottom)

    return col_bounds, row_bounds


def clean_rgba(rgba: np.ndarray) -> np.ndarray:
    out = rgba.copy()
    alpha = out[:, :, 3]
    solid = alpha > 96
    out[~solid, 3] = 0
    out[solid, 3] = np.clip(alpha[solid], 0, 255).astype(np.uint8)
    out = remove_noise_pixels(out)
    out = keep_main_icon(out, min_ratio=0.035)
    out = remove_detached_top_bands(out)
    out = trim_fringe_rows(out)
    out = drop_edge_fringe(out)
    out = defringe_for_white_bg(out)
    out = remove_noise_pixels(out)
    return out


def detect_grid_splits(sheet: Image.Image, *, cols: int, rows: int) -> tuple[list[int], list[int]]:
    arr = np.array(sheet.convert("RGBA")).astype(np.float32)
    rgb = arr[:, :, :3]
    corners = np.array([arr[2, 2, :3], arr[2, -3, :3], arr[-3, 2, :3], arr[-3, -3, :3]])
    bg = corners.mean(axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    sat = mx - mn
    mask = (dist > 35) & (sat > 8) & (arr[:, :, 3] > 200)

    h, w = mask.shape
    col_proj = mask.sum(axis=0)
    row_proj = mask.sum(axis=1)

    col_bounds = [0]
    for i in range(1, cols):
        lo = int(w * i / cols - 30)
        hi = int(w * i / cols + 30)
        lo = max(0, lo)
        hi = min(w, hi)
        idx = lo + int(col_proj[lo:hi].argmin())
        col_bounds.append(idx)
    col_bounds.append(w)

    row_bounds = [0]
    for i in range(1, rows):
        lo = int(h * i / rows - 30)
        hi = int(h * i / rows + 30)
        lo = max(0, lo)
        hi = min(h, hi)
        idx = lo + int(row_proj[lo:hi].argmin())
        row_bounds.append(idx)
    row_bounds.append(h)

    return col_bounds, row_bounds


def pad_square(im: Image.Image, size: int = 96, pad: int = 8) -> Image.Image:
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


def extract_grid_cell(
    sheet: Image.Image,
    *,
    level: int,
    cols: int,
    rows: int,
    col_bounds: list[int] | None = None,
    row_bounds: list[int] | None = None,
    cell_inset: float = 0.06,
) -> Image.Image:
    if col_bounds is None or row_bounds is None:
        col_bounds, row_bounds = detect_grid_splits(sheet, cols=cols, rows=rows)

    idx = level - 1
    row, col = divmod(idx, cols)
    x0, x1 = col_bounds[col], col_bounds[col + 1]
    y0, y1 = row_bounds[row], row_bounds[row + 1]
    cw = x1 - x0
    rh = y1 - y0
    inset_x = int(cw * cell_inset)
    inset_y = int(rh * cell_inset)
    return clean_bond_icon(sheet.crop((x0 + inset_x, y0 + inset_y, x1 - inset_x, y1 - inset_y)))
