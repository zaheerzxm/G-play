import { LOBBY_COMING_GAMES_GRID, LOBBY_FEATURED_GAME, LOBBY_GAMES_GRID } from "../lobbyGames.js";
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

function LobbyGameTile({ game, hero = false, onPickGame, onOpenGameRooms }) {
  const className = hero
    ? "G-play-lobby-game-featured G-play-lobby-game-ticket"
    : `G-play-lobby-game-tile G-play-lobby-game-ticket${game.comingSoon ? " G-play-lobby-game-tile--soon" : ""}`;

  return (
    <button
      type="button"
      className={className}
      style={{ background: game.gradient }}
      onClick={() => onPickGame?.(game) ?? onOpenGameRooms?.()}
    >
      {game.tag && (
        <span
          className={`G-play-lobby-game-tag${hero ? " G-play-lobby-game-tag--featured" : ""}${game.comingSoon ? " G-play-lobby-game-tag--soon" : ""}`}
        >
          {game.tag}
        </span>
      )}
      <GameTileArt game={game} hero={hero} />
      {hero ? (
        <span className="G-play-lobby-game-featured-copy">
          <strong>{game.name}</strong>
        </span>
      ) : (
        <span className="G-play-lobby-game-tile-name">{game.name}</span>
      )}
      {game.id === "ddd" && <span className="G-play-lobby-game-gift-badge">🎁</span>}
    </button>
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
        <LobbyGameTile
          game={LOBBY_FEATURED_GAME}
          hero
          onPickGame={onPickGame}
          onOpenGameRooms={onOpenGameRooms}
        />
      )}

      {LOBBY_GAMES_GRID.length > 0 && (
        <div className="G-play-lobby-games-grid">
          {LOBBY_GAMES_GRID.map((game) => (
            <LobbyGameTile
              key={game.id}
              game={game}
              onPickGame={onPickGame}
              onOpenGameRooms={onOpenGameRooms}
            />
          ))}
        </div>
      )}

      {LOBBY_COMING_GAMES_GRID.length > 0 && (
        <>
          <h3 className="G-play-lobby-games-soon-head">Coming soon</h3>
          <div className="G-play-lobby-games-grid G-play-lobby-games-grid--soon">
            {LOBBY_COMING_GAMES_GRID.map((game) => (
              <LobbyGameTile
                key={game.id}
                game={game}
                onPickGame={onPickGame}
                onOpenGameRooms={onOpenGameRooms}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
