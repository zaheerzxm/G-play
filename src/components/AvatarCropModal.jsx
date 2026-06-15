import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function measureCropSize() {
  const viewportW = Math.min(window.innerWidth || 360, 430);
  const viewportH = window.innerHeight || 700;
  const footerReserve = 140 + (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)")) || 0);
  const availableH = Math.max(220, viewportH - footerReserve - 72);
  return Math.round(Math.min(300, Math.max(230, viewportW - 48), availableH));
}

function getCroppedBlob(image, cropSize, offset, zoom) {
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const { naturalWidth: iw, naturalHeight: ih } = image;
  const baseScale = Math.max(cropSize / iw, cropSize / ih);
  const scale = baseScale * zoom;
  const drawW = iw * scale;
  const drawH = ih * scale;
  const dx = cropSize / 2 - drawW / 2 + offset.x;
  const dy = cropSize / 2 - drawH / 2 + offset.y;

  const ratio = size / cropSize;
  ctx.drawImage(image, dx * ratio, dy * ratio, drawW * ratio, drawH * ratio);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not crop image"))),
      "image/jpeg",
      0.92,
    );
  });
}

export default function AvatarCropModal({ imageSrc, onCancel, onConfirm }) {
  const [cropSize, setCropSize] = useState(measureCropSize);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    function syncSize() {
      setCropSize(measureCropSize());
    }
    syncSize();
    window.addEventListener("resize", syncSize);
    return () => window.removeEventListener("resize", syncSize);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const clampOffset = useCallback(
    (x, y, z = zoom) => {
      if (!image) return { x, y };
      const baseScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight);
      const scale = baseScale * z;
      const drawW = image.naturalWidth * scale;
      const drawH = image.naturalHeight * scale;
      const maxX = Math.max(0, (drawW - cropSize) / 2);
      const maxY = Math.max(0, (drawH - cropSize) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [image, cropSize, zoom],
  );

  function onPointerDown(e) {
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  useEffect(() => {
    if (!dragging) return undefined;
    function onPointerMove(e) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy));
    }
    function onPointerUp() {
      setDragging(false);
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, clampOffset]);

  function handleZoomChange(next) {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoom(z);
    setOffset((prev) => clampOffset(prev.x, prev.y, z));
  }

  async function handleConfirm() {
    if (!image || busy) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(image, cropSize, offset, zoom);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      onConfirm(file);
    } catch (e) {
      onCancel?.(e.message ?? "Could not crop image");
    } finally {
      setBusy(false);
    }
  }

  const baseScale = image
    ? Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight)
    : 1;
  const scale = baseScale * zoom;
  const drawW = image ? image.naturalWidth * scale : cropSize;
  const drawH = image ? image.naturalHeight * scale : cropSize;

  const modal = (
    <div className="gplay-mobile-shell-backdrop gplay-mobile-shell-backdrop--crop" onClick={onCancel}>
      <div className="gplay-mobile-shell avatar-crop-modal" onClick={(e) => e.stopPropagation()}>
        <header className="avatar-crop-header">
          <button type="button" className="avatar-crop-cancel" onClick={onCancel}>
            Cancel
          </button>
          <h2>Adjust Photo</h2>
          <button
            type="button"
            className="avatar-crop-done"
            disabled={!image || busy}
            onClick={handleConfirm}
          >
            {busy ? "…" : "Done"}
          </button>
        </header>

        <div className="avatar-crop-body">
          <div
            className="avatar-crop-stage"
            style={{ width: cropSize, height: cropSize }}
            onPointerDown={onPointerDown}
          >
            {image && (
              <img
                src={imageSrc}
                alt=""
                className="avatar-crop-image"
                style={{
                  width: drawW,
                  height: drawH,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
                draggable={false}
              />
            )}
            <div className="avatar-crop-mask" aria-hidden />
            <div className="avatar-crop-frame" aria-hidden />
          </div>
        </div>

        <footer className="avatar-crop-footer">
          <label className="avatar-crop-zoom">
            <span>Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
            />
          </label>
          <p className="avatar-crop-hint">Drag to position · use the slider to zoom</p>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
