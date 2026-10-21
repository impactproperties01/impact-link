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
const schema = loadSource('src/components/properties/schema.ts', { '@/lib/inspection-contact': contact })
const Contact = loadSource('src/components/properties/InspectionContact.tsx').default
const base = { declarationAccepted: true, listingType: 'RENTAL', propertyType: 'LAND', title: 'Property with road access', state: 'Lagos', locationArea: 'Ikeja', address: '10 Example Street', basePrice: 100000, size: 600, bedroomTypes: [], documents: [], inspectionContactType: 'OWNER', propertyRelationship: 'DIRECT_OWNER', directOwnerName: 'Account Owner', directOwnerPhone: '08012345678', directOwnerAddress: '20 Owner Street, Lagos', features: 'Good road access' }
const owner = { name: 'Account Owner', phone: '08012345678' }

function submission({ profile = owner, signedIn = true } = {}) {
  const writes = [], reads = [], uploads = []
  const action = loadSource('src/actions/properties.ts', {
    '@/auth': { auth: async () => signedIn ? { user: { id: 'owner-1', name: 'Untrusted Session Name' } } : null },
    '@/lib/prisma': { __esModule: true, default: {
      user: { findUnique: async (query) => { reads.push(query); return profile } },
      property: { create: async ({ data }) => { writes.push(data); return { id: 'listing-1' } } },
    } },
    '@/components/properties/schema': schema,
    '@/lib/inspection-contact': contact,
    '@/lib/property-fees': loadSource('src/lib/property-fees.ts'),
    'next/cache': { revalidatePath: () => {} },
    cloudinary: { v2: { config: () => {}, uploader: { upload_stream: (_options, done) => { uploads.push(true); return { end: () => done(null, { secure_url: 'https://example.invalid/property.jpg' }) } } } } },
    console: { error: () => {} },
  }).createPropertyAction
  return { writes, reads, uploads, create: async (overrides = {}) => {
    const form = new FormData()
    form.set('data', JSON.stringify({ ...base, ...overrides }))
    form.append('images', new File(['image'], 'property.jpg', { type: 'image/jpeg' }))
    return action(form)
  } }
}

test('Use owner is the default and custom contact fields are required together', () => {
  assert.equal(schema.propertySchema.parse({ ...base, inspectionContactType: undefined }).inspectionContactType, 'OWNER')
  for (const input of [{}, { inspectionContactName: 'Agent' }, { inspectionContactPhone: '08012345678' }]) {
    assert.equal(schema.propertySchema.safeParse({ ...base, inspectionContactType: 'CUSTOM', ...input }).success, false)
  }
  assert.equal(schema.propertySchema.safeParse({ ...base, inspectionContactType: 'OTHER' }).success, false)
})

test('inspection phone validation accepts local and international formats and rejects invalid values', () => {
  for (const phone of ['08012345678', '+234 801 234 5678', '+1 (202) 555-0123']) assert.equal(contact.inspectionContactSchema.safeParse({ name: 'Agent', phone }).success, true)
  for (const phone of ['', 'abc', '123', '+23480 ext 123', '1'.repeat(16), '++2348012345678']) assert.equal(contact.inspectionContactSchema.safeParse({ name: 'Agent', phone }).success, false)
})

test('Use owner saves current database name and phone and ignores supplied owner contact overrides', async () => {
  const state = submission()
  const result = await state.create({ inspectionContactName: 'Spoofed Name', inspectionContactPhone: '+11111111111' })
  assert.equal(result.success, true)
  assert.deepEqual(state.reads, [{ where: { id: 'owner-1' }, select: { name: true, phone: true } }])
  assert.equal(state.writes[0].inspectionContactType, 'OWNER')
  assert.equal(state.writes[0].inspectionContactName, owner.name)
  assert.equal(state.writes[0].inspectionContactPhone, owner.phone)
  assert.equal(state.writes[0].ownerId, 'owner-1')
  assert.equal(state.writes[0].status, 'PENDING')
})

