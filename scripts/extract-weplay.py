#!/usr/bin/env python3
"""Extract usable PNG/WebP assets from G-play Android data folder.

Usage:
  python3 scripts/extract-G-play.py /Users/zaheer/Downloads/com.wejoy.G-play.ar

Requires: pip install UnityPy Pillow
Output: public/G-play/ (web-ready assets)
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

try:
    import UnityPy
except ImportError:
    print("Install UnityPy: pip install UnityPy", file=sys.stderr)
    raise SystemExit(1)


def file_kind(path: Path) -> str:
    result = subprocess.run(["file", "-b", str(path)], capture_output=True, text=True)
    out = result.stdout
    if "PNG" in out:
        return "png"
    if "Web/P" in out:
        return "webp"
    return "bin"


def safe_name(name: str) -> str:
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in name) or "tex"


def extract_bundles(bundles_dir: Path, out_dir: Path) -> list[str]:
    keywords = ("sprite", "fairygui", "icon", "texture", "effect")
    written: list[str] = []

    for bundle in sorted(bundles_dir.iterdir()):
        if not bundle.is_file():
            continue
        low = bundle.name.lower()
        if not low.startswith("common_"):
            continue
        if not any(k in low for k in keywords):
            continue
        try:
            env = UnityPy.load(str(bundle))
        except Exception as exc:
            print(f"skip {bundle.name}: {exc}")
            continue

        prefix = bundle.name.split("_")[1][:12]
        for obj in env.objects:
            if obj.type.name != "Texture2D":
                continue
            try:
                data = obj.read()
                dest = out_dir / f"{prefix}_{safe_name(data.m_Name)}.png"
                data.image.save(dest)
                written.append(dest.name)
            except Exception as exc:
                print(f"skip texture in {bundle.name}: {exc}")

    return written


def copy_image_cache(cache_dir: Path, out_dir: Path) -> list[str]:
    written: list[str] = []
    if not cache_dir.is_dir():
        return written
    for src in cache_dir.iterdir():
        if not src.is_file():
            continue
        ext = file_kind(src)
        dest = out_dir / f"cache_{src.name}.{ext}"
        shutil.copy2(src, dest)
        written.append(dest.name)
    return written


def copy_svga_files(files_dir: Path, out_dir: Path) -> list[str]:
    written: list[str] = []
    if not files_dir.is_dir():
        return written
    for src in files_dir.rglob("*.svga"):
        dest = out_dir / src.name
        shutil.copy2(src, dest)
        written.append(dest.name)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract G-play assets for G-play")
    parser.add_argument(
        "source",
        nargs="?",
        default="/Users/zaheer/Downloads/com.wejoy.G-play.ar",
        help="Path to com.wejoy.G-play.ar folder",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output directory (default: <repo>/public/G-play)",
    )
    args = parser.parse_args()

    source = Path(args.source).expanduser().resolve()
    repo = Path(__file__).resolve().parents[1]
    out_dir = Path(args.out).expanduser().resolve() if args.out else repo / "public" / "G-play"
    out_dir.mkdir(parents=True, exist_ok=True)

    bundles_dir = source / "files" / "AssetBundles"
    cache_dir = source / "files" / "image_cache"
    files_dir = source / "files"

    if not bundles_dir.is_dir():
        print(f"AssetBundles not found: {bundles_dir}", file=sys.stderr)
        raise SystemExit(1)

    bundle_count = sum(1 for p in bundles_dir.iterdir() if p.is_file())
    print(f"Source: {source} ({bundle_count} bundles)")

    textures = extract_bundles(bundles_dir, out_dir)
    cache = copy_image_cache(cache_dir, out_dir)
    svgas = copy_svga_files(files_dir, out_dir)

    print(f"Wrote {len(textures)} textures + {len(cache)} cache + {len(svgas)} svga -> {out_dir}")
    print("Note: voice-room gift/emote bundles download when you use those features in G-play.")

    fui_hits = []
    for bundle in bundles_dir.iterdir():
        if not bundle.is_file():
            continue
        try:
            env = UnityPy.load(str(bundle))
            for obj in env.objects:
                if obj.type.name == "TextAsset" and obj.read().m_Name.endswith("_fui"):
                    fui_hits.append(f"{bundle.name} -> {obj.read().m_Name}")
        except Exception:
            pass
    if fui_hits:
        print("FairyGUI packages found:")
        for line in fui_hits:
            print(f"  {line}")


if __name__ == "__main__":
    main()
