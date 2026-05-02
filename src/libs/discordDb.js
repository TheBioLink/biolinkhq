// src/libs/discordDb.js
// Separate Mongoose connection for Discord-related data (D_MONGO_URI)

import mongoose from "mongoose";

const DISCORD_MONGO_URI = process.env.D_MONGO_URI;

// Use a separate connection object so it doesn't clash with the main MONGO_URI connection
let discordConnection = null;

export async function connectDiscordDb() {
  if (discordConnection && discordConnection.readyState === 1) {
    return discordConnection;
  }

  if (!DISCORD_MONGO_URI) {
    throw new Error("D_MONGO_URI is not set in environment variables");
  }

  discordConnection = await mongoose.createConnection(DISCORD_MONGO_URI).asPromise();
  return discordConnection;
}

export function getDiscordDb() {
  if (!discordConnection || discordConnection.readyState !== 1) {
    throw new Error("Discord DB not connected. Call connectDiscordDb() first.");
  }
  return discordConnection;
}
