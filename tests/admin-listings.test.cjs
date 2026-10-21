const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

const project = path.resolve(__dirname, '..')
const propertyId = 'd86cf92b-5777-4480-9855-21507cc7c606'

function loadSource(file, mocks = {}) {
  const filename = path.join(project, file)
  const localRequire = createRequire(filename)
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  const requireDependency = (name) => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name)
  new Function('require', 'module', 'exports', compiled)(requireDependency, module, module.exports)
  return module.exports
}

function fixture({ role = 'ADMIN', tokenRole = role, signedIn = true, status = 'PENDING', missing = false, fail = false } = {}) {
  let currentStatus = status
  let attempts = 0
  const invalidations = []
  const prisma = {
    user: { findUnique: async () => missing ? null : { id: 'user-1', role, name: 'Test User', email: 'test@example.invalid' } },
    property: { updateMany: async ({ where, data }) => {
      attempts++
      if (fail) throw new Error('Test storage failure')
      if (where.id !== propertyId || currentStatus !== where.status) return { count: 0 }
      currentStatus = data.status
      return { count: 1 }
    } },
  }
  const navigation = {
    redirect: (location) => { throw Object.assign(new Error('Redirect'), { location }) },
    notFound: () => { throw Object.assign(new Error('Not found'), { status: 404 }) },
  }
  const admin = loadSource('src/lib/admin.ts', {
    react: { cache: (fn) => fn },
    '@/auth': { auth: async () => signedIn ? { user: { id: 'user-1', role: tokenRole } } : null },
    '@/lib/prisma': { __esModule: true, default: prisma },
    'next/navigation': navigation,
  })
  const action = loadSource('src/actions/admin-listings.ts', {
    '@/lib/admin': admin,
    '@/lib/prisma': { __esModule: true, default: prisma },
    'next/cache': { revalidatePath: (route) => invalidations.push(route) },
  })
  return { ...action, ...admin, invalidations, status: () => currentStatus, attempts: () => attempts }
}

test('logged-out callers cannot review or write a listing', async () => {
  const state = fixture({ signedIn: false })
  assert.equal((await state.reviewListing(propertyId, 'APPROVE')).success, false)
  assert.equal(state.attempts(), 0)
  assert.deepEqual(state.invalidations, [])
})

test('owners cannot approve or reject listings, including their own', async () => {
  for (const decision of ['APPROVE', 'REJECT']) {
    const state = fixture({ role: 'OWNER' })
    assert.equal((await state.reviewListing(propertyId, decision)).success, false)
    assert.equal(state.attempts(), 0)
  }
})

test('a forged or stale ADMIN session cannot override a non-admin database role', async () => {
  const state = fixture({ role: 'TENANT', tokenRole: 'ADMIN' })
  assert.equal((await state.reviewListing(propertyId, 'APPROVE')).success, false)
  assert.equal(state.attempts(), 0)
  await assert.rejects(state.requireAdmin(), { status: 404 })
})

test('a removed user with a remaining session cannot review listings', async () => {
  const state = fixture({ missing: true })
  assert.equal((await state.reviewListing(propertyId, 'REJECT')).success, false)
  assert.equal(state.attempts(), 0)
})

test('page guards send anonymous users to login and allow database admins', async () => {
  await assert.rejects(fixture({ signedIn: false }).requireAdmin(), { location: '/login' })
  const admin = await fixture({ role: 'ADMIN', tokenRole: 'OWNER' }).requireAdmin()
  assert.equal(admin.role, 'ADMIN')
})

test('invalid IDs and unsupported decisions never reach the database write', async () => {
  const state = fixture()
  for (const [id, decision] of [['invalid', 'APPROVE'], [propertyId, 'SOLD'], [propertyId, null]]) {
    assert.equal((await state.reviewListing(id, decision)).success, false)
  }
  assert.equal(state.attempts(), 0)
})

