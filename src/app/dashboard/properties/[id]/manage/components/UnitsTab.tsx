'use client'

import { useState, useTransition } from 'react'
import { Plus, Search, MoreHorizontal, UserPlus, CheckCircle2, DoorOpen, X, Edit } from 'lucide-react'
import { createPropertyUnitAction, updatePropertyUnitAction } from '@/actions/properties'

export default function UnitsTab({ property }: { property: any }) {
  const units = property.units || []
  
  // Modal & Edit State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form State
  const [unitName, setUnitName] = useState('')
  const [unitType, setUnitType] = useState('')
  const [unitPrice, setUnitPrice] = useState<number | ''>('')
  const [unitStatus, setUnitStatus] = useState('VACANT')
  
  // Tenant Form State
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [rentStartDate, setRentStartDate] = useState('')
  const [rentEndDate, setRentEndDate] = useState('')

  // Helper to format dates for HTML input type="date"
  const formatDateForInput = (dateString: string | Date | null) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toISOString().split('T')[0]
  }

  // Handle auto-filling price when a type is selected
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value
    setUnitType(selectedType)
    
    if (property.unitPrices && property.unitPrices[selectedType]) {
      setUnitPrice(Number(property.unitPrices[selectedType]))
    } else {
      setUnitPrice('')
    }
  }

  const handleOpenCreate = () => {
    setEditingUnitId(null)
    setUnitName('')
    setUnitType('')
    setUnitPrice('')
    setUnitStatus('VACANT')
    setTenantName('')
    setTenantPhone('')
    setRentStartDate('')
    setRentEndDate('')
    setShowCreateModal(true)
  }

  const handleOpenEdit = (unit: any) => {
    setEditingUnitId(unit.id)
    setUnitName(unit.name || '')
    setUnitType(unit.type || '')
    setUnitPrice(unit.price || '')
    setUnitStatus(unit.status || 'VACANT')
    setTenantName(unit.tenantName || '')
    setTenantPhone(unit.tenantPhone || '')
    setRentStartDate(formatDateForInput(unit.rentStartDate))
    setRentEndDate(formatDateForInput(unit.rentEndDate))
    setShowCreateModal(true)
  }

  const handleSaveUnit = async () => {
    if (!unitName || !unitType || unitPrice === '') {
      alert("Please fill in the unit name, type, and price.")
      return
    }

    startTransition(async () => {
      const payload = {
        name: unitName,
        type: unitType,
        price: Number(unitPrice),
        status: unitStatus,
        tenantName: tenantName,
        tenantPhone: tenantPhone,
        rentStartDate: rentStartDate ? new Date(rentStartDate) : null,
        rentEndDate: rentEndDate ? new Date(rentEndDate) : null,
      }

      let res
      if (editingUnitId) {
        res = await updatePropertyUnitAction(editingUnitId, property.id, payload)
      } else {
        res = await createPropertyUnitAction(property.id, payload)
      }

      if (res.success) {
        setShowCreateModal(false)
        setEditingUnitId(null)
        setUnitName('')
        setUnitType('')
        setUnitPrice('')
        setUnitStatus('VACANT')
        setTenantName('')
        setTenantPhone('')
        setRentStartDate('')
        setRentEndDate('')
      } else {
        alert(res.error || "Failed to save unit")
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm overflow-hidden relative">
      
      {/* Assign / Edit Individual Unit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[440px] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[75vh] md:max-h-[85vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h3 className="text-[16px] sm:text-[18px] font-extrabold text-[#091F11]">
                {editingUnitId ? 'Edit Individual Unit' : 'Assign Individual Unit'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                <X className="w-4 h-4 text-[#091F11]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Block / Flat Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. Unit 1A, Flat 3"
                  value={unitName} 
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Bedroom Type</label>
                <select 
                  value={unitType} 
                  onChange={handleTypeChange}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none appearance-none"
                >
                  <option value="">Select a type</option>
                  {(property.bedroomTypes || []).map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Unit Price (₦)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={unitPrice} 
                  onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Occupancy Status</label>
                <div className="flex gap-2 sm:gap-3">
                  <button 
                    onClick={() => setUnitStatus('VACANT')}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[12px] sm:text-[13px] font-bold border transition-colors ${
                      unitStatus === 'VACANT' ? 'bg-gray-100 border-gray-300 text-[#091F11]' : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    Vacant
                  </button>
                  <button 
                    onClick={() => setUnitStatus('OCCUPIED')}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[12px] sm:text-[13px] font-bold border transition-colors ${
                      unitStatus === 'OCCUPIED' ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#005C3A]' : 'bg-white border-gray-200 text-gray-500'
                    }`}
                  >
                    Occupied
                  </button>
                </div>
              </div>

              {/* Dynamic Tenant Fields */}
              {unitStatus === 'OCCUPIED' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Current Tenant Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter tenant's full name"
                      value={tenantName} 
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Tenant Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 08012345678"
                      value={tenantPhone} 
                      onChange={(e) => setTenantPhone(e.target.value)}
                      className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none"
                    />
                  </div>
                  
                  {/* Grid stacks on mobile, side-by-side on larger screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Rent Start</label>
                      <input 
                        type="date" 
                        value={rentStartDate} 
                        onChange={(e) => setRentStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] sm:text-[13px] font-bold text-[#091F11] mb-1.5 sm:mb-2">Rent End</label>
                      <input 
                        type="date" 
                        value={rentEndDate} 
                        onChange={(e) => setRentEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] sm:text-[14px] font-medium text-[#091F11] focus:border-[#005C3A] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 sm:pt-4 border-t border-gray-100">
                <button 
                  onClick={handleSaveUnit}
                  disabled={isPending}
                  className="w-full bg-[#005C3A] text-white py-3 sm:py-3.5 rounded-xl text-[13px] sm:text-[14px] font-bold hover:bg-[#004b2f] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : (editingUnitId ? 'Save Changes' : 'Assign Unit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Header & Actions */}
      <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] lg:text-[18px] font-extrabold text-[#091F11]">Property Units</h2>
          <p className="text-[12px] lg:text-[13px] text-gray-500 mt-1">
            You have listed {property.totalUnits || 0} units, use the button to assign your units to room types and tenants.
          </p>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search units..." 
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium outline-none focus:border-[#005C3A]"
            />
          </div>
          <button 
            onClick={handleOpenCreate} 
            className="flex items-center justify-center gap-1.5 bg-[#005C3A] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold hover:bg-[#004b2f] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> <span className="hidden lg:inline">Assign Unit</span>
          </button>
        </div>
      </div>

      {/* Units List / Table / Empty State */}
      {units.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Unit Name</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Price</th>
                <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {units.map((unit: any) => (
                <tr key={unit.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-3 lg:py-4 px-4 lg:px-6">
                    <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">{unit.name}</div>
                    <div className="text-[11px] text-gray-500 lg:hidden mt-0.5">{unit.type}</div>
                  </td>
                  <td className="py-3 lg:py-4 px-4 lg:px-6 hidden lg:table-cell">
                    <span className="text-[13px] font-medium text-gray-600">{unit.type}</span>
                  </td>
                  <td className="py-3 lg:py-4 px-4 lg:px-6">
                    {unit.status === 'OCCUPIED' ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 bg-[#F0FDF4] text-[#005C3A] text-[10px] lg:text-[11px] font-bold rounded-full border border-[#BBF7D0]">
                          <CheckCircle2 className="w-3 h-3" /> Occupied
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">{unit.tenantName || 'Tenant Assigned'}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] lg:text-[11px] font-bold rounded-full border border-gray-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Vacant
                      </span>
                    )}
                  </td>
                  <td className="py-3 lg:py-4 px-4 lg:px-6 hidden sm:table-cell">
                    <span className="text-[13px] font-bold text-[#091F11]">₦{Number(unit.price).toLocaleString()}</span>
                  </td>
                  <td className="py-3 lg:py-4 px-4 lg:px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(unit)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-[#091F11] text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit Unit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 lg:py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <DoorOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-[16px] lg:text-[18px] font-extrabold text-[#091F11] mb-2">No units assigned yet</h3>
          <p className="text-[13px] lg:text-[14px] text-gray-500 max-w-sm mb-6">
            You have listed {property.totalUnits || 0} units, use the button to assign your units to room types and tenants.
          </p>
          <button 
            onClick={handleOpenCreate} 
            className="flex items-center justify-center gap-1.5 bg-white border-2 border-[#005C3A] text-[#005C3A] px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-[#F0FDF4] transition-colors"
          >
            <Plus className="w-4 h-4" /> Assign Individual Units
          </button>
        </div>
      )}
    </div>
  )
}