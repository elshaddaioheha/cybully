import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { isModeratorEmail } from "@/lib/env";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async session({ session }) {
      const email = session.user?.email;
      return {
        ...session,
        user: {
          ...session.user,
          role: isModeratorEmail(email) ? "moderator" : "user"
        }
      };
    }
  },
  pages: {
    signIn: "/sign-in"
  }
};

export function getSession() {
  return getServerSession(authOptions);
}

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "user" | "moderator";
    };
  }
}

