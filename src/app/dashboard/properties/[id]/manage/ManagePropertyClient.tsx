'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, MoreHorizontal, Camera, MapPin, Building, Users, Home, X, Check } from 'lucide-react'
import { updatePropertyUnitsAction } from '@/actions/properties'
import OverviewTab from './components/OverviewTab'
import UnitsTab from './components/UnitsTab'
import TenantsTab from './components/TenantsTab'
import PaymentsTab from './components/PaymentsTab'
import type { getOwnerPayments } from '@/lib/dashboard-data'
import { getPropertyOccupancy } from '@/lib/dashboard-metrics'

const BEDROOM_TYPE_OPTIONS = [
  'Single room', 'Room self contained', 'Room and Parlor Flat', 
  '2-bedroom Flat', '3-bedroom Flat', '4-Bedroom Flat'
]

export default function ManagePropertyClient({ property, paymentData, asOf, initialTab = 'Overview' }: { property: any; paymentData: Awaited<ReturnType<typeof getOwnerPayments>>; asOf: string; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  
  // Modal State
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editTotalUnits, setEditTotalUnits] = useState(property.totalUnits || 0)
  const [editAvailableUnits, setEditAvailableUnits] = useState(property.availableUnits || 0)
  const [editBedroomTypes, setEditBedroomTypes] = useState<string[]>(property.bedroomTypes || [])
  const [isPending, startTransition] = useTransition()

  // Routing Logic
  const isRent = property.listingType === 'RENTAL'
  const isLease = property.listingType === 'LEASE'
  const isSale = property.listingType === 'SALE'
  const isShortlet = property.listingType === 'SHORTLET'
  const isLand = property.propertyType === 'LAND'
  const isApartment = property.propertyType === 'APARTMENT'
  const isHouse = property.propertyType === 'HOUSE'

  const activeBedroomTypes = property.bedroomTypes || []
  const isMultiUnitRent = isRent && isApartment && activeBedroomTypes.length > 0

  const addressStr = property.address || 'Address not specified'
  
  let displayTitle = 'Untitled Property'
  if (isRent && isApartment) {
    const beds = (property.bedroomTypes && property.bedroomTypes.length > 0) ? property.bedroomTypes.join(', ') : 'Apartment'
    displayTitle = `${beds} available for rent in ${addressStr}`
  } else if (isRent && isLand) {
    displayTitle = `Land for rent in ${addressStr}`
  } else if (isLease) {
    const type = isHouse ? 'Residential home' : isLand ? 'Land' : 'Commercial building'
    displayTitle = `${type} for lease in ${addressStr}`
  } else if (isSale) {
    const pType = isHouse ? 'House' : isLand ? 'Land' : property.propertyType.toLowerCase()
    displayTitle = `${pType} for sale in ${addressStr}`
  } else if (isShortlet) {
    const sBed = property.shortletBedrooms || 'Apartment'
    displayTitle = `${sBed} available for shortlet in ${addressStr}`
  } else {
    displayTitle = `${property.propertyType.toLowerCase()} in ${addressStr}`
  }

  // Real Database Metrics
  const images = property.images && property.images.length > 0 ? property.images : ['/hero-image.png']
  const occupancy = getPropertyOccupancy(property)
  const totalUnits = occupancy.total
  const vacantUnits = occupancy.vacant
  const occupiedUnits = occupancy.occupied
  const basePrice = Number(property.basePrice) || 0
  
  const occupiedPercentage = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
  const dashOffset = 226 - (226 * occupiedPercentage) / 100

  const expectedRent = basePrice * (totalUnits > 0 ? totalUnits : 1)
  const rentCollected = paymentData.summary.rentCollected
  const outstandingRent = paymentData.summary.outstanding
  const leases = property.leases || [] 

  const tabs = ['Overview', 'Units', 'Tenants', 'Payments', 'Documents']

  // Modal Handlers
  const handleOpenModal = () => {
    setEditTotalUnits(property.totalUnits || 0)
    setEditAvailableUnits(property.availableUnits || 0)
    setEditBedroomTypes(property.bedroomTypes || [])
    setShowUnitModal(true)
  }

  const toggleBedroomType = (type: string) => {
    if (editBedroomTypes.includes(type)) {
      setEditBedroomTypes(prev => prev.filter(t => t !== type))
    } else {
      setEditBedroomTypes(prev => [...prev, type])
    }
  }

  const handleSaveUnits = async () => {
    startTransition(async () => {
      const res = await updatePropertyUnitsAction(property.id, {
        totalUnits: editTotalUnits,
        availableUnits: editAvailableUnits,
        bedroomTypes: editBedroomTypes
      })
      if (res.success) {
        setShowUnitModal(false)
        window.location.reload()
      } else {
        alert(res.error || "Failed to update")
      }
    })
  }

  return (
    <div className="max-w-[480px] lg:max-w-7xl mx-auto bg-gray-50 min-h-screen pb-24 font-sans relative">
      
      {/* Unit Management Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[440px] rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-extrabold text-[#091F11]">Manage Units</h3>
              <button onClick={() => setShowUnitModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-[#091F11]" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#091F11] mb-2">Total Units</label>
                  <input 
                    type="number" value={editTotalUnits} onChange={(e) => setEditTotalUnits(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-[#091F11] focus:border-[#005C3A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#091F11] mb-2">Available Units</label>
                  <input 
                    type="number" value={editAvailableUnits} onChange={(e) => setEditAvailableUnits(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-[#091F11] focus:border-[#005C3A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#091F11] mb-3">Unit Types Available</label>
                <div className="flex flex-wrap gap-2">
                  {BEDROOM_TYPE_OPTIONS.map((type) => {
                    const isSelected = editBedroomTypes.includes(type)
                    return (
                      <button
                        key={type} onClick={() => toggleBedroomType(type)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-colors ${
                          isSelected ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#005C3A]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />} {type}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleSaveUnits} disabled={isPending} className="w-full bg-[#005C3A] text-white py-3.5 rounded-xl text-[14px] font-bold hover:bg-[#004b2f] transition-colors shadow-sm disabled:opacity-50">
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative w-full h-[280px] lg:h-[380px] rounded-b-[32px] lg:rounded-b-[48px] overflow-hidden bg-gray-200 shadow-sm">
        <img src={images[0]} alt="Property" className="w-full h-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>
        
        <div className="absolute top-4 lg:top-6 left-4 lg:left-8 right-4 lg:right-8 flex justify-between items-center z-10">
          <Link href="/dashboard/properties" className="w-10 h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-[#091F11]" />
          </Link>
          <button className="w-10 h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <MoreHorizontal className="w-5 h-5 lg:w-6 lg:h-6 text-[#091F11]" />
          </button>
        </div>

        <div className="absolute bottom-4 lg:bottom-6 right-4 lg:right-8 bg-black/70 backdrop-blur-md text-white text-[11px] lg:text-[13px] font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> 1 / {images.length}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 lg:px-8 -mt-4 lg:-mt-10 relative z-10 space-y-4 lg:space-y-8">
        
        {/* Header Card */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] lg:shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2 mb-2 lg:mb-4">
            <h1 className="text-[20px] lg:text-[28px] font-extrabold text-[#091F11] leading-tight capitalize">{displayTitle}</h1>
            <div className="flex gap-1.5 shrink-0 mt-1 lg:mt-0">
              <span className="flex items-center gap-1 px-2 py-0.5 lg:px-3 lg:py-1 bg-[#F0FDF4] text-[#005C3A] text-[10px] lg:text-[12px] font-bold rounded-full border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#005C3A]"></span> {property.status}
              </span>
              <span className="px-2 py-0.5 lg:px-3 lg:py-1 bg-[#F0FDF4] text-[#005C3A] text-[10px] lg:text-[12px] font-bold rounded-[6px] lg:rounded-lg">
                For {property.listingType === 'RENTAL' ? 'Rent' : property.listingType}
              </span>
            </div>
          </div>
          <p className="text-[12px] lg:text-[14px] text-gray-500 flex items-center gap-1 mb-4 lg:mb-6">
            <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> {addressStr}
          </p>

          <div className="flex items-center justify-between pt-3 lg:pt-5 border-t border-gray-100">
            <div className="flex flex-col items-center gap-0.5 lg:gap-1">
              <div className="flex items-center gap-1.5"><Building className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" /><span className="text-[15px] lg:text-[18px] font-extrabold text-[#091F11]">{totalUnits}</span></div>
              <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium">Total Units</span>
            </div>
            <div className="w-[1px] h-8 lg:h-10 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-0.5 lg:gap-1">
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" /><span className="text-[15px] lg:text-[18px] font-extrabold text-[#091F11]">{occupiedUnits}</span></div>
              <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium">Occupied</span>
            </div>
            <div className="w-[1px] h-8 lg:h-10 bg-gray-200"></div>
            <div className="flex flex-col items-center gap-0.5 lg:gap-1">
              <div className="flex items-center gap-1.5"><Home className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" /><span className="text-[15px] lg:text-[18px] font-extrabold text-[#091F11]">{vacantUnits}</span></div>
              <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium">Vacant</span>
            </div>
            <div className="w-[1px] h-8 lg:h-10 bg-gray-200"></div>
            <div className="flex flex-col items-end gap-0.5 lg:gap-1 pl-2 lg:pl-4">
              <span className="text-[14px] lg:text-[18px] font-extrabold text-[#005C3A]">
                {isMultiUnitRent && <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium mr-1">from</span>}
                ₦{basePrice.toLocaleString()}
              </span>
              <span className="text-[9px] lg:text-[11px] text-gray-500 font-medium">Base Price / {property.tenancyDuration?.toLowerCase() || 'year'}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-1 lg:gap-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 lg:px-6 py-3 lg:py-4 text-[13px] lg:text-[15px] font-bold border-b-2 transition-colors ${
                activeTab === tab ? 'border-[#005C3A] text-[#005C3A]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Routing */}
        {activeTab === 'Overview' && (
          <OverviewTab 
            property={property} 
            onOpenModal={handleOpenModal}
            onAddTenant={() => setActiveTab('Tenants')}
            onRecordPayment={() => setActiveTab('Tenants')}
            onShowPayments={() => setActiveTab('Payments')}
            payments={paymentData.payments}
            paymentYear={paymentData.summary.year}
            expectedRent={expectedRent}
            rentCollected={rentCollected}
            outstandingRent={outstandingRent}
            occupiedUnits={occupiedUnits}
            vacantUnits={vacantUnits}
            totalUnits={totalUnits}
            dashOffset={dashOffset}
            occupiedPercentage={occupiedPercentage}
            leases={leases}
            isMultiUnitRent={isMultiUnitRent}
          />
        )}
        
      {activeTab === 'Units' && (
          <UnitsTab 
            property={property} 
          />
        )}
        
        {activeTab === 'Tenants' && (
          <TenantsTab property={property} asOf={asOf} onManageUnits={() => setActiveTab('Units')} />
        )}
        
        {activeTab === 'Payments' && (
          <PaymentsTab data={paymentData} propertyId={property.id} />
        )}
        
      </div>
    </div>
  )
}
