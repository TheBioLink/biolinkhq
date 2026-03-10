import clientPromise from "@/libs/mongoClient";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const norm = (s) => (s || "").toString().trim().toLowerCase();

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user }) {
      const email = norm(user?.email);
      if (!email) return false;

      try {
        const client = await clientPromise;
        const db = client.db();

        const banned = await db.collection("bans").findOne(
          {
            type: "email",
            identifier: email,
          },
          {
            projection: { reason: 1 },
            maxTimeMS: 1500,
          }
        );

        if (banned) {
          const reason = encodeURIComponent(banned.reason || "Banned");
          return `/login?error=banned&reason=${reason}`;
        }

        return true;
      } catch (err) {
        console.error("signIn ban check failed:", err);
        return true;
      }
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },

  debug: false,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
