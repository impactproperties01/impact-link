'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getListingContactHref } from '@/lib/support'
import { 
  Search, SlidersHorizontal, MapPin, Camera, 
  Building, Users, Home, BarChart2, Plus, Trash2, Eye 
} from 'lucide-react'

type PropertyData = {
  id: string
  title: string
  location: string
  price: string
  interval: string
  listingType: string
  status: string
  units: number | null
  occupied: number | null
  vacant: number | null
  unknownUnits: number
  imagesCount: number
  image: string | null
}

export default function PropertiesClient({ initialProperties }: { initialProperties: PropertyData[] }) {
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { name: 'All', count: initialProperties.length },
    { name: 'Approved', count: initialProperties.filter(p => p.status === 'Approved').length },
    { name: 'Pending verification', count: initialProperties.filter(p => p.status === 'Pending verification').length },
    { name: 'Rejected', count: initialProperties.filter(p => p.status === 'Rejected').length },
    { name: 'Sold', count: initialProperties.filter(p => p.status === 'Sold').length },
    { name: 'Rented', count: initialProperties.filter(p => p.status === 'Rented').length },
  ]

  const filteredProperties = initialProperties.filter(prop => {
    const matchesTab = activeTab === 'All' || prop.status === activeTab
    const matchesSearch = prop.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prop.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="px-4 pt-5 pb-24 space-y-4 font-sans">
      
      {/* Header: Title & Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold text-[#091F11] tracking-tight leading-tight">My Properties</h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">Manage all your properties, units and listings.</p>
        </div>
        <Link 
          href="/properties/new" 
          className="bg-[#005C3A] text-white py-2 px-3.5 rounded-[8px] font-bold text-[13px] flex items-center gap-1.5 shrink-0 hover:bg-[#004b2f] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Property
        </Link>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 -mx-4 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors ${
              activeTab === tab.name 
                ? 'bg-[#E8F5E9] text-[#005C3A]' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.name} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 pb-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location..." 
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-[10px] text-[12px] focus:outline-none focus:border-[#005C3A] transition-colors"
            />
          </div>
          <button className="bg-white border border-gray-200 p-2.5 rounded-[10px] text-gray-600 shrink-0 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between overflow-x-auto hide-scrollbar gap-2 pb-1">
          <div className="flex gap-2">
            <select className="bg-white border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium text-gray-700 outline-none">
              <option>Listing Type</option>
            </select>
            <select className="bg-white border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium text-gray-700 outline-none">
              <option>Occupancy</option>
            </select>
            <select className="bg-white border border-gray-200 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium text-gray-700 outline-none">
              <option>Location</option>
            </select>
          </div>
          <button className="text-[11px] font-bold text-[#005C3A] whitespace-nowrap pl-2 pr-1">Reset</button>
        </div>
      </div>

      {/* Property List */}
      <div className="space-y-4">
        {filteredProperties.length === 0 ? (
           <div className="text-center py-10 bg-white rounded-[16px] border border-gray-100">
             <Building className="w-10 h-10 text-gray-300 mx-auto mb-3" />
             <p className="text-[14px] font-bold text-[#091F11]">No properties found</p>
             <p className="text-[12px] text-gray-500">Try adjusting your tabs or search query.</p>
           </div>
        ) : (
          filteredProperties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-[16px] p-2.5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex gap-3">
              
              {/* Left Image Section */}
              <div className="relative w-[110px] shrink-0 rounded-[10px] overflow-hidden">
                {prop.image ? <Image src={prop.image} fill className="object-cover" alt={prop.title} unoptimized /> : (
                  <div className="flex h-full min-h-40 items-center justify-center bg-gray-100 p-3 text-center text-xs text-gray-500">No photo provided</div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] flex items-center gap-1">
                  <Camera className="w-3 h-3" /> {prop.imagesCount}
                </div>
              </div>

              {/* Right Content Section */}
              <div className="flex-1 min-w-0 flex flex-col py-0.5">
                
                {/* Title & Badge Row */}
                <div className="flex justify-between items-start gap-1 mb-1">
                  <h3 className="text-[13px] font-extrabold text-[#091F11] leading-[1.3] line-clamp-2 pr-1">
                    {prop.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold ${
                      prop.status === 'Approved' ? 'bg-[#E8F5E9] text-[#005C3A]' : 
                      prop.status === 'Pending verification' ? 'bg-[#FFFBEB] text-[#D97706]' :
                      prop.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        prop.status === 'Approved' ? 'bg-[#005C3A]' : 
                        prop.status === 'Pending verification' ? 'bg-[#F59E0B]' :
                        'bg-gray-500'
                      }`}></div>
                      {prop.status}
                    </div>
                    {prop.status === 'Rejected' && (
                      <a href={getListingContactHref(prop.id)} className="text-[11px] font-bold text-brand-forest underline underline-offset-2">Contact</a>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{prop.location}</span>
                </div>

                {/* Tag & Price */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                    prop.listingType === 'For Rent' ? 'bg-[#E8F5E9] text-[#005C3A]' : 'bg-[#EFF6FF] text-[#1D4ED8]'
                  }`}>
                    {prop.listingType}
                  </span>
                  <span className="text-[13px] font-extrabold text-[#005C3A]">
                    {prop.price} <span className="font-medium text-gray-400">{prop.interval}</span>
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-2.5 mt-1"></div>

                {/* Stats Row - Only visible for Rental Apartments */}
                {prop.units !== null && (
                  <div className="flex items-center justify-between text-[10px] text-gray-600 font-medium mb-3 px-0.5">
                    <div className="flex items-center gap-1"><Building className="w-3 h-3 text-gray-400" /> {prop.units} Unit{prop.units !== 1 ? 's' : ''}</div>
                    <div className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" /> {prop.occupied} Occupied</div>
                    <div className="flex items-center gap-1"><Home className="w-3 h-3 text-gray-400" /> {prop.vacant} Vacant</div>
                  </div>
                )}

                {prop.unknownUnits > 0 && <p className="mb-3 text-[10px] text-gray-500">{prop.unknownUnits} awaiting occupancy details</p>}

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 mt-auto">
                  <Link 
                    href={`/dashboard/properties/${prop.id}`}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 rounded-[6px] text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-3 h-3" /> View
                  </Link>

                  {prop.units !== null && (
                    <Link 
                      href={`/dashboard/properties/${prop.id}/manage`}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-1.5 rounded-[6px] text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
                    >
                      <BarChart2 className="w-3 h-3" /> Manage
                    </Link>
                  )}

                  <button className="flex-1 bg-white border border-red-100 text-red-500 py-1.5 rounded-[6px] text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
      
    </div>
  )
}
