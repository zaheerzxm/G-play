const STORAGE_PREFIX = "gplay.user_inventory.v1";

export function loadUserShopInventory(userId) {
  if (!userId) return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}.${userId}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addShopItemToInventory(userId, item) {
  if (!userId || !item?.id) return loadUserShopInventory(userId);
  const list = loadUserShopInventory(userId);
  const idx = list.findIndex((r) => r.id === item.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], quantity: (list[idx].quantity ?? 1) + 1 };
  } else {
    list.push({
      id: item.id,
      name: item.name,
      emoji: item.emoji ?? "🎁",
      category: item.category ?? "Items",
      tag: item.tag ?? null,
      bg: item.bg ?? "#f0fdf4",
      quantity: 1,
      purchasedAt: Date.now(),
    });
  }
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}.${userId}`, JSON.stringify(list));
  } catch {
    /* optional */
  }
  return list;
}
