'use client'

import { Building, Plus, UserPlus, CreditCard, BarChart3, ChevronRight, Calendar, Inbox, Receipt, Tag } from 'lucide-react'

export default function OverviewTab({ 
  property, onOpenModal, expectedRent, rentCollected, outstandingRent, occupiedUnits, vacantUnits, totalUnits, dashOffset, occupiedPercentage, leases, isMultiUnitRent 
}: any) {
  
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
      {/* MOBILE ONLY: Quick Actions & Chart */}
      <div className="w-full flex lg:hidden flex-col gap-4">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
          <button onClick={onOpenModal} className="flex items-center gap-1.5 bg-[#005C3A] text-white px-3.5 py-2.5 rounded-[10px] text-[12px] font-bold shrink-0">
            <Plus className="w-4 h-4" /> Manage Units
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-[#091F11] px-3.5 py-2.5 rounded-[10px] text-[12px] font-bold shrink-0">
            <UserPlus className="w-4 h-4" /> Add Tenant
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-[#091F11] px-3.5 py-2.5 rounded-[10px] text-[12px] font-bold shrink-0">
            <CreditCard className="w-4 h-4" /> Record Payment
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-extrabold text-[#091F11] flex items-center gap-1.5 mb-4"><Building className="w-4 h-4 text-gray-500" /> Occupancy</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#005C3A]"></div><span className="text-[13px] font-extrabold text-[#091F11]">{occupiedUnits} <span className="font-medium text-gray-500">Occupied</span></span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div><span className="text-[13px] font-extrabold text-[#091F11]">{vacantUnits} <span className="font-medium text-gray-500">Vacant</span></span></div>
            </div>
          </div>
          <div className="relative w-[100px] h-[100px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="36" fill="transparent" stroke="#E5E7EB" strokeWidth="12" />
              <circle cx="50" cy="50" r="36" fill="transparent" stroke="#005C3A" strokeWidth="12" strokeDasharray="226" strokeDashoffset={dashOffset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[20px] font-extrabold text-[#091F11] leading-none">{totalUnits}</span>
              <span className="text-[9px] font-medium text-gray-500">Total Units</span>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT DESKTOP COLUMN */}
      <div className="w-full lg:flex-1 space-y-4 lg:space-y-6">
        
        {/* Rent Summary Card */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[20px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h3 className="text-[14px] lg:text-[16px] font-extrabold text-[#091F11] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" /> Rent Summary <span className="text-gray-400 font-medium text-[12px] lg:text-[13px]">(Expected Annual)</span>
            </h3>
            <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 cursor-pointer" />
          </div>
          <div className="grid grid-cols-3 gap-2 lg:gap-4">
            <div className="flex flex-col gap-1 lg:gap-2">
              <span className="text-[13px] lg:text-[18px] font-extrabold text-[#091F11]">₦{expectedRent.toLocaleString()}</span>
              <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium">Total Expected Rent</span>
            </div>
            <div className="flex flex-col gap-1 lg:gap-2 border-l border-gray-100 pl-3 lg:pl-6">
              <span className="text-[13px] lg:text-[18px] font-extrabold text-[#005C3A]">₦{rentCollected.toLocaleString()}</span>
              <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium">Rent Collected</span>
            </div>
            <div className="flex flex-col gap-1 lg:gap-2 border-l border-gray-100 pl-3 lg:pl-6">
              <span className="text-[13px] lg:text-[18px] font-extrabold text-red-500">₦{outstandingRent.toLocaleString()}</span>
              <span className="text-[10px] lg:text-[12px] text-gray-500 font-medium">Outstanding Rent</span>
            </div>
          </div>
        </div>

        {/* Unit Pricing Setup Card */}
        {isMultiUnitRent && property.unitPrices && typeof property.unitPrices === 'object' && Object.keys(property.unitPrices).length > 0 && (
          <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[20px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h3 className="text-[14px] lg:text-[16px] font-extrabold text-[#091F11] flex items-center gap-1.5">
                <Tag className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" /> Unit Pricing
              </h3>
            </div>
            <div className="space-y-2 lg:space-y-3">
              {Object.entries(property.unitPrices).map(([type, price]) => {
                const uPrice = Number(price)
                if (uPrice <= 0) return null
                return (
                  <div key={type} className="flex justify-between items-center p-3 lg:p-4 bg-[#F8FAFC] border border-gray-100 rounded-xl">
                    <span className="font-bold text-[#091F11] text-[13px] lg:text-[14px] capitalize">{type}</span>
                    <span className="font-extrabold text-[#005C3A] text-[14px] lg:text-[15px]">
                      ₦{uPrice.toLocaleString()} <span className="font-normal text-gray-500 text-[11px] lg:text-[12px]">/ {property.tenancyDuration?.toLowerCase() || 'year'}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rent Due Soon List */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[20px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h3 className="text-[14px] lg:text-[16px] font-extrabold text-[#091F11] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" /> Rent Due Soon
            </h3>
            <span className="text-[11px] lg:text-[13px] font-bold text-gray-500 flex items-center cursor-pointer hover:text-[#005C3A]">View all <ChevronRight className="w-3 h-3 ml-0.5" /></span>
          </div>
          
          {leases.length > 0 ? (
            <div className="space-y-4">{/* Real Leases Here */}</div>
          ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Inbox className="w-10 h-10 lg:w-12 lg:h-12 text-gray-200 mb-3" />
                <p className="text-[14px] lg:text-[15px] font-bold text-[#091F11]">No rent due currently</p>
                <p className="text-[12px] lg:text-[13px] text-gray-500 mt-1">You have no active tenants with upcoming due dates.</p>
              </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl lg:rounded-[20px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h3 className="text-[14px] lg:text-[16px] font-extrabold text-[#091F11] flex items-center gap-1.5">
              <Receipt className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" /> Recent Payments
            </h3>
            <span className="text-[11px] lg:text-[13px] font-bold text-gray-500 flex items-center cursor-pointer hover:text-[#005C3A]">View all <ChevronRight className="w-3 h-3 ml-0.5" /></span>
          </div>
          {leases.length > 0 ? (
            <div className="space-y-4">{/* Real Payments Here */}</div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
                <p className="text-[13px] lg:text-[14px] font-medium text-gray-400">No recent payments recorded.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DESKTOP COLUMN (Sticky Sidebar) */}
      <div className="hidden lg:flex w-[320px] shrink-0 flex-col gap-6 sticky top-24">
        
        {/* Quick Actions Desktop */}
        <div className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm space-y-3">
          <h3 className="text-[14px] font-extrabold text-[#091F11] mb-2">Quick Actions</h3>
          <button onClick={onOpenModal} className="w-full flex items-center justify-center gap-2 bg-[#005C3A] text-white py-3 rounded-xl text-[13px] font-bold hover:bg-[#004b2f] transition-colors">
            <Plus className="w-4 h-4" /> Manage Units
          </button>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#091F11] py-3 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Tenant
          </button>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#091F11] py-3 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors">
            <CreditCard className="w-4 h-4" /> Record Payment
          </button>
        </div>

        {/* Occupancy Card Desktop */}
        <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-[15px] font-extrabold text-[#091F11] flex items-center gap-1.5 w-full mb-6">
            <Building className="w-5 h-5 text-gray-500" /> Occupancy
          </h3>
          
          <div className="relative w-[140px] h-[140px] mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E5E7EB" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#005C3A" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * occupiedPercentage) / 100} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-extrabold text-[#091F11] leading-none">{totalUnits}</span>
              <span className="text-[11px] font-medium text-gray-500 mt-1">Total Units</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#005C3A]"></div>
                <span className="text-[14px] font-medium text-gray-600">Occupied</span>
              </div>
              <span className="text-[14px] font-extrabold text-[#091F11]">{occupiedUnits}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                <span className="text-[14px] font-medium text-gray-600">Vacant</span>
              </div>
              <span className="text-[14px] font-extrabold text-[#091F11]">{vacantUnits}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}