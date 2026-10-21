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
  new Function('require', 'module', 'exports', compiled)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name), module, module.exports,
  )
  return module.exports
}
const display = loadSource('src/lib/property-display.ts')
const fees = loadSource('src/lib/property-fees.ts')
const image = { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) }
const propertyId = 'd86cf92b-5777-4480-9855-21507cc7c606'
const listing = {
  id: propertyId, title: 'Standard RENTAL Listing', description: 'Bright apartment with a private balcony.',
  address: '10 Example Street', listingType: 'RENTAL', propertyType: 'APARTMENT', status: 'VERIFIED',
  images: ['https://res.cloudinary.com/test/image/upload/front.jpg', 'https://res.cloudinary.com/test/image/upload/room.jpg'],
  bedrooms: 0, bathrooms: 0, toilets: 0, parkingSpaces: 0, size: null,
  bedroomTypes: ['2-bedroom Flat', '3-bedroom Flat'], totalUnits: 4, availableUnits: 0, shortletBedrooms: null,
  basePrice: 100000, unitPrices: { '2-bedroom Flat': 100000, '3-bedroom Flat': 200000, 'Stale': 1 },
  tenancyDuration: '6 months', installmentalPrice: null,
  serviceCharge: null, cautionFee: 5000, legalFee: 20000, agencyFee: null, commissionPct: 20,
  ownerId: 'private-owner', owner: { email: 'private@example.invalid' }, documents: ['PRIVATE_DOCUMENT'],
  units: [{ tenantName: 'PRIVATE_TENANT' }], state: 'PRIVATE_STATE', latitude: 6.5, longitude: 3.5,
  propertyRelationship: 'OTHER', ownerRelationship: 'PRIVATE_RELATIONSHIP', directOwnerName: 'PRIVATE_OWNER_NAME',
  directOwnerPhone: 'PRIVATE_OWNER_PHONE', directOwnerAddress: 'PRIVATE_OWNER_ADDRESS', features: null,
}
function fixture(overrides = {}, missing = false) {
  let current = { ...listing, ...overrides }
  const calls = []
  const Page = loadSource('src/app/(main)/properties/[id]/page.tsx', {
    'next/image': image,
    'next/server': { connection: async () => calls.push('connection') },
    'next/navigation': { notFound: () => { throw Object.assign(new Error('Not found'), { status: 404 }) } },
    '@/lib/property-display': display,
    '@/lib/property-fees': fees,
    '@/components/marketplace/ScheduleInspection': { __esModule: true, default: loadSource('src/components/marketplace/ScheduleInspection.tsx', { '@/lib/support': loadSource('src/lib/support.ts') }).default },
    '@/lib/prisma': { __esModule: true, default: { property: { findFirst: async (query) => {
      calls.push(query)
      if (missing || query.where.status !== current.status || query.where.id !== current.id) return null
      return Object.fromEntries(Object.keys(query.select).map((field) => [field, current[field]]))
    } } } },
  }).default
  return {
    calls,
    setStatus: (status) => { current = { ...current, status } },
    render: async (id = propertyId) => renderToStaticMarkup(await Page({ params: Promise.resolve({ id }) })),
  }
}
function textOf(html) { return html.replace(/<[^>]*>/g, '') }

test('public lease details show the submitted description, yearly price and both fees', async () => {
  const text = textOf(await fixture({
    listingType: 'LEASE', propertyType: 'HOUSE', title: 'Spacious home with a private garden', description: '',
    basePrice: 2000000, legalFee: 400000, commissionPct: 20, cautionFee: 0, serviceCharge: 0, agencyFee: 0,
    unitPrices: {}, bedroomTypes: [],
  }).render())
  assert.match(text, /Residential home for lease/)
  assert.match(text, /Spacious home with a private garden/)
  assert.match(text, /For lease/)
  assert.match(text, /\/ year/)
  assert.match(text, /Price per year₦2,000,000/)
  assert.match(text, /Agreement fee₦400,000/)
  assert.match(text, /Platform fee \(20%\)₦400,000/)
  assert.match(text, /Total listed amount₦2,800,000/)
})

