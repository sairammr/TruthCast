import "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    verificationLevel: string;
    worldcoinProfile: {
      sub: string;
      "https://id.worldcoin.org/v1": {
        verification_level: "orb" | "device";
      };
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
    };
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      verificationLevel: string;
      worldcoinProfile: {
        sub: string;
        "https://id.worldcoin.org/v1": {
          verification_level: "orb" | "device";
        };
        email?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
      };
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    verificationLevel: string;
    worldcoinProfile: {
      sub: string;
      "https://id.worldcoin.org/v1": {
        verification_level: "orb" | "device";
      };
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
    };
  }
}
