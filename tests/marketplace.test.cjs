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
const marketplace = loadSource('src/lib/marketplace.ts')
const { parseMarketplaceFilters: parse, marketplaceQuery: query, marketplaceHref: href } = marketplace
const image = { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) }
const MarketplaceSearch = loadSource('src/components/marketplace/MarketplaceSearch.tsx', { '@/lib/marketplace': marketplace }).default

function account(session, status = session ? 'authenticated' : 'unauthenticated', mocks = {}) {
  return loadSource('src/components/marketplace/AccountMenu.tsx', {
    'next-auth/react': { useSession: () => ({ data: session, status }), signOut: async () => {} },
    ...mocks,
  }).default
}
async function renderHome(params = {}, rowCount = 0) {
  let captured
  const AccountMenu = account(null)
  const HomePage = loadSource('src/app/(main)/page.tsx', {
    'next/image': image,
    'next/server': { connection: async () => {} },
    '@/components/ui/PropertyCard': { __esModule: true, default: ({ property }) => React.createElement('article', null, property.id) },
    '@/components/marketplace/AccountMenu': { __esModule: true, default: AccountMenu },
    '@/components/marketplace/MarketplaceSearch': { __esModule: true, default: MarketplaceSearch },
    '@/lib/marketplace': marketplace,
    '@/lib/prisma': { __esModule: true, default: { property: { findMany: async (args) => {
      captured = args
      return Array.from({ length: rowCount }, (_, i) => ({ id: `listing-${i}` }))
    } } } },
  }).default
  return { html: renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve(params) })), captured }
}

test('Rent, Buy and Shortlet always query their own verified listing category', () => {
  for (const [listing, listingType] of [['rent', 'RENTAL'], ['buy', 'SALE'], ['shortlet', 'SHORTLET'], ['lease', 'LEASE']]) {
    const filters = parse({ listing, status: 'PENDING' })
    assert.deepEqual(query(filters).where, { status: 'VERIFIED', listingType })
  }
  assert.equal(parse({}).listing, 'rent')
})

test('lease marketplace preserves yearly price and property filters and exposes the Lease tab', async () => {
  const filters = parse({ listing: 'lease', propertyType: 'COMMERCIAL', minPrice: '1000000', duration: '6 months' })
  assert.equal(filters.duration, '')
  assert.equal(query(filters).where.listingType, 'LEASE')
  assert.equal(query(filters).where.propertyType, 'COMMERCIAL')
  assert.deepEqual(query(filters).where.basePrice, { gte: 1000000, lte: undefined })
  assert.match(href(filters, { page: 2 }), /listing=lease/)
  const { html } = await renderHome({ listing: 'lease' })
  assert.match(html, /Properties for lease/)
  assert.match(html, /View all properties for lease/)
  assert.match(html, /per year/)
})

test('untrusted or repeated filter values cannot override status, enums, or query limits', () => {
  const filters = parse({ listing: ['buy', 'shortlet'], propertyType: 'UNKNOWN', minPrice: '-1', maxPrice: 'Infinity', bedrooms: '99', duration: 'forever', sort: 'ownerId', page: '-1' })
  assert.equal(filters.listing, 'rent')
  assert.equal(filters.propertyType, undefined)
  assert.equal(filters.minPrice, undefined)
  assert.equal(filters.maxPrice, undefined)
  assert.equal(filters.bedrooms, '')
  assert.equal(filters.duration, '')
  assert.equal(filters.sort, 'newest')
  assert.equal(filters.page, 1)
  assert.equal(parse({ page: '999999999' }).page, 10000)
  assert.equal(parse({ minPrice: '0' }).minPrice, 0)
  assert.equal(parse({ q: ' '.repeat(5) + 'a'.repeat(200) }).q.length, 100)
})

test('location search, price, type and tenancy combine without weakening approval filtering', () => {
  const { where, orderBy } = query(parse({ q: ' Ikeja ', minPrice: '100000', maxPrice: '900000', propertyType: 'APARTMENT', duration: '6 months', sort: 'price-low' }))
  assert.equal(where.status, 'VERIFIED')
  assert.equal(where.listingType, 'RENTAL')
  assert.equal(where.propertyType, 'APARTMENT')
  assert.deepEqual(where.basePrice, { gte: 100000, lte: 900000 })
  assert.equal(where.tenancyDuration, '6 months')
  assert.deepEqual(where.AND[0].OR[0], { address: { contains: 'Ikeja', mode: 'insensitive' } })
  assert.deepEqual(orderBy, [{ basePrice: 'asc' }, { id: 'asc' }])
})

test('bedroom filter includes the labels actually collected for rental apartments and shortlets', () => {
  const bedroomFilter = query(parse({ bedrooms: '2' })).where.AND[0]
  assert.deepEqual(bedroomFilter.propertyType, { not: 'LAND' })
  assert.deepEqual(bedroomFilter.OR, [
    { bedrooms: 2 },
    { listingType: 'RENTAL', bedroomTypes: { hasSome: ['2-bedroom Flat'] } },
    { listingType: 'SHORTLET', shortletBedrooms: { in: ['2-bedrooms'], mode: 'insensitive' } },
  ])
  assert.deepEqual(query(parse({ bedrooms: '5+' })).where.AND[0].OR[0], { bedrooms: { gte: 5 } })
})

