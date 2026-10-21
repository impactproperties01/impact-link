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
const image = { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) }
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) }
const now = new Date('2026-10-21T11:00:00Z')
const property = {
  id: 'property-1', listingType: 'RENTAL', propertyType: 'APARTMENT', address: '10 Example Street, Lagos',
  title: 'Standard RENTAL Listing', basePrice: 500000, bedrooms: 0, bathrooms: 0, bedroomTypes: ['2-bedroom Flat'],
  shortletBedrooms: null, size: null, images: ['https://res.cloudinary.com/test/front.jpg'], status: 'PENDING',
  tenancyDuration: '6 months', unitPrices: { '2-bedroom Flat': 500000 }, totalUnits: 4, availableUnits: 0, units: [],
}
const Card = loadSource('src/components/dashboard/PropertyCard.tsx', {
  '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display, 'next/image': image, 'next/link': link,
}).default
const textOf = (html) => html.replace(/<[^>]*>/g, '')

test('occupancy keeps zero vacancies and does not invent units for properties without unit information', () => {
  assert.deepEqual(metrics.getPropertyOccupancy(property), { total: 4, occupied: 4, vacant: 0, unknown: 0 })
  assert.deepEqual(metrics.getPropertyOccupancy({ ...property, totalUnits: 0, availableUnits: 0 }), { total: 0, occupied: 0, vacant: 0, unknown: 0 })
  assert.deepEqual(metrics.getPropertyOccupancy({ ...property, listingType: 'SALE', propertyType: 'HOUSE' }), { total: 0, occupied: 0, vacant: 0, unknown: 0 })
  assert.deepEqual(metrics.getPropertyOccupancy({ ...property, availableUnits: null }), { total: 4, occupied: 0, vacant: 0, unknown: 4 })
})

test('individual unit records take precedence over stale summary availability and expose untracked occupancy', () => {
  const mixed = { ...property, availableUnits: 4, units: [{ status: 'OCCUPIED' }, { status: 'VACANT' }] }
  assert.deepEqual(metrics.getPropertyOccupancy(mixed), { total: 4, occupied: 1, vacant: 1, unknown: 2 })
  assert.deepEqual(metrics.getPropertyOccupancy({ ...mixed, totalUnits: 1 }), { total: 2, occupied: 1, vacant: 1, unknown: 0 })
  assert.deepEqual(metrics.getPropertyOccupancy({ ...mixed, totalUnits: 2, units: [{ status: 'UNKNOWN' }] }), { total: 2, occupied: 0, vacant: 0, unknown: 2 })
  assert.deepEqual(metrics.getPortfolioOccupancy([property, mixed]), { total: 8, occupied: 5, vacant: 1, unknown: 2 })
  assert.deepEqual(metrics.getPortfolioOccupancy([]), { total: 0, occupied: 0, vacant: 0, unknown: 0 })
})

test('dashboard dates use the Lagos calendar for year boundaries, due dates and greetings', () => {
  const dates = metrics.getDashboardDates(new Date('2025-12-31T23:30:00Z'))
  assert.equal(dates.year, 2026)
  assert.equal(dates.today.toISOString(), '2025-12-31T23:00:00.000Z')
  assert.equal(dates.yearStart.toISOString(), '2025-12-31T23:00:00.000Z')
  assert.equal(dates.tomorrow.toISOString(), '2026-01-01T23:00:00.000Z')
  assert.equal(dates.upcomingEnd.toISOString(), '2026-01-31T23:00:00.000Z')
  assert.equal(metrics.getDashboardDates(new Date('2026-10-21T08:00:00Z')).greeting, 'Good morning')
  assert.equal(metrics.getDashboardDates(now).greeting, 'Good afternoon')
  assert.equal(metrics.getDashboardDates(new Date('2026-10-21T16:00:00Z')).greeting, 'Good evening')
})

