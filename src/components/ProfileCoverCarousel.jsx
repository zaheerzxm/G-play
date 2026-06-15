import { useRef, useState } from "react";
import { loadAvatar3d } from "../avatar3d.js";
import Avatar3dFigure from "./Avatar3dFigure.jsx";

export default function ProfileCoverCarousel({
  userId,
  profile,
  avatarSrc,
  fallbackInitial,
  onOpenPlayShow,
  isSelf = false,
}) {
  const [page, setPage] = useState(0);
  const startX = useRef(0);
  const avatar3d = loadAvatar3d(userId, profile);

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) setPage(1);
    if (dx > 40) setPage(0);
  }

  return (
    <div
      className="profile-cover-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="profile-cover-carousel-track" style={{ transform: `translateX(-${page * 50}%)` }}>
        <div className="profile-cover-carousel-slide">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="weplay-full-profile-cover-img" />
          ) : (
            <div className="weplay-full-profile-cover-fallback">{fallbackInitial}</div>
          )}
        </div>
        <div className="profile-cover-carousel-slide profile-cover-carousel-slide--3d">
          <div className="profile-cover-3d-stage">
            <Avatar3dFigure config={avatar3d} size="cover" />
          </div>
          {isSelf && onOpenPlayShow && (
            <button type="button" className="profile-cover-3d-edit" onClick={onOpenPlayShow}>
              Edit 3D avatar
            </button>
          )}
        </div>
      </div>
      <div className="profile-cover-dots">
        <button
          type="button"
          className={page === 0 ? "profile-cover-dot--active" : ""}
          onClick={() => setPage(0)}
          aria-label="Profile photo"
        />
        <button
          type="button"
          className={page === 1 ? "profile-cover-dot--active" : ""}
          onClick={() => setPage(1)}
          aria-label="3D avatar"
        />
      </div>
      {page === 0 && (
        <p className="profile-cover-swipe-hint">Swipe left for 3D avatar</p>
      )}
    </div>
  );
}
