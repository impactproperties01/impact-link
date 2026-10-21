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

const contact = loadSource('src/lib/inspection-contact.ts')
const { propertySchema } = loadSource('src/components/properties/schema.ts', { '@/lib/inspection-contact': contact })
const lease = {
  declarationAccepted: true,
  propertyRelationship: 'DIRECT_OWNER', directOwnerName: 'Test Owner', directOwnerPhone: '08012345678',
  directOwnerAddress: '20 Owner Street, Lagos', features: 'Water supply and gated access',
  listingType: 'LEASE', propertyType: 'HOUSE', title: 'Home with a private garden', description: '',
  address: '10 Example Street, Lagos', state: 'Lagos', locationArea: 'Ikeja',
  basePrice: 2000000, bedrooms: 3, bathrooms: 2, toilets: 3, parkingSpaces: 2,
  inspectionContactType: 'OWNER',
}

function component(file, values, effects = []) {
  return loadSource(file, {
    react: { ...React, useEffect: (callback) => effects.push(callback) },
    'react-hook-form': { useFormContext: () => ({
      register: (name, options = {}) => ({ name, ...(options.onChange ? { onChange: options.onChange } : {}) }), watch: () => values,
      getValues: (name) => name ? values[name] : values,
      setValue: (name, value) => { values[name] = value }, formState: { errors: {} },
    }) },
    '@/lib/inspection-contact': contact,
    '../InspectionContact': { __esModule: true, default: loadSource('src/components/properties/InspectionContact.tsx').default },
    '../PropertyRelationshipDetails': { __esModule: true, default: loadSource('src/components/properties/PropertyRelationshipDetails.tsx').default },
  }).default
}
function elements(tree, type) {
  const found = []
  function visit(element) {
    if (!React.isValidElement(element)) return
    if (element.type === type) found.push(element)
    React.Children.forEach(element.props.children, visit)
  }
  visit(tree)
  return found
}

test('selecting Lease resets an incompatible property type and exposes the three lease categories and description', () => {
  const values = { ...lease, listingType: 'RENTAL', propertyType: 'APARTMENT', title: 'Standard RENTAL Listing' }
  const Step = component('src/components/properties/steps/Step1BasicInfo.tsx', values)
  const tree = Step()
  elements(tree, 'button').find((button) => button.key === 'LEASE').props.onClick()
  assert.equal(values.listingType, 'LEASE')
  assert.equal(values.propertyType, 'HOUSE')
  assert.equal(values.tenancyDuration, '1 year')
  assert.equal(values.title, '')
  const selected = Step()
  const html = renderToStaticMarkup(selected)
  assert.match(html, /Residential homes/)
  assert.match(html, /Commercial buildings/)
  assert.match(html, />Land</)
  assert.match(html, /Enter a brief description for this lease/)
  assert.equal(elements(selected, 'input').find((input) => input.props.name === 'title').props.type, undefined)
  values.title = 'Keep my lease description'
  elements(selected, 'button').find((button) => button.key === 'LEASE').props.onClick()
  assert.equal(values.title, 'Keep my lease description')
})

test('lease details show the description with residential rooms, commercial facilities, or land size', () => {
  for (const propertyType of ['HOUSE', 'COMMERCIAL', 'LAND']) {
    const Step = component('src/components/properties/steps/Step2Details.tsx', { ...lease, propertyType })
    const html = renderToStaticMarkup(React.createElement(Step))
    assert.match(html, /Home with a private garden/)
    if (propertyType === 'LAND') {
      assert.match(html, /name="size"/)
      assert.doesNotMatch(html, /name="bedrooms"|name="bathrooms"/)
    } else {
      assert.match(html, /name="bathrooms"/)
      assert.match(html, /name="toilets"/)
      assert.match(html, /name="parkingSpaces"/)
      if (propertyType === 'HOUSE') assert.match(html, /name="bedrooms"/)
      else assert.doesNotMatch(html, /name="bedrooms"/)
    }
  }
})

test('lease pricing uses one yearly price and the existing 20 percent agreement and platform fees', () => {
  const values = { ...lease, tenancyDuration: '6 months', cautionFee: 0 }
  const effects = []
  const Pricing = component('src/components/properties/steps/Step3Pricing.tsx', values, effects)
  const html = renderToStaticMarkup(React.createElement(Pricing))
  for (const effect of effects) effect()
  assert.equal(values.tenancyDuration, '1 year')
  const text = html.replace(/<[^>]*>/g, '')
  assert.match(text, /Price per year/)
  assert.match(text, /Agreement Fee \(20%\)/)
  assert.match(text, /Platform Fee \(20%\)/)
  assert.equal((text.match(/₦400,000/g) || []).length, 2)
  assert.match(text, /₦2,800,000/)
  assert.doesNotMatch(html, /name="tenancyDuration"|Installmental Price|Price per night/)
})

