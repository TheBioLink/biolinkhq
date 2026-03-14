import crypto from "crypto";
import { User } from "@/models/User";

export async function ensureUserPsid(email) {
  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({ email: normalizedEmail });
  }

  if (user.psid) return user.psid;

  for (let i = 0; i < 8; i += 1) {
    const candidate = Number(
      `${Date.now().toString().slice(-8)}${crypto.randomInt(10, 99)}`
    );

    const exists = await User.findOne({ psid: candidate }).lean();
    if (!exists) {
      user.psid = candidate;
      await user.save();
      return candidate;
    }
  }

  throw new Error("Failed to allocate PSID");
}
