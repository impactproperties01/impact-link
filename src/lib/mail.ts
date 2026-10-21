import { Resend } from 'resend'

const DEFAULT_APP_URL = 'https://link.theimpactproperties.com'
const DEFAULT_FROM = 'Impact Link <noreply@theimpactproperties.com>'

export function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.')

  const appUrl = new URL(process.env.APP_URL?.trim() || DEFAULT_APP_URL)
  if (!['http:', 'https:'].includes(appUrl.protocol) || appUrl.username || appUrl.password || appUrl.search || appUrl.hash) {
    throw new Error('APP_URL must be an HTTP or HTTPS website URL without credentials, query parameters, or fragments.')
  }
  if (process.env.NODE_ENV === 'production' && (appUrl.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(appUrl.hostname))) {
    throw new Error('APP_URL must use a public HTTPS URL in production.')
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM
  const senderAddress = from.match(/<([^<>]+)>$/)?.[1] || from
  if (/[\r\n]/.test(from) || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(senderAddress) || senderAddress.toLowerCase().endsWith('@resend.dev')) {
    throw new Error('RESEND_FROM_EMAIL must use an address on your verified domain.')
  }

  const replyTo = process.env.RESEND_REPLY_TO?.trim()
  if (replyTo && !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(replyTo)) {
    throw new Error('RESEND_REPLY_TO must be a valid email address.')
  }

  return { apiKey, appUrl: appUrl.origin, from, replyTo }
}

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  const { apiKey, from, replyTo } = getEmailConfig()
  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({ from, ...message, ...(replyTo ? { replyTo } : {}) })

  if (error) {
    // Resend returns API failures as data; they do not necessarily throw.
    throw new Error(`Email delivery failed (${error.name}): ${error.message}`)
  }
  if (!data?.id) throw new Error('Resend did not return an email ID.')
  return { id: data.id }
}

export async function sendVerificationEmail(email: string, token: string) {
  const { appUrl } = getEmailConfig()
  const confirmUrl = new URL('/verify', appUrl)
  confirmUrl.searchParams.set('token', token)
  const confirmLink = confirmUrl.toString()
  const htmlLink = confirmLink.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return sendEmail({
    to: email,
    subject: 'Verify your email address - Impact Link',
    text: `Welcome to Impact Link!\n\nVerify your email address using this link:\n${confirmLink}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Impact Link!</h2>
        <p>Please confirm your email address by clicking the link below:</p>
        <a href="${htmlLink}" style="display: inline-block; padding: 12px 24px; background-color: #004D2C; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">Verify Email</a>
        <p>This link expires in one hour.</p>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
