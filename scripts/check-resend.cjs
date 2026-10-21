const { loadEnvConfig } = require('@next/env')
const { Resend } = require('resend')

loadEnvConfig(process.cwd(), false, { info: () => {}, error: () => {} })

async function main() {
  const { getEmailConfig, sendEmail } = await import('../src/lib/mail.ts')
  const config = getEmailConfig()
  const resend = new Resend(config.apiKey)
  const [command = '--check', value] = process.argv.slice(2)

  if (command === '--check-site') {
    for (const pathname of ['/', '/verify']) {
      const response = await fetch(new URL(pathname, config.appUrl), { signal: AbortSignal.timeout(15000) })
      console.log(JSON.stringify({ path: pathname, status: response.status, url: response.url }))
      if (!response.ok) process.exitCode = 1
    }
    return
  }

  if (command === '--email-status') {
    if (!value) throw new Error('Provide the Resend email ID.')
    const { data, error } = await resend.emails.get(value)
    if (error) throw new Error(`${error.name}: ${error.message}`)
    console.log(JSON.stringify({ id: data.id, from: data.from, to: data.to, subject: data.subject, last_event: data.last_event }, null, 2))
    return
  }

  if (command === '--send-test') {
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Provide the explicitly approved test recipient email address.')
    const sent = await sendEmail({
      to: value,
      subject: 'Impact Link email delivery test',
      text: `This is the email delivery test you requested for Impact Link.\n\nMessages are now sent from ${config.from}.\nWebsite: ${config.appUrl}\n\nNo account was created or changed by this test.`,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto;"><h2>Impact Link email delivery test</h2><p>This is the email delivery test you requested.</p><p>Your website: <a href="${config.appUrl}">${config.appUrl}</a></p><p>No account was created or changed by this test.</p></div>`,
    })
    console.log(JSON.stringify({ ...sent, from: config.from, to: value, appUrl: config.appUrl }, null, 2))
    return
  }

  if (command !== '--check') throw new Error('Use --check, --check-site, --send-test <recipient>, or --email-status <id>.')
  console.log(JSON.stringify({ apiKeyConfigured: true, from: config.from, appUrl: config.appUrl }, null, 2))
  const { data, error } = await resend.domains.list()
  if (error?.name === 'restricted_api_key') {
    console.log(JSON.stringify({ domainStatus: 'not_inspected', reason: 'The configured API key permits sending only. Use --send-test with an approved recipient to verify sending.' }))
    return
  }
  if (error) throw new Error(`Domain check: ${error.name}: ${error.message}`)
  const senderDomain = (config.from.match(/<([^<>]+)>$/)?.[1] || config.from).split('@')[1].toLowerCase()
  const domain = data.data.find((item) => item.name.toLowerCase() === senderDomain)
  console.log(JSON.stringify({ senderDomain, domain: domain ? { name: domain.name, status: domain.status, capabilities: domain.capabilities } : null }, null, 2))
  if (!domain || domain.status !== 'verified' || domain.capabilities?.sending === 'disabled') {
    throw new Error('The configured sender domain is not verified and enabled for sending with this API key.')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
