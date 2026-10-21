const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

function loadSource(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const localRequire = createRequire(filename)
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', compiled)((name) => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name), module, module.exports)
  return module.exports
}

const metrics = loadSource('src/lib/dashboard-metrics.ts')
const display = loadSource('src/lib/property-display.ts')
const management = loadSource('src/lib/tenant-management.ts', { '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display })
const rentPayments = loadSource('src/lib/rent-payments.ts')
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) }
const property = { id: 'property-1', address: '12 Example Street, Lagos', listingType: 'RENTAL', propertyType: 'APARTMENT', bedroomTypes: ['2-bedroom Flat'], shortletBedrooms: null, tenancyDuration: '6 months', ownerId: 'owner-1' }
const unit = { id: 'unit-1', propertyId: property.id, name: 'Flat 2A', type: '2-bedroom Flat', price: 500000, status: 'VACANT', tenantName: null, tenantPhone: null, tenantId: null, rentStartDate: null, rentEndDate: null }
const now = new Date('2026-10-21T11:00:00Z')
const input = { propertyId: property.id, unitId: unit.id, tenantName: '  Ada Tenant  ', tenantPhone: '08012345678', rentStartDate: '2026-10-21', rentEndDate: '2027-04-21' }

function assignmentFixture({ userId = 'owner-1', initialUnit = unit } = {}) {
  let current = structuredClone(initialUnit)
  const calls = []
  const refreshed = []
  const addTenantAction = loadSource('src/actions/tenants.ts', {
    '@/auth': { auth: async () => userId ? { user: { id: userId } } : null },
    '@/lib/tenant-management': management,
    'next/cache': { revalidatePath: (route) => refreshed.push(route) },
    '@/lib/prisma': { __esModule: true, default: { unit: { updateMany: async (query) => {
      calls.push(query)
      const { where, data } = query
      const matches = current.id === where.id && current.propertyId === where.propertyId && property.ownerId === where.property.ownerId && current.status === where.status && current.tenantId === where.tenantId && where.OR.some((item) => current.tenantName === item.tenantName)
      if (!matches) return { count: 0 }
      current = { ...current, ...data }
      return { count: 1 }
    } } } },
  }).addTenantAction
  return { addTenantAction, calls, refreshed, get current() { return current } }
}

test('adding a tenant claims an existing assigned vacant unit, preserves its pricing and refreshes both tenant views', async () => {
  const fixture = assignmentFixture()
  assert.equal((await fixture.addTenantAction(input)).success, true)
  assert.equal(fixture.current.id, unit.id)
  assert.equal(fixture.current.price, 500000)
  assert.equal(fixture.current.type, unit.type)
  assert.equal(fixture.current.tenantName, 'Ada Tenant')
  assert.equal(fixture.current.tenantPhone, '08012345678')
  assert.equal(fixture.current.status, 'OCCUPIED')
  assert.equal(fixture.current.rentStartDate.toISOString(), '2026-10-21T00:00:00.000Z')
  assert.equal(fixture.current.rentEndDate.toISOString(), '2027-04-21T00:00:00.000Z')
  assert.deepEqual(Object.keys(fixture.calls[0].data).sort(), ['rentEndDate', 'rentStartDate', 'status', 'tenantName', 'tenantPhone'])
  for (const route of ['/dashboard', '/dashboard/tenants', '/dashboard/properties', `/dashboard/properties/${property.id}`, `/dashboard/properties/${property.id}/manage`]) assert.ok(fixture.refreshed.includes(route))
})

test('assignment rejects unauthenticated users, foreign properties, nonexistent units and mismatched property/unit pairs', async () => {
  const unauthenticated = assignmentFixture({ userId: null })
  assert.equal((await unauthenticated.addTenantAction(input)).success, false)
  assert.equal(unauthenticated.calls.length, 0)
  for (const [options, changes] of [[{ userId: 'other-owner' }, {}], [{}, { unitId: 'not-assigned' }], [{}, { propertyId: 'other-property' }]]) {
    const fixture = assignmentFixture(options)
    assert.equal((await fixture.addTenantAction({ ...input, ...changes })).success, false)
    assert.equal(fixture.current.status, 'VACANT')
    assert.equal(fixture.refreshed.length, 0)
  }
})

