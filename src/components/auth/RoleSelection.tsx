'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Home, User, Briefcase, ChevronRight, ArrowRight } from 'lucide-react'

const ROLES = [
  {
    id: 'TENANT',
    title: "I'm looking for a property",
    description: 'Rent, buy or book a shortlet.',
    bgColor: 'bg-[#F4FAF7]',
    activeBorder: 'border-brand-emerald',
    icon: Home,
    iconColor: 'text-[#004D2C]',
    imagePlaceholder: 'bg-gradient-to-r from-transparent to-[#d2ede0]'
  },
  {
    id: 'OWNER',
    title: "I'm a Property Owner",
    description: 'List properties and manage tenants, rent and units.',
    bgColor: 'bg-[#FFF8F3]',
    activeBorder: 'border-[#E57A00]',
    icon: Home,
    iconColor: 'text-[#995200]',
    imagePlaceholder: 'bg-gradient-to-r from-transparent to-[#f5d8b8]'
  },
  {
    id: 'AGENT',
    title: "I'm an Agent",
    description: 'Find properties for clients and view agent commission opportunities.',
    bgColor: 'bg-[#F6F4FB]',
    activeBorder: 'border-[#5A31B4]',
    icon: User,
    iconColor: 'text-[#3C1D82]',
    imagePlaceholder: 'bg-gradient-to-r from-transparent to-[#d6cbf0]'
  },
  {
    id: 'VENDOR',
    title: "I'm a Property Professional",
    description: 'Offer services such as legal, electrical, plumbing, valuation, etc.',
    bgColor: 'bg-[#F2F7FA]',
    activeBorder: 'border-[#006BB3]',
    icon: Briefcase,
    iconColor: 'text-[#00457A]',
    imagePlaceholder: 'bg-gradient-to-r from-transparent to-[#c2e0f5]'
  }
]

export default function RoleSelection({ onContinue }: { onContinue: (role: string) => void }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-start pb-4 md:pb-8 relative">
      
      {/* 1. Logo Placed Absolute Top-Left of the entire screen */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
        <Image 
          src="/logo.png" 
          alt="Impact Link" 
          width={130} 
          height={28} 
          className="md:w-[150px] md:h-auto"
          priority 
        />
      </div>

      {/* 2. Compact Outer Wrapper for Content */}
      <div className="w-full max-w-md md:max-w-4xl bg-white md:rounded-[32px] md:shadow-[0_8px_32px_rgba(0,0,0,0.02)] md:border md:border-gray-100 mt-16 md:mt-24 mb-4 flex flex-col overflow-hidden">
        
        {/* Step 2: Main Header Info (Heavily compacted and shifted up) */}
        <div className="relative pt-4 px-6 md:pt-6 md:px-12 mb-1 flex justify-between items-start w-full">
          {/* Header Left (Text) */}
          <div className="relative z-10 max-w-[62%] md:max-w-[48%] mt-2">
            <h1 className="text-[26px] md:text-[34px] font-extrabold text-brand-dark leading-[1.12] tracking-tight mb-1.5">
              How do you want<br/>to use <span className="text-brand-forest">Impact Link?</span>
            </h1>
            <p className="text-[13px] md:text-[14.5px] text-gray-500 font-medium">
              Choose the option that best<br className="md:hidden" /> describes you.
            </p>
          </div>

          {/* Hero Image - moved tightly to the right with less vertical pad */}
          <div className="absolute top-0 right-[-32px] md:right-0 w-[50%] md:w-[45%] h-[140px] md:h-[160px] z-0 overflow-hidden md:relative md:overflow-visible">
            <div className="relative w-full h-full [mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)] -webkit-[mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)]">
              <Image 
                src="/hero-image.png" 
                alt="Architecture" 
                fill 
                className="object-cover object-right md:object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Step 3: Actionable Cards (More compact with tighter padding & smaller height) */}
        <div className="px-6 md:px-12 flex-1 flex flex-col md:grid md:grid-cols-2 gap-2.5 md:gap-4 relative z-10 mt-1">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative flex items-center w-full text-left overflow-hidden rounded-[18px] p-3.5 transition-all duration-200 border-2 ${role.bgColor} ${selectedRole === role.id ? role.activeBorder : 'border-transparent hover:border-gray-200'} h-[76px] md:h-[88px]`}
            >
              {/* Image Mask (Blends right Side edge) */}
              <div className={`absolute right-0 top-0 bottom-0 w-[30%] ${role.imagePlaceholder} opacity-30 mix-blend-multiply pointer-events-none`}></div>

              <div className="flex-1 flex gap-3 md:gap-3.5 items-center relative z-10">
                {/* Icon Box */}
                <div className="bg-white p-2 md:p-2.5 rounded-[10px] md:rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] shrink-0 border border-gray-50">
                  <role.icon className={`w-4.5 h-4.5 md:w-5.5 md:h-5.5 ${role.iconColor}`} />
                </div>
                
                {/* Text Description */}
                <div className="pr-6 md:pr-4">
                  <h3 className="font-extrabold text-[#111C15] text-[13px] md:text-[14px] mb-0.5 leading-tight">{role.title}</h3>
                  <p className="text-[10.5px] md:text-[11.5px] text-gray-500 font-medium leading-snug">{role.description}</p>
                </div>
              </div>

              <ChevronRight className="absolute right-3.5 w-4 h-4 text-gray-400 z-10" />
            </button>
          ))}
        </div>

        {/* Step 4: Compact Actions Bar */}
        <div className="px-6 md:px-12 mt-5 md:mt-8 mb-5 flex flex-col md:flex-row-reverse md:justify-between md:items-center gap-3">
          <button 
            onClick={() => selectedRole && onContinue(selectedRole)}
            disabled={!selectedRole}
            className="w-full md:w-[200px] bg-brand-forest text-white py-3 md:py-3.5 rounded-[14px] text-[13.5px] md:text-[14.5px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-dark cursor-pointer shadow-sm"
          >
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <p className="text-center text-[13px] text-gray-600 font-medium md:text-left">
            Already have an account? <Link href="/login" className="text-brand-emerald font-bold hover:text-brand-forest transition-colors ml-1 underline-offset-2 hover:underline">Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  )
}