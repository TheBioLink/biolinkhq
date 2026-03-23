export function generateReferralCode(username) {
  return (
    username.replace(/\s+/g, "").toLowerCase() +
    Math.random().toString(36).substring(2, 6)
  );
}
