# Agent Guide (sportsmedals)

This repository is a static site (HTML/CSS/JS) that renders a medal leaderboard
and includes an admin mode for CSV/JSON import/export. There is no build system
or package manager in the repo.

If you are an agent, use this file as the source of truth for how to work here.

------------------------------------------------------------
Build / Lint / Test
------------------------------------------------------------

There are no scripted build, lint, or test commands in this repo.

Run locally (recommended for UI changes):
- Option A: open `index.html` directly in a browser.
- Option B: serve the folder with any static server (examples below).

Static server examples (choose one available on your machine):
- `python -m http.server 8000` (then open http://localhost:8000)
- `npx serve .` (if Node tooling is available)
- `npx http-server .` (if Node tooling is available)

Single test execution:
- There are no tests in this repository.
- If you add tests in the future, document the command and how to run a single
  test file or case here.

Linting/formatting:
- No linting or formatting tools are configured.
- Preserve existing formatting and style in each file.

------------------------------------------------------------
Project Structure
------------------------------------------------------------

- `index.html` : main page markup
- `styles.css` : global styling, themes, responsive layout
- `app.js`     : all application logic (data loading, rendering, admin mode)
- `data/medals.json` : default data source for display

Data loading:
- Default data is `data/medals.json`.
- Optional query param: `/?data=https://your-cdn/medals.json`
- Admin mode: `/?admin=1`

------------------------------------------------------------
Code Style Guidelines
------------------------------------------------------------

General
- Follow the existing vanilla JS style: no frameworks, no bundlers.
- Keep changes minimal and consistent with the current structure.
- Prefer readability over cleverness.
- Keep DOM access centralized in the `elements` map.

Formatting
- Use 2-space indentation in JS, HTML, and CSS.
- Use double quotes for strings in JS and HTML attributes.
- Use semicolons in JS.
- Wrap long lines only when it improves readability (see current style).
- Keep blank lines between logical sections.

Imports / Dependencies
- There are no module imports; `app.js` is a single script.
- Avoid adding new dependencies unless absolutely necessary.
- If adding external assets, keep them in `index.html` (e.g. fonts).

Types / Data Shapes
- JavaScript is plain ES code; no TypeScript.
- Use JSDoc sparingly only when the intent is unclear.
- Preserve existing data shape:
  - `data.meta`, `data.settings`, `data.events`, `data.records`
  - `record` fields: `eventId`, `grade`, `className`, `gold`, `silver`, `bronze`
- Keep numeric values normalized with `Number(...)` when needed.

Naming Conventions
- `const` for values, `let` only when reassignment is required.
- Use camelCase for variables and functions.
- DOM element references live in `elements` object with descriptive keys.
- Event handler functions use `handleX` naming (e.g. `handleViewToggle`).
- Helper functions are verbs (e.g. `renderTable`, `buildLeaderboard`).

Error Handling
- Prefer `try/catch` around IO (fetch, FileReader) and show user-friendly
  fallback UI or messages.
- On fetch failure, fallback to `defaultData` (see existing pattern).
- When parsing CSV, provide a clear status message in the admin panel.
- Avoid throwing unhandled errors in UI code paths.

DOM / Rendering Guidelines
- Update the UI via explicit render functions (`render`, `updateHero`, etc.).
- When injecting HTML (`innerHTML`), sanitize inputs if new user text is added.
  (Current code expects controlled inputs only.)
- Keep template strings small and readable.
- Prefer `textContent` for plain text updates.

State Management
- Use the `state` object for shared app state.
- Keep `state` keys stable: `data`, `view`, `gradeFilter`, `admin`, `theme`.
- When adding state, update both initialization and any reset logic.

CSV / Data Handling
- Preserve `requiredCsvFields` validation.
- Use `toSafeNumber` for numeric inputs when parsing or exporting.
- Keep CSV headers stable: `event_name, category, grade, class, gold, silver, bronze`.

CSS / UI Guidelines
- Use CSS variables in `:root` for theme values.
- Keep light theme overrides under `body.theme-light`.
- Maintain existing animation style: subtle, short, and minimal.
- Preserve responsive breakpoints at 880px and 640px.
- Avoid introducing new global resets.

Accessibility
- Preserve `alt` text for images.
- Use semantic elements (`header`, `main`, `section`) as in `index.html`.
- Ensure focusable controls are buttons/inputs with visible text.

File-Specific Notes
------------------------------------------------------------

`app.js`
- Keep all DOM lookups in `elements` at the top.
- Keep initialization in `init()` and call it at the bottom.
- Avoid direct DOM queries inside loops unless necessary.

`styles.css`
- Keep sections grouped by page areas (hero, table, modal, admin).
- Prefer `var(...)` color usage over hard-coded colors (except special cases).
- Match existing typography choices (Oswald + Source Han Serif SC).

`index.html`
- Keep the DOM structure aligned with JS element IDs.
- If adding new controls, wire them in `elements` and bind events in `app.js`.

------------------------------------------------------------
Cursor / Copilot Rules
------------------------------------------------------------

- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md`
  were found in this repository.

------------------------------------------------------------
When Changing Behavior
------------------------------------------------------------

- Update `README.md` if user-facing behavior changes.
- Keep admin mode functioning for CSV import/export and JSON export.
- Confirm the UI still renders correctly on mobile.
