'use client'

import { useState, useTransition } from 'react'
import { Search, Users, Phone, Calendar, X, Home, CreditCard } from 'lucide-react'
import { recordTenantPaymentAction } from '@/actions/properties'

export default function TenantsTab({ property }: { property: any }) {
  const tenants = (property.units || []).filter((u: any) => u.status === 'OCCUPIED' && u.tenantName)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  
  const [isPending, startTransition] = useTransition()
  const [recordingUnitId, setRecordingUnitId] = useState<string | null>(null)

  const filteredTenants = tenants.filter((unit: any) => 
    unit.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Generate initials for the dummy profile avatar
  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const getLeaseStatus = (endDateString: string | null) => {
    if (!endDateString) return { label: 'Ongoing', color: 'text-[#005C3A]', bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]' }
    
    const endDate = new Date(endDateString)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const formattedDate = formatDate(endDateString)

    if (diffDays < 0) {
      return { label: `Expired ${formattedDate}`, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
    } else if (diffDays <= 30) {
      return { label: `Expires ${formattedDate}`, color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]' }
    }
    return { label: `Expires ${formattedDate}`, color: 'text-[#005C3A]', bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]' }
  }

  // Handle Recording Payment (Extends Lease)
  const handleRecordPayment = (unitId: string) => {
    const durationStr = (property.tenancyDuration || '').toLowerCase()
    let extensionLabel = '1 year'
    if (durationStr === 'monthly' || durationStr === 'month') extensionLabel = '1 month'
    else if (durationStr.includes('6') || durationStr.includes('bi')) extensionLabel = '6 months'

    const confirmAction = window.confirm(`Record a payment for this unit? This will extend their lease end date by ${extensionLabel}.`)
    if (!confirmAction) return

    setRecordingUnitId(unitId)
    startTransition(async () => {
      const res = await recordTenantPaymentAction(unitId, property.id)
      if (res.success) {
        setSelectedTenant(null)
      } else {
        alert(res.error || "Failed to record payment.")
      }
      setRecordingUnitId(null)
    })
  }

  return (
    <div className="bg-white rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm overflow-hidden relative">
      
      {/* Tenant Details Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[400px] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#005C3A] font-extrabold text-[16px] flex items-center justify-center shrink-0 border border-[#C8E6C9]">
                  {getInitials(selectedTenant.tenantName)}
                </div>
                <div>
                  <h3 className="text-[18px] sm:text-[20px] font-extrabold text-[#091F11]">{selectedTenant.tenantName}</h3>
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {selectedTenant.tenantPhone || 'No phone number'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                <X className="w-4 h-4 text-[#091F11]" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#005C3A] flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Unit Details</p>
                  <p className="text-[14px] font-extrabold text-[#091F11]">{selectedTenant.name} <span className="font-medium text-gray-500 text-[13px]">({selectedTenant.type})</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#005C3A] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Lease Period</p>
                  <p className="text-[14px] font-extrabold text-[#091F11]">
                    {formatDate(selectedTenant.rentStartDate)} — {formatDate(selectedTenant.rentEndDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#005C3A] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Unit Price</p>
                  <p className="text-[14px] font-extrabold text-[#091F11]">₦{Number(selectedTenant.price).toLocaleString()} <span className="font-medium text-gray-500 text-[12px]">/ {property.tenancyDuration?.toLowerCase() || 'term'}</span></p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => handleRecordPayment(selectedTenant.id)}
                disabled={isPending && recordingUnitId === selectedTenant.id}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#005C3A] py-3 rounded-xl text-[13px] font-bold hover:bg-[#dcfce7] transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" /> 
                {isPending && recordingUnitId === selectedTenant.id ? 'Processing...' : 'Record Payment'}
              </button>

              {selectedTenant.tenantPhone && (
                <a 
                  href={`tel:${selectedTenant.tenantPhone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-[#091F11] py-3 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Call Tenant
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Header & Actions */}
      <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] lg:text-[18px] font-extrabold text-[#091F11]">Property Tenants</h2>
          <p className="text-[12px] lg:text-[13px] text-gray-500 mt-1">View all active tenants and their lease statuses.</p>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tenants or units..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium outline-none focus:border-[#005C3A]"
            />
          </div>
        </div>
      </div>

      {/* Tenants List / Table */}
      {tenants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Tenant Name</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rent Start</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Status (End Date)</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTenants.length > 0 ? filteredTenants.map((unit: any) => {
                const status = getLeaseStatus(unit.rentEndDate)
                return (
                  <tr 
                    key={unit.id} 
                    onClick={() => setSelectedTenant(unit)}
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="flex items-center gap-3">
                        {/* Dummy Profile Avatar */}
                        <div className="w-9 h-9 rounded-full bg-[#E8F5E9] text-[#005C3A] font-extrabold text-[12px] flex items-center justify-center shrink-0 border border-[#C8E6C9]">
                          {getInitials(unit.tenantName)}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">{unit.tenantName}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 font-medium flex items-center gap-1">
                            Unit: <span className="font-bold text-[#005C3A]">{unit.name}</span>
                          </div>
                          {/* Mobile Contact Fallback */}
                          <div className="text-[11px] text-gray-400 mt-1 sm:hidden flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {unit.tenantPhone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-[12px] lg:text-[13px] font-medium text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {unit.tenantPhone || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden lg:table-cell">
                      <div className="text-[12px] lg:text-[13px] font-medium text-gray-600">
                        {formatDate(unit.rentStartDate)}
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] lg:text-[11px] font-bold rounded-lg border ${status.bg} ${status.color} ${status.border}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevents modal from opening when clicking button directly
                            handleRecordPayment(unit.id); 
                          }}
                          disabled={isPending && recordingUnitId === unit.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#005C3A] text-[11px] font-bold rounded-lg hover:bg-[#dcfce7] transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> 
                          {/* Full text on all sizes */}
                          <span>
                            {isPending && recordingUnitId === unit.id ? 'Saving...' : 'Record Payment'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[13px] text-gray-500 font-medium">
                    No tenants match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 lg:py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-[16px] lg:text-[18px] font-extrabold text-[#091F11] mb-2">No active tenants</h3>
          <p className="text-[13px] lg:text-[14px] text-gray-500 max-w-sm mb-6">
            You don't have any tenants assigned yet. Go to the Units tab to assign a tenant to a unit.
          </p>
        </div>
      )}
    </div>
  )
}