test('the complete card is a keyboard-accessible link to its public listing', () => {
  const Card = loadSource('src/components/ui/PropertyCard.tsx', {
    'next/image': image, '@/lib/property-display': display,
  }).default
  const html = renderToStaticMarkup(React.createElement(Card, { property: { ...listing, locationArea: 'Ikeja' } }))
  assert.match(html, new RegExp(`href="/properties/${propertyId}"`))
  assert.match(html, /aria-label="View listing: 2-bedroom Flat, 3-bedroom Flat available for rent/)
  assert.match(html, /focus-visible:ring-2/)
})

test('public details query only verified listings and select no owner, tenant, document or map data', async () => {
  const state = fixture()
  const html = await state.render()
  assert.equal(state.calls[0], 'connection')
  const query = state.calls[1]
  assert.deepEqual(query.where, { id: propertyId, status: 'VERIFIED' })
  for (const field of ['owner', 'ownerId', 'units', 'leases', 'documents', 'state', 'latitude', 'longitude', 'inspectionContactType', 'inspectionContactName', 'inspectionContactPhone', 'propertyRelationship', 'ownerRelationship', 'directOwnerName', 'directOwnerPhone', 'directOwnerAddress']) assert.equal(query.select[field], undefined)
  assert.doesNotMatch(html, /private@example.invalid|PRIVATE_TENANT|PRIVATE_DOCUMENT|PRIVATE_STATE|private-owner|PRIVATE_RELATIONSHIP|PRIVATE_OWNER_/)
  assert.match(html, /Verified listing/)
})

test('public listings display free-text features for every listing type without exposing owner contact details', async () => {
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    const html = await fixture({ listingType, features: 'Borehole water\nSecurity <script>example</script>' }).render()
    assert.match(html, /Features of Property/)
    assert.match(html, /Borehole water\nSecurity &lt;script&gt;example&lt;\/script&gt;/)
    assert.doesNotMatch(html, /<script>|PRIVATE_OWNER_|PRIVATE_RELATIONSHIP/)
  }
  assert.doesNotMatch(await fixture({ features: null }).render(), /Features of Property/)
})

test('unpublished, rejected and inactive listings return 404 to direct URL requests', async () => {
  for (const status of ['PENDING', 'REJECTED', 'SOLD', 'RENTED']) {
    await assert.rejects(fixture({ status }).render(), { status: 404 })
  }
  await assert.rejects(fixture({}, true).render(), { status: 404 })
})

test('malformed IDs return 404 before a database lookup', async () => {
  const state = fixture()
  await assert.rejects(state.render('not-a-listing-id'), { status: 404 })
  assert.deepEqual(state.calls, ['connection'])
})

test('detail pages read current approval status again for each request', async () => {
  const state = fixture()
  await state.render()
  state.setStatus('RENTED')
  await assert.rejects(state.render(), { status: 404 })
  assert.equal(state.calls.filter((call) => call === 'connection').length, 2)
})

test('details display all submitted photos, description, tenancy and actual zero availability', async () => {
  const html = await fixture().render()
  const text = textOf(html)
  assert.match(text, /2-bedroom Flat, 3-bedroom Flat available for rent in 10 Example Street/)
  assert.match(text, /Bright apartment with a private balcony/)
  assert.match(text, /Photos \(2\)/)
  assert.match(html, /Open property photo 1/)
  assert.match(html, /Open property photo 2/)
  assert.match(text, /Available units0/)
  assert.match(text, /6 months/)
  assert.doesNotMatch(text, /Bedrooms0|Bathrooms0|Standard RENTAL Listing/)
})

test('each selected apartment price includes its own saved agreement and platform fee amounts', async () => {
  const text = textOf(await fixture().render())
  assert.match(text, /Starting from/)
  assert.match(text, /100,000/)
  assert.match(text, /200,000/)
  assert.match(text, /20,000/)
  assert.match(text, /40,000/)
  assert.match(text, /145,000/)
  assert.match(text, /285,000/)
  assert.match(text, /Platform fee \(20%\)/)
  assert.doesNotMatch(text, /Stale/)
})

test('saved zero fees remain zero and absent fees are not replaced with assumed percentages', async () => {
  const zero = textOf(await fixture({ legalFee: 0, commissionPct: 0, cautionFee: null, unitPrices: null }).render())
  assert.match(zero, /Agreement fee₦0/)
  assert.match(zero, /Platform fee \(0%\)₦0/)
  assert.doesNotMatch(zero, /20,000|Platform fee \(20%\)/)
  const missing = textOf(await fixture({ legalFee: null, commissionPct: null, cautionFee: null, unitPrices: null }).render())
  assert.doesNotMatch(missing, /Agreement fee|Platform fee|Caution fee|Total listed amount/)
})

