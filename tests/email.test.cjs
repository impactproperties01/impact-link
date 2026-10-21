const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const ts = require('typescript')

function loadSource(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const localRequire = createRequire(filename)
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'console', compiled)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : localRequire(name), module, module.exports, mocks.console || console,
  )
  return module.exports
}

async function withEnv(overrides, run) {
  const values = { RESEND_API_KEY: 'test-api-key', RESEND_FROM_EMAIL: undefined, RESEND_REPLY_TO: undefined, APP_URL: undefined, NODE_ENV: 'test', ...overrides }
  const original = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]))
  try {
    for (const [key, value] of Object.entries(values)) value === undefined ? delete process.env[key] : process.env[key] = value
    return await run()
  } finally {
    for (const [key, value] of Object.entries(original)) value === undefined ? delete process.env[key] : process.env[key] = value
  }
}

function mailFixture(response = { data: { id: 'email-1' }, error: null }) {
  const calls = []
  const mail = loadSource('src/lib/mail.ts', { resend: { Resend: class {
    constructor(key) { assert.equal(key, 'test-api-key') }
    emails = { send: async (message) => { calls.push(message); if (response instanceof Error) throw response; return response } }
  } } })
  return { ...mail, calls }
}

test('verification emails use the verified sender and live URL in HTML and plain text', () => withEnv({}, async () => {
  const mail = mailFixture()
  assert.deepEqual(await mail.sendVerificationEmail('recipient@example.invalid', 'one-time-token'), { id: 'email-1' })
  const sent = mail.calls[0]
  assert.equal(sent.from, 'Impact Link <noreply@theimpactproperties.com>')
  assert.equal(sent.to, 'recipient@example.invalid')
  assert.match(sent.html, /https:\/\/link.theimpactproperties.com\/verify\?token=one-time-token/)
  assert.match(sent.text, /https:\/\/link.theimpactproperties.com\/verify\?token=one-time-token/)
  assert.doesNotMatch(sent.html, /localhost|resend.dev/)
}))

