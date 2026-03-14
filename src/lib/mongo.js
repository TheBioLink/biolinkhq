import mongoose from "mongoose"

const URI = process.env.L_DB

if (!URI) {
  throw new Error("Missing L_DB env variable")
}

let cached = global.esportsMongo

if (!cached) {
  cached = global.esportsMongo = {
    conn: null,
    promise: null
  }
}

export async function connectEsportsDB() {

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {

    cached.promise = mongoose
      .createConnection(URI, {
        bufferCommands: false
      })
      .asPromise()

  }

  cached.conn = await cached.promise
  return cached.conn
}
