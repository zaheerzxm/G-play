/** Clan chest definitions (FB-003 phase A). Gates must match SQL open_clan_chest. */

export const CLAN_CHEST_PERIOD = {
  DAILY: "daily",
  LIFETIME: "lifetime",
};

export const CLAN_CHESTS = [
  {
    id: "activeness_25",
    name: "25% Activeness",
    description: "Claim after completing 1 clan task today",
    group: "activeness",
    requiredTasks: 1,
    period: CLAN_CHEST_PERIOD.DAILY,
    rewardCoins: 25,
  },
  {
    id: "activeness_50",
    name: "50% Activeness",
    description: "Claim after completing 2 clan tasks today",
    group: "activeness",
    requiredTasks: 2,
    period: CLAN_CHEST_PERIOD.DAILY,
    rewardCoins: 50,
  },
  {
    id: "activeness_75",
    name: "75% Activeness",
    description: "Claim after completing 3 clan tasks today",
    group: "activeness",
    requiredTasks: 3,
    period: CLAN_CHEST_PERIOD.DAILY,
    rewardCoins: 75,
  },
  {
    id: "activeness_100",
    name: "100% Activeness",
    description: "Claim after completing all 4 clan tasks today",
    group: "activeness",
    requiredTasks: 4,
    period: CLAN_CHEST_PERIOD.DAILY,
    rewardCoins: 100,
  },
  {
    id: "treasury_level_2",
    name: "Treasury Chest I",
    description: "Clan level 2+ reward",
    group: "treasury",
    requiredLevel: 2,
    period: CLAN_CHEST_PERIOD.LIFETIME,
    rewardCoins: 120,
  },
  {
    id: "treasury_level_5",
    name: "Treasury Chest II",
    description: "Clan level 5+ reward",
    group: "treasury",
    requiredLevel: 5,
    period: CLAN_CHEST_PERIOD.LIFETIME,
    rewardCoins: 300,
  },
];

export function clanChestPeriodKey(chest, date = new Date()) {
  if (chest.period === CLAN_CHEST_PERIOD.LIFETIME) return "lifetime";
  return date.toISOString().slice(0, 10);
}

export function clanChestClaimKey(chestId, periodKey) {
  return `${chestId}:${periodKey}`;
}
