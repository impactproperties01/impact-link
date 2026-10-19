'use client'

import { useState } from 'react'
import { Search, Download, CheckCircle2, Clock, AlertCircle, Receipt, Filter } from 'lucide-react'

export default function PaymentsTab({ property }: { property: any }) {
  const units = property.units || []
  
  // Dynamic Financial Calculations
  const occupiedUnits = units.filter((u: any) => u.status === 'OCCUPIED')
  
  const expectedTotal = units.reduce((acc: number, unit: any) => acc + Number(unit.price || 0), 0)
  // For the UI, we'll assume occupied units have paid their base rent upfront
  const collectedTotal = occupiedUnits.reduce((acc: number, unit: any) => acc + Number(unit.price || 0), 0) 
  const outstandingTotal = expectedTotal - collectedTotal

  // Generate a mock payment history based on occupied units to show off the UI
  // In the future, this will be mapped to a real `property.payments` array
  const mockPayments = occupiedUnits.map((unit: any, index: number) => ({
    id: `pay-${index}`,
    tenantName: unit.tenantName,
    unitName: unit.name,
    amount: unit.price,
    date: unit.rentStartDate || new Date().toISOString(),
    status: 'PAID',
    method: 'Bank Transfer'
  }))

  const [searchTerm, setSearchTerm] = useState('')

  const filteredPayments = mockPayments.filter((p: any) => 
    p.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.unitName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-[12px] lg:text-[13px] font-bold text-gray-500 uppercase tracking-wide">Expected Rent</span>
          </div>
          <span className="text-[22px] lg:text-[28px] font-extrabold text-[#091F11]">₦{expectedTotal.toLocaleString()}</span>
          <span className="text-[11px] lg:text-[12px] text-gray-400 font-medium mt-1">Based on 100% occupancy</span>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[24px] border border-[#BBF7D0] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F0FDF4] rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#F0FDF4] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#005C3A]" />
            </div>
            <span className="text-[12px] lg:text-[13px] font-bold text-[#005C3A] uppercase tracking-wide">Collected</span>
          </div>
          <span className="text-[22px] lg:text-[28px] font-extrabold text-[#091F11]">₦{collectedTotal.toLocaleString()}</span>
          <span className="text-[11px] lg:text-[12px] text-gray-500 font-medium mt-1">From {occupiedUnits.length} active tenants</span>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl lg:rounded-[24px] border border-red-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 opacity-50"></div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[12px] lg:text-[13px] font-bold text-red-500 uppercase tracking-wide">Outstanding</span>
          </div>
          <span className="text-[22px] lg:text-[28px] font-extrabold text-red-600">₦{outstandingTotal.toLocaleString()}</span>
          <span className="text-[11px] lg:text-[12px] text-gray-500 font-medium mt-1">From vacant or unpaid units</span>
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="bg-white rounded-2xl lg:rounded-[24px] border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-[16px] lg:text-[18px] font-extrabold text-[#091F11]">Payment History</h2>
            <p className="text-[12px] lg:text-[13px] text-gray-500 mt-1">Track incoming rent and generate receipts.</p>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tenant or unit..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium outline-none focus:border-[#005C3A]"
              />
            </div>
            <button className="flex items-center justify-center w-10 h-10 lg:w-auto lg:px-4 lg:py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[13px] font-bold hover:bg-gray-50 transition-colors shrink-0">
              <Filter className="w-4 h-4" /> <span className="hidden lg:inline ml-1.5">Filter</span>
            </button>
          </div>
        </div>

        {mockPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Tenant & Unit</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date Paid</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Method</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 lg:py-4 px-4 lg:px-6 text-[11px] lg:text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">{payment.tenantName}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 font-medium flex items-center gap-1">
                        Unit: <span className="font-bold text-[#005C3A]">{payment.unitName}</span>
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="font-extrabold text-[#091F11] text-[13px] lg:text-[14px]">₦{Number(payment.amount).toLocaleString()}</div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden sm:table-cell">
                      <div className="text-[12px] lg:text-[13px] font-medium text-gray-600">
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 hidden lg:table-cell">
                      <div className="text-[12px] lg:text-[13px] font-medium text-gray-600">
                        {payment.method}
                      </div>
                    </td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
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
          <div className="py-12 lg:py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-[16px] lg:text-[18px] font-extrabold text-[#091F11] mb-2">No payments recorded</h3>
            <p className="text-[13px] lg:text-[14px] text-gray-500 max-w-sm mb-6">
              When you record a payment for a tenant in the Tenants tab, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}