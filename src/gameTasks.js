import { liveMiniGames } from "./games/catalog.js";
import { supabase } from "./supabase.js";
import { addUserExp } from "./userLevels.js";

const STORAGE_PREFIX = "gplay.game_tasks.v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}.${userId}.${todayKey()}`;
}

function defaultProgress() {
  return { progress: {}, claimed: {}, chestsClaimed: {}, loginMarked: false };
}

export function loadGameTaskState(userId) {
  if (!userId) return defaultProgress();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? { ...defaultProgress(), ...JSON.parse(raw) } : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function saveGameTaskState(userId, state) {
  if (!userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    /* optional */
  }
}

export function markGameTaskProgress(userId, taskId, amount = 1) {
  if (!userId || !taskId) return loadGameTaskState(userId);
  const state = loadGameTaskState(userId);
  const cur = Number(state.progress[taskId] ?? 0);
  state.progress[taskId] = cur + amount;
  saveGameTaskState(userId, state);
  return state;
}

export function markDailyLogin(userId) {
  if (!userId) return;
  const state = loadGameTaskState(userId);
  if (state.loginMarked) return state;
  state.loginMarked = true;
  state.progress.daily_login = 1;
  saveGameTaskState(userId, state);
  return state;
}

const GAME_PLAY_TASKS = liveMiniGames().map((g) => ({
  id: `play_${g.id}`,
  tab: "daily",
  title: `Play ${g.name}`,
  description: g.description,
  rewards: { coins: 15, exp: 10 },
  goal: 1,
  goAction: "games",
  context: "room",
}));

export const LOBBY_DAILY_TASK_DEFS = [
  {
    id: "daily_login",
    tab: "daily",
    title: "Daily Login",
    description: "Open G-play today",
    rewards: { coins: 20, exp: 15 },
    goal: 1,
    goAction: null,
    context: "lobby",
  },
  {
    id: "follow_user",
    tab: "daily",
    title: "Follow Someone",
    description: "Follow a player from their profile",
    rewards: { coins: 10, exp: 8 },
    goal: 1,
    goAction: "discover",
    context: "lobby",
  },
  {
    id: "add_friend",
    tab: "daily",
    title: "Make a Friend",
    description: "Become mutual friends with someone",
    rewards: { coins: 15, exp: 12 },
    goal: 1,
    goAction: "invite",
    context: "lobby",
  },
  {
    id: "edit_profile",
    tab: "daily",
    title: "Update Profile",
    description: "Save your profile in Me → Edit Profile",
    rewards: { coins: 10, exp: 10 },
    goal: 1,
    goAction: "profile",
    context: "lobby",
  },
  {
    id: "spotlight_post",
    tab: "daily",
    title: "Post on Spotlight",
    description: "Share a photo or caption on Spotlight",
    rewards: { coins: 15, exp: 12 },
    goal: 1,
    goAction: "discover",
    context: "lobby",
  },
  {
    id: "chat_friend",
    tab: "daily",
    title: "Message a Friend",
    description: "Send a message in private chat",
    rewards: { coins: 10, exp: 8 },
    goal: 1,
    goAction: "chats",
    context: "lobby",
  },
];

export const ROOM_DAILY_TASK_DEFS = [
  {
    id: "join_room",
    tab: "daily",
    title: "Join a Voice Room",
    description: "Enter any voice room and hang out",
    rewards: { coins: 25, exp: 20 },
    goal: 1,
    goAction: "rooms",
    context: "room",
  },
  {
    id: "send_gift",
    tab: "daily",
    title: "Send a Gift",
    description: "Send any gift in a voice room",
    rewards: { coins: 10, hearts: 1, exp: 10 },
    goal: 1,
    goAction: "rooms",
    context: "room",
  },
  {
    id: "stay_in_room",
    tab: "daily",
    title: "Stay in a Room",
    description: "Hang out in a voice room for 10 minutes",
    rewards: { coins: 20, exp: 15 },
    goal: 10,
    goAction: "rooms",
    context: "room",
  },
  ...GAME_PLAY_TASKS,
  {
    id: "use_mic",
    tab: "daily",
    title: "Use the Mic",
    description: "Unmute and speak in a voice room",
    rewards: { coins: 10, exp: 8 },
    goal: 1,
    goAction: null,
    context: "room",
  },
];

/** @deprecated Use LOBBY_DAILY_TASK_DEFS or ROOM_DAILY_TASK_DEFS */
export const DAILY_TASK_DEFS = [...LOBBY_DAILY_TASK_DEFS, ...ROOM_DAILY_TASK_DEFS];

export function dailyTasksForContext(context = "lobby") {
  return context === "room" ? ROOM_DAILY_TASK_DEFS : LOBBY_DAILY_TASK_DEFS;
}

export const GROWTH_TASK_DEFS = [
  {
    id: "charming",
    tab: "growth",
    title: "Charming",
    description: "Reach 50,000 total charm",
    rewards: { coins: 150, exp: 40 },
    goal: 50000,
    goAction: "rooms",
    metric: "charm",
  },
  {
    id: "social_butterfly",
    tab: "growth",
    title: "Social Butterfly",
    description: "Make 130 mutual friends",
    rewards: { coins: 120, exp: 35 },
    goal: 130,
    goAction: "invite",
    metric: "friends",
  },
  {
    id: "gold_purchaser",
    tab: "growth",
    title: "Gold Collector",
    description: "Purchase gold 5 times (tap Go once per purchase)",
    rewards: { coins: 80, exp: 25 },
    goal: 5,
    goAction: "profile",
    metric: "gold_purchase",
  },
  {
    id: "play_5_games",
    tab: "growth",
    title: "Play 5 Games",
    description: "Complete any 5 mini-games this week",
    rewards: { coins: 100, exp: 50 },
    goal: 5,
    goAction: "games",
  },
  {
    id: "reach_level_5",
    tab: "growth",
    title: "Reach Level 5",
    description: "Level up your account to Lv.5",
    rewards: { coins: 200, exp: 0 },
    goal: 1,
    goAction: "profile",
  },
  {
    id: "invite_friend",
    tab: "growth",
    title: "Invite a Friend",
    description: "Invite someone to join G-play",
    rewards: { coins: 50, exp: 30 },
    goal: 1,
    goAction: "invite",
  },
];

export const CLAN_TASK_DEFS = [
  {
    id: "clan_checkin",
    tab: "clan",
    title: "Clan Check-in",
    description: "Open your clan hub today",
    rewards: { coins: 15, exp: 10 },
    goal: 1,
    goAction: "clan",
  },
  {
    id: "clan_chat",
    tab: "clan",
    title: "Clan Group Chat",
    description: "Send a message in clan chat",
    rewards: { coins: 20, exp: 15 },
    goal: 1,
    goAction: "clan_chat",
  },
  {
    id: "clan_donate",
    tab: "clan",
    title: "Support the Clan",
    description: "Donate to clan treasury (tap Go once)",
    rewards: { coins: 25, exp: 20 },
    goal: 1,
    goAction: "clan",
  },
  {
    id: "clan_gift",
    tab: "clan",
    title: "Gift a Clanmate",
    description: "Send a gift to someone in a voice room",
    rewards: { coins: 15, exp: 12 },
    goal: 1,
    goAction: "rooms",
  },
];

export const CLAN_TASK_STUB = {
  id: "clan_join_stub",
  tab: "clan",
  title: "Join a Clan",
  description: "Create or join a clan to unlock clan missions",
  rewards: { coins: 0 },
  goal: 1,
  goAction: "clan",
  stub: true,
};

export function taskProgressValue(state, task) {
  if (task.id === "daily_login") return state.loginMarked ? 1 : Number(state.progress.daily_login ?? 0);
  return Number(state.progress[task.id] ?? 0);
}

/** Growth achievements use live profile metrics where available. */
export function growthTaskProgress(state, task, ctx = {}) {
  const charm = Number(ctx.charm ?? 0);
  const friendCount = Number(ctx.friendCount ?? 0);
  const userLevel = Number(ctx.userLevel ?? 1);

  if (task.metric === "charm") return Math.min(task.goal, charm);
  if (task.metric === "friends") return Math.min(task.goal, friendCount);
  if (task.id === "reach_level_5") return userLevel >= 5 ? 1 : 0;
  if (task.id === "play_5_games") {
    const played = Object.keys(state.progress)
      .filter((k) => k.startsWith("play_"))
      .reduce((sum, k) => sum + Number(state.progress[k] ?? 0), 0);
    return Math.min(task.goal, played);
  }
  return taskProgressValue(state, task);
}

export function growthTaskStatus(state, task, ctx = {}) {
  const value = growthTaskProgress(state, task, ctx);
  const claimed = Boolean(state.claimed[task.id]);
  if (claimed) return "claimed";
  if (value >= task.goal) return "claimable";
  return "active";
}

export function taskStatus(state, task) {
  const value = taskProgressValue(state, task);
  const done = value >= task.goal;
  const claimed = Boolean(state.claimed[task.id]);
  if (claimed) return "claimed";
  if (done) return "claimable";
  return "active";
}

export function activenessPercent(state, tasks = LOBBY_DAILY_TASK_DEFS) {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => {
    const s = taskStatus(state, t);
    return s === "claimable" || s === "claimed";
  }).length;
  return Math.round((done / tasks.length) * 100);
}

