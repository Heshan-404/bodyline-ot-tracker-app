import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "HR" | "MANAGER" | "DGM" | "GM" | "SECURITY";
      name?: string | null;
      sectionId?: string | null; // Allow sectionId to be null
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "HR" | "MANAGER" | "DGM" | "GM" | "SECURITY";
    sectionId?: string | null; // Allow sectionId to be null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: "HR" | "MANAGER" | "DGM" | "GM" | "SECURITY";
    sectionId?: string | null; // Allow sectionId to be null
  }
}