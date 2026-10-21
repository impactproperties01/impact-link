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
const terms = loadSource('src/lib/terms.ts')
const image = { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) }
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) }

function actionsFixture(existing = null) {
  const reads = [], created = [], updated = [], sent = [], cookies = []
  const actions = loadSource('src/actions/auth.ts', {
    '@/lib/terms': terms,
    '@/lib/prisma': { __esModule: true, default: { user: {
      findUnique: async (query) => { reads.push(query); return existing },
      create: async (query) => { created.push(query); return { id: 'user-1', ...query.data } },
      update: async (query) => { updated.push(query); return { ...existing, ...query.data } },
    } } },
    bcryptjs: { __esModule: true, default: { genSalt: async () => 'salt', hash: async () => 'hash', compare: async () => true } },
    '@/auth': { signIn: async () => {} }, 'next-auth': { AuthError: class extends Error {} },
    '@/lib/tokens': { generateVerificationToken: async (email) => ({ identifier: email, token: 'token' }) },
    '@/lib/mail': { sendVerificationEmail: async (email) => sent.push(email) },
    'next/headers': { cookies: async () => ({ set: (...args) => cookies.push(args) }) },
  })
  return { ...actions, reads, created, updated, sent, cookies, register: async (value) => {
    const form = new FormData()
    for (const [key, text] of Object.entries({ email: 'person@example.com', password: 'password123', confirmPassword: 'password123', role: 'OWNER' })) form.set(key, text)
    if (value !== undefined) form.set('termsAccepted', value)
    return actions.registerUser(null, form)
  } }
}

test('password registration requires explicit acceptance before account reads, writes or sending email', async () => {
  for (const value of [undefined, '', 'false', 'true', 'on']) {
    const state = actionsFixture()
    const result = await state.register(value)
    assert.equal(result.success, false)
    assert.match(result.error, /accept the Terms and Conditions/)
    assert.equal(state.reads.length, 0)
    assert.equal(state.created.length, 0)
    assert.equal(state.sent.length, 0)
  }
})

test('password signup records the server acceptance time and current terms version', async () => {
  const state = actionsFixture()
  const before = Date.now()
  assert.equal((await state.register('accepted')).success, true)
  assert.equal(state.created[0].data.termsVersion, terms.TERMS_VERSION)
  assert.ok(state.created[0].data.termsAcceptedAt instanceof Date)
  assert.ok(state.created[0].data.termsAcceptedAt.getTime() >= before)
  assert.equal(state.created[0].data.role, 'OWNER')
})

test('retrying signup preserves a current acceptance and records acceptance for a legacy unverified account', async () => {
  const existing = { id: 'user-1', email: 'person@example.com', passwordHash: 'hash', emailVerified: null, termsVersion: terms.TERMS_VERSION, termsAcceptedAt: new Date() }
  const current = actionsFixture(existing)
  assert.equal((await current.register('accepted')).success, true)
  assert.equal(current.updated.length, 0)
  const legacy = actionsFixture({ ...existing, termsVersion: null, termsAcceptedAt: null })
  assert.equal((await legacy.register('accepted')).success, true)
  assert.equal(legacy.updated[0].data.termsVersion, terms.TERMS_VERSION)
  assert.equal(legacy.created.length, 0)
})

test('OAuth preparation rejects unchecked acceptance and admin roles, and stores server cookies for valid signup', async () => {
  const state = actionsFixture()
  for (const args of [['OWNER', false], ['ADMIN', true], ['OWNER', 'true']]) {
    assert.equal((await state.prepareOAuthRegistration(...args)).success, false)
    assert.equal(state.cookies.length, 0)
  }
  assert.equal((await state.prepareOAuthRegistration('OWNER', true)).success, true)
  const accepted = state.cookies.find(([name]) => name === terms.TERMS_COOKIE_NAME)
  assert.equal(accepted[1], terms.TERMS_VERSION)
  assert.equal(accepted[2].httpOnly, true)
  assert.equal(accepted[2].sameSite, 'lax')
  assert.equal(accepted[2].maxAge, 600)
})

function oauthFixture({ existing = null, role = 'OWNER', version = terms.TERMS_VERSION } = {}) {
  let config
  let user = existing
  const writes = [], deleted = []
  const cookieValues = { impact_link_pending_role: role, [terms.TERMS_COOKIE_NAME]: version }
  loadSource('src/auth.ts', {
    'next-auth': { __esModule: true, default: (options) => { config = options; return {} } },
    'next-auth/providers/google': { __esModule: true, default: () => ({}) },
    'next-auth/providers/credentials': { __esModule: true, default: () => ({}) },
    '@auth/prisma-adapter': { PrismaAdapter: () => ({}) },
    '@/lib/prisma': { __esModule: true, default: { user: {
      findUnique: async () => user,
      create: async ({ data }) => { writes.push(data); user = { id: 'oauth-user', emailVerified: new Date(), ...data }; return user },
      update: async ({ data }) => { user = { ...user, ...data }; return user },
    } } },
    'next/headers': { cookies: async () => ({ get: (name) => cookieValues[name] ? { value: cookieValues[name] } : undefined, delete: (name) => deleted.push(name) }) },
    '@/lib/roles': loadSource('src/lib/roles.ts'), '@/lib/terms': terms,
  })
  return { config, writes, deleted }
}