test('custom inspection contact is trimmed and persisted for rent, sale and shortlet listings', async () => {
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    const state = submission({ profile: { name: null, phone: null } })
    const result = await state.create({ listingType, inspectionContactType: 'CUSTOM', inspectionContactName: '  Viewing Agent  ', inspectionContactPhone: ' +234 801 234 5678 ' })
    assert.equal(result.success, true)
    assert.equal(state.writes[0].inspectionContactType, 'CUSTOM')
    assert.equal(state.writes[0].inspectionContactName, 'Viewing Agent')
    assert.equal(state.writes[0].inspectionContactPhone, '+234 801 234 5678')
  }
})

test('incomplete owner profiles cannot upload images or save a listing using owner contact', async () => {
  for (const profile of [{ name: 'Owner', phone: null }, { name: null, phone: '08012345678' }, { name: 'Owner', phone: 'invalid' }, null]) {
    const state = submission({ profile })
    assert.equal((await state.create()).success, false)
    assert.equal(state.uploads.length, 0)
    assert.equal(state.writes.length, 0)
  }
})

test('invalid custom contact fails before image uploads and property writes', async () => {
  const state = submission()
  assert.equal((await state.create({ inspectionContactType: 'CUSTOM', inspectionContactName: '', inspectionContactPhone: 'not a phone' })).success, false)
  assert.equal(state.uploads.length, 0)
  assert.equal(state.writes.length, 0)
})

test('signed-out submissions cannot read owner contacts, upload images or write listings', async () => {
  const state = submission({ signedIn: false })
  assert.equal((await state.create()).success, false)
  assert.equal(state.reads.length, 0)
  assert.equal(state.uploads.length, 0)
  assert.equal(state.writes.length, 0)
})

test('inspection step displays owner defaults and custom name/phone inputs for the selected option', () => {
  for (const mode of ['OWNER', 'CUSTOM']) {
    const Step = loadSource('src/components/properties/steps/Step5Inspection.tsx', {
      '@/lib/inspection-contact': contact,
      'react-hook-form': { useFormContext: () => ({ register: (name) => ({ name }), watch: () => mode, clearErrors: () => {}, formState: { errors: {} } }) },
    }).default
    const html = renderToStaticMarkup(React.createElement(Step, { ownerContact: owner }))
    assert.match(html, /Use owner/)
    assert.match(html, /Input details/)
    if (mode === 'OWNER') { assert.match(html, /Account Owner/); assert.match(html, /08012345678/) }
    else { assert.match(html, /name="inspectionContactName"/); assert.match(html, /name="inspectionContactPhone"/); assert.match(html, /type="tel"/) }
  }
})

function wizard(step, listingType = 'RENTAL', profile = owner) {
  const data = { ...base, listingType, totalUnits: 2, availableUnits: 1, tenancyDuration: '1 year', documents: ['Receipt'] }
  const states = [step, [new File(['image'], 'photo.jpg')], false, false]
  const errors = [], saves = []
  let hook = 0
  const mocks = {
    react: { ...React, useEffect: () => {}, useState: () => { const i = hook++; return [states[i], (next) => { states[i] = typeof next === 'function' ? next(states[i]) : next }] } },
    'react-hook-form': { useForm: () => ({ watch: (key) => data[key], getValues: () => data, setValue: (key, value) => { data[key] = value }, register: (name) => ({ name }), formState: { errors: {} }, trigger: async () => true, setError: (...args) => errors.push(args), handleSubmit: () => () => {} }), FormProvider: ({ children }) => children },
    './schema': schema,
    '@/lib/inspection-contact': contact,
    '@/actions/properties': { createPropertyAction: async () => saves.push(true) },
  }
  for (const name of ['Step1BasicInfo', 'Step2Details', 'Step3Pricing', 'Step4Media', 'Step5Features', 'Step5Inspection', 'Step6Preview']) mocks[`./steps/${name}`] = { __esModule: true, default: () => null }
  mocks['./SuccessScreen'] = { __esModule: true, default: () => null }
  const Form = loadSource('src/components/properties/AddPropertyForm.tsx', mocks).default
  const tree = Form({ ownerContact: profile })
  const buttons = [], inputs = []
  function walk(element) {
    if (!React.isValidElement(element)) return
    if (element.type === 'button') buttons.push(element)
    if (element.type === 'input') inputs.push(element)
    React.Children.forEach(element.props.children, walk)
  }
  walk(tree)
  return { states, errors, saves, buttons, inputs, data }
}

