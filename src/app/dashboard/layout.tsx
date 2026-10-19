import { auth } from '@/auth'
import { getCurrentUser } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import TopNav from '@/components/dashboard/TopNav'
import MobileNav from '@/components/dashboard/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // --- THE FIX: THE DASHBOARD BOUNCER ---
  // If the user hasn't completed onboarding, intercept them here and route them
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  const user = session.user as typeof session.user & { isVerified?: boolean }
  const role = currentUser.role
  if (role !== 'ADMIN' && !user.isVerified) {
    if (role === 'OWNER') {
      redirect('/onboarding/landlord')
    } else if (role === 'AGENT') {
      redirect('/onboarding/agent')
    } else if (role === 'VENDOR') {
      redirect('/onboarding/vendor')
    }
    // Tenants default to dashboard, so they pass through
  }

  return (
    <div className="flex h-screen bg-white md:bg-[#F8FAFC] overflow-hidden">
      <Sidebar role={role} />
      
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <TopNav user={session.user} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        <MobileNav role={role} />
      </div>
    </div>
  )
}