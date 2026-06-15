#!/usr/bin/env python3
"""Generate Phase 3 final backlog docs. Run once: python3 docs/_gen_final_backlog.py"""
from pathlib import Path
from collections import Counter

ITEMS = []

def fb(category, severity, screen, files, deps, complexity, priority_type, desc, lineage, type_="Feature"):
    ITEMS.append(dict(
        category=category, severity=severity, screen=screen, files=files,
        deps=deps or "None", complexity=complexity, priority_type=priority_type,
        desc=desc, lineage=lineage, type=type_,
    ))

# CRITICAL
fb("Settings / Privacy", "Critical", "Privacy settings screen",
   "New PrivacySettingsSheet.jsx, ProfilePanel.jsx", None, "XL", 1,
   "Full Privacy screen: hide location, do not recommend, Incognito V6, hide gifts V7, hide guardian V8, blacklists.",
   "PARITY-001")
fb("Voice Room / Tools", "Critical", "Drawing widget overlay",
   "New DrawingWidget.jsx, RoomView.jsx, FunctionsGrid.jsx, roomLog.js", "GAP-012", "XL", 1,
   "In-room collaborative drawing canvas overlay (distinct from Draw & Guess).", "GAP-011")
fb("Chat / DM", "Critical", "Create Group DM",
   "New GroupChat flow, ChatSettingsSheet.jsx, privateChat.js", None, "XL", 1,
   "Multi-user group chat creation (currently stub toast).", "GAP-039a")
fb("Home / Lobby", "Critical", "Lobby games catalog",
   "lobbyGames.js, LobbyGamesSection.jsx, games/catalog.js", "GAP-091", "XL", 1,
   "Home grid missing ~10+ WePlay lobby titles.", "GAP-041")
fb("Shop", "Critical", "Chat Bubble shop",
   "New ChatBubbleShop.jsx, ShopSheet.jsx, InventorySheet.jsx", None, "L", 1,
   "Dedicated Chat Bubble catalog with coin/VIP/Family tags.", "GAP-068")
fb("Clan", "Critical", "Clan chest / store / gacha",
   "ClanProfileTab.jsx, clans.js", None, "XL", 1,
   "Clan Chest, Store, Gacha functional (currently stubs).", "GAP-084")
fb("BFF", "Critical", "BFF To Unlock screen",
   "New BffUnlockSheet.jsx, BffSheet.jsx, relationships.js", None, "L", 1,
   "New BFF → To Unlock tab with slot unlock flow.", "GAP-071")
fb("Games", "Critical", "UNO / Ludo / lobby games",
   "games/catalog.js, per-game modules", "GAP-041", "XL", 1,
   "UNO, Ludo, Jackaroo playable or removed from marketing.", "GAP-091")
fb("Clan / Chat", "Critical", "Clan group chat message types",
   "ClanChat.jsx, clans.js", None, "XL", 1,
   "Structured gift cards, admin badges in clan group chat.", "GAP-039b / PARITY-004")
fb("Clan", "Critical", "Family Fund donation flow",
   "ClanChat.jsx, clans.js", "GAP-039b", "L", 1,
   "In-chat family donation messages and treasury increment.", "PARITY-011")

