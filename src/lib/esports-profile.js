export function slugifyEsportsProfile(input) {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function computeProfileScore(profile = {}) {
  let score = 0;

  if (profile.gamerTag) score += 10;
  if (profile.headline) score += 10;
  if (profile.primaryGame) score += 10;
  if (Array.isArray(profile.roles) && profile.roles.length > 0) score += 10;
  if (profile.region) score += 5;
  if (profile.rank) score += 10;
  if (profile.anonymousBio && profile.anonymousBio.length >= 60) score += 10;
  if (Array.isArray(profile.achievements) && profile.achievements.length > 0) {
    score += 10;
  }
  if (Array.isArray(profile.vodLinks) && profile.vodLinks.length > 0) {
    score += 10;
  }
  if (Array.isArray(profile.orgFitTags) && profile.orgFitTags.length > 0) {
    score += 5;
  }
  if (Array.isArray(profile.languages) && profile.languages.length > 0) {
    score += 5;
  }
  if (profile.availability) score += 5;

  return Math.min(score, 100);
}

export function statusLabel(status) {
  switch (status) {
    case "lft":
      return "Looking for team";
    case "fa":
      return "Free agent";
    case "on-team":
      return "Currently on team";
    case "coach":
      return "Coach";
    case "manager":
      return "Manager";
    case "analyst":
      return "Analyst";
    case "creator":
      return "Creator";
    default:
      return "";
  }
}
