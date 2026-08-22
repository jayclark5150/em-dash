# Em Dash

A Notion-style markdown editor that lives entirely in your browser and stores every document in **Google Drive** — no other storage backend, no server, no database. Em Dash gives you a persistent folder tree in the sidebar, drag-and-drop organization, live preview, and a distraction-free focus mode, all as an installable offline-capable PWA.

## Features

- **Google Drive as the only backend** — Em Dash creates (or reuses) a folder named **"Em Dash"** at the root of your Drive and keeps all of its documents inside that folder's subtree. It never touches the rest of your Drive.
- **Persistent sidebar with a real folder tree** — expand/collapse nested folders, click a file to open it. The tree is backed by actual Drive folders via the Drive API v3 (not a flat file list).
- **Drag-and-drop organization** — drag a file or folder onto another folder to move/re-nest it (`files.update` with `addParents`/`removeParents`).
- **Inline create, rename, delete** — "+" buttons in the sidebar header create a new file or folder inline (Notion-style, no modal); double-click a name (or use the small pencil icon) to rename in place; the trash icon deletes with a confirmation.
- **Import / Export** — Import uploads a local `.md`/`.txt` file from disk straight into the currently-selected Drive folder. Export downloads the currently-open file back to disk as `.md`. These are the only ways local disk files enter or leave the app — there is no local disk *editing*.
- **Sync Existing Drive Files** — because the app only holds the narrow `drive.file` scope, files placed into the "Em Dash" folder from Drive's own UI (rather than created through the app) are invisible until you grant access. The "…" menu's **Sync Existing Drive Files…** opens Google's file picker, already browsing inside "Em Dash", so you can multi-select the specific files to grant access to — `drive.file` access is per-item, so each file has to be selected individually rather than the folder as a whole.
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
2. Create (or select) a project, then enable both the **Google Drive API** and the **Google Picker API** (APIs & Services → Library). The Picker API backs the **Sync Existing Drive Files…** feature — without it enabled (and allowlisted on your key, next step) that feature fails with "The API developer key is invalid."
3. Create an **OAuth 2.0 Client ID** (Application type: *Web application*). Add the origin(s) you'll serve the app from (e.g. `http://localhost:8000`, your production URL) under **Authorized JavaScript origins**.
4. Create an **API key** (APIs & Services → Credentials → Create Credentials → API key). Restrict it: **HTTP referrers** limited to your domain(s), and **API restrictions** limited to the Google Drive API and Google Picker API.
5. Note the OAuth scope the app requests: `https://www.googleapis.com/auth/drive.file`. This is a narrow, per-file scope — Em Dash can only see files and folders it creates, or that you explicitly select through Google's file picker, never your whole Drive. If you drop a file straight into the "Em Dash" folder from Drive's own UI, Em Dash won't see it until you use **"…" menu → Sync Existing Drive Files…** and select it (or select several at once) in the picker that opens; access is granted per file, so picking the "Em Dash" folder itself does not make its existing contents visible — only the individual files you select are.

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
