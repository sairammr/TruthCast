// File: app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    {
      id: "worldcoin",
      name: "Worldcoin",
      type: "oauth",
      wellKnown: "https://id.worldcoin.org/.well-known/openid-configuration",
      authorization: {
        params: {
          scope: "openid",
          response_type: "code",
        },
      },
      idToken: true,
      checks: ["state", "nonce"],
      clientId: process.env.NEXTAUTH_WORLDCOIN_ID,
      clientSecret: process.env.NEXTAUTH_WORLDCOIN_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.sub,
          email: profile.email,
          verificationLevel:
            profile["https://id.worldcoin.org/v1"].verification_level,
          worldcoinProfile: {
            sub: profile.sub,
            "https://id.worldcoin.org/v1": {
              verification_level:
                profile["https://id.worldcoin.org/v1"].verification_level,
            },
            email: profile.email,
            name: profile.name,
            given_name: profile.given_name,
            family_name: profile.family_name,
          },
        };
      },
    },
  ],
  pages: {
    signIn: "/verify-world",
    error: "/verify-world",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.verificationLevel = user.verificationLevel;
        token.worldcoinProfile = user.worldcoinProfile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.verificationLevel = token.verificationLevel as string;
        session.user.worldcoinProfile = token.worldcoinProfile;
      }
      return session;
    },
    async signIn({ user }) {
      return true;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
