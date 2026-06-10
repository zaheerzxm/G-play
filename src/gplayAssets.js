/** G-play UI assets (files live under /public/weplay/) */

const BASE = `${import.meta.env.BASE_URL}weplay/`;

export const GPLAY_ASSETS = {
  atlasCommon: `${BASE}fairygui_Common_atlas0.png`,
  emojiSheet: `${BASE}sprite_Emoji.png`,
  iconMore: `${BASE}icon_icon_more.png`,
  headFrame: `${BASE}icon_head_frame.png`,
  toast: `${BASE}sprite_Toast.png`,
  iconGift: `${BASE}fairygui_flower.png`,
  iconChest: `${BASE}fairygui_egg.png`,
  iconEmoji: `${BASE}fairygui_new.png`,
};

export function gplayUrl(filename) {
  return `${BASE}${filename}`;
}

/** Illustrated icons for catalog gifts where we have extracted art */
const GIFT_ICON_MAP = {
  rose: "fairygui_flower.png",
  pkg_rose: "fairygui_flower.png",
  heart: "fairygui_flower.png",
  pkg_heart: "fairygui_flower.png",
  pkg_kiss: "fairygui_new.png",
  member_mic: "fairygui_new.png",
  member_frame: "icon_head_frame.png",
  member_badge: "textures_vip.png",
  vip_dragon: "textures_vip.png",
  vip_palace: "textures_vip.png",
  vip_universe: "textures_vip.png",
  ring: "fairygui_discount_box.png",
  sp_ring: "fairygui_discount_box.png",
  castle: "fairygui_discount_box_wolf.png",
  sp_castle: "fairygui_discount_box_wolf.png",
};

export function giftIconFor(giftId) {
  const file = GIFT_ICON_MAP[giftId];
  return file ? gplayUrl(file) : null;
}
