import Image from 'next/image'
import Link from 'next/link'
import { 
  Bell, User, Search, SlidersHorizontal, 
  Tag, Bed, Building, MoreHorizontal, ChevronDown, 
  Home, ArrowRight 
} from 'lucide-react'
import PropertyCard from '@/components/ui/PropertyCard'
import prisma from '@/lib/prisma'

export default async function HomePage() {
  const featuredProperties = await prisma.property.findMany({
    where: { status: 'VERIFIED' },
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col pb-24 w-full overflow-x-hidden bg-white md:pb-10 relative">
      
      {/* 1. Header */}
      <header className="flex justify-between md:justify-end items-center px-4 md:px-8 h-14 md:h-20 bg-white sticky top-0 z-50">
        <Link href="/" className="relative flex items-center md:hidden">
          <Image 
            src="/logo.png" 
            alt="Impact Link" 
            width={130} 
            height={28}
            className="object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <button className="relative p-1.5 hover:bg-gray-50 rounded-full transition">
            <Bell className="w-5 h-5 text-brand-dark" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
            <User className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </header>

      <main className="w-full">
        
        {/* 2. Hero Section */}
        <div className="relative w-full h-[220px] md:h-[280px] bg-white md:mt-4 md:rounded-3xl md:overflow-hidden md:bg-gray-50/50">
          <div className="absolute top-0 right-[-24px] md:right-0 w-[60%] md:w-[55%] h-[190px] md:h-full">
            <div className="relative w-full h-full [mask-image:linear-gradient(to_right,transparent_0%,black_25%)] -webkit-[mask-image:linear-gradient(to_right,transparent_0%,black_25%)] md:[mask-image:linear-gradient(to_right,transparent_0%,black_10%)] md:-webkit-[mask-image:linear-gradient(to_right,transparent_0%,black_10%)]">
              <Image 
                src="/hero-image.png" 
                alt="Modern Architecture" 
                fill 
                className="object-cover object-right md:object-center"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="absolute top-4 left-4 z-10 w-[65%] md:static md:w-full md:p-10">
            <h1 className="text-[32px] md:text-[3rem] font-extrabold text-brand-dark leading-[1.1] tracking-tight">
              Find the right<br className="md:hidden"/> property
            </h1>
            <p className="text-sm md:text-lg text-gray-500 mt-2 md:mt-4 leading-relaxed max-w-[200px] md:max-w-md">
              Search apartments, homes and shortlets near you.
            </p>
          </div>

          <div className="absolute bottom-0 left-4 right-4 flex bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 z-20
                          md:static md:bg-white md:shadow-sm md:max-w-lg md:p-2 md:ml-10 md:-mt-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-full text-sm font-semibold transition-all duration-300 bg-brand-forest text-white shadow-sm">
              <Home className="w-4 h-4" /> Rent
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-full text-sm font-semibold transition-all duration-300 text-gray-600 hover:text-brand-dark md:hover:bg-gray-50">
              <Building className="w-4 h-4" /> Buy 
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-full text-sm font-semibold transition-all duration-300 text-gray-600 hover:text-brand-dark md:hover:bg-gray-50">
              <Bed className="w-4 h-4" /> Shortlet
            </button>
          </div>
        </div>

        {/* 3. Search & Filters */}
        <div className="px-4 space-y-4 mt-6 md:px-8 md:max-w-3xl md:mt-8">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm hover:border-gray-300 transition">
            <div className="flex-1 flex items-center pl-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by area, estate or landmark" 
                className="w-full bg-transparent border-none focus:ring-0 text-sm ml-2 text-brand-dark placeholder-gray-400 outline-none"
              />
            </div>
            <button className="p-2 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition">
              <SlidersHorizontal className="w-5 h-5 text-brand-dark" />
            </button>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-1">
            {[
              { label: 'Price', icon: Tag },
              { label: 'Beds', icon: Bed },
              { label: 'Type', icon: Building },
              { label: 'More', icon: MoreHorizontal },
            ].map((filter) => (
              <button 
                key={filter.label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full whitespace-nowrap text-sm font-medium text-brand-dark hover:border-brand-emerald transition"
              >
                <filter.icon className="w-4 h-4 text-gray-500" />
                {filter.label}
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* 4. Featured Properties Grid */}
        <section className="pl-4 mt-6 md:px-8 md:mt-10">
          <div className="flex justify-between items-center mb-4 pr-4 md:pr-0">
            <h2 className="text-lg md:text-xl font-bold text-brand-dark">Featured Properties</h2>
            <button className="text-brand-emerald text-sm font-medium flex items-center hover:underline">
              See all <ChevronDown className="w-4 h-4 ml-0.5 -rotate-90" />
            </button>
          </div>
          
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 hide-scrollbar pr-4 md:pr-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible">
            {featuredProperties.length > 0 ? (
              featuredProperties.map((property) => (
                <div key={property.id} className="snap-start min-w-[260px] w-[260px] md:w-full md:min-w-0">
                  <PropertyCard property={property} />
                </div>
              ))
            ) : (
              <div className="md:col-span-full">
                <p className="text-sm text-gray-500 italic">No verified properties found.</p>
              </div>
            )}
          </div>
        </section>

        {/* 5. Inline Pixel-Matched CTA Banner (Restored to regular document flow) */}
        <div className="px-4 mt-6 mb-8 md:px-8 md:mt-10">
          <div className="relative overflow-hidden bg-[#e6f4ed] rounded-[24px] p-5 md:p-6 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#d6eedf]">
            {/* Soft backdrop blobs */}
            <div className="absolute -right-4 -bottom-6 w-36 h-36 bg-[#cbeadd] rounded-full blur-2xl opacity-80 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#bdecd0]/50 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="relative z-10 flex gap-4 items-center w-full justify-between">
              {/* White Icon Box */}
              <div className="bg-white p-3.5 rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] shrink-0 border border-[#e1f5e8]">
                <Home className="w-6 h-6 text-[#008f43]" />
              </div>
              
              {/* Aligned Typography */}
              <div className="flex-1 pl-1 pr-3">
                <h3 className="font-extrabold text-[#111C15] text-[15px] md:text-lg tracking-tight leading-tight">
                  List Your Property
                </h3>
                <p className="text-[10.5px] md:text-sm text-gray-600 font-medium mt-1 leading-normal max-w-[210px] md:max-w-md">
                  Reach thousands of verified tenants and buyers across Nigeria.
                </p>
              </div>
              
              {/* Get Started Button */}
              <button className="shrink-0 bg-brand-forest hover:bg-brand-dark text-white px-5 py-3 rounded-[16px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}