test('admin approval publishes a pending listing and refreshes public and owner pages', async () => {
  const state = fixture()
  assert.equal((await state.reviewListing(propertyId, 'APPROVE')).success, true)
  assert.equal(state.status(), 'VERIFIED')
  for (const route of ['/', '/dashboard', '/dashboard/properties', `/dashboard/properties/${propertyId}`, '/dashboard/admin/listings', `/dashboard/admin/listings/${propertyId}`]) {
    assert.ok(state.invalidations.includes(route), 'Expected refreshed route: ' + route)
  }
})

test('admin rejection changes status without requiring or sending a review message', async () => {
  const state = fixture()
  assert.equal((await state.reviewListing(propertyId, 'REJECT')).success, true)
  assert.equal(state.status(), 'REJECTED')
})

test('reviewed, sold and rented listings cannot be overwritten by another decision', async () => {
  for (const status of ['VERIFIED', 'REJECTED', 'SOLD', 'RENTED']) {
    const state = fixture({ status })
    assert.equal((await state.reviewListing(propertyId, 'APPROVE')).success, false)
    assert.equal(state.status(), status)
    assert.deepEqual(state.invalidations, [])
  }
})

test('two simultaneous decisions cannot both succeed', async () => {
  const state = fixture()
  const results = await Promise.all([state.reviewListing(propertyId, 'APPROVE'), state.reviewListing(propertyId, 'REJECT')])
  assert.equal(results.filter(result => result.success).length, 1)
  assert.equal(state.status(), 'VERIFIED')
})

test('public registration excludes ADMIN and unrecognized roles', () => {
  const { isRegistrationRole } = loadSource('src/lib/roles.ts')
  for (const role of ['TENANT', 'OWNER', 'AGENT', 'VENDOR']) assert.equal(isRegistrationRole(role), true)
  for (const role of ['ADMIN', 'admin', undefined, 'LANDLORD', '']) assert.equal(isRegistrationRole(role), false)
})

test('rejected listing contact uses the supplied support email and listing reference', () => {
  const { getListingContactHref } = loadSource('src/lib/support.ts')
  const url = new URL(getListingContactHref(propertyId))
  assert.equal(url.protocol, 'mailto:')
  assert.equal(url.pathname, 'contact@theimpactproperties.com')
  assert.ok(url.searchParams.get('subject').includes(propertyId))
})

function screenFixture({ status = 'PENDING', denied = false, missing = false, propertyOverrides = {} } = {}) {
  const React = require('react')
  let reads = 0
  const property = {
    id: propertyId, title: 'Bright house', description: 'Survey available on request.',
    address: '12 Test Road, Lagos', locationArea: 'Lekki', state: 'Lagos', listingType: 'SALE', propertyType: 'HOUSE', status,
    images: [], bedroomTypes: [], documents: ['Receipt'], shortletBedrooms: null,
    bedrooms: 0, bathrooms: 0, toilets: null, parkingSpaces: null, totalUnits: null, availableUnits: null, size: null,
    latitude: null, longitude: null, basePrice: 50000000, unitPrices: {}, serviceCharge: null, cautionFee: null, legalFee: null,
    agencyFee: null, commissionPct: null, installmentalPrice: null, tenancyDuration: null,
    createdAt: new Date('2026-10-19T09:00:00Z'), updatedAt: new Date('2026-10-19T09:00:00Z'),
    owner: { name: 'Test Owner', email: 'owner@example.invalid', phone: null },
  }
  Object.assign(property, propertyOverrides)
  const prisma = { property: {
    findUnique: async () => { reads++; return missing ? null : property },
    findMany: async () => { reads++; return [property] },
    count: async () => 1,
    groupBy: async () => [{ status, _count: { _all: 1 } }],
  } }
  const mocks = {
    '@/lib/admin': { requireAdmin: async () => { if (denied) throw Object.assign(new Error('Not found'), { status: 404 }); return { id: 'admin-1', role: 'ADMIN' } } },
    '@/lib/prisma': { __esModule: true, default: prisma },
    '@/lib/property-display': loadSource('src/lib/property-display.ts'),
    '@/lib/property-fees': loadSource('src/lib/property-fees.ts'),
    '@/lib/inspection-contact': loadSource('src/lib/inspection-contact.ts'),
    '@/components/properties/InspectionContact': { __esModule: true, default: loadSource('src/components/properties/InspectionContact.tsx').default },
    '@/components/properties/PropertyRelationshipDetails': { __esModule: true, default: loadSource('src/components/properties/PropertyRelationshipDetails.tsx').default },
    '@/components/admin/ReviewActions': { __esModule: true, default: () => React.createElement('button', null, 'Review controls') },
    'next/navigation': { notFound: () => { throw Object.assign(new Error('Not found'), { status: 404 }) } },
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
  }
  return {
    detail: loadSource('src/app/dashboard/admin/listings/[id]/page.tsx', mocks).default,
    queue: loadSource('src/app/dashboard/admin/listings/page.tsx', mocks).default,
    reads: () => reads,
  }
}