test('lease validation rejects missing descriptions, unsupported property types, and missing land size', () => {
  assert.equal(propertySchema.safeParse(lease).success, true)
  for (const input of [
    { ...lease, title: '' }, { ...lease, title: '   ' },
    { ...lease, propertyType: 'APARTMENT' }, { ...lease, propertyType: 'DUPLEX' },
    { ...lease, propertyType: 'LAND' }, { ...lease, propertyType: 'LAND', size: -10 },
    { ...lease, basePrice: 0 },
  ]) assert.equal(propertySchema.safeParse(input).success, false)
})

test('lease preview shows yearly fees, description, and the selected property structure', () => {
  const Preview = component('src/components/properties/steps/Step6Preview.tsx', { ...lease, cautionFee: 0 })
  const text = renderToStaticMarkup(React.createElement(Preview, { imageFiles: [] })).replace(/<[^>]*>/g, '')
  assert.match(text, /Residential home for lease/)
  assert.match(text, /Home with a private garden/)
  assert.match(text, /\/ year/)
  assert.match(text, /3 Bedrooms/)
  assert.match(text, /Agreement Fee \(20%\)₦400,000/)
  assert.match(text, /Platform Fee \(20%\)₦400,000/)
  assert.match(text, /Total First Payment₦2,800,000/)
})

test('all listing types collect relationship and direct owner details in Basic Info and features in Details', () => {
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    for (const propertyRelationship of ['DIRECT_OWNER', 'OTHER']) {
      const values = { ...lease, listingType, propertyRelationship, ownerRelationship: 'Property manager' }
      const Basic = component('src/components/properties/steps/Step1BasicInfo.tsx', values)
      const basicHtml = renderToStaticMarkup(React.createElement(Basic))
      for (const field of ['propertyRelationship', 'directOwnerName', 'directOwnerPhone', 'directOwnerAddress']) assert.ok(basicHtml.includes(`name="${field}"`))
      assert.equal(basicHtml.includes('name="ownerRelationship"'), propertyRelationship === 'OTHER')
      const Details = component('src/components/properties/steps/Step2Details.tsx', values)
      const detailHtml = renderToStaticMarkup(React.createElement(Details))
      assert.match(detailHtml, /<textarea[^>]*name="features"/)
      assert.match(detailHtml, /Features of Property/)
      assert.equal(propertySchema.safeParse(values).success, true)
    }
  }
})

test('changing relationship clears prefilled contact details so they cannot be mistaken for another owner', () => {
  const values = { ...lease }
  const Basic = component('src/components/properties/steps/Step1BasicInfo.tsx', values)
  const other = elements(Basic(), 'input').find((input) => input.props.name === 'propertyRelationship' && input.props.value === 'OTHER')
  other.props.onChange()
  for (const field of ['ownerRelationship', 'directOwnerName', 'directOwnerPhone', 'directOwnerAddress']) assert.equal(values[field], '')
})

test('ownership and features validation requires complete details and conditionally requires the relationship description', () => {
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    const base = { ...lease, listingType }
    for (const field of ['propertyRelationship', 'directOwnerName', 'directOwnerPhone', 'directOwnerAddress', 'features']) {
      assert.equal(propertySchema.safeParse({ ...base, [field]: undefined }).success, false, `${listingType}: ${field}`)
      assert.equal(propertySchema.safeParse({ ...base, [field]: '' }).success, false, `${listingType}: empty ${field}`)
    }
    assert.equal(propertySchema.safeParse({ ...base, propertyRelationship: 'OTHER', ownerRelationship: '   ' }).success, false)
    assert.equal(propertySchema.safeParse({ ...base, directOwnerPhone: 'abc' }).success, false)
    assert.equal(propertySchema.safeParse({ ...base, features: 'x'.repeat(5001) }).success, false)
    const direct = propertySchema.parse({ ...base, ownerRelationship: 'Stale agent description' })
    assert.equal(direct.ownerRelationship, '')
  }
})

test('preview preserves free-text features and owner details for every listing type', () => {
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    const values = { ...lease, listingType, propertyRelationship: 'OTHER', ownerRelationship: 'Family member', features: 'Water supply\nPrivate garden <script>alert(1)</script>' }
    const Preview = component('src/components/properties/steps/Step6Preview.tsx', values)
    const html = renderToStaticMarkup(React.createElement(Preview, { imageFiles: [] }))
    assert.match(html, /Family member/)
    assert.match(html, /Test Owner/)
    assert.match(html, /20 Owner Street, Lagos/)
    assert.match(html, /Water supply\nPrivate garden &lt;script&gt;/)
    assert.doesNotMatch(html, /<script>/)
  }
})
