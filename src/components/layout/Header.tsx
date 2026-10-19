// src/components/layout/Header.tsx
import { Bell, User } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="flex justify-between items-center px-4 py-3 bg-white">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-1.5">
        <div className="text-brand-emerald text-2xl font-black">
          {/* You can replace this with your actual SVG/Image logo later */}
          <span className="leading-none">⌂</span>
        </div>
        <span className="text-xl font-bold text-brand-dark tracking-tight">
          impact<span className="text-brand-emerald">Link</span>
        </span>
      </Link>

      {/* Action Icons */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-50 rounded-full transition">
          <Bell className="w-5 h-5 text-brand-dark" />
          {/* Notification Dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:border-brand-emerald transition overflow-hidden">
          <User className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </header>
  )
}