# HIGH (abbreviated - full list in generator)
high_items = [
("Voice Room / Tools", "Lottery result modal", "New LotteryModal.jsx, RoomView.jsx", None, "L", 1,
 "Full lottery modal with participant/winner UI.", "GAP-016a / PARITY-003"),
("Voice Room", "Group chat header button", "RoomView.jsx, RoomGroupChatSheet.jsx", "GAP-015b", "M", 4,
 "Header Group pill opens room group chat.", "GAP-020a"),
("Voice Room / Settings", "Associated groups", "RoomSettingsSheet.jsx", "GAP-020a", "L", 1,
 "Associated Groups row and data model.", "GAP-015b / GAP-020b"),
("Voice Room / Settings", "Manage event toggle", "RoomSettingsSheet.jsx, EventCenterSheet.jsx", None, "M", 1,
 "Manage event toggle linking to Event Center.", "PARITY-007"),
("Voice Room", "Beats & Dance + treasure widgets", "RoomView.jsx", None, "M", 5,
 "Floating Beats & Dance and treasure widgets.", "GAP-006"),
("Voice Room / Chat", "System message styling", "RoomView.jsx, roomLog.js", None, "M", 5,
 "Yellow System: prefix, bell, regulations link.", "GAP-012"),
("Voice Room / Chat", "New message jump pill", "RoomView.jsx", None, "S", 4,
 "Jump-to-bottom pill when scrolled up.", "GAP-013"),
("Voice Room / Chat", "Drawing system lines", "roomLog.js", "GAP-011", "S", 3,
 "System lines on drawing widget events.", "GAP-106"),
("Voice Room / Tools", "Scoreboard modal layout", "ScoreboardSheet.jsx", None, "M", 5,
 "Add/Subtract button layout parity.", "GAP-018"),
("Voice Room / Video", "YouTube in-room panel", "VideoRoomPanel.jsx", None, "M", 5,
 "Video mode chrome and seat strip.", "GAP-019"),
("Voice Room", "Stage header metadata", "RoomView.jsx, StageBackdrop.jsx", None, "M", 5,
 "Diamond badge, room ID, music chip, audience.", "GAP-002"),
("Gifts", "Gift sheet footer", "GiftSheet.jsx", None, "M", 5,
 "Coin, anonymous, qty, pink Send footer.", "GAP-021"),
("Gifts", "Premium gift fullscreen FX", "PremiumGiftFx.jsx, giftFx.js", None, "L", 6,
 "SVGA/Lottie fullscreen gift FX.", "GAP-026"),
("Gifts", "Gift wall sheet", "GiftWallSheet.jsx", None, "M", 5,
 "Gift wall lit/unlit badges.", "GAP-029"),
("Chat / DM", "DM sticker panel sheet", "PersonalChat.jsx, StickerPanel.jsx", None, "L", 1,
 "Full sticker picker with category tabs.", "GAP-111b / PARITY-008"),
("Chat / DM", "Reply quote nesting UI", "PersonalChat.jsx", None, "M", 5,
 "Nested quote bubble styling.", "GAP-032"),
("Chat / DM", "Invite card visual parity", "PersonalChat.jsx", None, "M", 5,
 "Rich card with room cover thumbnail.", "GAP-031"),
("Chat / DM", "Block gaming invites", "ChatSettingsSheet.jsx", None, "M", 1,
 "Block gaming invites toggle.", "GAP-034b"),
("BFF", "BFF Invitation tab", "BffSheet.jsx", "GAP-071", "L", 1,
 "BFF Invitation inbox.", "GAP-072"),
("BFF / Intimate", "Confidant To dress", "ConfidantDressSheet.jsx, IntimateSpaceSheet.jsx", None, "XL", 1,
 "Dress tabs: Token, Mic connection, Background.", "PARITY-002"),
("Home / Lobby", "GOLD RUSH invite banner", "LobbyScreen.jsx", "GAP-041", "L", 1,
 "Timed game invite overlay.", "GAP-042"),
("Home / Lobby", "Room card badges", "LobbyScreen.jsx", None, "M", 5,
 "Hex badges and ribbon pills.", "GAP-045"),
("Home / Lobby", "Game tile 3D art", "LobbyGamesSection.jsx", "GAP-041", "L", 5,
 "Gold-framed 3D game tile art.", "GAP-048"),
("Profile", "Moments feed cards", "MomentsFeed.jsx", None, "M", 5,
 "Spotlight card interactions.", "GAP-060"),
("Profile", "Moments discover row", "ExploreTab.jsx", None, "M", 5,
 "Discover moments row with dot.", "GAP-051"),
("Rankings", "Dark purple rankings UI", "RankingsSheet.jsx", None, "L", 5,
 "Dark geometric background.", "GAP-061a"),
("Rankings", "PLAY Show tab UI", "PlayShowSheet.jsx", None, "M", 5,
 "Gender toggle + Collection metric.", "GAP-064"),
("Rankings", "Ornate avatar frames", "RankingsSheet.jsx", None, "M", 5,
 "Decorative frames ranks 4+.", "GAP-061c / PARITY-012"),
("Clan", "Family Sign editor", "ClanManageTab.jsx", None, "L", 5,
 "Graphical sign composer.", "GAP-081"),
("Clan", "Clan sign in room chat", "RoomView.jsx", "GAP-081", "M", 3,
 "Family sign badge in room chat.", "GAP-087"),
("Settings", "Safety Center banners", "SecurityCenterSheet.jsx", None, "M", 5,
 "Illustrated safety banners.", "GAP-094"),
("Settings", "Privacy VIP toggles", "PrivacySettingsSheet, GuardSheet.jsx", "PARITY-001", "L", 3,
 "VIP6-8 privacy toggles functional.", "PARITY-019"),
("Shop", "Avatar shop Boy/Girl", "ShopSheet.jsx", None, "M", 5,
 "Gender tabs + rarity tiers.", "GAP-067"),
("Shop", "Purchase duration modal", "ShopSheet.jsx", None, "M", 5,
 "Duration selector + stat effects modal.", "PARITY-005"),
("Auction / PK", "Auction mode UI", "AuctionPanel.jsx", None, "L", 5,
 "Auction stage UI parity.", "PARITY-015"),
("PK", "PK battle bar", "PkBarSheet.jsx", None, "L", 5,
 "PK overlay UI parity.", "PARITY-016"),
("Event Center", "Event creation flow", "EventCenterSheet.jsx", "PARITY-007", "L", 1,
 "Room event create/manage.", "PARITY-018"),
("Intimate Space", "Token wall locks", "IntimateSpaceSheet.jsx", None, "M", 5,
 "Exclusive wall level gates.", "GAP-073"),
("Church", "Select members UI", "MyHomeSheet.jsx", None, "M", 5,
 "Propose member picker + Guard Pts hint.", "PARITY-009"),
("Church", "Propose visual parity", "ChurchSheet.jsx", None, "M", 5,
 "Propose flow UI.", "GAP-076"),
("Love Home", "Rings + Love/Blessing stats", "LoveHomeSheet.jsx", None, "M", 5,
 "Ring modal + stat counters.", "GAP-075 / GAP-110"),
]
for cat, screen, files, deps, cx, pt, desc, lin in high_items:
    fb(cat, "High", screen, files, deps, cx, pt, desc, lin)

