# Em Dash

A Notion-style markdown editor that lives entirely in your browser and stores every document in **Google Drive** — no other storage backend, no server, no database. Em Dash gives you a persistent folder tree in the sidebar, drag-and-drop organization, live preview, and a distraction-free focus mode, all as an installable offline-capable PWA.

## Features

- **Google Drive as the only backend** — Em Dash creates (or reuses) a folder named **"Em Dash"** at the root of your Drive and keeps all of its documents inside that folder's subtree in its own UI. It doesn't touch anything outside that folder.
- **Sees everything in the folder, including files added outside the app** — files you drop into "Em Dash" from Drive's own UI (rather than creating them through Em Dash) show up in the sidebar too, no extra step required.
- **Persistent sidebar with a real folder tree** — expand/collapse nested folders, click a file to open it. The tree is backed by actual Drive folders via the Drive API v3 (not a flat file list), and paginates through the full folder contents rather than stopping at the first page.
- **Drag-and-drop organization** — drag a file or folder onto another folder to move/re-nest it (`files.update` with `addParents`/`removeParents`).
- **Inline create, rename, delete** — "+" buttons in the sidebar header create a new file or folder inline (Notion-style, no modal); double-click a name (or use the small pencil icon) to rename in place; the trash icon deletes with a confirmation.
- **Import / Export** — Import uploads a local `.md`/`.txt` file from disk straight into the currently-selected Drive folder. Export downloads the currently-open file back to disk as `.md`. These are the only ways local disk files enter or leave the app — there is no local disk *editing*.
- **Live preview** — markdown rendered as you type, with syntax-highlighted code blocks and one-click copy on fenced code.
- **Focus mode** — distraction-free WYSIWYG writing with typewriter scrolling; converts back to markdown on exit.
- **Find & replace** — with match navigation and replace-all.
- **Auto-save** — saves two seconds after you stop typing, straight to the open Drive file.
- **Offline** — installable as a PWA; the app shell works without a connection (Drive sync obviously needs one).
- **Three themes** — Lokai (dark editor, light preview), Dark, and Light. Persisted across sessions.
- Line numbers, word/character count, adjustable zoom, and light keyboard shortcuts.

## Tech

