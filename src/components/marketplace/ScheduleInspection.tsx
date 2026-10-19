import { CalendarDays, Mail, Phone } from 'lucide-react'
import { getInspectionEmailHref, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from '@/lib/support'

export default function ScheduleInspection({ propertyId, title }: { propertyId: string; title: string }) {
  return (
    <section aria-labelledby="schedule-inspection" className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 shrink-0 text-brand-forest" aria-hidden="true" />
        <h2 id="schedule-inspection" className="text-lg font-bold text-brand-dark">Schedule an inspection</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">Contact our team by email or phone to arrange a visit. Please mention this listing when you call.</p>
      <div className="mt-4 space-y-3">
        <a href={getInspectionEmailHref(propertyId, title)} className="flex items-start gap-3 rounded-xl bg-brand-forest px-4 py-3 text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0"><span className="block text-sm font-semibold">Email us</span><span className="mt-1 block break-all text-xs text-white/80">{SUPPORT_EMAIL}</span></span>
        </a>
        <a href={SUPPORT_PHONE_HREF} className="flex items-start gap-3 rounded-xl border border-brand-forest px-4 py-3 text-brand-forest transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span><span className="block text-sm font-semibold">Call us</span><span className="mt-1 block text-xs">{SUPPORT_PHONE}</span></span>
        </a>
      </div>
      <p className="mt-4 break-all text-xs text-gray-500">Listing reference: {propertyId}</p>
    </section>
  )
}
