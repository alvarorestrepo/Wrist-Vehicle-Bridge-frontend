import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const temporaryAllowedEmails = new Set(["alvarorestrepoz@gmail.com"]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      const email = user.email?.toLowerCase();

      return Boolean(email && temporaryAllowedEmails.has(email));
    },
  },
});
