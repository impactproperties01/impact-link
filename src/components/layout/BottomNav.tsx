'use client'

import { Home, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import AccountMenu from '@/components/marketplace/AccountMenu'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Saved', href: '/saved', icon: Heart },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-colors",
                isActive ? "text-brand-emerald" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
        <AccountMenu variant="bottom" />
      </div>
    </nav>
  )
}