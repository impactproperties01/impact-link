'use client'

import { Home, Heart, MessageSquare, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Saved', href: '/saved', icon: Heart },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 p-6 z-50">
      {/* Brand Logo Area */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <span className="text-brand-emerald">⌂</span> Impact Link
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={clsx(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium",
                isActive 
                  ? "bg-brand-emerald/10 text-brand-emerald" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-brand-dark"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}