# MEDIUM - batch add remaining validated gaps
medium_items = [
("Voice Room / Settings", "Membership fees row", "RoomSettingsSheet.jsx", None, "M", 1, "Membership Fee settings row.", "GAP-015a"),
("Voice Room / Settings", "Room records row", "RoomSettingsSheet.jsx", None, "M", 1, "Room Records row.", "GAP-015c"),
("Voice Room / Settings", "Settings list pattern", "RoomSettingsSheet.jsx", None, "S", 5, "iOS chevron grouped settings.", "PARITY-013"),
("Voice Room / Settings", "High quality system line", "RoomSettingsSheet.jsx", "GAP-012", "XS", 3, "System line on HQ toggle.", "GAP-014"),
("Voice Room / Tools", "Dice emote", "FunctionsGrid.jsx", None, "S", 1, "Animated dice in chat.", "GAP-016b"),
("Voice Room / Tools", "Coin toss emote", "FunctionsGrid.jsx", None, "S", 1, "Coin toss in chat.", "GAP-016c"),
("Voice Room / Chat", "Pinned owner rules", "RoomView.jsx", None, "M", 1, "Pinned rules above chat.", "GAP-017"),
("Gifts", "Gift chat feedback merged", "RoomView.jsx, GiftHitFx.jsx", "GAP-021", "M", 6, "Charm +N + floating gift sprites.", "GAP-030+102"),
("Gifts", "Receiver Gold line", "RoomView.jsx, ClanChat.jsx", "GAP-030+102", "S", 3, "Receiver's Gold +N subline.", "PARITY-014"),
("Gifts", "Gift tile disabled", "GiftSheet.jsx", "GAP-021", "S", 5, "Gray-out unaffordable tiles.", "GAP-022"),
("Gifts", "Anonymous mask", "GiftSheet.jsx", "GAP-021", "S", 3, "Anonymous in chat lines.", "GAP-023"),
("Gifts", "Qty presets", "GiftSheet.jsx", None, "XS", 5, "Presets 1/5/33/50/100.", "GAP-024"),
("Gifts", "Special tab helper", "GiftSheet.jsx", None, "XS", 5, "Helper + Business Life tags.", "GAP-025"),
("Gifts", "Combo button", "ComboGiftButton.jsx", "GAP-021", "M", 6, "Combo send ring.", "GAP-027"),
("Gifts", "DM gift promo banner", "GiftSheet.jsx", None, "S", 5, "Promo strip in DM.", "GAP-028"),
("Chat / DM", "DM avatar frame + badge", "PersonalChat.jsx", None, "M", 5, "Gold frame + floating LV badge.", "GAP-037+109"),
("Chat / DM", "Large sticker no bubble", "PersonalChat.jsx", None, "S", 5, "Sticker-only messages.", "GAP-033"),
("Chat / DM", "Compose icon layout", "PersonalChat.jsx", "PARITY-008", "S", 5, "Compose bar icon order.", "GAP-111a"),
("Chat / DM", "Official badge", "ChatListRow.jsx", None, "XS", 5, "Official badge on rows.", "GAP-035"),
("Chat / DM", "Chats header icons", "LobbyScreen.jsx", None, "XS", 5, "Add-friend + compose.", "GAP-036"),
("Chat / DM", "Muted bell icon", "ChatListRow.jsx", None, "XS", 5, "Muted row indicator.", "GAP-038"),
("Chat / DM", "Clan chat row", "LobbyScreen.jsx", "GAP-081", "S", 5, "Clan row styling.", "GAP-040"),
("Voice Room / Lobby", "Pull-to-refresh", "LobbyScreen.jsx", None, "M", 4, "Pull refresh gesture.", "GAP-043"),
("Voice Room / Lobby", "Gold Tycoon banner", "LobbyScreen.jsx", None, "S", 5, "Banner illustration.", "GAP-044"),
("Voice Room / Lobby", "Tag filter pills", "LobbyScreen.jsx", None, "XS", 5, "Filter pill styling.", "GAP-046"),
("Home / Lobby", "Hub quick links", "GplayHubRow.jsx", None, "S", 5, "Ranking/Tasks/Online row.", "GAP-047"),
("Home / Lobby", "HOT ROOM polish", "LobbyScreen.jsx", None, "S", 5, "Banner visual diff.", "GAP-050"),
("Home / Lobby", "Gift Pack tile badge", "LobbyGamesSection.jsx", None, "M", 1, "Countdown on tiles.", "GAP-049a"),
("Home / Lobby", "Gift Pack floater", "GiftPackFloater.jsx", None, "M", 5, "Lobby floater widget.", "GAP-049b / PARITY-017"),
("Home / Lobby", "Header coin/NEW/Events", "GplayHomeHeader.jsx", None, "M", 5, "Header ornaments.", "PARITY-006"),
("Profile", "Cover carousel", "ProfileCoverCarousel.jsx", None, "M", 5, "Cover + 3D hint.", "GAP-052"),
("Profile", "Me settings grid", "ProfilePanel.jsx", None, "M", 5, "Settings icon grid.", "GAP-053"),
("Profile", "Gift wall preview", "UserFullProfileSheet.jsx", None, "M", 5, "Inline gift wall.", "GAP-054"),
("Profile", "PLAY Show entry", "ProfilePanel.jsx", None, "XS", 4, "PLAY Show tile.", "GAP-055"),
("Profile", "Stats badges", "UserFullProfileSheet.jsx", None, "S", 5, "Stats capsules.", "GAP-056"),
("Profile", "Country picker", "EditProfileSheet.jsx", None, "M", 3, "Country with flags.", "GAP-057a"),
("Profile", "Bio field", "EditProfileSheet.jsx", None, "XS", 3, "Bio parity.", "GAP-057b"),
("Profile", "Visitors incognito", "VisitorsSheet.jsx", None, "M", 3, "VIP hide footprint.", "GAP-058"),
("Profile", "Moment composer media", "CreateMomentSheet.jsx", None, "M", 1, "Photo/location/mentions.", "GAP-059"),
("Rankings", "Time filter pills", "RankingsSheet.jsx", "GAP-061a", "S", 5, "Active pill styling.", "GAP-062"),
("Rankings", "Podium art", "RankingsSheet.jsx", "GAP-061a", "M", 5, "Crown top-3 styling.", "GAP-061b"),
("Rankings", "Help modal", "RankingsSheet.jsx", None, "S", 4, "Rules explainer.", "GAP-065"),
("VIP", "VIP request UI", "VipSheet.jsx", None, "M", 5, "Request flow polish.", "GAP-066"),
("VIP", "VIP name coverage", "VipDisplayName.jsx", None, "S", 5, "VIP names everywhere.", "GAP-069"),
("Wallet", "Coin pack ribbons", "CoinShopSheet.jsx", None, "S", 5, "Pack promo art.", "GAP-070"),
("Shop", "Silver wallet", "ShopSheet.jsx, wallet.js", None, "L", 3, "Real silver balance.", "PARITY-010"),
("Shop", "Bubble backpack equip", "InventorySheet.jsx", "GAP-068", "M", 4, "Equip owned bubbles.", "GAP-107"),
("BFF", "BFF Chest", "BffSheet.jsx", "GAP-071", "M", 1, "Chest rewards modal.", "GAP-074"),
("BFF", "BFF shop link", "BffSheet.jsx", None, "XS", 4, "Header shop deep link.", "GAP-078"),
("BFF", "Title badges", "RoomView.jsx", None, "M", 5, "YAPPERS-style badges.", "GAP-079"),
("BFF", "Couple ranking pairs", "RankingsSheet.jsx", None, "M", 5, "Paired avatars.", "GAP-080"),
("Clan", "Charm gate UI", "ClanManageTab.jsx", None, "S", 5, "Badge picker.", "GAP-082"),
("Clan", "Steal toggle", "ClanManageTab.jsx", None, "M", 1, "Steal prohibition.", "GAP-083"),
("Clan", "Manage tab dot", "ClanHubSheet.jsx", None, "XS", 5, "Pending apps dot.", "GAP-085"),
("Clan", "Header icons", "ClanHubSheet.jsx", None, "XS", 5, "Rank + menu icons.", "GAP-086"),
("Clan", "Voice room button", "ClanProfileTab.jsx", None, "S", 5, "Button restyle.", "GAP-088"),
("Clan", "Tasks rewards UI", "ClanTasksTab.jsx", None, "S", 5, "Task card polish.", "GAP-089"),
("Clan", "News cards", "ClanNewsTab.jsx", None, "M", 5, "Illustrated news.", "GAP-090"),
("Clan / Chat", "FAMILY BUSINESS badge", "ClanChat.jsx", "GAP-039b", "S", 5, "Gift scroll badge.", "PARITY-023"),
("Settings", "Message blacklist UI", "BlockedUsersSheet.jsx", None, "S", 4, "Blacklist screen.", "GAP-095a"),
("Settings", "Keyword blacklist", "New keyword module", "PARITY-001", "M", 1, "Keyword filtering.", "GAP-095b"),
("Settings", "Parental controls", "ParentalControlSheet.jsx", None, "M", 1, "PIN + limits.", "GAP-096a"),
("Settings", "Youth Mode link", "ParentalControlSheet.jsx", "PARITY-001", "S", 4, "Link to privacy.", "GAP-096b"),
("Settings", "Region picker", "LanguageSheet.jsx", None, "M", 3, "Searchable regions.", "GAP-093"),
("Login", "Splash + login branding", "LoginScreen.jsx", None, "M", 5, "Branded splash.", "GAP-092"),
("Voice Room", "Business Life", "FunctionsGrid.jsx", None, "L", 1, "Business Life feature.", "PARITY-020"),
("Discover", "Nearby geo", "NearbySheet.jsx", "PARITY-001", "L", 3, "Real location + privacy.", "PARITY-022"),
("Onboarding", "First-run wizard", "ProfileSetupScreen.jsx", None, "M", 4, "Onboarding UX.", "PARITY-024"),
]
for cat, screen, files, deps, cx, pt, desc, lin in medium_items:
    fb(cat, "Medium", screen, files, deps, cx, pt, desc, lin)

