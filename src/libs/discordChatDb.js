// src/libs/discordChatDb.js
import mongoose from "mongoose";

let cached = global._biolinkDiscordChatDb;

if (!cached) {
  cached = global._biolinkDiscordChatDb = { conn: null, promise: null };
}

export async function discordChatDb() {
  const uri = process.env.DIS_MONGO_URI;

  if (!uri) {
    throw new Error("Missing DIS_MONGO_URI environment variable");
  }

  if (cached.conn && cached.conn.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.createConnection(uri, {}).asPromise();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
