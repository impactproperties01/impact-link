import { auth } from '@/auth'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, CreditCard, ChevronRight, Home, Building, Users, HomeIcon, MapPin, Bed, Bath, Maximize, Heart, FileText } from 'lucide-react'
import prisma from '@/lib/prisma' // <-- Added Prisma

export const metadata = { title: 'Dashboard | Impact Link' }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id
  const firstName = session?.user?.name?.split(' ')[0] || 'Daniel'

  // --- 1. FETCH LIVE DATABASE DATA ---
  // Fetch the latest 5 properties for the horizontal scroll
  const liveProperties = await prisma.property.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  // Fetch all properties to calculate real stats
  const allUserProperties = await prisma.property.findMany({
    where: { ownerId: userId },
    select: { totalUnits: true, availableUnits: true }
  })

  // --- 2. CALCULATE LIVE STATS ---
  const totalPropertiesCount = allUserProperties.length
  
  let totalUnitsCount = 0
  let vacantUnitsCount = 0
  
  allUserProperties.forEach(prop => {
    totalUnitsCount += (prop.totalUnits || 1) // Fallback to 1 if it's a single house
    vacantUnitsCount += (prop.availableUnits || 1)
  })
  
  const occupiedUnitsCount = Math.max(0, totalUnitsCount - vacantUnitsCount)

  // --- 3. FORMAT PROPERTIES FOR UI ---
  const formattedProperties = liveProperties.map(prop => ({
    id: prop.id,
    title: prop.title || `${prop.bedrooms || 0} Bedroom ${prop.propertyType.toLowerCase()}`,
    price: prop.basePrice?.toLocaleString() || '0',
    status: prop.status, // PENDING, APPROVED, etc.
    beds: prop.bedrooms || 0,
    baths: prop.bathrooms || 0,
    sqm: prop.size || 0,
    loc: prop.locationArea || prop.address || 'Lagos',
    img: prop.images?.[0] || '/hero-image.png' // Uses first uploaded Cloudinary image
  }))

  // --- 4. MOCK DATA (For future Tenant/Payment schemas) ---
  const mockRentDue = [
    { id: 1, initials: 'TO', name: 'Tunde Omisore', property: '3 Bedroom Apartment, Lekki', amount: '1,200,000', status: 'Overdue' },
    { id: 2, initials: 'IM', name: 'Ibrahim Musa', property: 'Self Contain, Surulere', amount: '600,000', status: 'Due Soon' },
    { id: 3, initials: 'FO', name: 'Funke Olayinka', property: '1 Bedroom, Ikeja', amount: '900,000', status: 'Due Soon' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#eaf6f0] to-[#f4f9f7] rounded-[24px] p-6 md:p-10 relative overflow-hidden flex justify-between items-center h-[140px] md:h-[180px]">
        <div className="relative z-10 w-[60%] md:w-[50%]">
          <p className="text-[15px] md:text-[18px] font-medium text-brand-dark mb-0.5 md:mb-2">Good morning,</p>
          <h1 className="text-[32px] md:text-[42px] font-extrabold text-brand-dark leading-none tracking-tight mb-2 md:mb-4 flex items-center gap-2">
            {firstName} <span className="text-[24px] md:text-[32px]">👋</span>
          </h1>
          <p className="text-[12px] md:text-[15px] text-gray-600 leading-snug pr-4">
            Manage your properties, tenants and rent in one place.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[45%] md:w-[40%]">
           <div className="absolute inset-0 bg-gradient-to-r from-[#eaf6f0] via-[#eaf6f0]/50 to-transparent z-10"></div>
           <Image src="/hero-image.png" alt="House" fill className="object-cover rounded-r-[24px]" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:flex md:gap-4 gap-3">
        <Link href="/dashboard/properties/new" className="bg-brand-forest text-white py-3.5 px-4 rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm md:w-[200px] hover:bg-brand-dark transition-colors">
          <Plus className="w-5 h-5" /> Add Property
        </Link>
        <button className="bg-white border border-gray-200 text-brand-dark py-3.5 px-4 rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] md:w-[200px] hover:bg-gray-50 transition-colors">
          <CreditCard className="w-5 h-5 text-brand-dark" /> Record Payment
        </button>
      </div>

      {/* Stats Grid - Now Live! */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <StatCard title="Properties" value={totalPropertiesCount} icon={Home} iconBg="bg-[#e6f4ed]" iconColor="text-brand-emerald" bg="bg-[#fcfdfc]" />
        <StatCard title="Units" value={totalUnitsCount} icon={Building} iconBg="bg-blue-100" iconColor="text-blue-600" bg="bg-[#fcfdfc]" />
        <StatCard title="Occupied" value={occupiedUnitsCount} icon={Users} iconBg="bg-teal-100" iconColor="text-teal-600" bg="bg-[#fcfdfc]" />
        <StatCard title="Vacant" value={vacantUnitsCount} icon={HomeIcon} iconBg="bg-orange-100" iconColor="text-orange-500" bg="bg-[#fffdfa]" />
        
        {/* Full width stats - Still Mocked for Finanaces */}
        <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-[#eefaf3] to-[#e6f4ed] p-5 md:p-6 rounded-[20px] flex flex-col justify-between relative shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[120px]">
          <div className="w-8 h-8 bg-brand-emerald text-white rounded-full flex items-center justify-center mb-3 text-[12px] font-bold shadow-sm">₦</div>
          <div>
            <p className="text-[11px] md:text-[13px] text-gray-500 font-bold mb-0.5">Rent Collected</p>
            <h3 className="text-[18px] md:text-[24px] font-extrabold text-brand-dark tracking-tight leading-none mb-1">₦24,600,000</h3>
            <p className="text-[10px] md:text-[12px] text-gray-500">This year</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-[#fff0f3] to-[#ffe6ea] p-5 md:p-6 rounded-[20px] flex flex-col justify-between relative shadow-[0_2px_10px_rgba(0,0,0,0.02)] min-h-[120px]">
          <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] md:text-[13px] text-gray-500 font-bold mb-0.5">Outstanding</p>
            <h3 className="text-[18px] md:text-[24px] font-extrabold text-brand-dark tracking-tight leading-none mb-1">₦3,200,000</h3>
            <p className="text-[10px] md:text-[12px] text-gray-500">Across all properties</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Side-by-side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pt-2">
        
        {/* Rent Due Section (Mocked) */}
        <div>
          <div className="flex justify-between items-center mb-3 md:mb-4 px-1">
            <h2 className="text-[18px] md:text-[20px] font-extrabold text-brand-dark">Rent Due</h2>
            <button className="text-[13px] text-gray-500 hover:text-brand-dark font-bold flex items-center gap-1 transition-colors">View all <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 overflow-hidden divide-y divide-gray-50">
            {mockRentDue.map((rent) => (
              <div key={rent.id} className="p-4 md:p-5 flex items-center gap-3 md:gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center text-[13px] md:text-[14px] font-bold text-gray-500 shrink-0">
                  {rent.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] md:text-[15px] font-bold text-brand-dark truncate leading-tight">{rent.name}</h4>
                  <p className="text-[12px] md:text-[13px] text-gray-500 truncate mt-0.5">{rent.property}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-[14px] md:text-[15px] font-extrabold text-brand-dark">₦{rent.amount}</p>
                  <span className={`text-[10px] md:text-[11px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full ${rent.status === 'Overdue' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                    {rent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Properties Section - Now Live! */}
        <div>
          <div className="flex justify-between items-center mb-3 md:mb-4 px-1">
            <h2 className="text-[18px] md:text-[20px] font-extrabold text-brand-dark">My Properties</h2>
            <button className="text-[13px] text-gray-500 hover:text-brand-dark font-bold flex items-center gap-1 transition-colors">View all <ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          
          {formattedProperties.length === 0 ? (
            <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 p-8 text-center">
               <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <h3 className="text-[15px] font-bold text-brand-dark mb-1">No Properties Yet</h3>
               <p className="text-[13px] text-gray-500 mb-4">You haven't listed any properties.</p>
               <Link href="/dashboard/properties/new" className="text-brand-forest font-bold text-[14px]">List your first property</Link>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {formattedProperties.map((prop) => (
                <div key={prop.id} className="min-w-[280px] md:min-w-[320px] w-[85%] md:w-[320px] bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 overflow-hidden snap-center flex-shrink-0 group cursor-pointer hover:shadow-md transition-all">
                  <div className="relative h-[160px] md:h-[180px] w-full overflow-hidden">
                    <Image src={prop.img} alt={prop.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                     <div className={`w-1.5 h-1.5 rounded-full ${prop.status === 'VERIFIED' ? 'bg-brand-emerald' : 'bg-orange-500'}`}></div>
<span className={prop.status === 'VERIFIED' ? 'text-brand-emerald' : 'text-orange-500 capitalize'}>
  {prop.status.toLowerCase()}
</span>
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-extrabold text-[15px] md:text-[16px] text-brand-dark leading-snug mb-1.5 line-clamp-2">{prop.title}</h3>
                    <p className="text-brand-emerald font-extrabold text-[14px] md:text-[15px] mb-2.5">₦{prop.price} <span className="text-gray-400 font-medium text-[12px] md:text-[13px]">/ year</span></p>
                    <p className="text-[12px] md:text-[13px] text-gray-500 flex items-center gap-1.5 mb-4"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{prop.loc}</span></p>
                    
                    <div className="flex items-center gap-4 text-[12px] md:text-[13px] font-bold text-gray-500 pt-3 md:pt-4 border-t border-gray-50">
                      <span className="flex items-center gap-1.5"><Bed className="w-4 h-4" /> {prop.beds}</span>
                      <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" /> {prop.baths}</span>
                      <span className="flex items-center gap-1.5 ml-auto"><Maximize className="w-4 h-4" /> {prop.sqm} sqm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  )
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, bg }: any) {
  return (
    <div className={`col-span-1 ${bg} p-4 md:p-5 rounded-[20px] flex flex-col md:flex-row md:items-center relative shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-50 transition-all hover:shadow-sm cursor-pointer`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 ${iconBg} ${iconColor} rounded-full flex items-center justify-center mb-3 md:mb-0 md:mr-4 shrink-0`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <div>
        <p className="text-[11px] md:text-[13px] text-gray-500 font-bold leading-tight">{title}</p>
        <h3 className="text-[20px] md:text-[24px] font-extrabold text-brand-dark leading-none mt-1">{value}</h3>
      </div>
      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 absolute right-4 md:right-5 top-4 md:top-1/2 md:-translate-y-1/2" />
    </div>
  )
}