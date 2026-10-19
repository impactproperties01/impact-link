import { Phone, User } from 'lucide-react'

type InspectionContactProps = { name?: string | null; phone?: string | null }

export default function InspectionContact({ name, phone }: InspectionContactProps) {
  if (!name || !phone) return null
  return (
    <section aria-label="Inspection contact" className="rounded-2xl border border-gray-100 bg-white p-5">
      <h2 className="text-lg font-bold text-brand-dark">Inspection contact</h2>
      <p className="mt-1 text-sm text-gray-500">Our team will use these details to coordinate inspections.</p>
      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-dark"><User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />{name}</p>
      <a href={`tel:${phone.replace(/[\s()-]/g, '')}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-forest hover:underline"><Phone className="h-4 w-4 shrink-0" aria-hidden="true" />{phone}</a>
    </section>
  )
}
