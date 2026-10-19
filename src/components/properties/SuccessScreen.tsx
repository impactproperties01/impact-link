'use client'

import { Clock, ArrowRight, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function SuccessScreen() {
  return (
    <div className="max-w-[480px] mx-auto pb-24 bg-white min-h-screen pt-0 px-4 md:px-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 -mt-2">
        <button type="button" className="p-2 -ml-2 rounded-full hover:bg-gray-50">
          <ChevronLeft className="w-6 h-6 text-[#091F11]" />
        </button>
        
        <div className="flex items-center justify-center scale-[1.35] origin-top">
           <img src="/logo.png" alt="Impact Link" className="h-16 w-auto object-contain" />
        </div>
        
        <div className="w-10" /> 
      </div>

      <div className="flex flex-col items-center text-center px-2">
        
        {/* Success Graphic - Flat Matte Style */}
        <div className="relative w-56 h-56 mb-2 flex items-center justify-center">
           <svg className="w-full h-full" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
             {/* Ultra-Light Subtle Green Background Circle */}
             <circle cx="80" cy="80" r="66" fill="#F4FBF7" />
             
             {/* Flat Matte Confetti */}
             <path d="M 42 50 L 52 60" stroke="#005C3A" strokeWidth="5" strokeLinecap="round" />
             <path d="M 118 45 L 108 55" stroke="#005C3A" strokeWidth="5" strokeLinecap="round" />
             <path d="M 38 88 L 48 84" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
             
             <circle cx="58" cy="38" r="4.5" fill="#005C3A" />
             <circle cx="122" cy="78" r="4.5" fill="#005C3A" />
             <circle cx="106" cy="34" r="4.5" fill="#F59E0B" />
             <circle cx="116" cy="100" r="4.5" fill="#F59E0B" />

             {/* Tilted Matte Document */}
             <g transform="translate(70, 75) rotate(-14)">
               {/* Flat offset shadow (creates depth without gloss) */}
               <rect x="-32" y="-42" width="64" height="84" rx="6" fill="#D1D5DB" opacity="0.4" transform="translate(8, 8)" />
               
               {/* Document Base */}
               <rect x="-32" y="-42" width="64" height="84" rx="6" fill="#F4F6F8" />
               
               {/* Thick Matte Lines representing text */}
               <path d="M -16 -20 L 20 -20" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
               <path d="M -16 -4 L 28 -4" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
               <path d="M -16 12 L 12 12" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
               <path d="M -16 28 L 0 28" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
             </g>

             {/* Matte Green Checkmark Badge Overlapping */}
             <g transform="translate(100, 100)">
               {/* Soft drop shadow for the badge to pop slightly off the paper */}
               <circle cx="2" cy="3" r="26" fill="#091F11" opacity="0.08" />
               
               {/* Main Badge */}
               <circle cx="0" cy="0" r="26" fill="#005C3A" />
               
               {/* Clean Rounded Checkmark */}
               <path d="M -9 2 L -2 9 L 12 -5" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
             </g>
           </svg>
        </div>

        <h1 className="text-[26px] font-extrabold text-[#091F11] mb-3 leading-tight tracking-tight">
          Property Submitted<br/>Successfully
        </h1>
        <p className="text-gray-500 text-[14px] leading-[1.6] mb-8 px-2">
          Your property has been sent to Impact Link for review. You'll be notified once it is approved and goes live on the platform.
        </p>

        {/* Status Card */}
        <div className="w-full bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl p-4 flex items-center gap-4 mb-10 text-left shadow-sm">
          <div className="w-12 h-12 bg-[#FEF3C7] rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-[#D97706]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#92400E] uppercase tracking-wider mb-0.5">Status</p>
            <p className="text-[16px] font-extrabold text-[#091F11]">Pending Verification</p>
          </div>
        </div>

        {/* What happens next? Timeline */}
        <div className="w-full text-left mb-10">
          <h3 className="text-[16px] font-extrabold text-[#091F11] mb-6">What happens next?</h3>
          <div className="space-y-6">
            {[
              { id: 1, title: 'Our team will review your listing', desc: 'We check the details, images and documents to ensure quality and authenticity.' },
              { id: 2, title: "You'll get a notification", desc: "We'll notify you once your property is approved or if any changes are needed." },
              { id: 3, title: 'Your property goes live', desc: 'After approval, your property will be visible to thousands of tenants, buyers and guests on Impact Link.' }
            ].map((step, idx) => (
              <div key={step.id} className="flex gap-4 relative">
                {idx < 2 && <div className="absolute left-[13.5px] top-8 bottom-[-16px] w-[2px] bg-gray-200"></div>}
                <div className="w-7 h-7 rounded-full bg-[#005C3A] text-white flex items-center justify-center text-[12px] font-bold shrink-0 relative z-10 shadow-sm">
                  {step.id}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#091F11] mb-1">{step.title}</h4>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <Link href="/dashboard/properties" className="w-full flex items-center justify-center gap-2 bg-[#005C3A] hover:bg-[#004b2f] text-white py-4 rounded-[14px] text-[15px] font-bold transition-colors shadow-sm">
            View My Properties <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/dashboard" className="w-full flex items-center justify-center bg-white border-[1.5px] border-[#005C3A] text-[#005C3A] hover:bg-gray-50 py-4 rounded-[14px] text-[15px] font-bold transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}