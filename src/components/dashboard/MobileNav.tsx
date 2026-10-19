'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, Users, CreditCard, MoreHorizontal, ClipboardCheck } from 'lucide-react'

export default function MobileNav({ role }: { role?: string }) {
  const pathname = usePathname()

  const links = role === 'ADMIN' ? [
    { name: 'Listing Reviews', href: '/dashboard/admin/listings', icon: ClipboardCheck },
    { name: 'Marketplace', href: '/', icon: Home },
  ] : [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/dashboard/properties', icon: LayoutDashboard },
    { name: 'Tenants', href: '/dashboard/tenants', icon: Users },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'More', href: '/settings', icon: MoreHorizontal },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 px-2 py-2 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      {links.map((link) => {
        const Icon = link.icon
        const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
        
        return (
          <Link 
            key={link.name} 
            href={link.href}
            className="flex flex-col items-center justify-center w-[72px] py-1 gap-1"
          >
            <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-[#e6f4ed] text-brand-forest' : 'text-gray-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${isActive ? 'text-brand-forest' : 'text-gray-400'}`}>
              {link.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}