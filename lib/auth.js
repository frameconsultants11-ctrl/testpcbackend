import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDB } from "@/lib/db";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  secret: process.env.AUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  providers: [
    Credentials({
      name: "Admin Login",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        try {
          if (
            !credentials?.email ||
            !credentials?.password
          ) {
            return null;
          }

          const db = await getDB();

          const email = credentials.email
            .toString()
            .trim()
            .toLowerCase();

          const admin = await db.collection("users").findOne({
            email,
            role: "admin",
            isActive: true,
          });

          if (!admin) {
            console.log(
              "Admin not found or inactive:",
              email
            );

            return null;
          }

          if (!admin.password) {
            console.log(
              "Admin has no password:",
              email
            );

            return null;
          }

          const passwordValid = await bcrypt.compare(
            credentials.password.toString(),
            admin.password
          );

          if (!passwordValid) {
            console.log(
              "Invalid password:",
              email
            );

            return null;
          }

          return {
            id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: "ADMIN",
          };
        } catch (error) {
          console.error(
            "AUTH AUTHORIZE ERROR:",
            error
          );

          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },

    async authorized({ auth, request }) {
      const isAdminRoute =
        request.nextUrl.pathname.startsWith("/admin");

      if (!isAdminRoute) {
        return true;
      }

      return auth?.user?.role === "ADMIN";
    },
  },

  pages: {
    signIn: "/login",
  },
});