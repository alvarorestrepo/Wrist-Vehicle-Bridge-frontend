import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAllowedEmails() {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      const allowedEmails = getAllowedEmails();

      if (allowedEmails.size === 0) {
        return true;
      }

      const email = user.email?.toLowerCase();

      return Boolean(email && allowedEmails.has(email));
    },
  },
});