test('category links preserve search filters, reset pagination and drop tenancy outside rentals', () => {
  const filters = parse({ q: 'Ikeja & Lagos', minPrice: '0', bedrooms: '2', duration: '1 year', sort: 'price-high', page: '3' })
  const params = new URL(href(filters, { listing: 'buy', page: 1 }), 'http://localhost').searchParams
  assert.equal(params.get('listing'), 'buy')
  assert.equal(params.get('q'), 'Ikeja & Lagos')
  assert.equal(params.get('minPrice'), '0')
  assert.equal(params.get('bedrooms'), '2')
  assert.equal(params.get('sort'), 'price-high')
  assert.equal(params.has('page'), false)
  assert.equal(params.has('duration'), false)
  assert.equal(query(parse({ listing: 'shortlet', duration: '1 year' })).where.tenancyDuration, undefined)
})

test('search form submits filters together and resets pagination while retaining the selected tab', () => {
  const html = renderToStaticMarkup(React.createElement(MarketplaceSearch, { filters: parse({ listing: 'buy', q: 'Ikeja', page: '2' }) }))
  assert.match(html, /<form[^>]+action="\/"[^>]+method="get"/)
  assert.match(html, /name="listing" value="buy"/)
  for (const field of ['q', 'minPrice', 'maxPrice', 'bedrooms', 'propertyType', 'sort']) assert.match(html, new RegExp(`name="${field}"`))
  assert.doesNotMatch(html, /name="page"|name="duration"/)
  assert.match(html, /href="\/\?listing=buy"/)
})

test('profile offers existing sign-in and registration routes to visitors', () => {
  const AccountMenu = account(null)
  for (const variant of ['header', 'sidebar', 'bottom']) {
    const html = renderToStaticMarkup(React.createElement(AccountMenu, { variant }))
    assert.match(html, /href="\/login"/)
    assert.match(html, /href="\/register"/)
    assert.doesNotMatch(html, /href="\/profile"|Sign out/)
  }
})

test('signed-in profile offers dashboard and sign out instead of registration', () => {
  const AccountMenu = account({ user: { name: 'Listing Owner' } })
  const html = renderToStaticMarkup(React.createElement(AccountMenu))
  assert.match(html, /Listing Owner/)
  assert.match(html, /href="\/dashboard"/)
  assert.match(html, /Sign out/)
  assert.doesNotMatch(html, /href="\/register"|href="\/login"/)
})

test('profile waits for session lookup before offering account actions', () => {
  const AccountMenu = account(null, 'loading')
  const html = renderToStaticMarkup(React.createElement(AccountMenu))
  assert.match(html, /Loading account/)
  assert.doesNotMatch(html, /href="\/login"|href="\/register"/)
})

test('profile sign out uses the existing Auth.js session action and returns to the marketplace', async () => {
  const calls = []
  const AccountMenu = account({ user: { name: 'Owner' } }, 'authenticated', {
    react: { ...React, useEffect: () => {}, useRef: () => ({ current: null }), useState: (value) => [value, () => {}] },
    'next-auth/react': { useSession: () => ({ data: { user: { name: 'Owner' } }, status: 'authenticated' }), signOut: async (options) => calls.push(options) },
  })
  const buttons = []
  function walk(element) {
    if (!React.isValidElement(element)) return
    if (element.type === 'button') buttons.push(element)
    React.Children.forEach(element.props.children, walk)
  }
  walk(AccountMenu({}))
  assert.equal(buttons.length, 1)
  await buttons[0].props.onClick()
  assert.deepEqual(calls, [{ callbackUrl: '/' }])
})

test('homepage category, filter defaults, CTA and empty state agree with the submitted URL', async () => {
  const { html, captured } = await renderHome({ listing: 'buy', q: 'Ikeja' })
  assert.equal(captured.where.status, 'VERIFIED')
  assert.equal(captured.where.listingType, 'SALE')
  assert.match(html, /Properties for sale/)
  assert.match(html, /aria-current="page"[^>]*>[\s\S]*?Buy<\/a>/)
  assert.match(html, /value="Ikeja"/)
  assert.match(html, /No verified properties match your search/)
  assert.match(html, /href="\/register"[^>]*>\s*Get Started/)
})

test('homepage paginates all matching listings with stable ordering and preserved search', async () => {
  const { html, captured } = await renderHome({ listing: 'shortlet', q: 'Lekki', page: '2', sort: 'price-high' }, 13)
  assert.equal(captured.take, 13)
  assert.equal(captured.skip, 12)
  assert.equal(captured.where.listingType, 'SHORTLET')
  assert.deepEqual(captured.orderBy, [{ basePrice: 'desc' }, { id: 'asc' }])
  assert.equal((html.match(/<article>/g) || []).length, 12)
  assert.match(html, /Page 2/)
  assert.match(html, /listing=shortlet&amp;q=Lekki&amp;sort=price-high&amp;page=3#listings/)
  assert.match(html, /Previous/)
  assert.match(html, /Next/)
})
