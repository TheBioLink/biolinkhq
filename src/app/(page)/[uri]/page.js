// only updating ProfileBadgeIcon
function ProfileBadgeIcon({ badge }) {
  if (badge.icon) {
    return (
      <img
        src={badge.icon}
        alt={badge.name}
        title={badge.name}
        className="h-7 w-7 object-contain transition hover:scale-110"
      />
    );
  }

  return (
    <span
      title={badge.name}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/25 text-sm font-black text-white/80"
    >
      {(badge.name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
