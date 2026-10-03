# Aster front-end

The React, JavaScript, HTML, CSS, illustrations, book files, and frontend build configuration are collected here.

## Contents

- `src/` — pages, components, CSS Modules, learning data, translations, state, and frontend unit tests.
- `public/` — images, favicon, and local book editions with their original credits.
- `index.html` — application entry page.
- `vite.config.mjs` — development server, build settings, and local API proxy.
- `package.json` — frontend dependencies and commands.
- `dist/` — generated production build; regenerate with the build command.
- `ASSETS.md` — image and book credits.
- `qa-fixtures/` — synthetic example data for manual recovery checks.

## Run within this project

From the project root, install with `pnpm install` (or `npm install`), then use `pnpm dev` / `npm run dev`. The existing `Start-Aster.cmd` launcher still starts the full local app. Frontend commands run against this folder, and the site remains at http://127.0.0.1:5173/.

## Use this folder separately

With Node.js 22.12 or later, run `npm install` and `npm run dev` inside this folder. Use `npm run build` to create `dist/`, `npm run preview` to preview it, and `npm test` for the frontend-only unit checks. The full project uses the root pnpm workspace lockfile to pin dependencies.

Guest learning tools work in the browser. Accounts, private school feeds, shared chat, and AI require the separate Aster backend. Development and preview forward `/api` to `http://127.0.0.1:5174`; a deployed frontend needs an appropriate backend connection. Private database files, AI models, and API credentials are not included here.

## Complete book library

The visible library contains only editions included in `public/books/`. Its verified catalogue is `src/localLibrary.json`; each entry records its full text path, source, edition credits, and content checksum. External-only titles remain in the legacy source catalogue for data compatibility but are not offered in the reading library.

Opening a cover launches the in-site reader. Appearance settings, passage highlights, notes, bookmarks, and page position are saved in browser storage scoped to the active account. Search, language/subject filters, and sorting apply only to available complete editions. Book bodies load on demand rather than being bundled into the application JavaScript.

The manual importer, `../scripts/import-readable-books.mjs`, downloads original text editions through Project Gutenberg's listed mirror. It preserves source credits, checks complete-edition boundaries and contributor metadata, and skips editions it cannot verify. Run the library and reader tests before publishing an updated catalogue.
