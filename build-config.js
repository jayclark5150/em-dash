// Generates config.js from environment variables at build/deploy time.
// Run automatically by Vercel (see vercel.json) — nothing to run by hand.
//
// Reads GOOGLE_CLIENT_ID / GOOGLE_API_KEY from the environment and writes
// them into config.js, which index.html loads as a plain <script> tag.
// config.js is gitignored, so real credentials never touch the repo —
// they live only in Vercel's Environment Variables.

const fs = require('fs');

const clientId = process.env.GOOGLE_CLIENT_ID || '';
const apiKey = process.env.GOOGLE_API_KEY || '';

if (!clientId || !apiKey) {
  console.warn(
    '[build-config] GOOGLE_CLIENT_ID and/or GOOGLE_API_KEY are not set. ' +
    'The deployed app will show "Google credentials are not configured." ' +
    'Set them in Vercel: Project Settings -> Environment Variables.'
  );
}

const contents = `// AUTO-GENERATED at deploy time by build-config.js — do not edit by hand.
window.APP_CONFIG = {
  GOOGLE_CLIENT_ID: ${JSON.stringify(clientId)},
  GOOGLE_API_KEY: ${JSON.stringify(apiKey)},
};
`;

fs.writeFileSync('config.js', contents);
console.log('[build-config] Wrote config.js' + (clientId && apiKey ? '' : ' (with empty credentials — see warning above)'));