function dataFixture({ empty = false, paymentCount = 101, ledger = [] } = {}) {
  const calls = []
  const record = (table, method, query, value) => { calls.push({ table, method, query }); return Promise.resolve(value) }
  const prisma = {
    property: { findMany: (query) => record('property', 'findMany', query, empty ? [] : [property]) },
    payment: {
      aggregate: (query) => record('payment', 'aggregate', query, { _sum: { amount: empty ? null : query.where.status === 'PAID' ? 1250000 : 250000 } }),
      count: (query) => record('payment', 'count', query, paymentCount),
      findMany: (query) => record('payment', 'findMany', query, query.select.receiptUrl ? ledger : []),
    },
    unit: { findMany: (query) => record('unit', 'findMany', query, []) },
  }
  return { calls, ...loadSource('src/lib/dashboard-data.ts', {
    '@/lib/prisma': { __esModule: true, default: prisma }, '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display,
  }) }
}

test('dashboard reads are scoped to the current owner and finances use paid and unpaid records with explicit date bounds', async () => {
  const state = dataFixture()
  const data = await state.getDashboardData('owner-1', now)
  assert.equal(data.propertyCount, 1)
  assert.equal(data.occupancy.vacant, 0)
  assert.equal(data.rentCollected, 1250000)
  assert.equal(data.outstanding, 250000)
  for (const call of state.calls) {
    if (call.table === 'property') assert.equal(call.query.where.ownerId, 'owner-1')
    else if (call.table === 'unit') assert.equal(call.query.where.property.ownerId, 'owner-1')
    else {
      assert.equal(call.query.where.OR[0].lease.property.ownerId, 'owner-1')
      assert.equal(call.query.where.OR[1].unit.property.ownerId, 'owner-1')
    }
  }
  const collected = state.calls.find((call) => call.method === 'aggregate' && call.query.where.status === 'PAID')
  assert.deepEqual(collected.query.where.datePaid, { gte: new Date('2025-12-31T23:00:00Z'), lte: now })
  const outstanding = state.calls.find((call) => call.method === 'aggregate' && call.query.where.status !== 'PAID')
  assert.deepEqual(outstanding.query.where.status.in, ['PENDING', 'OVERDUE'])
  assert.equal(outstanding.query.where.dueDate.lt.toISOString(), '2026-10-21T23:00:00.000Z')
  const due = state.calls.find((call) => call.table === 'payment' && call.method === 'findMany')
  assert.equal(due.query.take, 5)
  assert.equal(due.query.where.dueDate.lt.toISOString(), '2026-11-20T23:00:00.000Z')
  const recent = state.calls.find((call) => call.table === 'property' && call.query.take)
  assert.equal(recent.query.take, 5)
  assert.equal(recent.query.select.directOwnerPhone, undefined)
})

test('empty portfolios and absent payment sums return honest zeros, and missing owner IDs never query data', async () => {
  const state = dataFixture({ empty: true })
  const data = await state.getDashboardData('owner-1', now)
  assert.equal(data.propertyCount, 0)
  assert.equal(data.rentCollected, 0)
  assert.equal(data.outstanding, 0)
  assert.equal(data.occupancy.total, 0)
  const denied = dataFixture()
  await assert.rejects(denied.getDashboardData('', now))
  await assert.rejects(denied.getOwnerPayments('', 1, now))
  assert.equal(denied.calls.length, 0)
})

