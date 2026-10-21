type PropertyRelationshipDetailsProps = {
  propertyRelationship?: 'DIRECT_OWNER' | 'OTHER' | null
  ownerRelationship?: string | null
  directOwnerName?: string | null
  directOwnerPhone?: string | null
  directOwnerAddress?: string | null
}

export default function PropertyRelationshipDetails(details: PropertyRelationshipDetailsProps) {
  if (!details.propertyRelationship) return null

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5">
      <h2 className="text-lg font-bold text-brand-dark">Relationship to property</h2>
      <dl className="mt-3 space-y-3 text-sm">
        <div><dt className="text-gray-500">Relationship</dt><dd className="mt-1 font-semibold text-brand-dark">{details.propertyRelationship === 'DIRECT_OWNER' ? 'Direct owner' : 'Other'}</dd></div>
        {details.propertyRelationship === 'OTHER' && details.ownerRelationship && <div><dt className="text-gray-500">Relationship with the direct owner</dt><dd className="mt-1 break-words text-brand-dark">{details.ownerRelationship}</dd></div>}
        {details.directOwnerName && <div><dt className="text-gray-500">Direct owner name</dt><dd className="mt-1 break-words text-brand-dark">{details.directOwnerName}</dd></div>}
        {details.directOwnerPhone && <div><dt className="text-gray-500">Direct owner phone</dt><dd className="mt-1 text-brand-dark">{details.directOwnerPhone}</dd></div>}
        {details.directOwnerAddress && <div><dt className="text-gray-500">Direct owner address</dt><dd className="mt-1 whitespace-pre-wrap break-words text-brand-dark">{details.directOwnerAddress}</dd></div>}
      </dl>
    </section>
  )
}
