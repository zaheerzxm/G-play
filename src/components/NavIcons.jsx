export function IconGplay({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 9.5V7.8c0-.66.54-1.2 1.2-1.2h5.6c.66 0 1.2.54 1.2 1.2v1.7M7 10.5h10l-1.1 7.2a1.2 1.2 0 0 1-1.18 1H9.28a1.2 1.2 0 0 1-1.18-1L7 10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 13.2h1.8M12.7 13.2h1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconVoiceRoom({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5.5 10.5v3a6.5 6.5 0 0 0 13 0v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="9" y="4.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 17.5v2.2M9 19.7h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconExplore({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m14.2 9.8-2.4 5.2-1.2-2.4-2.4-1.2 5.2-2.4Z" fill="currentColor" />
    </svg>
  );
}

export function IconChats({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5.5 6.8h13a1.8 1.8 0 0 1 1.8 1.8v6.2a1.8 1.8 0 0 1-1.8 1.8H11l-3.8 2.6V6.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMe({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8.2" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.2 18.8c.9-2.8 3.2-4.6 5.8-4.6s4.9 1.8 5.8 4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconChurch({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4.5v15M8.5 8.2h7M10 12.2h4M9.5 19.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 8.2 12 4.5l5.5 3.7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 19.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFamily({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 18.5c.6-2.2 2.2-3.5 3.5-3.5S11.9 16.3 12.5 18.5M13.5 17.8c.4-1.5 1.4-2.3 2.5-2.3s2.1.8 2.5 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconNearby({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5.2c-2.8 0-5 2-5 4.6 0 3.4 5 8.7 5 8.7s5-5.3 5-8.7c0-2.6-2.2-4.6-5-4.6Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="9.8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconMoments({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 10.5h6M9 13.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ICON_MAP = {
  home: IconGplay,
  rooms: IconVoiceRoom,
  explore: IconExplore,
  chats: IconChats,
  profile: IconMe,
};

export function BottomNavIcon({ tab, active }) {
  const Icon = NAV_ICON_MAP[tab];
  if (!Icon) return null;
  return <Icon className={`bottom-nav-svg ${active ? "bottom-nav-svg--active" : ""}`} />;
}