test('payment history paginates, derives unpaid status from due dates, and uses only stored receipts and dates', async () => {
  const lease = { tenant: { name: 'Ada Tenant', email: 'ada@example.invalid' }, property }
  const state = dataFixture({ ledger: [
    { id: 'paid', amount: 100000, status: 'PAID', dueDate: new Date('2026-10-01'), datePaid: null, receiptUrl: 'https://example.com/receipt.pdf', lease },
    { id: 'late', amount: 200000, status: 'PENDING', dueDate: new Date('2026-10-20'), datePaid: null, receiptUrl: 'javascript:alert(1)', lease },
    { id: 'today', amount: 300000, status: 'PENDING', dueDate: new Date('2026-10-21T00:00:00Z'), datePaid: null, receiptUrl: null, lease },
    { id: 'future', amount: 400000, status: 'PENDING', dueDate: new Date('2026-11-01'), datePaid: null, receiptUrl: null, lease },
  ] })
  const data = await state.getOwnerPayments('owner-1', 999, now)
  assert.equal(data.page, 3)
  assert.equal(data.totalPages, 3)
  assert.equal(data.totalPayments, 101)
  const read = state.calls.find((call) => call.method === 'findMany')
  assert.equal(read.query.skip, 100)
  assert.equal(read.query.take, 50)
  assert.equal(read.query.where.OR[0].lease.property.ownerId, 'owner-1')
  assert.equal(read.query.where.OR[1].unit.property.ownerId, 'owner-1')
  assert.deepEqual(data.payments.map((payment) => payment.status), ['Paid', 'Overdue', 'Due today', 'Pending'])
  assert.equal(data.payments[0].datePaid, null)
  assert.equal(data.payments[1].receiptUrl, null)
  assert.equal(data.payments[0].receiptUrl, 'https://example.com/receipt.pdf')
  assert.equal(data.payments[0].propertyAddress, property.address)
})

function renderCard(overrides = {}) {
  return renderToStaticMarkup(React.createElement(Card, { property: { ...property, ...overrides } }))
}