test('both admin pages authorize before reading any listing data', async () => {
  const screen = screenFixture({ denied: true })
  await assert.rejects(screen.detail({ params: Promise.resolve({ id: propertyId }) }), { status: 404 })
  await assert.rejects(screen.queue({ searchParams: Promise.resolve({}) }), { status: 404 })
  assert.equal(screen.reads(), 0)
})

test('sale review displays submitted description and documents without invented units or fees', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture()
  const html = renderToStaticMarkup(await screen.detail({ params: Promise.resolve({ id: propertyId }) }))
  assert.ok(html.includes('House for sale in 12 Test Road, Lagos'))
  assert.ok(html.includes('Bright house\n\nSurvey available on request.'))
  assert.ok(html.includes('Receipt'))
  assert.ok(html.includes('owner@example.invalid'))
  assert.ok(html.includes('Review controls'))
  assert.ok(!html.includes('Total units'))
  assert.ok(!html.includes('Service charge'))
})

test('reviewed listings have no decision controls and missing listings return 404', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture({ status: 'REJECTED' })
  const html = renderToStaticMarkup(await screen.detail({ params: Promise.resolve({ id: propertyId }) }))
  assert.ok(html.includes('Rejected'))
  assert.ok(!html.includes('Review controls'))
  await assert.rejects(screenFixture({ missing: true }).detail({ params: Promise.resolve({ id: propertyId }) }), { status: 404 })
})

test('review queue renders status tabs and links to the full admin review', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture()
  const html = renderToStaticMarkup(await screen.queue({ searchParams: Promise.resolve({}) }))
  assert.ok(html.includes('Pending (1)'))
  assert.ok(html.includes('Approved (0)'))
  assert.ok(html.includes('Rejected (0)'))
  assert.ok(html.includes('/dashboard/admin/listings/' + propertyId))
  assert.ok(html.includes('Test Owner'))
})

function creationFixture() {
  const writes = []
  const { createPropertyAction } = loadSource('src/actions/properties.ts', {
    '@/lib/prisma': { __esModule: true, default: { user: { findUnique: async () => ({ name: 'Test Owner', phone: '08012345678' }) }, property: { create: async ({ data }) => { writes.push(data); return { id: propertyId } } } } },
    '@/auth': { auth: async () => ({ user: { id: 'owner-1' } }) },
    '@/components/properties/schema': loadSource('src/components/properties/schema.ts', { '@/lib/inspection-contact': loadSource('src/lib/inspection-contact.ts') }),
    '@/lib/property-fees': loadSource('src/lib/property-fees.ts'),
    '@/lib/inspection-contact': loadSource('src/lib/inspection-contact.ts'),
    '@/components/properties/InspectionContact': { __esModule: true, default: loadSource('src/components/properties/InspectionContact.tsx').default },
    'next/cache': { revalidatePath: () => {} },
    cloudinary: { v2: { config: () => {}, uploader: { upload_stream: (_options, done) => ({ end: () => done(null, { secure_url: 'https://example.invalid/property.png' }) }) } } },
  })
  const create = async (overrides = {}) => {
    const data = {
      listingType: 'RENTAL', propertyType: 'LAND', title: 'Test listing', description: '',
      declarationAccepted: true,
      propertyRelationship: 'DIRECT_OWNER', directOwnerName: 'Test Owner', directOwnerPhone: '08012345678',
      directOwnerAddress: '20 Owner Street, Lagos', features: 'Good road access',
      state: 'Lagos', locationArea: 'Lekki', address: '12 Test Road, Lagos', basePrice: 1000000,
      bedrooms: 0, bathrooms: 0, documents: [], bedroomTypes: [], legalFee: 0, commissionPct: 0,
      ...overrides,
    }
    const form = new FormData()
    form.set('data', JSON.stringify(data))
    form.append('images', new File(['image'], 'property.png', { type: 'image/png' }))
    const result = await createPropertyAction(form)
    assert.equal(result.success, true, result.error)
    return writes.at(-1)
  }
  return { create }
}