low_items = [
("Voice Room / Seats", "Empty seat styling", "App.css", None, "S", 7, "Gold + on empty seats.", "GAP-003"),
("Voice Room / Seats", "Locked seat padlock", "App.css", None, "XS", 7, "Padlock styling.", "GAP-004"),
("Voice Room", "Champagne backdrop art", "StageBackdrop.jsx", None, "M", 7, "Bottle/pyramid PNG.", "GAP-005"),
("Voice Room", "Minimize chip art", "App.jsx", None, "S", 7, "Float chip thumbnail.", "GAP-008"),
("Voice Room", "Diamond badge", "RoomExpBar.jsx", "GAP-002", "S", 7, "Diamond component.", "GAP-009"),
("Voice Room", "Audience strip", "RoomView.jsx", None, "S", 7, "Avatar overlap.", "GAP-010"),
("Voice Room", "Dock icon order", "RoomDock.jsx", None, "XS", 7, "Dock layout.", "GAP-101"),
("Polish", "Teal accent", "App.css", None, "S", 7, "Theme tokens.", "GAP-098"),
("Polish", "Sheet animations", "App.css", None, "XS", 6, "Spring timing.", "GAP-099"),
("Polish", "Empty illustrations", "Multiple", None, "M", 7, "Empty state art.", "GAP-100"),
("Polish", "G-play tab label", "LobbyScreen.jsx", None, "XS", 7, "Brand copy.", "GAP-097"),
("Polish", "Family vs Clan label", "RankingsSheet.jsx", None, "XS", 7, "Tab copy.", "GAP-104"),
("Clan", "Section accent bars", "ClanManageTab.jsx", None, "XS", 7, "Cyan accent bars.", "GAP-105"),
("Notifications", "Discover red dot", "LobbyScreen.jsx", None, "XS", 5, "Discover badge.", "GAP-108"),
("Gifts", "Combo press model", "ComboGiftButton.jsx", "GAP-027", "S", 6, "Long-press eval.", "PARITY-025"),
("Documentation", "DM call G-Play extra", "DmCallProvider.jsx", None, "XS", 7, "Document extra feature.", "PARITY-021"),
]
for cat, screen, files, deps, cx, pt, desc, lin in low_items:
    fb(cat, "Low", screen, files, deps, cx, pt, desc, lin)

