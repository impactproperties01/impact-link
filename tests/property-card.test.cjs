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
const image = { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) }
const PropertyCard = loadSource('src/components/ui/PropertyCard.tsx', {
  '@/lib/property-display': display,
  'next/image': image,
}).default
const listing = {
  id: 'listing-1', title: 'Standard RENTAL Listing', listingType: 'RENTAL', propertyType: 'APARTMENT',
  address: '10 Example Street', locationArea: 'Ikeja', status: 'VERIFIED', basePrice: 500000,
  images: ['https://res.cloudinary.com/test/image/upload/listing.jpg'],
  bedrooms: 0, bathrooms: 0, size: null, bedroomTypes: ['2-bedroom Flat'], shortletBedrooms: null,
  tenancyDuration: '6 months', unitPrices: { '2-bedroom Flat': 500000 }, totalUnits: 4, availableUnits: 0,
}
function render(overrides = {}) {
  return renderToStaticMarkup(React.createElement(PropertyCard, { property: { ...listing, ...overrides } }))
}
function textOf(html) { return html.replace(/<[^>]*>/g, '') }

test('approved rental displays submitted photo, preview title, rent period and real availability', () => {
  const html = render()
  const text = textOf(html)
  assert.match(text, /Verified/)
  assert.match(text, /2-bedroom Flat available for rent in 10 Example Street/)
  assert.match(text, /500,000 \/ 6 months/)
  assert.match(text, /4 units/)
  assert.match(text, /0 available/)
  assert.doesNotMatch(text, /Standard RENTAL Listing|0 Beds|0 Baths/)
  assert.match(html, /src="https:\/\/res.cloudinary.com\/test\/image\/upload\/listing.jpg"/)
})

test('unapproved and inactive listings never render a marketplace card', () => {
  for (const status of ['PENDING', 'REJECTED', 'SOLD', 'RENTED']) assert.equal(render({ status }), '')
})

test('sale cards show outright price without invented room counts, units or rent period', () => {
  const text = textOf(render({ listingType: 'SALE', propertyType: 'HOUSE', basePrice: 50000000 }))
  assert.match(text, /For sale/)
  assert.match(text, /House for sale in 10 Example Street/)
  assert.match(text, /50,000,000/)
  assert.doesNotMatch(text, /\/|Beds|Baths|units|available/)
})

test('shortlets use the submitted bedroom label and nightly pricing', () => {
  const text = textOf(render({ listingType: 'SHORTLET', shortletBedrooms: '3 Bedrooms', basePrice: 80000 }))
  assert.match(text, /3 Bedrooms available for shortlet/)
  assert.match(text, /80,000 \/ night/)
  assert.doesNotMatch(text, /6 months|units|0 Beds/)
})

test('rental price ranges use selected unit prices and ignore stale or invalid entries', () => {
  const text = textOf(render({
    bedroomTypes: ['2-bedroom Flat', '3-bedroom Flat', 'Invalid'],
    unitPrices: { '2-bedroom Flat': 750000, '3-bedroom Flat': 1200000, Invalid: null, Stale: 1 },
  }))
  assert.match(text, /From /)
  assert.match(text, /750,000/)
  assert.doesNotMatch(text, /500,000|1,200,000/)
})

test('missing photo and optional details do not produce a broken image or fabricated values', () => {
  const html = render({ images: [], totalUnits: null, availableUnits: null, tenancyDuration: null, unitPrices: null })
  assert.match(textOf(html), /No photo provided/)
  assert.doesNotMatch(html, /<img/)
  assert.doesNotMatch(textOf(html), /units|available\d|\/ year|\/ 6 months|0 Beds|0 Baths/)
})

test('land displays its saved size and omits irrelevant bedroom and bathroom attributes', () => {
  const text = textOf(render({ propertyType: 'LAND', size: 600, bedrooms: 2, bathrooms: 1 }))
  assert.match(text, /600 sqm/)
  assert.doesNotMatch(text, /Beds|Baths|units/)
})

test('homepage waits for a request and fetches only verified public listing fields each time', async () => {
  const calls = []
  let rows = [listing]
  const HomePage = loadSource('src/app/(main)/page.tsx', {
    'next/image': image,
    'next/server': { connection: async () => { calls.push('connection') } },
    '@/components/ui/PropertyCard': { __esModule: true, default: PropertyCard },
    '@/lib/marketplace': loadSource('src/lib/marketplace.ts'),
    '@/components/marketplace/AccountMenu': { __esModule: true, default: () => null },
    '@/components/marketplace/MarketplaceSearch': { __esModule: true, default: () => null },
    '@/lib/prisma': { __esModule: true, default: { property: { findMany: async (query) => {
      calls.push('query')
      assert.deepEqual(query.where, { status: 'VERIFIED', listingType: 'RENTAL' })
      assert.equal(query.select.ownerId, undefined)
      assert.equal(query.select.documents, undefined)
      return rows
    } } } },
  }).default
  const first = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({}) }))
  assert.match(textOf(first), /2-bedroom Flat available for rent/)
  rows = []
  const second = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({}) }))
  assert.match(textOf(second), /No verified properties match your search/)
  assert.deepEqual(calls, ['connection', 'query', 'connection', 'query'])
})
