import { useEffect, useMemo, useState } from "react";
import { formatCompactNumber } from "../../formatCompact.js";
import { ROLE_LABELS, canManageClan, isClanLeader, loadClanMembers, promoteMember } from "../../clans.js";
import AvatarImg from "../AvatarImg.jsx";
import VipDisplayName from "../VipDisplayName.jsx";

const ROLE_ORDER = { leader: 0, deputy: 1, admin: 2, member: 3 };

export default function ClanMembersTab({ clanId, userId, myRole, onToast, onRefresh }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!clanId) return;
    let cancelled = false;
    setLoading(true);
    loadClanMembers(clanId)
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch(() => onToast?.("Could not load members"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clanId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = [...members].sort(
      (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9),
    );
    if (!q) return rows;
    return rows.filter((m) => {
      const name = m.profile?.display_name ?? "";
      const code = String(m.profile?.user_code ?? "");
      return name.toLowerCase().includes(q) || code.includes(q);
    });
  }, [members, search]);

  async function handlePromote(member, newRole) {
    if (!isClanLeader(myRole) || member.user_id === userId) return;
    setBusyId(member.user_id);
    try {
      await promoteMember(clanId, userId, member.user_id, newRole);
      const rows = await loadClanMembers(clanId);
      setMembers(rows);
      onRefresh?.();
      onToast?.(`Updated ${member.profile?.display_name ?? "member"} to ${ROLE_LABELS[newRole]}`);
    } catch (e) {
      onToast?.(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="clan-members-tab">
      <div className="clan-members-search">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
        />
        <span className="clan-members-count">{members.length} members</span>
      </div>

      {loading && <p className="hub-sheet-hint">Loading…</p>}

      <ul className="clan-members-list">
        {filtered.map((m) => {
          const name = m.profile?.display_name ?? "Member";
          const isMe = m.user_id === userId;
          return (
            <li key={m.user_id} className="clan-member-row">
              <AvatarImg
                src={m.profile?.avatar_url}
                fallback={name}
                className="clan-member-avatar"
                imgClassName="clan-member-avatar"
              />
              <div className="clan-member-body">
                <strong>
                  <VipDisplayName name={name} profile={m.profile} variant="light" />
                  {isMe && <em> (you)</em>}
                </strong>
                <span className={`clan-role-badge clan-role-badge--${m.role}`}>
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
              </div>
              <div className="clan-member-donations">
                <span title="Weekly donation">
                  W {formatCompactNumber(m.weekly_donation ?? 0)}
                </span>
                <span title="Total donation">
                  T {formatCompactNumber(m.total_donation ?? 0)}
                </span>
              </div>
              {isClanLeader(myRole) && !isMe && m.role !== "leader" && (
                <div className="clan-member-actions">
                  {m.role !== "deputy" && (
                    <button
                      type="button"
                      className="clan-member-action-btn"
                      disabled={busyId === m.user_id}
                      onClick={() => handlePromote(m, m.role === "admin" ? "deputy" : "admin")}
                    >
                      Promote
                    </button>
                  )}
                  {m.role !== "member" && (
                    <button
                      type="button"
                      className="clan-member-action-btn clan-member-action-btn--muted"
                      disabled={busyId === m.user_id}
                      onClick={() => handlePromote(m, "member")}
                    >
                      Demote
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {!loading && filtered.length === 0 && (
          <li className="clan-members-empty">No members found</li>
        )}
      </ul>

      {canManageClan(myRole) && (
        <p className="hub-sheet-hint">Leaders can promote members to Admin or Deputy.</p>
      )}
    </div>
  );
}
