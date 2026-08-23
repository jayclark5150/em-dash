# Em Dash

A markdown editor that lives entirely in your browser and stores every document in **Google Drive** — no other storage backend, no server, no database. Em Dash gives you a persistent folder tree in the sidebar, drag-and-drop organization, live preview, and a distraction-free focus mode, all as an installable offline-capable PWA.

Google Workspace integrations push it further toward a personal knowledge management tool (like Notion or Obsidian, but Google-native) — Tasks keeps your to-dos, Calendar keeps your schedule, and Em Dash is where you actually write about all of it, with everything staying in your own Drive.

The closest thing to what Em Dash could become is a private Notion that lives entirely in your Google account — which is actually a pretty compelling niche Google has never filled themselves.

## Features

- **Google Drive as the only backend** — Em Dash creates (or reuses) a folder named **"Em Dash"** at the root of your Drive and keeps all of its documents inside that folder's subtree in its own UI. It doesn't touch anything outside that folder.
- **Sees everything in the folder, including files added outside the app** — files you drop into "Em Dash" from Drive's own UI (rather than creating them through Em Dash) show up in the sidebar too, no extra step required.
- **Persistent sidebar with a real folder tree** — expand/collapse nested folders, click a file to open it. The tree is backed by actual Drive folders via the Drive API v3 (not a flat file list), and paginates through the full folder contents rather than stopping at the first page.
- **Drag-and-drop organization** — drag a file or folder onto another folder to move/re-nest it (`files.update` with `addParents`/`removeParents`).
- **Inline create, rename, delete** — "+" buttons in the sidebar header create a new file or folder inline, without a modal; double-click a name (or use the small pencil icon) to rename in place; the trash icon deletes with a confirmation.
- **Import / Export** — Import uploads a local `.md`/`.txt` file from disk straight into the currently-selected Drive folder. Export downloads the currently-open file back to disk as `.md`. These are the only ways local disk files enter or leave the app — there is no local disk *editing*.
- **Live preview** — markdown rendered as you type, with syntax-highlighted code blocks and one-click copy on fenced code.
- **Focus mode** — if you want to type and edit directly in the rendered view rather than in markdown source, open the `…` menu and choose **Focus Mode**. The preview becomes a full-screen rich-text editor (bold, italic, headings, lists all work inline) with typewriter scrolling that keeps the cursor centered. On exit it converts back to clean markdown automatically.
- **Find & replace** — with match navigation and replace-all.
- **Auto-save** — saves two seconds after you stop typing, straight to the open Drive file.
- **Offline** — installable as a PWA; the app shell works without a connection (Drive sync obviously needs one).
- **Three themes** — Lokai (dark editor, light preview), Dark, and Light. Persisted across sessions.
- **Sidebar sort order** — a toggle button in the sidebar header switches between Z→A and A→Z name order (Z→A by default, so ISO-date filenames show newest first). The sidebar also shows a count badge on each folder once expanded.
- **Recently opened files** — a collapsible "Recent" section at the top of the sidebar lists the last 8 files you opened, persisted across sessions. Click the header to collapse or expand it.
- **Open in Drive** — a small ↗ icon in the status bar links directly to the current file in drive.google.com.
- **Database view** — hover any subfolder and click the table icon to open it as a spreadsheet. Each `.md` file becomes a row; YAML frontmatter keys become columns (auto-detected). Text cells are editable inline, booleans render as checkboxes, arrays render as tags. Tags is always a system column — click any tags cell to type comma-separated values. Modified date and file size are always shown. Click a title to open the file; click any column header to sort. Use "+ Add property" to define new frontmatter columns without leaving the table.
- **Sidebar toggle** — Cmd+\ (or the panel button at the top-left of the header) collapses/expands the file sidebar for a full-width editing view.
- **Duplicate file** — hover any file in the sidebar to reveal a copy icon that creates "Copy of …" in the same folder.
- **Export as PDF** — "Export as PDF" in the `…` menu renders the current document to a print-ready popup and opens the browser's print dialog. Choose "Save as PDF" to download.
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