export const ACTIVENESS_CHEST_REWARDS = {
  10: { coins: 5 },
  40: { coins: 15 },
  70: { coins: 30 },
  100: { coins: 50 },
};

export function activenessChestStatus(state, threshold, tasks = LOBBY_DAILY_TASK_DEFS) {
  const act = activenessPercent(state, tasks);
  if (state.chestsClaimed?.[threshold]) return "claimed";
  if (act >= threshold) return "claimable";
  return "locked";
}

export async function claimActivenessChest(userId, threshold, { isSuperAdmin = false, tasks = LOBBY_DAILY_TASK_DEFS } = {}) {
  const reward = ACTIVENESS_CHEST_REWARDS[threshold];
  if (!reward || !userId) throw new Error("Invalid chest");

  const state = loadGameTaskState(userId);
  if (activenessChestStatus(state, threshold, tasks) !== "claimable") {
    throw new Error("Chest not ready");
  }

  state.chestsClaimed = { ...(state.chestsClaimed ?? {}), [threshold]: true };
  saveGameTaskState(userId, state);

  const newBalance = await creditCoins(userId, reward.coins ?? 0, isSuperAdmin);
  return { rewards: reward, newBalance };
}

/** Unclaimed tasks ready to claim — drives Tasks hub notification dot. */
export function countClaimableTasks(userId, context = "lobby", growthCtx = null) {
  if (!userId) return 0;
  const state = loadGameTaskState(userId);
  const daily = dailyTasksForContext(context).filter((t) => taskStatus(state, t) === "claimable").length;
  const growth = GROWTH_TASK_DEFS.filter((t) =>
    growthCtx ? growthTaskStatus(state, t, growthCtx) === "claimable" : taskStatus(state, t) === "claimable",
  ).length;
  return daily + growth;
}