test('property creation persists agreement amount and platform percentage despite zero form defaults', async () => {
  const saved = await creationFixture().create()
  assert.equal(saved.legalFee, 200000)
  assert.equal(saved.commissionPct, 20)
  assert.equal(saved.ownerId, 'owner-1')
  assert.equal(saved.status, 'PENDING')
})

test('all listing types save direct owner details and free-text features independently of the submitting account', async () => {
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    const saved = await creationFixture().create({
      listingType, size: 600, propertyRelationship: 'OTHER', ownerRelationship: '  Property manager  ',
      directOwnerName: '  Ada Okafor  ', directOwnerPhone: '+234 802 345 6789',
      directOwnerAddress: '  25 Owner Avenue, Lagos  ', features: '  Borehole water\nGated access and paved roads  ',
    })
    assert.equal(saved.ownerId, 'owner-1')
    assert.equal(saved.propertyRelationship, 'OTHER')
    assert.equal(saved.ownerRelationship, 'Property manager')
    assert.equal(saved.directOwnerName, 'Ada Okafor')
    assert.equal(saved.directOwnerPhone, '+234 802 345 6789')
    assert.equal(saved.directOwnerAddress, '25 Owner Avenue, Lagos')
    assert.equal(saved.features, 'Borehole water\nGated access and paved roads')
    assert.ok(saved.declarationAcceptedAt instanceof Date)
    assert.match(saved.declarationText, /and every other information supplied is true\/correct\.$/)
    assert.equal(Object.hasOwn(saved, 'declarationAccepted'), false)
  }
})

test('admin review includes the declared relationship, direct owner details and features', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture({ propertyOverrides: {
    propertyRelationship: 'OTHER', ownerRelationship: 'Family representative',
    directOwnerName: 'Ada Okafor', directOwnerPhone: '+2348023456789',
    directOwnerAddress: '25 Owner Avenue, Lagos', features: 'Borehole water\nGated access',
  } })
  const text = renderToStaticMarkup(await screen.detail({ params: Promise.resolve({ id: propertyId }) })).replace(/<[^>]*>/g, '')
  for (const value of ['Family representative', 'Ada Okafor', '+2348023456789', '25 Owner Avenue, Lagos', 'Borehole water\nGated access']) assert.ok(text.includes(value))
})

test('submitted fee overrides cannot change the server-calculated 20 percent charges', async () => {
  const saved = await creationFixture().create({ legalFee: 1, commissionPct: 99 })
  assert.equal(saved.legalFee, 200000)
  assert.equal(saved.commissionPct, 20)
})

test('shortlets persist a platform fee rate without a rental agreement charge', async () => {
  const saved = await creationFixture().create({ listingType: 'SHORTLET', propertyType: 'APARTMENT', basePrice: 50000, legalFee: 10000 })
  assert.equal(saved.legalFee, 0)
  assert.equal(saved.commissionPct, 20)
  const { getPropertyFees } = loadSource('src/lib/property-fees.ts')
  assert.equal(getPropertyFees(saved).platformFee, 10000)
})

