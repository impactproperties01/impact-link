'use client'

import { useState } from 'react'
import { Search, Download, CheckCircle2, AlertCircle, Receipt, Filter } from 'lucide-react'

export default function PaymentsClient({ properties }: { properties: any[] }) {
  // Aggregate data globally
  let globalExpected = 0
  let globalCollected = 0
  const globalMockPayments: any[] = []

  properties.forEach(property => {
    const units = property.units || []
    
    units.forEach((unit: any) => {
      const price = Number(unit.price || 0)
      globalExpected += price
      
      if (unit.status === 'OCCUPIED') {
        globalCollected += price
        globalMockPayments.push({
          id: unit.id,
          propertyTitle: property.title,
          tenantName: unit.tenantName,
          unitName: unit.name,
          amount: price,
          date: unit.rentStartDate || new Date().toISOString(),
          method: 'Bank Transfer'
        })
      }
    })
  })

  const globalOutstanding = globalExpected - globalCollected
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPayments = globalMockPayments.filter((p: any) => 
    p.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 min-h-screen pb-24 font-sans">
      <div className="mb-8">
        <h1 className="text-[24px] lg:text-[28px] font-extrabold text-[#091F11]">Global Financials</h1>
        <p className="text-[14px] text-gray-500 mt-1">Track revenue and outstanding balances across your entire portfolio.</p>
      </div>

      {/* Global Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-[12px] lg:text-[13px] font-bold text-gray-500 uppercase tracking-wide">Expected Revenue</span>
          </div>
          <span className="text-[24px] lg:text-[32px] font-extrabold text-[#091F11]">₦{globalExpected.toLocaleString()}</span>
          <span className="text-[11px] lg:text-[12px] text-gray-400 font-medium mt-1">Based on 100% portfolio occupancy</span>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[24px] border border-[#BBF7D0] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F0FDF4] rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#005C3A]" />
            </div>
            <span className="text-[12px] lg:text-[13px] font-bold text-[#005C3A] uppercase tracking-wide">Total Collected</span>
          </div>
          <span className="text-[24px] lg:text-[32px] font-extrabold text-[#091F11]">₦{globalCollected.toLocaleString()}</span>
          <span className="text-[11px] lg:text-[12px] text-gray-500 font-medium mt-1">From {globalMockPayments.length} active tenants globally</span>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[24px] border border-red-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[12px] lg:text-[13px] font-bold text-red-500 uppercase tracking-wide">Total Outstanding</span>
          </div>
          <span className="text-[24px] lg:text-[32px] font-extrabold text-red-600">₦{globalOutstanding.toLocaleString()}</span>
          <span className="text-[11px] lg:text-[12px] text-gray-500 font-medium mt-1">From vacant or unpaid units</span>
        </div>
      </div>

      {/* Global Transactions Ledger */}
      <div className="bg-white rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tenant, unit, or property..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium outline-none focus:border-[#005C3A]"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors shrink-0">
            <Filter className="w-4 h-4" /> <span className="ml-1.5">Export</span>
          </button>
        </div>

        {globalMockPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Tenant</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Property & Unit</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date Paid</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">{payment.tenantName}</div>
                      {/* Mobile Fallback */}
                      <div className="text-[11px] text-gray-500 mt-0.5 font-medium sm:hidden">
                        {payment.propertyTitle} <span className="font-bold text-[#005C3A]">({payment.unitName})</span>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden sm:table-cell">
                      <div className="text-[13px] font-bold text-[#091F11]">{payment.propertyTitle}</div>
                      <div className="text-[11px] text-gray-500 font-medium">Unit: <span className="text-[#005C3A] font-bold">{payment.unitName}</span></div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">₦{Number(payment.amount).toLocaleString()}</div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden lg:table-cell">
                      <div className="text-[12px] lg:text-[13px] font-medium text-gray-600">
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] lg:text-[11px] font-bold rounded-lg border bg-[#F0FDF4] text-[#005C3A] border-[#BBF7D0]">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-right">
                      <button className="inline-flex items-center justify-center w-8 h-8 lg:w-auto lg:px-3 lg:py-1.5 bg-white border border-gray-200 text-[#091F11] text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 lg:mr-1.5" /> <span className="hidden lg:inline">Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-[18px] font-extrabold text-[#091F11] mb-2">No payments recorded</h3>
            <p className="text-[14px] text-gray-500 max-w-sm">
              Your global payment history will appear here once you assign units and record payments across your properties.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}