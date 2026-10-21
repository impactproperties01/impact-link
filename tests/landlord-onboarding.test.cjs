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

const schema = loadSource('src/lib/landlord-onboarding.ts')
const profile = {
  fullName: '  Daniel Akpan  ', phone: '08012345678', address: '  10 Example Street, Lagos  ',
  stateOfOrigin: '  Akwa Ibom  ', lga: '  Uyo  ', nextOfKinName: '  Ada Akpan  ', nextOfKinPhone: '+234 802 345 6789',
}

function fixture({ signedIn = true, role = 'OWNER' } = {}) {
  const writes = [], uploads = [], reads = []
  const { completeLandlordOnboarding } = loadSource('src/actions/onboarding.ts', {
    '@/auth': { auth: async () => signedIn ? { user: { id: 'owner-1', image: 'existing-photo' } } : null },
    '@/lib/landlord-onboarding': schema,
    '@/lib/prisma': { __esModule: true, default: { user: {
      findUnique: async (query) => { reads.push(query); return role ? { role } : null },
      update: async (query) => { writes.push(query); return { id: 'owner-1' } },
    } } },
    cloudinary: { v2: { config: () => {}, uploader: { upload_stream: (_options, done) => { uploads.push(true); return { end: () => done(null, { secure_url: 'new-profile-photo' }) } } } } },
  })
  return { writes, uploads, reads, submit: async (overrides = {}, file) => {
    const form = new FormData()
    for (const [key, value] of Object.entries({ ...profile, ...overrides })) if (value !== undefined) form.set(key, value)
    if (file) form.set('profileImage', file)
    return completeLandlordOnboarding(form)
  } }
}

test('landlord onboarding saves state of origin, LGA, next of kin and the previously unsaved address', async () => {
  const state = fixture()
  assert.equal((await state.submit()).success, true)
  assert.deepEqual(state.writes[0], { where: { id: 'owner-1' }, data: {
    name: 'Daniel Akpan', phone: '08012345678', address: '10 Example Street, Lagos',
    stateOfOrigin: 'Akwa Ibom', lga: 'Uyo', nextOfKinName: 'Ada Akpan', nextOfKinPhone: '+234 802 345 6789',
    image: 'existing-photo', isVerified: true,
  } })
})

test('every new onboarding field is required and invalid input cannot upload a photo or verify the account', async () => {
  for (const field of ['stateOfOrigin', 'lga', 'nextOfKinName', 'nextOfKinPhone']) {
    for (const value of ['', '   ', undefined]) {
      const state = fixture()
      const result = await state.submit({ [field]: value }, new File(['photo'], 'profile.jpg', { type: 'image/jpeg' }))
      assert.equal(result.success, false, `${field}: ${value}`)
      assert.equal(state.writes.length, 0)
      assert.equal(state.uploads.length, 0)
    }
  }
  for (const nextOfKinPhone of ['abc', '123', '++2348023456789']) assert.equal((await fixture().submit({ nextOfKinPhone })).success, false)
})

test('only the authenticated owner can complete landlord onboarding', async () => {
  for (const options of [{ signedIn: false }, { role: null }, { role: 'TENANT' }, { role: 'AGENT' }, { role: 'ADMIN' }]) {
    const state = fixture(options)
    assert.equal((await state.submit()).success, false)
    assert.equal(state.writes.length, 0)
    assert.equal(state.uploads.length, 0)
    if (options.signedIn === false) assert.equal(state.reads.length, 0)
  }
})

test('optional profile uploads preserve the profile flow while invalid file types are rejected', async () => {
  const valid = fixture()
  assert.equal((await valid.submit({}, new File(['image'], 'profile.jpg', { type: 'image/jpeg' }))).success, true)
  assert.equal(valid.writes[0].data.image, 'new-profile-photo')
  const invalid = fixture()
  assert.equal((await invalid.submit({}, new File(['document'], 'profile.pdf', { type: 'application/pdf' }))).success, false)
  assert.equal(invalid.writes.length, 0)
  assert.equal(invalid.uploads.length, 0)
})

test('onboarding presents the new required fields without the property declaration or an extra step', () => {
  const Onboarding = loadSource('src/components/auth/PropertyOwnerOnboarding.tsx', {
    'next/navigation': { useRouter: () => ({ back: () => {}, push: () => {} }) },
    'next-auth/react': { useSession: () => ({ update: async () => {} }) },
    '@/actions/onboarding': { completeLandlordOnboarding: async () => ({ success: true }) },
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
  }).default
  const html = renderToStaticMarkup(React.createElement(Onboarding))
  for (const name of ['stateOfOrigin', 'lga', 'nextOfKinName', 'nextOfKinPhone']) {
    const input = html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0]
    assert.ok(input, `Missing ${name} input`)
    assert.match(input, /required=""/)
  }
  assert.doesNotMatch(html, /I confirm that I am the property owner|type="checkbox"/)
  assert.match(html, />Continue/)
})
