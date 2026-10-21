This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Transactional email

Set `RESEND_API_KEY` in the local `.env` and in the deployment environment. A sending-only key is sufficient for the app.

The default sender is `Impact Link <noreply@theimpactproperties.com>` and verification links use `https://link.theimpactproperties.com/verify`. These can be overridden with `RESEND_FROM_EMAIL` and `APP_URL`. The sender must belong to a domain verified in the same Resend account. Optionally set `RESEND_REPLY_TO` to a monitored inbox. For local verification links, explicitly set `APP_URL=http://localhost:3000`; production requires a public HTTPS URL. Restart or redeploy after changing environment variables.

Run `npm run email:check` to inspect configuration and, with a key that permits reads, the sender domain status. To send one test email to an approved recipient, run `npm run email:check -- --send-test recipient@example.com`. This uses the same mail sender as verification emails without creating an account. Read-enabled keys can inspect a sent message with `npm run email:check -- --email-status EMAIL_ID`. These diagnostics require Node.js 22.18 or newer. Never commit API keys.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