sev_w = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
# Assign FB IDs by wave (Critical→Low), then priority within wave
ordered = []
for sev in ["Critical", "High", "Medium", "Low"]:
    chunk = [i for i in ITEMS if i["severity"] == sev]
    chunk.sort(key=lambda x: (x["priority_type"], x["screen"]))
    ordered.extend(chunk)
ITEMS = ordered
for i, item in enumerate(ITEMS, 1):
    item["id"] = f"FB-{i:03d}"

# Map lineage tokens to FB ids for dependency resolution
lin_map = {}
for item in ITEMS:
    for part in item["lineage"].replace("+", "/").split("/"):
        part = part.strip().split()[0]
        if part.startswith(("GAP-", "PARITY-")):
            lin_map.setdefault(part.split("(")[0].strip(), item["id"])

def resolve_deps(dep_str):
    if not dep_str or dep_str == "None":
        return "None"
    for key, fid in lin_map.items():
        if key in dep_str:
            return fid
    return dep_str

for item in ITEMS:
    item["deps"] = resolve_deps(item["deps"])

counts = Counter(i["severity"] for i in ITEMS)
labels = {1:"Missing functionality",2:"Broken functionality",3:"Data wiring",4:"Navigation",5:"Visual parity",6:"Animation parity",7:"Cosmetic polish"}
ptype = Counter(i["priority_type"] for i in ITEMS)
waves = {s: [i for i in ITEMS if i["severity"]==s] for s in ["Critical","High","Medium","Low"]}

