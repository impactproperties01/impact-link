'use client'

import { useState, useTransition } from 'react'
import { Search, Users, Phone, Calendar, X, Home, CreditCard, Building } from 'lucide-react'
import { recordTenantPaymentAction } from '@/actions/properties'

export default function TenantsClient({ initialTenants }: { initialTenants: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  
  const [isPending, startTransition] = useTransition()
  const [recordingUnitId, setRecordingUnitId] = useState<string | null>(null)

  const filteredTenants = initialTenants.filter((unit: any) => 
    unit.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

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

    if (diffDays < 0) return { label: `Expired ${formattedDate}`, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
    if (diffDays <= 30) return { label: `Expires ${formattedDate}`, color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]' }
    return { label: `Expires ${formattedDate}`, color: 'text-[#005C3A]', bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]' }
  }

  const handleRecordPayment = (unitId: string, propertyId: string, tenancyDuration: string) => {
    const durationStr = (tenancyDuration || '').toLowerCase()
    let extensionLabel = '1 year'
    if (durationStr === 'monthly' || durationStr === 'month') extensionLabel = '1 month'
    else if (durationStr.includes('6') || durationStr.includes('bi')) extensionLabel = '6 months'

    const confirmAction = window.confirm(`Record a payment for this unit? This will extend their lease end date by ${extensionLabel}.`)
    if (!confirmAction) return

    setRecordingUnitId(unitId)
    startTransition(async () => {
      const res = await recordTenantPaymentAction(unitId, propertyId)
      if (res.success) {
        setSelectedTenant(null)
        window.location.reload() // Refresh master list
      } else {
        alert(res.error || "Failed to record payment.")
      }
      setRecordingUnitId(null)
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 min-h-screen pb-24 font-sans">
      <div className="mb-8">
        <h1 className="text-[24px] lg:text-[28px] font-extrabold text-[#091F11]">All Tenants</h1>
        <p className="text-[14px] text-gray-500 mt-1">Manage tenants across your entire property portfolio.</p>
      </div>

      <div className="bg-white rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by tenant, unit, or property..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium outline-none focus:border-[#005C3A]"
            />
          </div>
        </div>

        {initialTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Tenant</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Property & Unit</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Status (End Date)</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTenants.map((unit: any) => {
                  const status = getLeaseStatus(unit.rentEndDate)
                  return (
                    <tr key={unit.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3 lg:py-4 px-4 lg:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#E8F5E9] text-[#005C3A] font-extrabold text-[12px] flex items-center justify-center shrink-0 border border-[#C8E6C9]">
                            {getInitials(unit.tenantName)}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">{unit.tenantName}</div>
                            {/* Mobile Fallback */}
                            <div className="text-[11px] text-gray-500 mt-0.5 font-medium sm:hidden">
                              {unit.property?.title} <span className="font-bold text-[#005C3A]">({unit.name})</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-4 lg:px-6 hidden sm:table-cell">
                        <div className="text-[13px] font-bold text-[#091F11]">{unit.property?.title}</div>
                        <div className="text-[11px] text-gray-500 font-medium">Unit: <span className="text-[#005C3A] font-bold">{unit.name}</span></div>
                      </td>
                      <td className="py-3 lg:py-4 px-4 lg:px-6 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-[12px] lg:text-[13px] font-medium text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {unit.tenantPhone || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-4 lg:px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] lg:text-[11px] font-bold rounded-lg border ${status.bg} ${status.color} ${status.border}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-4 lg:px-6 text-right">
                        <button 
                          onClick={() => handleRecordPayment(unit.id, unit.propertyId, unit.property?.tenancyDuration)}
                          disabled={isPending && recordingUnitId === unit.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#005C3A] text-[11px] font-bold rounded-lg hover:bg-[#dcfce7] transition-colors disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> 
                          <span className="hidden xl:inline">
                            {isPending && recordingUnitId === unit.id ? 'Saving...' : 'Record Payment'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-[18px] font-extrabold text-[#091F11] mb-2">No active tenants</h3>
            <p className="text-[14px] text-gray-500 max-w-sm">
              You don't have any active tenants across your properties. Add units and assign tenants in your property management dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}