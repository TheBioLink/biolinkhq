import mongoose from "mongoose";

let cached = global._biolinkNewsDb;

if (!cached) {
  cached = global._biolinkNewsDb = { conn: null, promise: null };
}

export async function newsDb() {
  const uri = process.env.N_MONGO_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("Missing N_MONGO_URI or MONGO_URI for news database");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.createConnection(uri, {}).asPromise();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