test('new OAuth accounts require current terms in both sign-in checks and database creation', async () => {
  for (const version of [undefined, '', 'outdated']) {
    // Empty is used for the absent-cookie case because the fixture defaults undefined.
    const state = oauthFixture({ version: version || '' })
    assert.equal(await state.config.callbacks.signIn({ user: { email: 'person@example.com' }, account: { provider: 'google' } }), '/register')
    await assert.rejects(state.config.adapter.createUser({ id: 'provider-id', email: 'person@example.com', emailVerified: null }), /Accept the Terms/)
    assert.equal(state.writes.length, 0)
  }
  const valid = oauthFixture()
  assert.equal(await valid.config.callbacks.signIn({ user: { email: 'person@example.com' }, account: { provider: 'google' } }), true)
  await valid.config.adapter.createUser({ id: 'provider-id', email: 'person@example.com', emailVerified: null })
  assert.equal(valid.writes[0].termsVersion, terms.TERMS_VERSION)
  assert.ok(valid.writes[0].termsAcceptedAt instanceof Date)
  assert.equal(valid.writes[0].role, 'OWNER')
  assert.equal(Object.hasOwn(valid.writes[0], 'id'), false)
})

test('existing OAuth users can still sign in and pending signup cookies are cleared', async () => {
  const state = oauthFixture({ existing: { id: 'existing-user', email: 'person@example.com', role: 'TENANT', isVerified: false }, version: '' })
  assert.equal(await state.config.callbacks.signIn({ user: { email: 'person@example.com' }, account: { provider: 'google' } }), true)
  await state.config.callbacks.jwt({ token: {}, user: { email: 'person@example.com' }, trigger: 'signIn', account: { provider: 'google' } })
  assert.ok(state.deleted.includes(terms.TERMS_COOKIE_NAME))
  assert.equal(state.writes.length, 0)
})

function signupForm(accepted) {
  let stateIndex = 0
  const calls = [], errors = []
  const states = [false, false, accepted, false, '']
  const Form = loadSource('src/components/auth/RegisterForm.tsx', {
    react: { ...React, useActionState: () => [null, () => {}, false], useState: () => { const index = stateIndex++; return [states[index], (value) => { states[index] = value; errors.push(value) }] } },
    'next/navigation': { useRouter: () => ({}) },
    'next-auth/react': { signIn: async (...args) => calls.push(['signIn', ...args]) },
    '@/actions/auth': { registerUser: async () => {}, prepareOAuthRegistration: async (...args) => { calls.push(['prepare', ...args]); return { success: true } } },
    'next/image': image, 'next/link': link,
  }).default
  const tree = Form({ defaultRole: 'OWNER', onBack: () => {} })
  const buttons = [], inputs = []
  function visit(element) {
    if (!React.isValidElement(element)) return
    if (element.type === 'button') buttons.push(element)
    if (element.type === 'input') inputs.push(element)
    React.Children.forEach(element.props.children, visit)
  }
  visit(tree)
  return { tree, buttons, inputs, calls, errors }
}

test('signup starts unchecked and blocks password and OAuth signup until acceptance', async () => {
  const unchecked = signupForm(false)
  const checkbox = unchecked.inputs.find((input) => input.props.name === 'termsAccepted')
  assert.equal(checkbox.props.checked, false)
  assert.equal(checkbox.props.required, true)
  assert.equal(unchecked.buttons.find((button) => button.props.type === 'submit').props.disabled, true)
  const google = unchecked.buttons.find((button) => button.props.children?.some?.((child) => child?.props?.children === 'Continue with Google'))
  assert.equal(google.props.disabled, true)
  await google.props.onClick()
  assert.equal(unchecked.calls.length, 0)
  assert.match(renderToStaticMarkup(unchecked.tree), /href="\/terms"[^>]*target="_blank"/)

  const checked = signupForm(true)
  assert.equal(checked.buttons.find((button) => button.props.type === 'submit').props.disabled, false)
  const acceptedGoogle = checked.buttons.find((button) => button.props.children?.some?.((child) => child?.props?.children === 'Continue with Google'))
  await acceptedGoogle.props.onClick()
  assert.deepEqual(checked.calls.map(([name]) => name), ['prepare', 'signIn'])
})

test('the public terms page includes the version, current service terms, rights and working contact links', () => {
  const support = loadSource('src/lib/support.ts')
  const Page = loadSource('src/app/(legal)/terms/page.tsx', { '@/lib/terms': terms, '@/lib/support': support, 'next/image': image, 'next/link': link }).default
  const html = renderToStaticMarkup(React.createElement(Page))
  for (const text of ['Terms and Conditions', terms.TERMS_EFFECTIVE_DATE, terms.TERMS_VERSION, 'Prices, fees and payments', 'Personal information and communications', 'Complaints and governing law', 'does not subscribe you to marketing']) assert.ok(html.includes(text))
  assert.ok(html.includes(`mailto:${support.SUPPORT_EMAIL}`))
  assert.ok(html.includes(support.SUPPORT_PHONE_HREF))
  assert.doesNotMatch(html, /TODO|\[Company|\[Address|lorem ipsum/i)
})
