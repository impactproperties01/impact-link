'use client'

import TenantDirectory from '@/components/dashboard/TenantDirectory'
import { serializeTenantUnit, type TenantProperty, type TenantSourceUnit } from '@/lib/tenant-management'
import { getListingTitle } from '@/lib/property-display'

export default function TenantsTab({ property, asOf, onManageUnits }: { property: TenantProperty & { units: TenantSourceUnit[] }; asOf: string; onManageUnits: () => void }) {
  const properties = [{ id: property.id, title: getListingTitle(property), address: property.address }]
  return <TenantDirectory units={property.units.map((unit) => serializeTenantUnit(unit, property))} properties={properties} asOf={asOf} propertyId={property.id} onManageUnits={onManageUnits} />
}
