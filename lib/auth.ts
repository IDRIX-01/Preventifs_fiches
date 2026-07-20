import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// IMPORTANT : il n'y a PAS d'auto-inscription. Tous les comptes (machinistes,
// chef d'équipe, responsables, directeur) sont créés UNIQUEMENT par l'admin
// depuis /admin/users. C'est ce qui garantit que personne d'autre que
// l'admin ne peut se donner le rôle ADMIN.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        username: { label: "Identifiant", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
async authorize(credentials) {
  if (!credentials?.username || !credentials?.password) {
    console.log("❌ Champs manquants", credentials);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { username: credentials.username },
  });
  console.log("🔍 Recherche username:", JSON.stringify(credentials.username));
  console.log("🔍 Utilisateur trouvé :", user ? user.username : "AUCUN");
  if (!user) return null;

  console.log("🔑 Hash en base :", user.passwordHash);
  const valid = await bcrypt.compare(credentials.password, user.passwordHash);
  console.log("✅ Mot de passe valide :", valid);
  if (!valid) return null;

  return { id: user.id, name: user.name, role: user.role, username: user.username };
},
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