Plain HTML/CSS/JavaScript — no build step, no framework. It uses [marked](https://github.com/markedjs/marked) for parsing, [DOMPurify](https://github.com/cure53/DOMPurify) to sanitize rendered HTML, [highlight.js](https://highlightjs.org/) for code highlighting, and [Turndown](https://github.com/mixmark-io/turndown) for HTML→Markdown in focus mode. Drive access uses Google's `gapi` client and Google Identity Services (GSI) for OAuth. All third-party scripts are version-pinned with Subresource Integrity, and the app ships a Content Security Policy.

## Setup

Because storage is Google Drive only, Em Dash needs a working Google OAuth client to do anything useful.

### 1. Create Google Cloud credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create (or select) a project, then enable the **Google Drive API** (APIs & Services → Library).
3. Create an **OAuth 2.0 Client ID** (Application type: *Web application*). Add the origin(s) you'll serve the app from (e.g. `http://localhost:8000`, your production URL) under **Authorized JavaScript origins**.
4. Create an **API key** (APIs & Services → Credentials → Create Credentials → API key). Restrict it: **HTTP referrers** limited to your domain(s), and **API restrictions** limited to the Google Drive API.
5. Note the OAuth scope the app requests: `https://www.googleapis.com/auth/drive`. This is full read/write access to the account's Drive — Em Dash's own UI only ever reads or writes within the "Em Dash" folder subtree, but the token itself is not restricted to that folder. This was chosen deliberately over the narrower `drive.file` scope: `drive.file` only grants access to files an app creates or that a user individually selects via Google's file picker, which does not scale to an existing folder with dozens or hundreds of files already in it (each one would need to be selected one at a time). If you're publishing the OAuth consent screen beyond "Testing" status for broader use, Google requires a verification review for this scope — see [Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) for the tradeoffs of narrower alternatives.
6. **If you're upgrading from an older version of Em Dash** that used the `drive.file` scope, existing users need to reconnect (Sign out of Drive, then Connect Google Drive again) so the browser re-prompts for the new, broader permission — a previously-issued token won't automatically pick up the wider scope.

### 2. Configure the app

```bash
cp config.example.js config.js   # then add your Google credentials
npx serve .                       # serve locally (PWAs need https or localhost)
```

Edit `config.js` and fill in:

- `GOOGLE_CLIENT_ID` — the OAuth Client ID from step 1.
- `GOOGLE_API_KEY` — the API key from step 1.
- `DRIVE_ROOT_FOLDER_NAME` (optional) — the Drive folder Em Dash uses as its root. Defaults to `"Em Dash"`.

Open the local URL in Chrome or Edge, click **Connect Google Drive** from the "…" menu, and grant access. Em Dash will create the root folder on first connect if it doesn't already exist.

`config.js` is **gitignored** and never committed. Because the app is fully client-side, any API key it uses is visible in the browser — that's why it's restricted by HTTP referrer and scoped to the Drive API only in step 1.

## Deployment

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes to GitHub Pages. It generates `config.js` at deploy time from repository secrets, so credentials stay out of the repo source.

To use it:

1. Add repository secrets for `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` (Settings → Secrets and variables → Actions).
2. Set Pages to deploy from GitHub Actions (Settings → Pages → Source → GitHub Actions).
3. Push to `main` — the workflow builds and deploys automatically.

Remember to add your Pages URL to the API key's referrer restrictions and to your OAuth client's authorized JavaScript origins.

## Changelog

### v3.1.0

- **Switched OAuth scope from `drive.file` to full `drive`** — the narrow scope required individually granting access to every pre-existing file via Google's picker, which doesn't hold up for folders with real file counts (hundreds of files). The app now sees everything in the "Em Dash" folder immediately after connecting; existing users need to reconnect once to pick up the wider permission. Removed the interim "Sync Existing Drive Files…" picker flow this replaces.
- **Fixed folder listing pagination** — the sidebar tree previously capped at 200 items per folder with no pagination, silently dropping anything past that; it now pages through the full folder contents.

### v3.0.0 — Em Dash

Em Dash is a rebrand and reboot of the previous "Markdown PWA" project, focused entirely around Google Drive as a real, navigable filing system:

- **Persistent sidebar with a real Drive folder tree** — replaces the old flat "Open from Drive" file-picker modal. Folders and files are fetched lazily via the Drive API v3 as you expand them.
- **Drag-and-drop reparenting** — drag any file or folder onto another folder to move it.
- **Inline create / rename / delete** — new files and folders are created inline in the tree (no modal); rename via double-click or the pencil icon; delete via the trash icon, with confirmation.
- **Import / Export** — Import uploads a local file into the selected Drive folder; Export downloads the open file back to disk.
- **OneDrive removed** — Microsoft Graph / MSAL.js sign-in, and all OneDrive UI, have been removed. Google Drive is now the only storage backend.
- **Local disk editing removed** — the File System Access API open/save/save-as/rename flow is gone. Import and Export cover the "get a file in or out" need without the complexity of two parallel storage models.
- **Simplified header menu** — the "…" menu now only has Import, Export, Connect/Sign out of Drive, and Focus Mode.

<details>
<summary>Markdown PWA history (pre-rebrand)</summary>

### v2.1.4
- Copy button fixes (found in code review): rapid double-clicking no longer strands the button on the checkmark icon; a failed clipboard fallback (`execCommand`) now correctly shows "Copy failed"; raw `<pre>` blocks with no fenced code no longer get a non-functional copy button.

### v2.1.3
- Copy button on code blocks — every fenced code block in the preview pane got a copy icon.

### v2.1.0 – v2.1.2
- Unified file menu across Disk/Drive/OneDrive; Drive/OneDrive menu-state parity.

### v2.0.0
- OneDrive sync via Microsoft Graph (MSAL.js, SPA + PKCE).

### v1.5.0 – v1.5.1
- UI redesign (header bar + format bar), three themes, WYSIWYG focus mode, iPad/iPhone PWA support.

</details>

## Browser support

| Browser | Google Drive | Import / Export |
|---------|:---:|:---:|
| Chrome  | Yes | Yes |
| Edge    | Yes | Yes |
| Safari  | Yes | Yes |
| Firefox | Yes | Yes |
