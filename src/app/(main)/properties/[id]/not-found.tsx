import Link from 'next/link'

export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-brand-dark">Listing unavailable</h1>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">This listing is no longer available or could not be found.</p>
      <Link href="/" className="mt-6 inline-flex rounded-xl bg-brand-forest px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">Browse properties</Link>
    </div>
  )
}
