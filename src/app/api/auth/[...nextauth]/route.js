import clientPromise from "@/libs/mongoClient";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongoose from "mongoose";
import { Ban } from "@/models/Ban";

export const authOptions = {
  secret: process.env.SECRET,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const email = (user?.email || "").toLowerCase().trim();
      if (!email) return true;

      // If DB not ready, don't block sign in
      try {
        await mongoose.connect(process.env.MONGO_URI);
        const banned = await Ban.findOne({ type: "email", identifier: email }).lean();
        if (banned) return false;
      } catch {
        return true;
      }

      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
