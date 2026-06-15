import { LOBBY_FEATURED_GAME, LOBBY_GAMES_GRID } from "../lobbyGames.js";
import { IconGames } from "./NavIcons.jsx";

function GameTileArt({ game, hero = false }) {
  const emoji = game.emoji ?? "🎮";

  return (
    <span
      className={`G-play-lobby-game-art ${hero ? "G-play-lobby-game-art--hero" : ""} G-play-lobby-game-art--${game.id}`}
      aria-hidden
    >
      {game.id === "ddd" ? (
        <span className="G-play-lobby-game-emoji G-play-lobby-game-emoji--ddd">
          <span>❤️</span>
          <span>🧠</span>
          <span>🗑️</span>
        </span>
      ) : (
        <span className="G-play-lobby-game-emoji">{emoji}</span>
      )}
    </span>
  );
}

export default function LobbyGamesSection({ onOpenGameRooms, onPickGame }) {
  return (
    <section className="G-play-section G-play-section--home-games">
      <div className="G-play-section-head G-play-section-head--games">
        <h2>Games</h2>
        <button type="button" className="G-play-game-rooms-link" onClick={onOpenGameRooms}>
          <span className="G-play-game-rooms-icon" aria-hidden>
            <IconGames />
          </span>
          Game Rooms
        </button>
      </div>

      {LOBBY_FEATURED_GAME && (
        <button
          type="button"
          className="G-play-lobby-game-featured G-play-lobby-game-ticket"
          style={{ background: LOBBY_FEATURED_GAME.gradient }}
          onClick={() => onPickGame?.(LOBBY_FEATURED_GAME) ?? onOpenGameRooms?.()}
        >
          {LOBBY_FEATURED_GAME.tag && (
            <span className="G-play-lobby-game-tag G-play-lobby-game-tag--featured">{LOBBY_FEATURED_GAME.tag}</span>
          )}
          <GameTileArt game={LOBBY_FEATURED_GAME} hero />
          <span className="G-play-lobby-game-featured-copy">
            <strong>{LOBBY_FEATURED_GAME.name}</strong>
          </span>
        </button>
      )}

      {LOBBY_GAMES_GRID.length > 0 && (
        <div className="G-play-lobby-games-grid">
          {LOBBY_GAMES_GRID.map((game) => (
            <button
              key={game.id}
              type="button"
              className="G-play-lobby-game-tile G-play-lobby-game-ticket"
              style={{ background: game.gradient }}
              onClick={() => onPickGame?.(game) ?? onOpenGameRooms?.()}
            >
              {game.tag && <span className="G-play-lobby-game-tag">{game.tag}</span>}
              <GameTileArt game={game} />
              <span className="G-play-lobby-game-tile-name">{game.name}</span>
              {game.id === "ddd" && <span className="G-play-lobby-game-gift-badge">🎁</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
