import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { isRegistrationRole } from '@/lib/roles'
import { TERMS_VERSION, TERMS_COOKIE_NAME } from '@/lib/terms'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    async createUser({ id, ...user }) {
      const cookieStore = await cookies()
      const pendingRole = cookieStore.get('impact_link_pending_role')?.value
      const pendingTerms = cookieStore.get(TERMS_COOKIE_NAME)?.value
      if (!isRegistrationRole(pendingRole) || pendingTerms !== TERMS_VERSION) {
        throw new Error('Accept the Terms and Conditions before creating an account.')
      }
      return prisma.user.create({ data: { ...user, role: pendingRole, termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } })
    },
  },
  session: {
    strategy: "jwt", 
  },
  pages: {
    signIn: '/login', 
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" }, 
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password")
        }

        const identifier = credentials.email as string

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { phone: identifier }
            ]
          }
        })

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        // --- Block unverified emails ---
        if (!user.emailVerified) {
          throw new Error("unverified_email")
        }

        return user
      }
    })
  ],
  callbacks: {
    // --- THE GATEKEEPER: Prevent accidental ghost accounts ---
    async signIn({ user, account }) {
      // Only run this check for OAuth (Google/Apple)
      if (account?.provider !== 'credentials' && user.email) {
        const existingUser = await prisma.user.findUnique({ 
          where: { email: user.email } 
        })

        const cookieStore = await cookies()
        const pendingRole = cookieStore.get('impact_link_pending_role')?.value
        const pendingTerms = cookieStore.get(TERMS_COOKIE_NAME)?.value

        // If the user is brand new AND they didn't come from the Sign Up page (no cookie)
        if (!existingUser && (!isRegistrationRole(pendingRole) || pendingTerms !== TERMS_VERSION)) {
          // Abort the creation process and redirect them to the registration page
          return '/register' 
        }
      }
      return true // Allow all other logins to proceed normally
    },

    async jwt({ token, user, trigger, session, account }) {
      if (trigger === "update" && session) {
        token.role = session.role || token.role
        token.isVerified = session.isVerified ?? token.isVerified
      }

      // Initial Sign-in or Sign-up
      if (user) {
        const dbUser = user.email ? await prisma.user.findUnique({ 
          where: { email: user.email } 
        }) : null;

        if (dbUser) {
          
          // ONLY RUN ON ABSOLUTE FIRST CREATION
          // Auth.js fires trigger === "signUp" ONLY when the adapter creates a brand new user.
          if (trigger === "signUp" && account && account.provider !== 'credentials') {
            const cookieStore = await cookies()
            const pendingRole = cookieStore.get('impact_link_pending_role')?.value
            
            if (isRegistrationRole(pendingRole)) {
              // Update the database synchronously
              await prisma.user.update({
                where: { email: dbUser.email },
                data: { role: pendingRole }
              })
              
              // Update local object so the token gets the new role instantly
              dbUser.role = pendingRole
              
              try { cookieStore.delete('impact_link_pending_role') } catch (e) {}
              try { cookieStore.delete(TERMS_COOKIE_NAME) } catch (e) {}
            }
          } else {
            // For existing users, just clean up the cookie if they accidentally brought one
            const cookieStore = await cookies()
            try { cookieStore.delete('impact_link_pending_role') } catch (e) {}
            try { cookieStore.delete(TERMS_COOKIE_NAME) } catch (e) {}
          }

          // Guarantee token syncs perfectly with the established DB state
          token.role = dbUser.role
          token.isVerified = dbUser.isVerified
          token.sub = dbUser.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        (session.user as any).role = token.role;
        (session.user as any).isVerified = token.isVerified;
      }
      return session
    }
  }
})