test('Media Next advances to Inspection without submitting a listing', async () => {
  const state = wizard(4)
  const next = state.buttons.find((button) => button.props.children === 'Next')
  assert.equal(next.props.type, 'button')
  await next.props.onClick({ preventDefault() {} })
  assert.equal(state.states[0], 5)
  assert.equal(state.saves.length, 0)
})

test('inspection gates missing owner details and advances complete details to the correct next step', async () => {
  const missing = wizard(5, 'RENTAL', { name: 'Owner', phone: null })
  await missing.buttons.find((button) => button.props.children === 'Next').props.onClick({ preventDefault() {} })
  assert.equal(missing.states[0], 5)
  assert.equal(missing.errors[0][0], 'inspectionContactType')
  for (const listingType of ['RENTAL', 'SALE', 'SHORTLET', 'LEASE']) {
    const state = wizard(5, listingType)
    await state.buttons.find((button) => button.props.children === 'Next').props.onClick({ preventDefault() {} })
    assert.equal(state.states[0], 6)
    assert.equal(state.saves.length, 0)
  }
})

test('only the final preview step has a submit button for each listing type', () => {
  for (const [listingType, preview] of [['RENTAL', 6], ['SALE', 7], ['SHORTLET', 6], ['LEASE', 6]]) {
    const previous = wizard(preview - 1, listingType)
    assert.equal(previous.buttons.some((button) => button.props.type === 'submit'), false)
    const state = wizard(preview, listingType)
    const submit = state.buttons.find((button) => button.props.type === 'submit')
    assert.equal(submit.props.name, 'submitProperty')
    assert.equal(submit.props.disabled, false)
    assert.equal(state.saves.length, 0)
  }
})

test('the property declaration appears on the existing final preview for every listing type and resets when editing', () => {
  for (const [listingType, preview] of [['RENTAL', 6], ['SALE', 7], ['SHORTLET', 6], ['LEASE', 6]]) {
    const previous = wizard(preview - 1, listingType)
    assert.equal(previous.inputs.some((input) => input.props.name === 'declarationAccepted'), false)
    const final = wizard(preview, listingType)
    const checkbox = final.inputs.find((input) => input.props.name === 'declarationAccepted')
    assert.equal(checkbox.props.type, 'checkbox')
    assert.equal(checkbox.props.required, true)
    // The first button is the existing back button.
    final.buttons[0].props.onClick()
    assert.equal(final.data.declarationAccepted, false)
  }
})

test('property submissions without explicit declaration acceptance fail before uploads and database writes', async () => {
  for (const declarationAccepted of [false, undefined, 'true', 1]) {
    const state = submission()
    const result = await state.create({ declarationAccepted })
    assert.equal(result.success, false)
    assert.equal(state.uploads.length, 0)
    assert.equal(state.writes.length, 0)
  }
})

test('preview resolves owner or custom inspection details and does not invent contacts for old listings', () => {
  for (const mode of ['OWNER', 'CUSTOM']) {
    const Preview = loadSource('src/components/properties/steps/Step6Preview.tsx', {
      'react-hook-form': { useFormContext: () => ({ watch: () => ({ ...base, inspectionContactType: mode, inspectionContactName: 'Viewing Agent', inspectionContactPhone: '08099999999' }) }) },
      '../InspectionContact': { __esModule: true, default: Contact }, '@/lib/inspection-contact': contact,
      '../PropertyRelationshipDetails': { __esModule: true, default: loadSource('src/components/properties/PropertyRelationshipDetails.tsx').default },
    }).default
    const html = renderToStaticMarkup(React.createElement(Preview, { imageFiles: [], ownerContact: owner }))
    assert.match(html, mode === 'OWNER' ? /Account Owner/ : /Viewing Agent/)
    assert.match(html, mode === 'OWNER' ? /href="tel:08012345678"/ : /href="tel:08099999999"/)
  }
  assert.equal(renderToStaticMarkup(React.createElement(Contact, { name: null, phone: null })), '')
})
