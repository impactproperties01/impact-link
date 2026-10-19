'use client'

import { Bell, ChevronDown } from 'lucide-react'
import Image from 'next/image'

export default function TopNav({ user }: { user: any }) {
  return (
    <header className="h-16 md:h-20 bg-white md:border-b border-gray-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40 pt-2 md:pt-0">
      
      {/* Mobile Logo / Desktop Title */}
      <div className="flex items-center gap-4">
        <div className="md:hidden flex items-center pt-1">
          <Image src="/logo.png" alt="Impact Link" width={110} height={24} className="w-auto h-auto" priority />
        </div>
        <h2 className="text-[18px] font-extrabold text-brand-dark hidden md:block">Overview</h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        <button className="p-2 text-brand-dark hover:bg-gray-50 rounded-full transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center gap-1.5 cursor-pointer">
          <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-gray-100">
            {user?.image ? (
              <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-brand-dark bg-[#e6f4ed]">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-brand-dark" />
        </div>
      </div>
    </header>
  )
}