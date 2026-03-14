import mongoose from "mongoose";

const globalForLinkedDb = globalThis;

if (!globalForLinkedDb.__linkedDbCache) {
  globalForLinkedDb.__linkedDbCache = {
    conn: null,
    promise: null,
  };
}

const cache = globalForLinkedDb.__linkedDbCache;

export async function connectLinkedDb() {
  if (cache.conn) return cache.conn;

  if (!process.env.L_DB) {
    throw new Error("Missing L_DB environment variable");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .createConnection(process.env.L_DB, {
        bufferCommands: false,
      })
      .asPromise();
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