test('lease creation saves yearly pricing and server-calculated agreement and platform fees for each property type', async () => {
  for (const propertyType of ['HOUSE', 'COMMERCIAL', 'LAND']) {
    const saved = await creationFixture().create({
      listingType: 'LEASE', propertyType, size: 600, title: 'Property available for a long-term lease',
      tenancyDuration: '6 months', basePrice: 2000000, legalFee: 1, commissionPct: 99,
      bedroomTypes: ['2-bedroom Flat'], unitPrices: { '2-bedroom Flat': 500000 },
      totalUnits: 3, availableUnits: 1, installmentalPrice: 3000000,
    })
    assert.equal(saved.listingType, 'LEASE')
    assert.equal(saved.propertyType, propertyType)
    assert.equal(saved.tenancyDuration, '1 year')
    assert.equal(saved.legalFee, 400000)
    assert.equal(saved.commissionPct, 20)
    assert.equal(saved.status, 'PENDING')
    assert.deepEqual(saved.bedroomTypes, [])
    assert.deepEqual(saved.unitPrices, {})
    assert.equal(saved.totalUnits, undefined)
    assert.equal(saved.installmentalPrice, undefined)
  }
})

test('admin review shows lease description and yearly fees', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture({ propertyOverrides: {
    listingType: 'LEASE', propertyType: 'COMMERCIAL', title: 'Office building with private parking',
    description: '', basePrice: 2000000, legalFee: 400000, commissionPct: 20,
  } })
  const text = renderToStaticMarkup(await screen.detail({ params: Promise.resolve({ id: propertyId }) })).replace(/<[^>]*>/g, '')
  assert.match(text, /Commercial building for lease/)
  assert.match(text, /Office building with private parking/)
  assert.match(text, /Price per year/)
  assert.match(text, /Agreement fee₦400,000/)
  assert.match(text, /Platform fee \(20%\)₦400,000/)
})

test('sale listings do not inherit rental fees when the listing type changes', async () => {
  const saved = await creationFixture().create({ listingType: 'SALE', legalFee: 200000, commissionPct: 20 })
  assert.equal(saved.legalFee, 0)
  assert.equal(saved.commissionPct, 0)
})

test('multi-unit fees use saved pricing and convert the platform percentage into the correct amount', async () => {
  const saved = await creationFixture().create({ propertyType: 'APARTMENT', bedroomTypes: ['1 bedroom', '2 bedrooms'], totalUnits: 2, availableUnits: 2, unitPrices: { '1 bedroom': 1000000, '2 bedrooms': 1500000 } })
  const { getPropertyFees } = loadSource('src/lib/property-fees.ts')
  assert.equal(getPropertyFees(saved).agreementFee, 200000)
  assert.equal(getPropertyFees(saved).platformFee, 200000)
  assert.equal(getPropertyFees(saved, 1500000).agreementFee, 300000)
  assert.equal(getPropertyFees(saved, 1500000).platformFee, 300000)
})

test('saved zero fees remain zero and percentage calculations round to currency precision', () => {
  const { getPropertyFees, getListingFeeFields } = loadSource('src/lib/property-fees.ts')
  const fees = getPropertyFees({ listingType: 'RENTAL', basePrice: 1000000, legalFee: 0, commissionPct: 0 })
  assert.equal(fees.agreementFee, 0)
  assert.equal(fees.platformFee, 0)
  assert.equal(getListingFeeFields('RENTAL', 999.99).legalFee, 200)
})

test('admin review hides state, area, and map coordinates even when populated', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture({ propertyOverrides: { state: 'Lagos', locationArea: 'Lekki', latitude: 6.5, longitude: 3.3 } })
  const html = renderToStaticMarkup(await screen.detail({ params: Promise.resolve({ id: propertyId }) }))
  assert.ok(!html.includes('>State</dt>'))
  assert.ok(!html.includes('>Area</dt>'))
  assert.ok(!html.includes('Map coordinates'))
  assert.ok(html.includes('Full address'))
})

test('admin review shows saved agreement and platform charges as amounts', async () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  const screen = screenFixture({ propertyOverrides: { listingType: 'RENTAL', propertyType: 'LAND', basePrice: 1000000, legalFee: 200000, commissionPct: 20 } })
  const html = renderToStaticMarkup(await screen.detail({ params: Promise.resolve({ id: propertyId }) }))
  assert.ok(html.includes('Agreement fee'))
  assert.ok(html.includes('Platform fee (20%)'))
  assert.equal((html.match(/₦200,000/g) || []).length, 2)
  assert.ok(!html.includes('Commission (%)'))
})