root = Path("/Users/zaheer/G-play/docs")

# backlog
bl = ["# WePlay → G-Play Final Implementation Backlog\n\n**Version:** Phase 3 (Execution)  \n**Date:** 2026-06-14  \n**Total:** {} items (FB-001–FB-{:03d})\n\n".format(len(ITEMS), len(ITEMS))]
bl.append("> **Source of truth for implementation.** Historical audit docs live in [`archive/`](./archive/).\n\n")
bl.append("## Consolidation applied\n\n")
bl.append("- **Removed:** GAP-103 (INVALID)\n")
bl.append("- **Merged:** GAP-037+109, GAP-102+030\n")
bl.append("- **Split:** GAP-015,016,020,034,039,049,057,061,095,096,111\n")
bl.append("- **Imported:** PARITY-001–025\n")
bl.append("- **Excluded:** GAP-001,007,077 (14-seat intentional)\n")
bl.append("- **Closed (validated implemented):** GAP-063 (Global region pill exists)\n\n")
bl.append("## Severity totals\n\n| Severity | Count |\n|----------|------:|\n")
for s in ["Critical","High","Medium","Low"]:
    bl.append(f"| {s} | {counts[s]} |\n")
bl.append(f"| **Total** | **{len(ITEMS)}** |\n\n---\n\n")
for item in ITEMS:
    bl.append(f"### {item['id']}\n\n")
    for k,v in [("Category","category"),("Severity","severity"),("Type","type"),("Screen","screen")]:
        bl.append(f"**{k}:** {item[v]}  \n")
    bl.append(f"**Priority:** {item['priority_type']} — {labels[item['priority_type']]}  \n")
    bl.append(f"**Description:** {item['desc']}  \n")
    bl.append(f"**Likely files:** {item['files']}  \n")
    bl.append(f"**Dependencies:** {item['deps']}  \n")
    bl.append(f"**Complexity:** {item['complexity']}  \n")
    bl.append(f"**Lineage:** {item['lineage']}  \n")
    bl.append(f"**Status:** Not Started  \n")
    bl.append(f"**Implemented In:** —  \n")
    bl.append(f"**Testing Notes:** —  \n\n---\n\n")
(root / "weplay-final-backlog.md").write_text("".join(bl))

# roadmap
def find_ids(*keywords):
    ids = []
    for item in ITEMS:
        blob = f"{item['screen']} {item['desc']} {item['lineage']} {item['category']}"
        if any(k.lower() in blob.lower() for k in keywords):
            ids.append(item["id"])
    return " → ".join(sorted(set(ids), key=lambda x: int(x.split("-")[1])))

