# Vercel Deployment Fix: Data Directory

## Issue Resolved
**Error**: `Failed to load persona data: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

## Problem
When the application was deployed to Vercel, the demo page attempted to load JSON files from `/data/personas.json`, `/data/kb.json`, and `/data/query-types.json`. However, these files were located in a `/data` directory at the project root, which was not included in the Vite build output (`dist/`).

When Vercel served the application and a request was made to `/data/personas.json`, it returned a 404 HTML page instead of the JSON file. The JavaScript code tried to parse this HTML as JSON, resulting in the error: `Unexpected token '<', "<!DOCTYPE "...`.

## Root Cause
Vite's build process only includes:
1. Files explicitly referenced in the build configuration (HTML entry points)
2. Files imported by JavaScript/TypeScript modules
3. Files in the `/public` directory (copied as-is to the output)

The `/data` directory was not in any of these categories, so it was excluded from the build output.

## Solution
**Moved `/data` directory to `/public/data`**

This ensures that:
1. Vite copies the data directory and all JSON files to `dist/data/` during build
2. The files are accessible at runtime via `/data/personas.json` paths
3. The same code works in both development and production

## Changes Made

### 1. Directory Structure Change
```bash
# Before
/data/
  ├── README.md
  ├── personas.json
  ├── kb.json
  └── query-types.json

# After
/public/data/
  ├── README.md
  ├── personas.json
  ├── kb.json
  └── query-types.json
```

### 2. Build Output
```bash
# After build (npm run build)
dist/
  ├── index.html
  ├── client-success-portal.html
  ├── demo.html
  ├── assets/
  │   ├── portal-[hash].css
  │   └── portal-[hash].js
  └── data/              # ← Now included!
      ├── README.md
      ├── personas.json  # ← 21 personas
      ├── kb.json        # ← 33 articles
      └── query-types.json # ← 7 categories
```

### 3. Documentation Updates
Updated file paths in:
- `INT_INTEGRATION_COMPLETE.md`
- `QUICK_REFERENCE.md`
- `PERSONAS_QUERIES_IMPLEMENTATION.md`

Changed references from `./data/` to `./public/data/`

### 4. Code Changes
**No code changes required!** The demo.html files already used relative paths like `/data/personas.json`, which work correctly when the files are served from the `dist/data/` directory.

## Verification

### Local Testing
```bash
npm run build
npm run preview
curl http://localhost:4173/data/personas.json  # ✓ Returns JSON
```

### Production Testing
After deploying to Vercel:
```bash
curl https://your-app.vercel.app/data/personas.json  # ✓ Returns JSON
```

## Impact
- ✅ Demo page will load personas successfully on Vercel
- ✅ No JavaScript errors in browser console
- ✅ All 21 personas available in dropdown
- ✅ Knowledge base (33 articles) accessible
- ✅ Query types (7 categories) accessible

## Related Files
- Demo pages: `demo.html`, `public/demo.html`
- Build config: `vite.config.js`, `vercel.json`
- Data files: `public/data/*.json`

## Note for Future Development
When adding new static assets (JSON, images, etc.) that need to be accessible at runtime, always place them in the `/public` directory. Vite will copy them to the build output automatically.
