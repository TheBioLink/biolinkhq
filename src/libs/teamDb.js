import mongoose from "mongoose";

let cached = global._biolinkTeamDb;

if (!cached) {
  cached = global._biolinkTeamDb = { conn: null, promise: null };
}

export async function teamDb() {
  const uri = process.env.T_MONGO_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("Missing T_MONGO_URI or MONGO_URI for team database");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.createConnection(uri, {}).asPromise();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