test('configured sender, reply-to and app URL are respected and tokens are URL encoded', () => withEnv({
  RESEND_FROM_EMAIL: 'Impact Link <accounts@mail.example.com>', RESEND_REPLY_TO: 'support@example.com', APP_URL: 'https://app.example.com/',
}, async () => {
  const mail = mailFixture()
  await mail.sendVerificationEmail('recipient@example.invalid', 'token&<"unsafe')
  const sent = mail.calls[0]
  assert.equal(sent.from, 'Impact Link <accounts@mail.example.com>')
  assert.equal(sent.replyTo, 'support@example.com')
  const link = new URL(sent.text.split('\n').find((line) => line.startsWith('https:')))
  assert.equal(link.origin, 'https://app.example.com')
  assert.equal(link.searchParams.get('token'), 'token&<"unsafe')
  assert.doesNotMatch(sent.html, /token&<"unsafe/)
}))

test('API errors, transport failures and missing message IDs cannot report successful sending', async () => {
  for (const response of [
    { data: null, error: { name: 'validation_error', message: 'Domain not verified' } },
    { data: null, error: null }, new Error('Network unavailable'),
  ]) await withEnv({}, async () => {
    const mail = mailFixture(response)
    await assert.rejects(mail.sendVerificationEmail('recipient@example.invalid', 'token'))
  })
})

test('missing keys and invalid sender or URL configuration fail before any email request', async () => {
  for (const env of [
    { RESEND_API_KEY: undefined }, { RESEND_FROM_EMAIL: 'onboarding@resend.dev' },
    { RESEND_FROM_EMAIL: 'sender@example.com\nBcc:other@example.com' },
    { APP_URL: 'javascript:alert(1)' }, { APP_URL: 'https://user:password@example.com' },
    { NODE_ENV: 'production', APP_URL: 'http://localhost:3000' },
    { NODE_ENV: 'production', APP_URL: 'https://localhost:3000' },
  ]) await withEnv(env, async () => {
    const mail = mailFixture()
    await assert.rejects(mail.sendVerificationEmail('recipient@example.invalid', 'token'))
    assert.equal(mail.calls.length, 0)
  })
})

function authFixture({ existing = null, mailFails = false, passwordMatches = true } = {}) {
  const created = [], sent = [], tokenRequests = [], lookups = []
  const user = existing || { id: 'user-1', email: 'person@example.com', passwordHash: 'hash', emailVerified: null }
  const actions = loadSource('src/actions/auth.ts', {
    '@/lib/terms': loadSource('src/lib/terms.ts'),
    '@/lib/prisma': { __esModule: true, default: { user: {
      findUnique: async () => existing,
      findFirst: async (query) => { lookups.push(query); return user },
      create: async ({ data }) => { created.push(data); return user },
      update: async () => user,
    } } },
    bcryptjs: { __esModule: true, default: { genSalt: async () => 'salt', hash: async () => 'hash', compare: async () => passwordMatches } },
    '@/auth': { signIn: async () => {} },
    'next-auth': { AuthError: class extends Error {} },
    '@/lib/tokens': { generateVerificationToken: async (email) => { tokenRequests.push(email); return { identifier: email, token: 'stored-token' } } },
    '@/lib/mail': { sendVerificationEmail: async (email, token) => { sent.push({ email, token }); if (mailFails) throw new Error('API rejected email'); return { id: 'email-1' } } },
    console: { error: () => {} },
  })
  const register = async (email = ' Person@Example.com ') => {
    const form = new FormData()
    for (const [key, value] of Object.entries({ email, password: 'password123', confirmPassword: 'password123', role: 'OWNER', termsAccepted: 'accepted' })) form.set(key, value)
    return actions.registerUser(null, form)
  }
  return { ...actions, register, created, sent, tokenRequests, lookups }
}

test('signup sends the persisted token to the normalized email and reports API rejection honestly', async () => {
  const success = authFixture()
  assert.equal((await success.register()).success, true)
  assert.equal(success.created[0].email, 'person@example.com')
  assert.deepEqual(success.sent, [{ email: 'person@example.com', token: 'stored-token' }])
  const failure = authFixture({ mailFails: true })
  const result = await failure.register()
  assert.equal(result.success, false)
  assert.match(result.error, /account is saved.*email could not be sent/)
  assert.equal(failure.created.length, 1)
})

test('an unverified signup can retry email delivery with its password without creating or changing an account', async () => {
  const existing = { id: 'user-1', email: 'person@example.com', passwordHash: 'hash', emailVerified: null, role: 'TENANT' }
  const retry = authFixture({ existing })
  assert.equal((await retry.register()).success, true)
  assert.equal(retry.created.length, 0)
  assert.equal(retry.sent.length, 1)
  assert.equal(existing.role, 'TENANT')
  for (const options of [{ passwordMatches: false }, { existing: { ...existing, emailVerified: new Date() } }, { existing: { ...existing, passwordHash: null } }]) {
    const denied = authFixture({ existing, ...options })
    assert.equal((await denied.register()).success, false)
    assert.equal(denied.sent.length, 0)
  }
})

test('resending supports the registered phone number and sends to the account email', async () => {
  const state = authFixture()
  assert.ok((await state.resendVerificationEmail(' 08012345678 ')).success)
  assert.deepEqual(state.tokenRequests, ['person@example.com'])
  assert.equal(state.sent[0].email, 'person@example.com')
  const failure = authFixture({ mailFails: true })
  assert.ok((await failure.resendVerificationEmail('person@example.com')).error)
  const verified = authFixture({ existing: { email: 'person@example.com', emailVerified: new Date() } })
  assert.ok((await verified.resendVerificationEmail('person@example.com')).error)
  assert.equal(verified.sent.length, 0)
})

test('resending reuses an unexpired token so a failed delivery cannot invalidate the previous link', async () => {
  const existing = { identifier: 'person@example.com', token: 'existing-token', expires: new Date(Date.now() + 600000) }
  const changes = []
  const tokens = loadSource('src/lib/tokens.ts', {
    uuid: { v4: () => 'new-token' },
    '@/lib/prisma': { __esModule: true, default: { verificationToken: {
      findFirst: async () => existing,
      delete: async () => changes.push('delete'), create: async () => changes.push('create'),
    } } },
  })
  assert.equal(await tokens.generateVerificationToken(existing.identifier), existing)
  assert.deepEqual(changes, [])
})