clusters = [
    ("Privacy foundation", find_ids("PARITY-001", "Privacy settings", "Keyword blacklist", "Message blacklist", "Youth Mode", "Nearby geo", "VIP toggles"),
     "PARITY-001 unlocks VIP toggles, keyword blacklist, youth link, Nearby geo"),
    ("Clan chat core", find_ids("Clan group chat", "Family Fund"),
     "Gift cards before Family Fund donations"),
    ("Room groups", find_ids("Group chat header", "Associated groups"),
     "Group header button before associated groups data model"),
    ("Events", find_ids("Manage event", "Event creation"),
     "Manage-event toggle before Event Center create flow"),
    ("Games catalog", find_ids("Lobby games catalog", "UNO / Ludo"),
     "Lobby grid and playable games are coupled"),
    ("BFF unlock", find_ids("BFF To Unlock", "BFF Invitation", "BFF Chest"),
     "To Unlock before Invitation tab and chest"),
    ("Gifts stack", find_ids("Gift sheet footer", "Gift chat feedback", "Receiver Gold", "Gift tile disabled", "Combo button"),
     "Footer before chat feedback, combo, disabled tiles"),
    ("Drawing widget", find_ids("Drawing widget", "Drawing system lines"),
     "Canvas overlay before drawing system lines"),
]

rl = ["# WePlay → G-Play Final Implementation Roadmap\n\n",
      "**Backlog:** [`weplay-final-backlog.md`](./weplay-final-backlog.md)  \n",
      "**Summary:** [`weplay-final-summary.md`](./weplay-final-summary.md)  \n",
      "**Date:** 2026-06-14  \n\n",
      "Engineering agents execute **Waves 1→4** in order. Do not use v1 sprint docs.\n\n",
      "## Dependency clusters\n\n",
      "| Cluster | Items | Notes |\n",
      "|---------|-------|-------|\n"]
for name, chain, note in clusters:
    rl.append(f"| {name} | {chain or '—'} | {note} |\n")
rl.append("\n")
for wname, sev, goal in [
    ("Wave 1 — Critical", "Critical",
     "Ship missing core features: privacy, drawing, group DM, games, clan economy, BFF unlock."),
    ("Wave 2 — High", "High",
     "Complete high-impact flows: lottery modal, stickers, events, rankings, clan sign, PK/auction."),
    ("Wave 3 — Medium", "Medium",
     "Data wiring, navigation polish, shop/wallet, clan tasks, settings sub-screens."),
    ("Wave 4 — Low polish", "Low",
     "Visual tokens, animations, cosmetic labels, interaction model tweaks."),
]:
    items = waves[sev]
    rl.append(f"## {wname}\n\n**Items:** {len(items)}  \n**Goal:** {goal}\n\n")
    rl.append("| ID | Screen | Complexity | Deps | Files |\n")
    rl.append("|----|--------|------------|------|-------|\n")
    for it in items:
        f0 = it['files'].split(',')[0].strip()
        deps = it['deps'] if it['deps'] != 'None' else '—'
        rl.append(f"| {it['id']} | {it['screen']} | {it['complexity']} | {deps} | `{f0}` |\n")
    rl.append("\n### Wave test checklist\n\n")
    checks = {
        "Critical": [
            "Privacy screen reachable from Profile settings with all toggles persisted",
            "Drawing widget opens from functions grid and posts system lines",
            "Group DM creation adds multi-user thread (not toast stub)",
            "Clan Chest/Store/Gacha open functional flows",
            "UNO/Ludo either playable or removed from lobby marketing",
            "Family Fund donation increments treasury in clan chat",
        ],
        "High": [
            "Lottery opens modal with winner card (not emoji-only chat line)",
            "DM sticker sheet opens with category tabs",
            "Room Manage event toggle links to Event Center",
            "Rankings dark theme + ornate frames render on list rows",
            "Auction/PK overlays match reference stage chrome",
        ],
        "Medium": [
            "Gift send shows Charm + Gold sublines where applicable",
            "Silver wallet is separate balance (not gold×1.6)",
            "Parental controls PIN + limits functional",
            "Gift Pack tile badge + floater countdown visible on lobby",
        ],
        "Low": [
            "Empty seat gold + styling matches reference",
            "Combo gift long-press model evaluated vs click-only",
            "Theme teal accent tokens applied consistently",
        ],
    }
    for c in checks[sev]:
        rl.append(f"- [ ] {c}\n")
    rl.append("\n")
(root / "weplay-final-roadmap.md").write_text("".join(rl))

