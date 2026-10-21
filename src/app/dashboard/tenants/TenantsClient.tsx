'use client'

import TenantDirectory from '@/components/dashboard/TenantDirectory'
import type { TenantPropertyOption, TenantUnit } from '@/lib/tenant-management'

export default function TenantsClient({ units, properties, asOf }: { units: TenantUnit[]; properties: TenantPropertyOption[]; asOf: string }) {
  return <div className="mx-auto max-w-7xl pb-24"><TenantDirectory units={units} properties={properties} asOf={asOf} /></div>
}