The repo is configured for **Vercel**. `vercel.json` sets `build-config.js` as the build command, which reads `GOOGLE_CLIENT_ID`, `GOOGLE_API_KEY`, and optionally `DRIVE_ROOT_FOLDER_NAME` from Vercel's Environment Variables and writes them into `config.js` at deploy time. `config.js` is gitignored, so credentials never touch the repo.

To deploy your own copy:

1. Import the repo into [Vercel](https://vercel.com).
2. Add `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` under Project Settings → Environment Variables.
3. Push to `main` — Vercel builds and deploys automatically.

Remember to add your Vercel deployment URL to the API key's HTTP referrer restrictions and to your OAuth client's authorized JavaScript origins in the Google Cloud Console.

## Changelog

### v3.8.0

- **Resizable sidebar** — drag the handle at the right edge of the file tree to set the sidebar width anywhere from 150 px to 500 px. The chosen width persists through sidebar open/close toggles.
- **Folder state preserved on refresh** — previously, any action that triggered a tree refresh (save, move, rename, delete, new file) would collapse all expanded folders back to their closed state. Expanded folders now stay open and repopulate their contents automatically after every refresh.

### v3.7.0

- **Tags column in database view** — Tags is now a permanent system column (between Title and auto-detected frontmatter columns). Click any cell to edit tags as a comma-separated list; they persist as a YAML array in each file's frontmatter. Empty cells show an "Add tags…" placeholder. Sortable by tag content.
- **Export as PDF** — "Export as PDF" in the `…` menu renders the current markdown to a styled print popup and auto-triggers the browser's print dialog. Print-optimized CSS handles page breaks, pre-wrap for code blocks, table borders, and clean typography. Syntax highlighting reuses the already-cached highlight.js stylesheet.

### v3.6.0

- **Sidebar toggle** — Cmd+\ (or the panel button in the header) hides/shows the sidebar, giving you a full-width editor when you need it.
- **Duplicate file** — hover a file in the sidebar and click the copy icon to create "Copy of …" in the same folder.
- **Add frontmatter property from database view** — click "+ Add property" in the database toolbar (or the ghost column header at the right end of the table) to define a new column by name; it appears immediately for all rows.
- **Database view caching** — reopening a database folder you already visited no longer re-fetches all file contents; the row data is held in memory and reused until the sidebar is refreshed.
- **New Row collision fix** — clicking "+ New Row" twice in the same day now produces `YYYY-MM-DD-untitled.md` and `YYYY-MM-DD-untitled-2.md` instead of two files with the same name.

### v3.5.0

- **Database view** — hover any subfolder and click the table icon to open it as a spreadsheet. `.md` files become rows, YAML frontmatter keys become columns. Text cells edit inline, booleans render as checkboxes, arrays as tag chips. Modified date and file size are always present as system columns. Sortable by any column header. "+ New Row" creates a blank `.md` file in the folder.
- **Recently opened files** — collapsible "Recent" section at the top of the sidebar, last 8 files, persisted in localStorage. Click the header chevron to collapse or expand.
- **Open in Drive link** — ↗ icon in the status bar opens the current file directly in drive.google.com.
- **Folder item count** — expanded folders show a muted count badge next to the folder name.
- **Z→A default sort** — sidebar tree and database view both default to descending name order so ISO-date filenames show newest first.
- **UI font size 14px** — increased from 13px across all UI elements.
- **Fixed find bar focus** — the search box no longer lost focus after the first keystroke.

### v3.2.0

- **Sidebar sort-direction toggle** — a button in the sidebar header switches between A→Z and Z→A name order; since filenames use ISO date prefixes this also serves as a date sort.
- **README: clarified Focus Mode** — the feature bullet now explains that Focus Mode is how you type and edit directly in the rendered view, rather than in markdown source.

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
