# Credential Rotation Guide

Em Dash uses two Google Cloud credentials: an **OAuth 2.0 Client ID** (for Drive sign-in) and an **API Key** (for Drive API calls). This guide covers rotating one or both when they are exposed, suspected compromised, or due for periodic refresh.

---

## When to rotate

- A credential appeared in a git commit, log, screenshot, or Slack message
- A team member with access to Vercel or Google Cloud Console has left
- The Google Cloud project was shared with someone who should no longer have access
- Routine periodic rotation (annually is a common baseline)

---

## What you have

| Credential | Where it lives | What it does |
|---|---|---|
| OAuth 2.0 Client ID | Google Cloud Console → APIs & Services → Credentials | Identifies the app to Google's OAuth flow; users see this name when granting Drive access |
| API Key | Google Cloud Console → APIs & Services → Credentials | Authorizes Drive API calls (`gapi.client` requests) |

Both are set as Vercel Environment Variables (`GOOGLE_CLIENT_ID`, `GOOGLE_API_KEY`) and written into `config.js` at build time by `build-config.js`. They never touch the git repo.

---

## Step 1 — Create new credentials in Google Cloud Console

Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) and select the Em Dash project.

### New API Key

1. Click **Create Credentials → API key**.
2. Click the new key to open its settings.
3. Under **Application restrictions**, choose **HTTP referrers** and add:
   - `https://your-vercel-domain.vercel.app/*`
   - Any custom domain you use
   - `http://localhost:8000/*` (if you want local dev to use this key)
4. Under **API restrictions**, choose **Restrict key** and select **Google Drive API** only.
5. Click **Save**. Copy the new key value — you will need it in Step 2.

### New OAuth 2.0 Client ID

Only needed if the Client ID itself was exposed (the secret is not used by this app — it's a public client — but replacing it is still good hygiene).

1. Click **Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized JavaScript origins**, add the same origins as before:
   - `https://your-vercel-domain.vercel.app`
   - `http://localhost:8000`
4. Click **Create**. Copy the new Client ID.

> If you are only rotating the API Key, you can skip the OAuth Client ID steps and keep the existing Client ID.

---

## Step 2 — Update Vercel

1. Open your project in the [Vercel dashboard](https://vercel.com).
2. Go to **Settings → Environment Variables**.
3. Edit `GOOGLE_API_KEY` and paste the new key.
4. If you also created a new Client ID, edit `GOOGLE_CLIENT_ID`.
5. Go to **Deployments** and click **Redeploy** on the latest deployment (or push any change to `main` to trigger a fresh build).

The new values take effect immediately after the build completes.

---

## Step 3 — Update local development

If you have a `config.js` locally:

1. Open `config.js`.
2. Replace the old `GOOGLE_CLIENT_ID` and/or `GOOGLE_API_KEY` values with the new ones.
3. Reload the browser — no server restart needed.

`config.js` is gitignored. Do not commit it.

---

## Step 4 — Revoke the old credentials

Once the new credentials are live and verified:

1. Return to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Find the **old** API Key and click the trash icon to delete it.
3. If you created a new OAuth Client ID, delete the old one as well.

Deleting old credentials ensures they cannot be used even if someone has a copy.

---

## Verification

After the Vercel redeploy:

1. Open the live app at your Vercel URL.
2. Click **Connect Google Drive** in the `…` menu.
3. Complete the OAuth flow — you should reach your Drive folder tree with no errors.
4. Open a file and confirm it loads and saves correctly.
5. Check the browser console for any `401` or `403` errors from `googleapis.com`.

For local dev, repeat the same steps at `http://localhost:8000` after updating `config.js`.

---

## What not to do

- **Never put credentials in source code** — `config.js` is gitignored for this reason; `config.example.js` only contains `PLACEHOLDER_*` values
- **Never log credentials** — avoid `console.log(APP_CONFIG)` or similar
- **Never share credentials in issues or pull request comments** — GitHub issues are public
- **Do not reuse the same API Key across multiple projects** — restrict each key to its own project and referrer list