test('owner property cards render all approval states as accessible private detail links', () => {
  for (const [status, label] of Object.entries({ PENDING: 'Pending verification', VERIFIED: 'Approved', REJECTED: 'Rejected', SOLD: 'Sold', RENTED: 'Rented' })) {
    const html = renderCard({ status })
    assert.match(html, /href="\/dashboard\/properties\/property-1"/)
    assert.match(html, /aria-label="View property:/)
    assert.ok(html.includes(label))
  }
})

test('dashboard property cards show the correct listing title, period, selected price and availability', () => {
  const rent = textOf(renderCard())
  assert.match(rent, /2-bedroom Flat available for rent/)
  assert.match(rent, /₦500,000/)
  assert.match(rent, /\/ 6 months/)
  assert.match(rent, /4 occupied · 0 vacant/)
  assert.doesNotMatch(rent, /Standard RENTAL Listing|0 beds|0 baths|0 sqm/)
  const range = textOf(renderCard({ bedroomTypes: ['2-bedroom Flat', '3-bedroom Flat'], unitPrices: { '2-bedroom Flat': 500000, '3-bedroom Flat': 700000, stale: 1 } }))
  assert.match(range, /From ₦500,000/)
  const sale = textOf(renderCard({ listingType: 'SALE', propertyType: 'LAND', size: 600 }))
  assert.match(sale, /Land for sale/)
  assert.match(sale, /600 sqm/)
  assert.doesNotMatch(sale, /\/ year|\/ night|occupied|vacant/)
  const shortlet = textOf(renderCard({ listingType: 'SHORTLET', shortletBedrooms: '2-bedrooms' }))
  assert.match(shortlet, /2-bedrooms available for shortlet/)
  assert.match(shortlet, /\/ night/)
  const lease = textOf(renderCard({ listingType: 'LEASE', propertyType: 'COMMERCIAL' }))
  assert.match(lease, /Commercial building for lease/)
  assert.match(lease, /For lease/)
  assert.match(lease, /\/ year/)
})

test('missing property photos have an honest fallback and unknown occupancy is clearly shown', () => {
  const html = renderCard({ images: [], units: [{ status: 'OCCUPIED' }] })
  assert.match(html, /No photo provided/)
  assert.doesNotMatch(html, /hero-image.png/)
  assert.match(textOf(html), /3 awaiting occupancy details/)
})

async function dashboardPage({ user = { id: 'owner-1', role: 'OWNER', name: 'Ada Owner', email: 'ada@example.invalid' }, overrides = {} } = {}) {
  const calls = []
  const data = {
    properties: [], propertyCount: 0, occupancy: { total: 0, occupied: 0, vacant: 0, unknown: 0 },
    rentCollected: 0, outstanding: 0, rentDue: [], renewals: [], dates: metrics.getDashboardDates(now), ...overrides,
  }
  const Page = loadSource('src/app/dashboard/page.tsx', {
    '@/lib/admin': { getCurrentUser: async () => user },
    '@/lib/dashboard-data': { getDashboardData: async (id) => { calls.push(id); return data } },
    '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display,
    '@/components/dashboard/PropertyCard': { __esModule: true, default: Card },
    'next/navigation': { redirect: (location) => { throw Object.assign(new Error('redirect'), { location }) } },
    'next/image': image, 'next/link': link,
  }).default
  return { calls, render: async () => renderToStaticMarkup(await Page()) }
}

test('dashboard authorizes before loading data and retains the admin review redirect', async () => {
  for (const [user, location] of [[null, '/login'], [{ id: 'admin-1', role: 'ADMIN' }, '/dashboard/admin/listings']]) {
    const page = await dashboardPage({ user })
    await assert.rejects(page.render(), { location })
    assert.equal(page.calls.length, 0)
  }
})

test('dashboard renders real names, zero balances, empty states and working navigation without sample data', async () => {
  const state = await dashboardPage()
  const html = await state.render()
  assert.deepEqual(state.calls, ['owner-1'])
  assert.match(html, /Ada/)
  assert.match(html, /Good afternoon/)
  assert.match(textOf(html), /Properties0Units0Occupied0Vacant0/)
  assert.match(html, /No properties yet/)
  assert.match(html, /No unpaid rent is due/)
  assert.match(html, /No tenant renewals are due/)
  assert.match(html, /href="\/properties\/new"/)
  assert.match(html, /href="\/dashboard\/payments"/)
  assert.doesNotMatch(html, /Daniel|Tunde|Ibrahim|Funke|24,600,000|3,200,000|\/dashboard\/properties\/new/)
})

test('dashboard distinguishes unpaid rent records from occupied-unit renewal reminders', async () => {
  const state = await dashboardPage({ overrides: {
    properties: [property], propertyCount: 1, occupancy: { total: 4, occupied: 1, vacant: 0, unknown: 3 }, rentCollected: 1250000, outstanding: 250000,
    rentDue: [{ id: 'rent-1', amount: 250000, dueDate: new Date('2026-10-20'), tenantName: 'Ada Tenant', property }],
    renewals: [{ id: 'unit-1', name: 'Flat 2A', price: 500000, tenantName: 'Bola Tenant', rentEndDate: new Date('2026-10-25'), property }],
  } })
  const html = await state.render()
  assert.match(html, /Ada Tenant/)
  assert.match(html, /Bola Tenant/)
  assert.match(html, /Overdue/)
  assert.match(html, /Renewal soon/)
  assert.match(html, /Unit rent price/)
  assert.match(html, /3 units are awaiting occupancy details/)
  assert.match(html, /₦1,250,000/)
  assert.match(html, /₦250,000/)
})

test('payments overview displays actual records, missing dates and receipts without inventing transfers', () => {
  const Payments = loadSource('src/app/dashboard/payments/PaymentsClient.tsx', {
    '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display, 'next/link': link,
  }).default
  const props = { summary: { rentCollected: 100000, outstanding: 50000, year: 2026 }, totalPayments: 2, totalPages: 1, page: 1, payments: [
    { id: 'p1', amount: 100000, status: 'Paid', tenantName: 'Ada Tenant', propertyId: property.id, propertyAddress: '10 Example Street, Lagos', dueDate: '2026-10-01', datePaid: null, receiptUrl: null },
    { id: 'p2', amount: 50000, status: 'Overdue', tenantName: 'Bola Tenant', propertyId: property.id, propertyAddress: '20 Example Street, Lagos', dueDate: '2026-10-01', datePaid: null, receiptUrl: 'https://example.com/receipt.pdf' },
  ] }
  const html = renderToStaticMarkup(React.createElement(Payments, props))
  assert.match(html, /Ada Tenant/)
  assert.match(html, /Bola Tenant/)
  assert.match(html, /Overdue/)
  assert.match(html, /Not recorded/)
  assert.match(html, /Not uploaded/)
  assert.match(html, /href="https:\/\/example.com\/receipt.pdf"/)
  assert.doesNotMatch(html, /Bank Transfer|Unit:|Export/)
  const empty = renderToStaticMarkup(React.createElement(Payments, { ...props, payments: [], totalPayments: 0 }))
  assert.match(empty, /No payment records yet/)
})

test('saving a unit refreshes the dashboard, tenant list and financial views', async () => {
  const refreshed = []
  const actions = loadSource('src/actions/properties.ts', {
    '@/auth': { auth: async () => ({ user: { id: 'owner-1' } }) },
    '@/lib/prisma': { __esModule: true, default: { property: { findUnique: async () => property }, unit: { create: async () => ({ id: 'unit-1' }) } } },
    '@/components/properties/schema': {}, '@/lib/property-fees': {}, '@/lib/inspection-contact': {},
    cloudinary: { v2: { config: () => {} } }, 'next/cache': { revalidatePath: (pathname) => refreshed.push(pathname) },
  })
  assert.equal((await actions.createPropertyUnitAction(property.id, { name: 'Flat 1', type: '2-bedroom Flat', price: 500000, status: 'VACANT' })).success, true)
  for (const route of ['/dashboard', '/dashboard/properties', '/dashboard/tenants', '/dashboard/payments', `/dashboard/properties/${property.id}/manage`]) assert.ok(refreshed.includes(route))
})

test('My Properties uses owner-scoped data, real pricing, terminal statuses and missing-photo fallbacks', async () => {
  const calls = []
  let captured
  const Page = loadSource('src/app/dashboard/properties/page.tsx', {
    '@/lib/admin': { getCurrentUser: async () => ({ id: 'owner-1' }) },
    '@/lib/prisma': { __esModule: true, default: { property: { findMany: async (query) => {
      calls.push(query)
      return [property, { ...property, id: 'sold', status: 'SOLD', listingType: 'SALE', images: [] },
        { ...property, id: 'rented', status: 'RENTED', units: [{ status: 'VACANT' }] }]
    } } } },
    '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display,
    './PropertiesClient': { __esModule: true, default: (props) => { captured = props.initialProperties; return null } },
    'next/navigation': { redirect: () => { throw new Error('redirect') } },
  }).default
  renderToStaticMarkup(await Page())
  assert.equal(calls[0].where.ownerId, 'owner-1')
  assert.equal(calls[0].select.directOwnerPhone, undefined)
  assert.equal(captured[0].price, '₦500,000')
  assert.equal(captured[0].interval, '/ 6 months')
  assert.equal(captured[0].vacant, 0)
  assert.equal(captured[1].status, 'Sold')
  assert.equal(captured[1].interval, '')
  assert.equal(captured[1].image, null)
  assert.equal(captured[2].status, 'Rented')
  assert.equal(captured[2].vacant, 1)
  assert.equal(captured[2].unknownUnits, 3)
})

const rentPayments = loadSource('src/lib/rent-payments.ts')
const paymentInput = {
  requestId: 'c0ddf156-0a62-49e1-a036-6e8230a9bb30', amount: 500000, datePaid: '2026-01-15', extendRent: true,
  expectedRentEndDate: '2026-08-31T00:00:00.000Z',
}

function paymentActionFixture(options = {}) {
  let unit = { id: 'unit-1', propertyId: property.id, name: 'Flat A', tenantName: 'Ada Tenant', tenantPhone: '08000000000', status: 'OCCUPIED', price: 500000, rentEndDate: new Date(paymentInput.expectedRentEndDate), updatedAt: new Date('2026-01-01'), property: { ...property, ownerId: 'owner-1' }, ...options.unit }
  let payments = []
  const calls = []
  const refreshed = []
  let serializations = options.serializations || 0
  const matchesOwner = (query) => query.OR?.some((branch) => {
    const scope = branch.unit?.property
    return scope && scope.ownerId === unit.property.ownerId && (!scope.id || scope.id === unit.propertyId)
  })
  const hydrated = () => payments.map((row) => ({ ...row, receiptUrl: null, lease: null, unit: { ...unit, property } }))
  const prisma = {
    payment: {
      findFirst: async ({ where }) => payments.find((row) => row.requestId === where.requestId && row.unitId === where.unitId && where.unit.property.ownerId === unit.property.ownerId && where.unit.propertyId === unit.propertyId) || null,
      aggregate: async ({ where }) => ({ _sum: { amount: matchesOwner(where) ? payments.filter((row) => row.status === where.status && row.datePaid >= where.datePaid.gte && row.datePaid <= where.datePaid.lte).reduce((sum, row) => sum + row.amount, 0) : null } }),
      count: async ({ where }) => matchesOwner(where) ? payments.length : 0,
      findMany: async ({ where }) => matchesOwner(where) ? hydrated() : [],
    },
    $transaction: async (callback, settings) => {
      calls.push({ settings })
      if (serializations-- > 0) throw Object.assign(new Error('retry'), { code: 'P2034' })
      const originalUnit = structuredClone(unit)
      const originalPayments = structuredClone(payments)
      try {
        return await callback({
          payment: { ...prisma.payment, create: async ({ data }) => {
            if (options.failCreate) throw new Error('write failed')
            payments.push({ id: 'saved-payment', ...data })
          } },
          unit: {
            findFirst: async ({ where }) => {
              calls.push({ where })
              return where.id === unit.id && where.propertyId === unit.propertyId && where.property.ownerId === unit.property.ownerId ? structuredClone(unit) : null
            },
            updateMany: async ({ where, data }) => {
              calls.push({ where, data })
              if (options.changedUnit) return { count: 0 }
              unit = { ...unit, ...data }
              return { count: 1 }
            },
          },
        })
      } catch (error) { unit = originalUnit; payments = originalPayments; throw error }
    },
  }
  const action = loadSource('src/actions/payments.ts', {
    '@/auth': { auth: async () => options.unauthenticated ? null : { user: { id: options.ownerId || 'owner-1' } } },
    '@/lib/prisma': { __esModule: true, default: prisma }, '@/lib/dashboard-metrics': metrics, '@/lib/rent-payments': rentPayments,
    'next/cache': { revalidatePath: (route) => refreshed.push(route) },
  }).recordTenantPaymentAction
  const reads = loadSource('src/lib/dashboard-data.ts', {
    '@/lib/prisma': { __esModule: true, default: prisma }, '@/lib/dashboard-metrics': metrics, '@/lib/property-display': display,
  })
  return { action, reads, calls, refreshed, get unit() { return unit }, get payments() { return payments } }
}

test('Record Payment persists money received, renews once, and feeds both dashboard totals and history', async () => {
  const state = paymentActionFixture()
  assert.equal((await state.action('unit-1', property.id, paymentInput)).success, true)
  assert.equal(state.payments.length, 1)
  assert.equal(state.payments[0].amount, 500000)
  assert.equal(state.payments[0].status, 'PAID')
  assert.equal(state.payments[0].datePaid.toISOString(), '2026-01-14T23:00:00.000Z')
  assert.equal(state.payments[0].tenantName, 'Ada Tenant')
  assert.equal(state.unit.rentEndDate.toISOString(), '2027-02-28T00:00:00.000Z')
  assert.equal(state.calls[0].settings.isolationLevel, 'Serializable')
  const summary = await state.reads.getOwnerPaymentSummary('owner-1', now)
  assert.equal(summary.rentCollected, 500000)
  const ledger = await state.reads.getOwnerPayments('owner-1', 1, now, property.id)
  assert.equal(ledger.payments[0].tenantName, 'Ada Tenant')
  assert.equal(ledger.payments[0].unitName, 'Flat A')
  assert.equal(ledger.summary.rentCollected, 500000)
  assert.equal((await state.reads.getOwnerPaymentSummary('other-owner', now)).rentCollected, 0)
  assert.equal((await state.reads.getOwnerPaymentSummary('owner-1', now, 'other-property')).rentCollected, 0)
  assert.ok(state.refreshed.includes('/dashboard'))
  assert.ok(state.refreshed.includes('/dashboard/payments'))
  assert.ok(state.refreshed.includes(`/dashboard/properties/${property.id}/manage`))
})

test('retrying a payment submission does not save another payment or extend the rent period twice', async () => {
  const state = paymentActionFixture()
  assert.equal((await state.action('unit-1', property.id, paymentInput)).success, true)
  assert.equal((await state.action('unit-1', property.id, paymentInput)).success, true)
  assert.equal(state.payments.length, 1)
  assert.equal(state.unit.rentEndDate.toISOString(), '2027-02-28T00:00:00.000Z')
  const stale = await state.action('unit-1', property.id, { ...paymentInput, requestId: '03e5ece7-ad18-4812-af65-cec38cd9ff9f' })
  assert.equal(stale.success, false)
  assert.match(stale.error, /rent period changed/)
  assert.equal(state.payments.length, 1)
})

test('a previously renewed payment can be entered without extending dates or assuming the unit price was paid', async () => {
  const state = paymentActionFixture()
  assert.equal((await state.action('unit-1', property.id, { ...paymentInput, amount: 450000, extendRent: false })).success, true)
  assert.equal(state.payments[0].amount, 450000)
  assert.equal(state.unit.rentEndDate.toISOString(), paymentInput.expectedRentEndDate)
  assert.equal((await state.reads.getOwnerPaymentSummary('owner-1', now)).rentCollected, 450000)
})

test('payment and renewal roll back together when saving fails, and unsafe retries keep the request ID', async () => {
  const state = paymentActionFixture({ failCreate: true })
  const originalError = console.error
  console.error = () => {}
  try {
    const result = await state.action('unit-1', property.id, paymentInput)
    assert.equal(result.success, false)
    assert.equal(result.retrySameRequest, true)
  } finally { console.error = originalError }
  assert.equal(state.payments.length, 0)
  assert.equal(state.unit.rentEndDate.toISOString(), paymentInput.expectedRentEndDate)
  assert.equal(state.refreshed.length, 0)
})

test('recording payments rejects unauthenticated, foreign-property, vacant and stale-unit requests', async () => {
  for (const options of [{ unauthenticated: true }, { ownerId: 'other-owner' }, { unit: { status: 'VACANT' } }, { changedUnit: true }]) {
    const state = paymentActionFixture(options)
    assert.equal((await state.action('unit-1', property.id, paymentInput)).success, false)
    assert.equal(state.payments.length, 0)
    assert.equal(state.unit.rentEndDate.toISOString(), paymentInput.expectedRentEndDate)
  }
  const wrongUnit = paymentActionFixture()
  assert.equal((await wrongUnit.action('different-unit', property.id, paymentInput)).success, false)
  assert.equal(wrongUnit.payments.length, 0)
})

test('payment validation rejects invalid or future dates, nonpositive amounts and malformed request IDs before writing', async () => {
  for (const change of [{ amount: 0 }, { amount: -5 }, { amount: NaN }, { amount: 0.001 }, { datePaid: '2026-02-30' }, { datePaid: '2099-01-01' }, { requestId: 'invalid' }, { expectedRentEndDate: 'bad' }]) {
    const state = paymentActionFixture()
    assert.equal((await state.action('unit-1', property.id, { ...paymentInput, ...change })).success, false)
    assert.equal(state.calls.length, 0)
  }
})

test('serialization conflicts retry the atomic payment and renewal transaction', async () => {
  const state = paymentActionFixture({ serializations: 1 })
  assert.equal((await state.action('unit-1', property.id, paymentInput)).success, true)
  assert.equal(state.payments.length, 1)
  assert.equal(state.calls.filter((call) => call.settings).length, 2)
})

test('rent extensions respect monthly, six-month and annual periods and clamp month-end dates', () => {
  for (const [duration, months] of [['monthly', 1], ['1 month', 1], ['6 months', 6], ['1 year', 12]]) assert.equal(rentPayments.getRentExtensionMonths(duration), months)
  assert.equal(rentPayments.extendRentDate(new Date('2024-01-31'), 1).toISOString(), '2024-02-29T00:00:00.000Z')
  assert.equal(rentPayments.extendRentDate(new Date('2024-02-29'), 12).toISOString(), '2025-02-28T00:00:00.000Z')
})