test('occupied units and units with an existing tenant cannot be overwritten even from a stale assignment form', async () => {
  for (const changes of [{ status: 'OCCUPIED', tenantName: 'Existing Tenant' }, { tenantId: 'registered-tenant' }, { tenantName: 'Existing Tenant' }]) {
    const fixture = assignmentFixture({ initialUnit: { ...unit, ...changes } })
    assert.equal((await fixture.addTenantAction(input)).success, false)
    assert.deepEqual(fixture.current, { ...unit, ...changes })
  }
  const fixture = assignmentFixture()
  const results = await Promise.all([fixture.addTenantAction(input), fixture.addTenantAction({ ...input, tenantName: 'Other Tenant' })])
  assert.equal(results.filter((result) => result.success).length, 1)
  assert.equal(fixture.current.tenantName, 'Ada Tenant')
})

test('tenant name, phone, assigned unit and valid ordered calendar dates are required before writing', async () => {
  for (const changes of [{ unitId: '' }, { propertyId: '' }, { tenantName: ' ' }, { tenantPhone: '' }, { tenantPhone: 'phone' }, { rentStartDate: '' }, { rentEndDate: '2026-02-30' }, { rentEndDate: input.rentStartDate }, { rentEndDate: '2026-10-20' }]) {
    const fixture = assignmentFixture()
    assert.equal((await fixture.addTenantAction({ ...input, ...changes })).success, false)
    assert.equal(fixture.calls.length, 0)
  }
})

test('unit selection excludes occupied, already linked and partially assigned units', () => {
  assert.equal(management.isUnitAvailableForTenant(unit), true)
  assert.equal(management.isUnitAvailableForTenant({ ...unit, tenantName: '' }), true)
  for (const change of [{ status: 'OCCUPIED' }, { tenantId: 'tenant-id' }, { tenantName: 'Existing Tenant' }, { tenantName: ' ' }, { status: 'MAINTENANCE' }]) assert.equal(management.isUnitAvailableForTenant({ ...unit, ...change }), false)
})

test('rent statuses use Lagos calendar days and do not mark missing dates as ongoing', () => {
  const status = (start, end, date = now) => management.getTenantStatus({ rentStartDate: start, rentEndDate: end }, date).key
  assert.equal(status(null, null), 'missing')
  assert.equal(status(null, 'invalid'), 'missing')
  assert.equal(status('2026-01-01', '2026-10-20'), 'expired')
  assert.equal(status('2026-01-01', '2026-10-21'), 'expiring')
  assert.equal(status('2026-10-22', '2027-10-22'), 'scheduled')
  assert.equal(status('2026-01-01', '2026-11-21'), 'active')
  assert.equal(status('2026-01-01', '2026-10-21', new Date('2026-10-21T23:30:00Z')), 'expired')
})

test('global tenant data includes existing tenants and assigned vacant units, scoped to the authenticated owner', async () => {
  const queries = []
  let captured
  const Page = loadSource('src/app/dashboard/tenants/page.tsx', {
    '@/auth': { auth: async () => ({ user: { id: 'owner-1' } }) },
    '@/lib/property-display': display, '@/lib/tenant-management': management,
    '@/lib/prisma': { __esModule: true, default: {
      unit: { findMany: async (query) => { queries.push(query); return [{ ...unit, property }] } },
      property: { findMany: async (query) => { queries.push(query); return [property] } },
    } },
    './TenantsClient': { __esModule: true, default: (props) => { captured = props; return null } },
    'next/navigation': { redirect: () => { throw new Error('redirect') } },
  }).default
  renderToStaticMarkup(await Page())
  assert.equal(queries[0].where.property.ownerId, 'owner-1')
  assert.equal(queries[1].where.ownerId, 'owner-1')
  assert.equal(queries[0].where.status, undefined)
  assert.equal(queries[0].select.property.select.directOwnerPhone, undefined)
  assert.equal(captured.units[0].name, 'Flat 2A')
  assert.equal(captured.units[0].status, 'VACANT')
  assert.match(captured.units[0].property.title, /2-bedroom Flat available for rent in 12 Example Street/)
  assert.equal(captured.properties[0].id, property.id)
})