# summary
crit = waves["Critical"]
top10 = sorted(crit, key=lambda x: ({"XL":0,"L":1,"M":2,"S":3,"XS":4}[x["complexity"]], x["id"]))[:10]
sl = ["# WePlay → G-Play Final Backlog Summary\n\n",
      "**Phase 3 output — single source of truth for engineering agents.**\n\n",
      "## Do not use v1 sprints\n\n",
      "Execute from [`weplay-final-backlog.md`](./weplay-final-backlog.md) using **FB-XXX** IDs and **Waves 1–4** in [`weplay-final-roadmap.md`](./weplay-final-roadmap.md). ",
      "Prior docs remain reference only:\n\n",
      "| Doc | Role |\n|-----|------|\n",
      "| `weplay-gap-analysis.md` | v1 discovery (superseded) |\n",
      "| `weplay-gap-validation.md` | Merge/split rules applied here |\n",
      "| `weplay-parity-audit-v2.md` | PARITY-001–025 source |\n",
      "| `weplay-gap-sprints.md` | **Do not execute** |\n\n",
      "## Phase 2 parity baseline\n\n",
      "| Metric | Value |\n|--------|------:|\n",
      "| Original v1 gaps | 108 |\n",
      "| Validation: validated | 93 |\n",
      "| Validation: invalid | 1 (GAP-103) |\n",
      "| Validation: duplicate | 2 (merged) |\n",
      "| Validation: needs split | 12 |\n",
      "| New PARITY gaps | 25 |\n",
      "| Overall parity | ~69% |\n",
      "| Voice Room | 72% |\n",
      "| Chat | 88% |\n",
      "| Clan | 52% |\n",
      "| Settings | 41% |\n",
      "| Games | 48% |\n\n",
      "## Final backlog\n\n",
      "| Metric | Value |\n|--------|------:|\n",
      f"| **Final items (FB-001–FB-{len(ITEMS):03d})** | **{len(ITEMS)}** |\n",
      "| Removed | GAP-103 |\n| Merged | GAP-037+109, GAP-102+030 |\n",
      "| Split | GAP-015,016,020,030,034,039,049,057,061,095,096,111 |\n",
      "| PARITY imported | 25 |\n",
      "| Closed (implemented) | GAP-063 |\n\n",
      "## Severity\n\n| Severity | Count | Wave |\n|----------|------:|------|\n"]
for s in ["Critical","High","Medium","Low"]:
    w = {"Critical":1,"High":2,"Medium":3,"Low":4}[s]
    sl.append(f"| {s} | {counts[s]} | Wave {w} |\n")
sl.append(f"| **Total** | **{len(ITEMS)}** | |\n\n")
sl.append("## Priority type distribution\n\n| Priority | Label | Count |\n|----------|-------|------:|\n")
for pt in sorted(ptype):
    sl.append(f"| {pt} | {labels[pt]} | {ptype[pt]} |\n")
sl.append("\n## Wave 1 — start here (top 10 by impact)\n\n")
sl.append("| ID | Screen | Complexity | Lineage |\n|----|--------|------------|--------|\n")
for it in top10:
    sl.append(f"| {it['id']} | {it['screen']} | {it['complexity']} | {it['lineage']} |\n")
sl.append("\n**Recommended Wave 1 order:** FB-009 (Privacy) → FB-005 (Group DM) → FB-006 (Drawing) → FB-003 (Clan economy) → FB-004 (Clan chat types) → FB-001 (BFF unlock) → FB-008/FB-010 (Games) → FB-002 (Bubble shop) → FB-007 (Family Fund).\n\n")
sl.append("## Intentional G-Play design (never backlog)\n\n")
sl.append("- 14-seat room layout (2+4+4+4)\n")
sl.append("- DM coin transfer via red packet only (no send-coins button)\n")
sl.append("- No voice-room chat timestamps\n")
sl.append("- Walkie talkie overlay\n")
sl.append("- DM voice call is a G-Play extra (PARITY-021 documents only)\n\n")
sl.append("## Agent instructions\n\n")
sl.append("1. Pick the next **FB-XXX** item from the current wave only.\n")
sl.append("2. Read lineage (GAP/PARITY) for reference frames in audit docs.\n")
sl.append("3. Implement in listed files; respect Dependencies column.\n")
sl.append("4. Mark item done in your PR description with `FB-XXX` ID.\n")
sl.append("5. Do **not** start Wave 2 until Wave 1 test checklist passes.\n")
sl.append("6. Do **not** re-open GAP-103, GAP-001/007/077, or GAP-063.\n\n")
sl.append("**Start with Wave 1 only.**\n")
(root / "weplay-final-summary.md").write_text("".join(sl))

print("OK", len(ITEMS), dict(counts))
