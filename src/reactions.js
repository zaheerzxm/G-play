import { parseEmoteMessage } from "./emotes.js";

export function reactionFromMessage(message) {
  const emote = parseEmoteMessage(message);
  if (emote) return emote;
  if (message?.startsWith("Coin flipped") || message?.startsWith("🪙")) {
    return { key: "coin", emoji: "coin", anim: "wow", particles: ["coin"], duration: 2200 };
  }
  const emoji = reactionEmojiFromMessage(message);
  if (!emoji) return null;
  return { key: "legacy", emoji, anim: "default", particles: [emoji], duration: 2200 };
}

export function reactionEmojiFromMessage(message) {
  if (!message) return null;
  if (message.includes("waved hello")) return "👋";
  if (message.includes("sent love")) return "💖";
  if (message.startsWith("🎲")) return "🎲";
  if (message.startsWith("Coin flipped")) return "🟡";
  if (message.startsWith("🪙")) return "🟡";
  if (message.startsWith("🎰")) return "🎰";
  if (message.startsWith("✌️")) return "✌️";
  return null;
}

export function buildReactionMessage(key) {
  switch (key) {
    case "dice":
      return `🎲 rolled ${1 + Math.floor(Math.random() * 6)}`;
    case "coin":
      return `Coin flipped ${Math.random() < 0.5 ? "Heads" : "Tails"}`;
    case "wave":
      return "👋 waved hello!";
    case "heart":
      return "💖 sent love!";
    case "lottery": {
      const prizes = ["Nothing", "10 gold", "50 gold", "Jackpot!"];
      return `🎰 lottery: ${prizes[Math.floor(Math.random() * prizes.length)]}`;
    }
    case "lucky":
      return `🍀 lucky number: ${1 + Math.floor(Math.random() * 100)}`;
    case "bigwinner":
      return "🎉 big winner round started — host picks the winner!";
    case "rps": {
      const moves = ["Rock", "Paper", "Scissors"];
      return `✌️ played ${moves[Math.floor(Math.random() * moves.length)]}`;
    }
    default:
      return "✨ reacted";
  }
}
