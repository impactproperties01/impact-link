'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react' // <-- Added
import { completeLandlordOnboarding } from '@/actions/onboarding' // <-- Added
import { 
  ChevronLeft, User, Phone, Mail, MapPin, 
  Upload, ArrowRight, Megaphone, Settings, BarChart2, Plus, Loader2
} from 'lucide-react' // <-- Added Loader2

export default function PropertyOwnerOnboarding() {
  const router = useRouter()
  const { update } = useSession() // <-- Allows us to refresh the user's JWT cookie
  const [step, setStep] = useState<1 | 2>(1)
  const [isPending, startTransition] = useTransition() // <-- Handles the loading state

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB.")
        return
      }
      setImageFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // --- NEW: Custom Submit Handler ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    if (imageFile) {
      formData.set('profileImage', imageFile)
    }

    startTransition(async () => {
      const result = await completeLandlordOnboarding(formData)
      
      if (result.success) {
        // Refresh NextAuth session cookie so the middleware knows we are verified!
        await update({ isVerified: true })
        // Move to Step 2
        setStep(2)
      } else {
        alert(result.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // STEP 1: KYC FORM
  // ---------------------------------------------------------------------------
  if (step === 1) {
    return (
      <div className="w-full min-h-screen bg-white md:bg-gray-50/40 flex flex-col items-center justify-start md:justify-center relative overflow-hidden">
        
        {/* Desktop Split Container */}
        <div className="w-full max-w-md md:max-w-4xl bg-white md:rounded-[32px] md:shadow-[0_8px_32px_rgba(0,0,0,0.02)] md:border md:border-gray-100 flex flex-col md:flex-row overflow-hidden relative md:my-10">
          
          {/* LEFT COLUMN: Form Area */}
          <div className="w-full md:w-[55%] pt-14 md:pt-14 px-6 md:px-12 pb-8 flex flex-col relative z-10">
            
            {/* Absolute Logo & Back Button */}
            <div className="absolute top-3 left-4 md:top-8 md:left-10 flex items-center gap-1.5 z-50">
              <button 
                onClick={() => router.back()} 
                className="p-1.5 -ml-1.5 text-brand-dark hover:bg-gray-50 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <Image src="/logo.png" alt="Impact Link" width={100} height={22} priority />
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 w-full mb-6 mt-2 md:mt-4">
              <div className="h-1 flex-1 bg-brand-emerald rounded-full"></div>
              <div className="h-1 flex-1 bg-gray-100 rounded-full"></div>
            </div>

            {/* Header Text */}
            <div className="mb-6 text-left">
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mb-1">Property Owner Onboarding</p>
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-brand-dark leading-tight tracking-tight mb-1.5">
                Tell us about yourself
              </h1>
              <p className="text-[13px] md:text-[14px] text-gray-500 font-medium">
                Provide a few details to create your account as a Property Owner.
              </p>
            </div>

            {/* --- CHANGED: Now uses handleSubmit --- */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Profile Photo */}
              <div className="mb-2">
                <label className="block text-[12px] font-bold text-[#111C15] mb-3 pl-1">
                  Profile Photo <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-brand-emerald hover:bg-[#e6f4ed] transition-colors group shrink-0 shadow-sm overflow-hidden"
                  >
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-brand-emerald" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-brand-dark mb-0.5">Upload a picture</p>
                    <p className="text-[11px] text-gray-500">JPG or PNG (Max 5MB)</p>
                  </div>
                  
                  <input 
                    type="file"
                    name="profileImage"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4.5 h-4.5 text-gray-400" />
                  <input type="text" name="fullName" placeholder="Enter your full name" required className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all placeholder:text-gray-400 text-brand-dark" />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">Phone Number</label>
                <div className="relative flex items-center bg-white border border-gray-200 rounded-[14px] overflow-hidden focus-within:border-brand-emerald focus-within:ring-1 focus-within:ring-brand-emerald/20 transition-all">
                  <div className="flex items-center gap-1.5 px-3 py-3.5 bg-gray-50/50 border-r border-gray-200 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span className="text-[16px] leading-none ml-1">🇳🇬</span>
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                  <input type="tel" name="phone" placeholder="080 1234 5678" required className="w-full px-3 py-3.5 text-[13px] focus:outline-none placeholder:text-gray-400 text-brand-dark" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">Residential / Contact Address</label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 w-4.5 h-4.5 text-gray-400" />
                  <input type="text" name="address" placeholder="Enter your address" required className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all placeholder:text-gray-400 text-brand-dark" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stateOfOrigin" className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">State of Origin</label>
                  <input id="stateOfOrigin" name="stateOfOrigin" type="text" required minLength={2} maxLength={100} placeholder="Enter your state of origin" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 text-brand-dark" />
                </div>
                <div>
                  <label htmlFor="lga" className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">Local Government Area (LGA)</label>
                  <input id="lga" name="lga" type="text" required minLength={2} maxLength={100} placeholder="Enter your LGA of origin" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 text-brand-dark" />
                </div>
              </div>

              <fieldset className="space-y-4 pt-2">
                <legend className="text-[14px] font-bold text-brand-dark mb-3">Next of kin</legend>
                <div>
                  <label htmlFor="nextOfKinName" className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">Full name</label>
                  <input id="nextOfKinName" name="nextOfKinName" type="text" required minLength={2} maxLength={100} placeholder="Enter your next of kin’s full name" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 text-brand-dark" />
                </div>
                <div>
                  <label htmlFor="nextOfKinPhone" className="block text-[12px] font-bold text-[#111C15] mb-1.5 pl-1">Phone number</label>
                  <input id="nextOfKinPhone" name="nextOfKinPhone" type="tel" inputMode="tel" required maxLength={30} placeholder="e.g. 08012345678 or +2348012345678" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 text-brand-dark" />
                </div>
              </fieldset>

              {/* --- CHANGED: Disabled on pending, shows processing spinner --- */}
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full mt-4 bg-brand-forest hover:bg-brand-dark text-white py-4 rounded-[14px] text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>Processing <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Desktop Image Panel */}
          <div className="hidden md:block w-[45%] relative bg-gray-50 p-3">
            <div className="relative w-full h-full rounded-[24px] overflow-hidden">
              <Image 
                src="/hero-image.png" 
                alt="Property" 
                fill 
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A252A]/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10 text-white">
                <h3 className="text-2xl font-bold mb-2 leading-tight">Start managing<br/>your properties.</h3>
                <p className="text-[14px] text-white/90">Join thousands of property owners maximizing their reach on Impact Link.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // STEP 2: SUCCESS / ADD FIRST PROPERTY
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-white md:bg-gray-50/40 flex flex-col items-center justify-start md:justify-center relative overflow-hidden">
      
      {/* Desktop Split Container */}
      <div className="w-full max-w-md md:max-w-4xl bg-white md:rounded-[32px] md:shadow-[0_8px_32px_rgba(0,0,0,0.02)] md:border md:border-gray-100 flex flex-col md:flex-row overflow-hidden relative md:my-10">
        
        {/* MOBILE ONLY: Top Curved Image Header */}
        <div className="relative w-full h-[220px] md:hidden">
          <div className="absolute top-4 left-0 w-full flex justify-center z-20">
            <Image src="/logo.png" alt="Impact Link" width={110} height={24} priority className="drop-shadow-md brightness-0 invert" />
          </div>

          <div className="absolute inset-0 overflow-hidden" style={{ borderBottomLeftRadius: '50% 15%', borderBottomRightRadius: '50% 15%' }}>
            <Image src="/hero-image.png" alt="Architecture" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          {/* Floating Icon */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[84px] h-[84px] bg-[#e6f4ed] rounded-full border-[6px] border-white flex items-center justify-center z-10 shadow-sm">
            <div className="relative">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#004D2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-emerald rounded-full border-2 border-white flex items-center justify-center text-white">
                <Plus className="w-3 h-3" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP ONLY: Left Image Panel */}
        <div className="hidden md:flex w-[45%] relative bg-gray-50 p-3 flex-col items-center justify-center">
          <div className="relative w-full h-full rounded-[24px] overflow-hidden">
            <Image src="/hero-image.png" alt="Architecture" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/40"></div>
            
            <div className="absolute top-10 left-10 z-20">
              <Image src="/logo.png" alt="Impact Link" width={130} height={28} priority className="drop-shadow-md brightness-0 invert" />
            </div>

            {/* Desktop Floating Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] bg-[#e6f4ed] rounded-full border-[6px] border-white/20 flex items-center justify-center z-10 shadow-2xl">
              <div className="relative">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#004D2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-brand-emerald rounded-full border-2 border-white flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full md:w-[55%] pt-16 md:pt-14 px-6 md:px-14 pb-8 flex flex-col justify-center text-center md:text-left relative z-10">
          
          <div className="hidden md:flex gap-2 w-full mb-8 absolute top-8 left-14 right-14 max-w-[calc(100%-112px)]">
            <div className="h-1 flex-1 bg-brand-emerald rounded-full"></div>
            <div className="h-1 flex-1 bg-brand-emerald rounded-full"></div>
          </div>

          <h2 className="text-[24px] md:text-[32px] font-extrabold text-brand-dark mb-2 leading-tight mt-4 md:mt-6">Add Your First Property</h2>
          <p className="text-[14px] md:text-[15px] text-gray-500 font-medium leading-relaxed md:px-0 px-2 mb-8 md:mb-10">
            You're almost set! Start by listing your first property and reach thousands of tenants, buyers and guests.
          </p>

          <div className="bg-white border border-gray-100 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left mb-8 md:mb-10">
            <div className="flex items-start gap-4 p-4 md:p-5 border-b border-gray-50">
              <div className="p-2.5 bg-[#e6f4ed] rounded-full shrink-0 text-brand-emerald">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[13.5px] md:text-[14.5px] font-bold text-brand-dark mb-0.5">Get more visibility</h3>
                <p className="text-[12px] md:text-[13px] text-gray-500 leading-snug">Reach serious tenants, buyers and guests across Nigeria.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 md:p-5 border-b border-gray-50">
              <div className="p-2.5 bg-[#e6f4ed] rounded-full shrink-0 text-brand-emerald">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[13.5px] md:text-[14.5px] font-bold text-brand-dark mb-0.5">Manage easily</h3>
                <p className="text-[12px] md:text-[13px] text-gray-500 leading-snug">List, edit and manage all your properties in one place.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 md:p-5">
              <div className="p-2.5 bg-[#e6f4ed] rounded-full shrink-0 text-brand-emerald">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[13.5px] md:text-[14.5px] font-bold text-brand-dark mb-0.5">Find the right tenants</h3>
                <p className="text-[12px] md:text-[13px] text-gray-500 leading-snug">Connect with verified and genuine users.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => router.push('/properties/new')} 
            className="w-full bg-brand-forest hover:bg-brand-dark text-white py-4 rounded-[14px] text-[14px] md:text-[15px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm mb-5"
          >
            Add Property <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => router.push('/dashboard')} 
            className="text-[13.5px] md:text-[14.5px] font-bold text-brand-emerald hover:text-brand-dark transition-colors md:self-center"
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  )
}