async function creditCoins(userId, amount, isSuperAdmin) {
  if (!amount || isSuperAdmin) return null;
  if (!supabase || !userId) return null;
  const { data: wallet } = await supabase
    .from("wallets")
    .select("coins")
    .eq("user_id", String(userId))
    .maybeSingle();
  const coins = Number(wallet?.coins ?? 0) + amount;
  await supabase.from("wallets").update({ coins }).eq("user_id", String(userId));
  return coins;
}

export async function claimGameTask(userId, taskId, { isSuperAdmin = false, growthCtx = null } = {}) {
  const all = [...LOBBY_DAILY_TASK_DEFS, ...ROOM_DAILY_TASK_DEFS, ...GROWTH_TASK_DEFS];
  const task = all.find((t) => t.id === taskId);
  if (!task) throw new Error("Unknown task");

  const state = loadGameTaskState(userId);
  const isGrowth = GROWTH_TASK_DEFS.some((t) => t.id === taskId);
  const ready = isGrowth
    ? growthTaskStatus(state, task, growthCtx ?? {}) === "claimable"
    : taskStatus(state, task) === "claimable";
  if (!ready) throw new Error("Task not ready");

  state.claimed[taskId] = true;
  saveGameTaskState(userId, state);

  const coins = Number(task.rewards?.coins ?? 0);
  const exp = Number(task.rewards?.exp ?? 0);
  const [newBalance] = await Promise.all([
    creditCoins(userId, coins, isSuperAdmin),
    exp > 0 ? addUserExp(userId, exp) : Promise.resolve(null),
  ]);

  return { task, rewards: task.rewards, newBalance };
}
