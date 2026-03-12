// src/libs/credits.js
export function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

export function isItsNic({ email = "", uri = "" }) {
  return (
    normalizeEmail(email) === "mrrunknown44@gmail.com" ||
    String(uri || "").toLowerCase().trim() === "itsnicbtw"
  );
}
