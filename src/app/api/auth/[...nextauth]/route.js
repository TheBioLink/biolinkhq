import clientPromise from "@/libs/mongoClient";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongoose from "mongoose";
import { Ban } from "@/models/Ban";

const norm = (s) => (s || "").toString().trim().toLowerCase();

export const authOptions = {
  secret: process.env.SECRET,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // ✅ make NextAuth send errors back to /login
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user }) {
      const email = norm(user?.email);
      if (!email) return true;

      try {
        await mongoose.connect(process.env.MONGO_URI);

        // ✅ Ban by email blocks login
        const banned = await Ban.findOne({
          type: "email",
          identifier: email,
        }).lean();

        if (banned) {
          const reason = encodeURIComponent(banned.reason || "Banned");
          return `/login?error=banned&reason=${reason}`;
        }
      } catch {
        // If DB fails, don't block sign-in
        return true;
      }

      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
