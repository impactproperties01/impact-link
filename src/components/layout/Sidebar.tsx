'use client'

import { Home, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '../../../public/logo.png'
import AccountMenu from '@/components/marketplace/AccountMenu'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Saved', href: '/saved', icon: Heart },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 p-6 z-50">
      {/* Brand Logo Area */}
      <div className="mb-10">
        <Link href="/" aria-label="Impact Link home" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2">
          <Image src={logo} alt="Impact Link" sizes="160px" className="h-auto w-40 object-contain" />
        </Link>
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
        <AccountMenu variant="sidebar" />
      </nav>
    </aside>
  )
}