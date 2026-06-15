import AvatarImg from "./AvatarImg.jsx";
import VipDisplayName from "./VipDisplayName.jsx";

export default function HomeExploreSection({ users = [], onOpenProfile, onOpenChat, onJoinRoom }) {
  if (!users.length) return null;

  return (
    <section className="G-play-section G-play-section--home-explore">
      <div className="G-play-section-head">
        <h2>Explore</h2>
      </div>
      <div className="G-play-home-explore-scroll" role="list">
        {users.map((user) => {
          const initial = (user.display_name || "?").charAt(0).toUpperCase();
          const inRoom = Boolean(user.in_voice_room);
          const roomLabel = inRoom && user.room_name ? user.room_name : inRoom ? "In Voice Room" : "Online";
          return (
            <div key={user.id} className="G-play-home-explore-card-wrap" role="listitem">
              <button
                type="button"
                className="G-play-home-explore-card"
                onClick={() => (onOpenChat ? onOpenChat(user) : onOpenProfile?.(user))}
              >
                <span className="G-play-home-explore-avatar-wrap">
                  <AvatarImg
                    src={user.avatar_url}
                    fallback={initial}
                    className="G-play-home-explore-avatar G-play-home-explore-avatar--fallback"
                    imgClassName="G-play-home-explore-avatar"
                  />
                </span>
                <VipDisplayName
                  as="strong"
                  className="G-play-home-explore-name"
                  name={user.display_name || "Player"}
                  profile={user}
                  variant="light"
                />
                <span
                  className={`G-play-home-explore-pill ${inRoom ? "G-play-home-explore-pill--room" : ""}`}
                  title={inRoom && user.room_name ? user.room_name : undefined}
                >
                  {roomLabel}
                </span>
              </button>
              {inRoom && user.room_code && onJoinRoom && (
                <button
                  type="button"
                  className="G-play-home-explore-join"
                  onClick={() => onJoinRoom(user.room_code)}
                  aria-label={`Join ${user.display_name} in room`}
                >
                  Join
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
