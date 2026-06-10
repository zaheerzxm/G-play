/** WePlay-style bond icons (SVG, not emoji). */

export function BondIcon({ type, className = "" }) {
  const cls = `bond-icon bond-icon--${type} ${className}`.trim();
  switch (type) {
    case "cp":
    case "wedding":
    case "choti_ghar_wali":
    case "badi_ghar_wali":
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <path
            d="M16 28c-.5-4.5-8-8.2-8-14a4.5 4.5 0 0 1 8-2.7 4.5 4.5 0 0 1 8 2.7c0 5.8-7.5 9.5-8 14z"
            fill="#ec4899"
          />
        </svg>
      );
    case "bro":
    case "son":
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <circle cx="10" cy="12" r="5" fill="#3b82f6" />
          <circle cx="22" cy="12" r="5" fill="#60a5fa" />
          <path d="M8 22c1-4 5-6 8-6s7 2 8 6" stroke="#2563eb" strokeWidth="2" fill="none" />
        </svg>
      );
    case "sis":
    case "bff":
    case "daughter":
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <path d="M8 14h16l-2 10H10L8 14z" fill="#f472b6" />
          <path d="M10 8h12l-1 6H11L10 8z" fill="#ec4899" />
          <circle cx="16" cy="6" r="2" fill="#db2777" />
        </svg>
      );
    case "confidant":
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="10" fill="#fbcfe8" />
          <circle cx="16" cy="16" r="4" fill="#ec4899" />
          <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#f472b6" strokeWidth="1.5" />
        </svg>
      );
    case "guard":
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <path d="M16 4L6 8v8c0 7 4.5 12 10 14 5.5-2 10-7 10-14V8L16 4z" fill="#eab308" />
          <path d="M12 16l3 3 6-7" stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
      );
    case "mentor":
    case "apprentice":
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="11" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.5" />
          <text x="16" y="20" textAnchor="middle" fontSize="12" fill="#5b21b6">📿</text>
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 32 32" aria-hidden>
          <circle cx="16" cy="16" r="10" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
        </svg>
      );
  }
}

export function bondIconType(bondType) {
  return bondType ?? "cp";
}
