# Google sign-in and sign-up

Google uses the same OAuth client for sign-in and registration. In Google Cloud Console, open **Google Auth Platform → Clients**, choose the **Web application** client configured for this app, and add these **Authorized redirect URIs**:

```text
https://link.theimpactproperties.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

These are redirect URIs, not JavaScript origins. Google requires an exact match, including protocol, host, path and port. Keep both entries if using local development and production. If Google shows `redirect_uri_mismatch`, check the client used by the deployed application, then save its missing callback URL. This setting may take a few minutes to apply.

The app reads `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the server. Auth.js also supports `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. Set a private `AUTH_SECRET` in each environment. Do not expose these secrets through `NEXT_PUBLIC_` variables.

Local development uses port **3000** (`npm run dev`). Set `NEXTAUTH_URL=http://localhost:3000` in this project's `.env`. Stop any other app using port 3000 before starting Impact Link; the explicit port prevents Next.js from silently moving Impact Link to a port that does not match the OAuth callback. In the hosting environment, set `NEXTAUTH_URL=https://link.theimpactproperties.com` (or the equivalent `AUTH_URL`); do not deploy the localhost value. The live site was confirmed to send the production callback URL during diagnosis. Changing Google Console's redirect URI does not require an application rebuild. Changing deployment environment variables does require a redeployment or server restart.

New Google users must choose an account type and accept the current terms on `/register` before continuing with Google. Existing Google users can use `/login`. An existing email/password account is not automatically linked just because its email matches a Google profile; the login page explains this if Auth.js returns `OAuthAccountNotLinked`.

Reference: [Auth.js Google provider](https://authjs.dev/getting-started/providers/google), [Google OpenID Connect setup](https://developers.google.com/identity/openid-connect/openid-connect#settingup).
