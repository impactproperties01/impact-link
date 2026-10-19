'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, Users, FileText, Wrench, Settings, LogOut, ClipboardCheck } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  // Define links based on Role
  const getLinks = () => {
    const baseLinks = [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
    
    if (role === 'ADMIN') {
      baseLinks.push({ name: 'Listing Reviews', href: '/dashboard/admin/listings', icon: ClipboardCheck })
    } else if (role === 'OWNER') {
      baseLinks.push(
        { name: 'My Properties', href: '/dashboard/properties', icon: Home },
        { name: 'Tenants & Leases', href: '/leases', icon: Users },
        { name: 'Maintenance', href: '/tickets', icon: Wrench },
        { name: 'Financials', href: '/financials', icon: FileText }
      )
    } else if (role === 'TENANT') {
      baseLinks.push(
        { name: 'My Lease', href: '/my-lease', icon: Home },
        { name: 'Rent Payments', href: '/payments', icon: FileText },
        { name: 'Support Tickets', href: '/tickets', icon: Wrench }
      )
    }
    
    baseLinks.push({ name: 'Settings', href: '/settings', icon: Settings })
    return baseLinks
  }

  const links = getLinks()

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen hidden md:flex flex-col justify-between sticky top-0">
      <div>
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <Image src="/logo.png" alt="Impact Link" width={120} height={26} className="w-auto h-auto" priority />
        </div>
        
        <nav className="p-4 space-y-1.5 mt-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(`${link.href}/`))
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                  isActive 
                    ? 'bg-brand-forest text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-emerald' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-50">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}