test('sale details show the submitted description and outright or installment prices without rental-only fields', async () => {
  const html = await fixture({
    listingType: 'SALE', propertyType: 'HOUSE', title: 'Detached home with a garden',
    description: 'Recently renovated.', basePrice: 50000000, installmentalPrice: 55000000,
    legalFee: 0, commissionPct: 0, cautionFee: 0,
  }).render()
  const text = textOf(html)
  assert.match(text, /House for sale in 10 Example Street/)
  assert.match(text, /Detached home with a garden/)
  assert.match(text, /Recently renovated/)
  assert.match(text, /50,000,000/)
  assert.match(text, /55,000,000/)
  assert.match(html, /href="\/\?listing=buy"/)
  assert.doesNotMatch(text, /Total units|Available units|Apartment types|Tenancy|Agreement fee|Platform fee|\/ night|\/ 6 months/)
})

test('shortlet details use nightly pricing and the recorded shortlet bedroom label', async () => {
  const html = await fixture({ listingType: 'SHORTLET', basePrice: 80000, shortletBedrooms: '2-bedrooms', legalFee: 0, cautionFee: null }).render()
  const text = textOf(html)
  assert.match(text, /2-bedrooms available for shortlet/)
  assert.match(text, /80,000 \/ night/)
  assert.match(text, /16,000/)
  assert.doesNotMatch(text, /Agreement fee|Total units|Available units|Tenancy/)
  assert.match(html, /href="\/\?listing=shortlet"/)
})

test('missing photos and optional property attributes render honest fallbacks', async () => {
  const html = await fixture({ propertyType: 'LAND', images: [], bedroomTypes: [], bedrooms: 3, bathrooms: 2, size: 600, description: '', legalFee: null, commissionPct: null }).render()
  const text = textOf(html)
  assert.match(text, /No photos provided/)
  assert.match(text, /No description provided/)
  assert.match(text, /600 sqm/)
  assert.doesNotMatch(html, /<img/)
  assert.doesNotMatch(text, /Bedrooms|Bathrooms|Total units|Available units/)
})

test('unavailable listings provide a working return to the marketplace', () => {
  const NotFound = loadSource('src/app/(main)/properties/[id]/not-found.tsx').default
  const html = renderToStaticMarkup(React.createElement(NotFound))
  assert.match(html, /Listing unavailable/)
  assert.match(html, /href="\/"/)
  assert.match(html, /Browse properties/)
})

test('public listings route inspection requests to company email and phone and hide submitted contacts', async () => {
  const html = await fixture({ inspectionContactName: 'Private Inspection Agent', inspectionContactPhone: '+234 801 234 5678' }).render()
  assert.match(html, /Schedule an inspection/)
  assert.match(html, /Email us/)
  assert.match(html, /Call us/)
  assert.match(html, /07083804443/)
  assert.match(html, /href="tel:\+2347083804443"/)
  assert.match(html, /mailto:contact@theimpactproperties\.com/)
  assert.doesNotMatch(html, /Private Inspection Agent|234 801 234 5678|tel:\+2348012345678|private@example.invalid/)
  const legacy = await fixture({ inspectionContactName: null, inspectionContactPhone: null }).render()
  assert.match(legacy, /Schedule an inspection/)
  assert.match(legacy, /href="tel:\+2347083804443"/)
})

test('inspection emails include the correct listing reference, title and scheduling prompts', () => {
  const { getInspectionEmailHref } = loadSource('src/lib/support.ts')
  const title = '2-bedroom Flat in Ikeja & Lagos'
  const url = new URL(getInspectionEmailHref(propertyId, title))
  assert.equal(url.protocol, 'mailto:')
  assert.equal(url.pathname, 'contact@theimpactproperties.com')
  assert.equal(url.searchParams.get('subject'), `Schedule an inspection: ${propertyId}`)
  const body = url.searchParams.get('body')
  assert.ok(body.includes(title))
  assert.ok(body.includes(`Listing reference: ${propertyId}`))
  assert.ok(body.includes('Preferred date:'))
  assert.ok(body.includes('Preferred time:'))
  assert.ok(body.includes('My phone number:'))
})