test('unauthenticated tenant page redirects before querying units', async () => {
  const Page = loadSource('src/app/dashboard/tenants/page.tsx', {
    '@/auth': { auth: async () => null }, '@/lib/prisma': { __esModule: true, default: {} },
    '@/lib/property-display': display, '@/lib/tenant-management': management, './TenantsClient': {},
    'next/navigation': { redirect: (location) => { throw Object.assign(new Error('redirect'), { location }) } },
  }).default
  await assert.rejects(Page(), { location: '/login' })
})

const Directory = loadSource('src/components/dashboard/TenantDirectory.tsx', {
  '@/lib/tenant-management': management, '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display, 'next/link': link,
  './AddTenantDialog': { __esModule: true, default: () => null }, './RecordRentPayment': { __esModule: true, default: () => null },
}).default
const occupied = management.serializeTenantUnit({ ...unit, status: 'OCCUPIED', tenantName: 'Ada Tenant', tenantPhone: '08012345678', rentStartDate: new Date('2026-01-01'), rentEndDate: new Date('2027-01-01') }, property)
function renderDirectory(units = [occupied, management.serializeTenantUnit({ ...unit, id: 'vacant-unit', name: 'Vacant unit' }, property)]) {
  return renderToStaticMarkup(React.createElement(Directory, { units, properties: [{ id: property.id, title: 'Test property', address: property.address }], asOf: now.toISOString() }))
}

test('tenant table shows names, callable phones, units, real rent, both dates and visible payment actions', () => {
  const html = renderDirectory()
  assert.match(html, /<table/)
  assert.match(html, /Ada Tenant/)
  assert.match(html, /href="tel:08012345678"/)
  assert.match(html, /Flat 2A/)
  assert.match(html, /12 Example Street/)
  assert.match(html, /₦500,000/)
  assert.match(html, /6 months/)
  assert.match(html, /1 Jan 2026/)
  assert.match(html, /1 Jan 2027/)
  assert.match(html, /Active/)
  assert.match(html, /Record Payment/)
  assert.match(html, /Add Tenant/)
  assert.doesNotMatch(html, /rounded-2xl|shadow-sm|hidden xl:inline|Tenant Details Modal/)
  assert.doesNotMatch(html, /Vacant unit<\/p>/)
})

test('tenant table exposes incomplete records, refuses unsafe phone links and guides empty portfolios to Units', () => {
  const html = renderDirectory([{ ...occupied, tenantName: null, tenantPhone: 'javascript:alert(1)', rentStartDate: null, rentEndDate: null }])
  assert.match(html, /Tenant name not recorded/)
  assert.match(html, /Dates not recorded/)
  assert.match(html, /Not recorded/)
  assert.match(html, /Complete tenant details/)
  assert.doesNotMatch(html, /href="tel:javascript/)
  const empty = renderDirectory([])
  assert.match(empty, /No tenants added yet/)
  assert.match(empty, /Assign an individual unit/)
  assert.match(empty, /Add Tenant/)
})

test('Add Tenant form offers only assigned vacant units and explains how to assign units when none are available', () => {
  const Dialog = loadSource('src/components/dashboard/AddTenantDialog.tsx', {
    '@/actions/tenants': { addTenantAction: async () => ({ success: true }) },
    '@/lib/tenant-management': management, '@/lib/rent-payments': rentPayments, '@/lib/property-display': display,
    'next/navigation': { useRouter: () => ({ refresh: () => {} }) }, 'next/link': link,
  }).default
  const base = { properties: [{ id: property.id, title: 'Test property', address: property.address }], onClose: () => {} }
  const html = renderToStaticMarkup(React.createElement(Dialog, { ...base, units: [occupied, management.serializeTenantUnit(unit, property)] }))
  assert.match(html, /option value="unit-1">Flat 2A/)
  assert.match(html, /Tenant’s full name/)
  assert.match(html, /Rent start date/)
  assert.match(html, /Rent end date/)
  const empty = renderToStaticMarkup(React.createElement(Dialog, { ...base, units: [occupied] }))
  assert.doesNotMatch(empty, /option value="unit-1"/)
  assert.match(empty, /No vacant assigned units/)
  assert.match(empty, /manage\?tab=Units/)
})
