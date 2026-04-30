import mongoose from "mongoose";

let cached = global._biolinkMessageDb;

if (!cached) {
  cached = global._biolinkMessageDb = { conn: null, promise: null };
}

export async function messageDb() {
  const uri = process.env.M_MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("Missing M_MONGODB_URI or MONGO_URI for message database");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.createConnection(uri, {}).asPromise();
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
