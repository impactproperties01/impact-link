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

function loginFixture(signIn = async () => {}) {
  const states = []
  let index = 0
  const Form = loadSource('src/components/auth/LoginForm.tsx', {
    react: { ...React,
      useState: (initial) => { const slot = index++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = value }] },
      useActionState: () => [null, () => {}, false],
      useTransition: () => [false, callback => callback()],
    },
    'next/navigation': { useRouter: () => ({ back() {} }) },
    'next-auth/react': { signIn },
    '@/actions/auth': { loginUser: async () => {}, resendVerificationEmail: async () => ({}) },
    '@/lib/auth-errors': loadSource('src/lib/auth-errors.ts'),
    'next/image': { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) },
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  }).default
  return { render: (props = {}) => { index = 0; return Form(props) } }
}

function find(tree, predicate) {
  if (!React.isValidElement(tree)) return
  if (predicate(tree)) return tree
  for (const child of React.Children.toArray(tree.props.children)) { const result = find(child, predicate); if (result) return result }
}
const googleButton = tree => find(tree, e => e.type === 'button' && renderToStaticMarkup(e).includes('Continue with Google'))

test('OAuth callback errors tell users how to recover and do not display arbitrary URL content', () => {
  const fixture = loginFixture()
  const linked = renderToStaticMarkup(fixture.render({ oauthError: 'OAuthAccountNotLinked' }))
  assert.match(linked, /role="alert"/)
  assert.match(linked, /Sign in with your email and password/)
  assert.match(renderToStaticMarkup(fixture.render({ oauthError: 'AccessDenied' })), /cancelled or access was denied/)
  assert.match(renderToStaticMarkup(fixture.render({ oauthError: 'Configuration' })), /temporarily unavailable/)
  const unknown = renderToStaticMarkup(fixture.render({ oauthError: '<script>private-debug-detail</script>' }))
  assert.match(unknown, /Could not complete sign-in/)
  assert.doesNotMatch(unknown, /private-debug-detail/)
  assert.doesNotMatch(renderToStaticMarkup(fixture.render()), /role="alert"/)
})

test('starting Google sign-in prevents repeated attempts and restores the form with an error on network failure', async () => {
  let rejectSignIn
  const calls = []
  const fixture = loginFixture((...args) => { calls.push(args); return new Promise((resolve, reject) => { rejectSignIn = reject }) })
  const initial = fixture.render()
  find(initial, e => e.type === 'input' && e.props.name === 'email').props.onChange({ target: { value: 'person@example.com' } })
  const attempt = googleButton(initial).props.onClick()
  const pending = fixture.render()
  const pendingButton = find(pending, e => e.type === 'button' && renderToStaticMarkup(e).includes('Connecting to Google'))
  assert.equal(pendingButton.props.disabled, true)
  assert.equal(find(pending, e => e.type === 'button' && e.props.type === 'submit').props.disabled, true)
  await pendingButton.props.onClick()
  assert.equal(calls.length, 1)
  rejectSignIn(new TypeError('Failed to fetch'))
  await attempt
  const recovered = fixture.render()
  assert.match(renderToStaticMarkup(recovered), /Could not connect to Google sign-in/)
  assert.equal(googleButton(recovered).props.disabled, false)
  assert.equal(find(recovered, e => e.type === 'input' && e.props.name === 'email').props.value, 'person@example.com')
  assert.deepEqual(calls[0], ['google', { redirectTo: '/dashboard' }])
})
