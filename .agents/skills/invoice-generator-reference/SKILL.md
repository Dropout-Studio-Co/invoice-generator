---
name: invoice-generator-reference
description: Detailed invoice architecture, auth, persistence, AI copilot, tooling, migrations, testing, and operational constraints. Read before changing those areas.
---

# AGENTS.md

## Branch Policy (Strict)

**All work must be done on `main`. Never create a new branch unless Rahi explicitly instructs you to do so.**

This file provides guidance to AI coding agent (the coding-agent platform) when working with code in this repository. Workspace-wide conventions (git/worktree workflow, Conventional Commits, visual verification, shared SvelteKit/Workers/Better-Auth/BYO-AI stack) live in the parent `tools/` and `projects/` AGENTS.md files — not repeated here.

Follow the workspace `frontend-design` selection rule. The existing Dropout DS and invoice-tool
visual language win during constrained work.

---

## Project Overview

A SvelteKit app that generates batches of PDF invoices. Users configure a fixed sender identity and payment methods, add multiple clients (each with service details and a list of invoice months), then trigger bulk generation. Each invoice is rendered as HTML, captured via `html2canvas`, and exported to a jsPDF Blob. Multiple PDFs can be downloaded via the File System Access API (directory picker) or, if unavailable, as sequential individual downloads. A ZIP fallback is also available. An optional AI Copilot lets users drive the same client and invoice operations through natural-language commands.

**Stack**: SvelteKit 2 + Svelte 5 runes, Tailwind CSS v4, Dropout Design System (`@dropout/ds`, vendored) + shadcn-svelte, Cloudflare Workers, Better Auth (Google OAuth + One Tap + passkeys), Cloudflare D1, Drizzle ORM, Cloudflare Workers AI, Bun.

**Auth-optional**: the full builder works signed-out — guest data persists to **localStorage** (the PDF pipeline is client-side anyway). There is **no auth guard / no `/login` redirect**. Sign-in via Better Auth (Google OAuth/One Tap, or a passkey) is an _optional_ upgrade: signing in migrates the guest workspace into D1 (one-time, on first sign-in), syncs all data server-side (sender info, payment methods, clients, invoice entries, AI Copilot conversations), and unlocks the AI Copilot (which additionally requires a connected bring-your-own Cloudflare account — see AI Copilot).

---

## Tech Stack

| Layer           | Technology                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Framework       | SvelteKit 2.x (Svelte 5 with runes)                                                                                      |
| Language        | TypeScript (strict mode)                                                                                                 |
| Styling         | Tailwind CSS v4 (CSS-first; tokens from `@dropout/ds`)                                                                   |
| UI Components   | Dropout Design System (`@dropout/ds`, vendored) + shadcn-svelte                                                          |
| Authentication  | Better Auth (Google OAuth + One Tap + passkeys, optional sign-in)                                                        |
| Database        | Cloudflare D1 (SQLite via Drizzle ORM)                                                                                   |
| AI              | Bring-your-own Cloudflare Workers AI (REST, user's account) + RAG (qwen3 embeddings → bge reranker on owner's Vectorize) |
| Validation      | Zod                                                                                                                      |
| PDF Rendering   | html2canvas + jsPDF                                                                                                      |
| ZIP Packaging   | fflate (`zipSync`, `level: 0`)                                                                                           |
| Animations      | GSAP 3 (motion, view transitions); shadcn Progress/Skeleton                                                              |
| Deployment      | Cloudflare Workers                                                                                                       |
| Package Manager | Bun                                                                                                                      |
| Linting         | ESLint 10 flat config + Prettier                                                                                         |

---

## Commands

```bash
bun run dev              # Start Vite dev server (--open --host: opens browser, exposes on LAN)
bun run build            # Production build
bun run preview          # Build, then run Wrangler dev (test auth/D1 locally)
bun run check            # svelte-check TypeScript validation
bun run check:watch      # svelte-check in watch mode
bun run lint             # ESLint
bun run format           # Prettier
bun run cf-typegen       # Regenerate worker-configuration.d.ts from wrangler.jsonc
bun run sync-ds          # Refresh vendored @dropout/ds from ../../dropout-design-system (rsync --delete)
bun run db:generate      # Generate Drizzle migration files
bun run db:push          # Push schema directly to D1 (skips migration files)
bun run db:pull          # Pull schema from D1
bun run db:migrate       # Apply pending migrations to remote D1
bun run db:migrate:local # Apply pending migrations to local D1
bun run db:migrate:list  # List applied migrations
bun run db:check         # Check migration consistency
bun run db:studio        # Launch Drizzle Studio GUI
bun run seed             # Idempotent local D1 fixtures for e2e-test-user
```

---

## Architecture

### Path Aliases

Two aliases are configured in `svelte.config.js`:

- `$lib` → `src/lib/` (SvelteKit default)
- `$src` → `src/` (custom, used in route files to import from `src/components/`)

Route files use `$src/components/...`; library files use `$lib/...`. Never use relative paths.

### Design System (`$lib/ds`)

**HARD RULE — the Dropout DS guidelines are binding.** Every UI/design change in this repo MUST obey **`~/Desktop/projects/dropout-design-system/GUIDELINES.md`** — the law for all UI: tokens, typography, layout shells, the shadcn-svelte primitive layer (pinned `components.json` preset + blessed kit), overlay/glass tokens, motion, a11y. Non-negotiable: theme via tokens, **never recolor a component**, components before custom markup. This applies automatically to every UI task whether or not the request mentions it. This project vendors `@dropout/ds` at `src/lib/ds/`.

The frontend runs on the **Dropout Design System** (`@dropout/ds`), **vendored** at `src/lib/ds/` — NOT an npm/`file:`/workspace dependency (a sibling-path dependency breaks Cloudflare git-push auto-deploy). DS is the single source of visual truth: `app.css` imports `ds/styles/tokens.css` + `ds/styles/animations.css` (ink ramp, semantic aliases, type scale, fonts, radius, shadows, `--ease`, base layer, `@custom-variant` set). `app.css` adds only tool-specific token aliases (`--popover`, `--status-*`, `--chat-*`, `--surface`, `--preview-paper`) repointed to DS primitives, plus app keyframes and the invoice-preview stage.

`$lib/ds` exports `cn`, biometric-label helpers (`detectPlatform`, `biometricLabel`, …), editorial components — `Cta`, `IconButton`, `Heading`, `Eyebrow`, `Input`, `Tile`, `Select`, `StatusBadge` — the settings-section primitives (`SettingsSection`, `SettingsRow`, `SettingsActions`, `SettingsSaveBar`), plus style-string helpers (`inputBase`, `tileBase`, `pillBase`, …). shadcn-svelte primitives in `$lib/components/ui/` coexist and resolve to DS token values with no per-component re-theming. The app is **dark-only** — `app.html` hardcodes `<html class="dark">` (the DS canonical theme). Note `cn()` is imported from `$lib/utils` app-wide, not from DS.

Refresh DS with `bun run sync-ds`. **Never hand-edit files under `src/lib/ds/`** — edit upstream in the DS repo (`../../dropout-design-system`), then re-sync.

### Auth Layer

The server layer handles authentication, data persistence, and AI Copilot inference — the PDF pipeline remains entirely client-side.

- **`$lib/server/auth.ts`** — `createAuth(d1, env)` factory. Returns a Better Auth instance configured with Google OAuth, the `oneTap()` and `passkey()` plugins, Drizzle adapter (D1/SQLite), 7-day session expiry, 5-minute cookie cache, and database rate limiting. `env` must include `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Passkey `rpID`/`origin` are derived from `BETTER_AUTH_URL` so dev/preview/prod all validate. `authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" }` restricts registration to platform biometrics (Face ID / Touch ID — no roaming security keys) and forces the gesture (registration-time only; existing credentials keep working).

- **`$lib/server/schema.ts`** — Drizzle schema for all tables: Better Auth tables (`users`, `sessions`, `accounts`, `verifications`, `rateLimits`, `passkeys`), app tables (`fixedSettings`, `paymentMethods`, `clients`, `clientPaymentMethods`, `invoiceEntries`), AI Copilot tables (`aiConversations`, `aiMessages`, `aiActions`), and `userSettings` (one row per user, PK `user_id` cascade-delete; holds the BYO Cloudflare connection: `cloudflare_token_encrypted` blob, `cloudflare_account_id`, `cloudflare_model`). Snake_case column names required by the Drizzle adapter.

- **`$lib/server/db.ts`** — `getDatabase(d1)` factory returning a Drizzle instance. Exports `Database` type and `schema`.

- **`$lib/server/api.ts`** — `requireApiContext(event)` → `{ db, userId }`. Throws 401 if unauthenticated, 503 if D1 unavailable. Also exports `parseJson(event, schema)` for Zod-validated request bodies and `ok(data?)` for 200/204 responses.

- **`$lib/server/dto.ts`** — Pure row-to-domain mappers: `toSavedPaymentMethod`, `toInvoiceEntry`, `toClient`, `toFixed`. Also exports `AppState` interface: `{ fixed, clients, selectedClientId, expandedClients }`.

- **`$lib/server/repositories/`** — Eight repository files: `fixed.ts`, `clients.ts`, `payment-methods.ts`, `state.ts`, `import.ts`, `ai-conversations.ts`, `ai-messages.ts`, `ai-actions.ts`. `state.ts` exports `loadAppState(db, userId)` → `AppState` used in `+page.server.ts`; `import.ts` performs the atomic first-sign-in guest import in one D1 batch (backs `POST /api/import`).

- **`$lib/server/validation.ts`** — Shared Zod schemas for API request bodies.

- **`$lib/auth-client.ts`** — Better Auth Svelte client (`createAuthClient`) with the `passkeyClient()` and `oneTapClient()` plugins. Exports `authClient`, `signIn`, `signOut`, `useSession`. One Tap reads the browser-exposed `PUBLIC_GOOGLE_CLIENT_ID` (via `$env/dynamic/public`); empty → One Tap never fires.

- **`$lib/config/app.ts`** — `APP_CONFIG` object. App metadata used for `<title>`/`<meta>` tags; its `author` and `siblings` fields also feed the global footer links.

- **`$lib/data/changelog.ts`** — `CHANGELOG_ENTRIES`: hand-curated, customer-facing product update entries backing `/changelog`. Plain-language (no commit hashes/jargon); the array IS the render order (newest first). Prepend a new entry in the same change that ships a user-facing feature.

- **`$lib/hooks/use-current-user.ts`** — `getCurrentUser(user)` → `CurrentUser | null`.

- **`src/hooks.server.ts`** — SvelteKit `handle` hook. Instantiates `createAuth` per request, delegates Better Auth routes to `svelteKitHandler`, calls `auth.api.getSession`, populates `event.locals.user`, `event.locals.session`, `event.locals.currentUser`. Applies CSP and security headers on every response — the CSP whitelists `accounts.google.com/gsi/*` (script/style/connect/frame) and the `Permissions-Policy` grants `identity-credentials-get` so Google One Tap's FedCM prompt works; passkeys need no CSP change. Gracefully degrades if D1 unavailable. Exports `handleError` with UUID correlation.

- **`src/hooks.client.ts`** — Client-side `handleError` with UUID correlation.

- **`src/routes/+layout.server.ts`** — Passes `user`, `session`, `currentUser` from `locals`, plus the `aiEnabled` flag (derived from the `AI_COPILOT_ENABLED` var), into `PageData`.

- **`src/routes/+page.server.ts`** — **No auth guard / no redirect.** Only when `d1 && locals.user` does it load full `AppState` from D1 via `loadAppState` plus the AI Copilot hydration payload (conversations, messages, actions, anomaly settings); anonymous visitors get empty shells (`emptyAi(aiEnabled)`) and re-seed client-side from localStorage. Always returns `{ user, currentUser, appState, ai }`.

- **`src/routes/login/+page.svelte`** — Sign-in page: "Continue with Google" (social OAuth), auto-prompted Google One Tap (when `PUBLIC_GOOGLE_CLIENT_ID` is set), and "Sign in with Face ID / Touch ID" (WebAuthn platform biometrics — gated on `window.PublicKeyCredential`). Redirects to the `?redirect=` target (default `/`) on success.

- **`src/routes/login/+page.server.ts`** — Redirects to `/` if already authenticated.

- **`src/routes/settings/+page.svelte`** and **`+page.server.ts`** — `/settings` route: configure the BYO Cloudflare connection (API token, account ID, chat model) **and manage passkeys** (register Face ID/Touch ID/fingerprint via `authClient.passkey.*`, list, delete — client-side only). Server `load` decrypts the stored token and returns only `maskToken(...)` (raw secret never leaves the server) plus cached model list; **redirects guests to `/login`**. The `save` action validates by calling `listChatModels(creds)` (proves token + account + Workers AI permission), encrypts the token (leaving the blob unchanged if the field is blank), upserts `userSettings`, and warms the `cf-models:{accountId}` KV cache. The `reset` action deletes the `userSettings` row.

- **`src/routes/api/cf/models/+server.ts`** — `GET` lists the user's Cloudflare Workers AI chat models for the settings picker (cached in `AI_QUOTA_KV` under `cf-models:{accountId}`, 24h TTL; `?refresh=1` bypasses). Returns `{ models, connected }` (degrades to `{ models: [], connected: false }` when unconnected; errors travel in JSON, not HTTP status).

- **`src/routes/changelog/+page.svelte`** — Public `/changelog` route. Has **no `+page.server.ts`**, so it inherits no auth guard and is reachable unauthenticated (the guard lives only in `+page.server.ts` for `/`). Renders `CHANGELOG_ENTRIES` from `$lib/data/changelog.ts` grouped by date (source order is render order — newest first, no re-sort). Dates are formatted absolutely (SSR-safe).

- **`src/routes/api/logout/+server.ts`** — `POST`/`GET` both delete the session cookie and redirect to `/login`.

- **`src/routes/api/fixed/+server.ts`** — `PATCH` updates sender fields; `PUT` updates `selectedClientId`.

- **`src/routes/api/payment-methods/+server.ts`** and **`[id]/+server.ts`** — CRUD for payment methods. `PUT` reorders by `orderedIds` array.

- **`src/routes/api/clients/+server.ts`** and **`[id]/+server.ts`** — CRUD for clients. `POST` accepts optional `templateId` to copy from an existing client.

- **`src/routes/api/clients/[id]/entries/+server.ts`** and **`[entryId]/+server.ts`** — CRUD for invoice entries per client.

- **`src/routes/api/clients/[id]/payment-methods/+server.ts`** — `PUT` updates the ordered list of payment method IDs for a client.

- **`src/routes/api/import/+server.ts`** — `POST` ingests a guest's full localStorage snapshot (sender, payment methods, clients, entries, links) in one atomic D1 batch with server-side id remapping; backs the first-sign-in guest import (`migrateGuestToServer`). Refuses (409) if the account already holds data.

- **`src/routes/api/ai/`** — AI Copilot endpoints: `chat/+server.ts` (SSE streaming turn), `conversations/+server.ts` and `[id]/+server.ts` (conversation CRUD), `messages/+server.ts` (message list) and `messages/[id]/+server.ts` (`PATCH` a message's persisted tool-call status so reloaded chats show true outcomes, not always "applied"), `actions/+server.ts` and `[id]/+server.ts` (action history), `undo/[id]/+server.ts` (reverse an applied action), `seed/+server.ts` (embeds `KNOWLEDGE_CORPUS` into Vectorize; `POST` guarded by the `x-seed-secret` header matching `SEED_SECRET`). See the AI Copilot section.

**Authorization flow**: no gate on the builder — guests use it fully (localStorage-backed). Signing in (Google OAuth/One Tap or a passkey) scopes all data to `userId` (D1) and unlocks the AI Copilot. The AI Copilot additionally requires the signed-in user to connect their own Cloudflare account at `/settings`; `/api/ai/chat` returns **HTTP 412** until they do.

### API Client

**`$lib/api/client.ts`** — Typed fetch wrapper: `api.get`, `api.post`, `api.patch`, `api.put`, `api.delete`. Also exports `sync(fn)` (try/catch wrapper returning `T | null`) and `debounceSync(key, delayMs, fn)` (debounced fire-and-forget used for text fields).

### Store Design

All three stores use the **factory function + `$state` closure** pattern, exported as singletons. `session` and `fixed` are **dual-mode**: an `authed` flag (set once at `hydrate(initial, { authed })`) routes every mutation to either the REST API/D1 (signed-in) or a synchronous localStorage write (guest). The guest persistence layer lives in `$lib/persistence/` (see below).

- **`$lib/stores/session.svelte.ts`** — Per-session state: `clients`, `selectedClientId`, `expandedClients`, `generatedInvoices`, `generationState`, `generationError`. Client mutations: `addClient`, `removeClient`, `updateClient(id, patch)`, `togglePaymentMethod`, `ensurePaymentMethodSelected`, `purgePaymentMethodFromClients`, `addInvoiceEntry`, `addInvoiceEntries(clientId, months[])`, `removeInvoiceEntry`, `updateInvoiceEntry`. Activation toggles: `setClientActive(id, isActive)`, `setInvoiceActive(clientId, entryId, isActive)` — both capture previous state and roll back on API failure so stale `isActive` flags cannot leak into the generation queue. Selection/expansion: `setSelectedClientId`, `setClientExpanded`, `toggleClientExpanded`, `isClientExpanded`. Generation lifecycle: `setGenerating`, `setGenerated`, `setError`, `resetGeneration`. Three `$derived` values: `totalInvoiceCount`, `generatableInvoiceCount` (count after active filter), and `allClientsValid` (checks every client has non-empty `name` and `invoicePrefix`). Dual-mode: `hydrate(initial, { authed })` (called once in `+page.svelte` via `untrack`), `loadGuest()` (re-seeds from `GUEST_SESSION_KEY` in `onMount` for guests after SSR), and `saveLocal()`. When `authed` is false, mutations mint ids via `crypto.randomUUID()` and write the full `GuestSessionSnapshot` to localStorage; when true they call `sync()`/`debounceSync()` against the API.

- **`$lib/stores/fixed.svelte.ts`** — Sender/bank data. Exposes `value` getter, `hydrate(initial, { authed })`, `loadGuest()`, `updateFrom(field, value)`, `addPaymentMethod(kind)`, `removePaymentMethod(id)`, `updatePaymentMethodLabel`, `updatePaymentMethodValue`, `movePaymentMethod`. Dual-mode: when `authed` is false, mutations mint ids via `createSavedMethod` and write synchronously to `GUEST_FIXED_KEY`; when true, text mutations debounce via `debounceSync` and structural ones call `sync()` against the API. `hydrate` is called once in `+page.svelte` via `untrack`.

- **`$lib/stores/ai.svelte.ts`** — AI Copilot state: conversations, messages, streaming status, the Tier-B confirmation queue, undo history, anomaly settings (persisted to `localStorage`), pending vision images (`pendingImages`, max 3, with `addPendingImage`/`removePendingImage`/`clearPendingImages`), and mobile/tab UI state. Has a `hydrate(payload)` method called once in `+page.svelte` via `untrack`. Detailed in the AI Copilot section.

The factory pattern is required because Svelte 5 `$state` reactivity is scoped to its declaration.

### Guest Persistence (`$lib/persistence/`)

The signed-out workspace is backed by localStorage:

- **`keys.ts`** — versioned keys `GUEST_FIXED_KEY` / `GUEST_SESSION_KEY` (`invoice-generator:guest:{fixed,session}:v1`) and the `GuestSessionSnapshot` type.
- **`local.ts`** — SSR-safe `readLocal` / `writeLocal` / `clearLocal` (no-op on server; swallow quota/parse errors; synchronous, not debounced).
- **`migrate.ts`** — `migrateGuestToServer(accountEmpty)`: one-time first-sign-in import. POSTs the whole guest snapshot to `/api/import` (one atomic D1 batch, server-side id remapping), then clears both keys and returns `true` so `+page.svelte` reloads to re-hydrate from D1. Returns `false` (retaining guest data) if the account already has data or the call fails — because the import is atomic, a failure commits nothing, so the retry never duplicates rows. Also exports `hasGuestData()`.

### Payment Methods System

**`$lib/payments/registry.ts`** — Defines all supported payment method types as `PAYMENT_METHOD_DEFS: Record<PaymentMethodKind, PaymentMethodDef>`. Supported kinds: `bank`, `bkash`, `nagad`, `rocket`, `wise`, `payoneer`, `paypal`, `custom`. Each `PaymentMethodDef` has `display: "fields" | "link"`. Link methods (wise, payoneer, paypal) show a payment link button in the PDF. Field methods (bank, mobile wallets, custom) show labeled key-value rows. Exports `getMethodDef`, `createSavedMethod`, `isMethodComplete`.

Currencies: `BDT` (৳) and `USD` ($). `$lib/format/currency.ts`exports`formatAmount`only (symbol prefix + en-US grouping, sign hoisted ahead of symbol);`currencySymbol` is module-private.

### Invoice Pipeline

1. **`$lib/invoice/active.ts`** — Single source of truth for the active filter. Exports `getGeneratableInvoices(clients)`, `countGeneratableInvoices(clients)`, and `firstGeneratableInvoice(client)`. Filter rule: `client.isActive AND entry.isActive` (strict AND gate). All generation paths (`GenerationPanel`, `InvoicePreview`, store derived count) consume these helpers — no caller iterates raw `session.clients` for generation.

2. **`$lib/invoice/builder.ts`** — `buildInvoiceHtml(client, entry, fixed)` assembles a complete HTML document string (it imports `defaultTheme` directly — no theme parameter). `renderPaymentMethod` uses the payment method's `display` style to select the correct theme template. Invoice ID format: `{PREFIX}-{MM}{ISSUE_DAY}-{YEAR}` (e.g. `ACME-0101-2026`). Service description supports a `{MONTH}` token substituted via `String.prototype.replace`. Exports `getInvoiceId(client, entry)` and `getFileName(client, entry)` → `invoice-{PREFIX}-{MM}{ISSUE_DAY}-{YEAR}.pdf`.

3. **`$lib/invoice/resolver.ts`** — `resolveTokens(template, tokens)`: single pure function. One-pass regex (`/\{([A-Z_]+)\}/g`) over the original template — inserted values are never re-scanned (so user text containing a token name like `{CSS}` is left alone), unknown tokens pass through verbatim, case-sensitive.

4. **`$lib/invoice/months.ts`** — `MONTHS` array and `MONTH_TO_NUMBER` map (`"January" → "01"`, etc.).

5. **`$lib/pdf/generator.ts`** — Entirely client-side. Injects HTML into a hidden off-screen `<iframe>`, waits for fonts, runs `html2canvas` at 2× scale on the iframe body (A4: 794×1123px), writes the canvas to jsPDF at 210×297mm. Returns a `Blob`.

6. **`$lib/pdf/sequential-download.ts`** — `downloadGroups(groups)` → `DownloadResult`. Tries the File System Access API (`showDirectoryPicker`) first; falls back to sequential individual downloads with 150ms delay between files. Returns `{ usedDirectoryPicker, fellBackToSequential, cancelled, fileCount }`. Files are organized under an `invoices/` root; clients with more than one invoice get a subfolder named `{ClientName}-{Year}-Invoices`. Exports `DownloadGroup`, `DownloadResult`, `countFiles`, `downloadGroups`, `isUserAbort`.

7. **`$lib/pdf/zip.ts`** — `downloadInvoicesZip(groups)` — ZIP fallback using `fflate`. Builds the same folder structure as the directory picker and triggers a single `invoices.zip` download.

### Theme System

**`$lib/themes/default.ts`** exports the `Theme` interface and the single `defaultTheme`. A `Theme` contains: `html` (full document template), `css` (minified stylesheet injected into `{CSS}`), `paymentMethodFields` (partial template for field-style methods), `paymentMethodLink` (partial template for link-style methods), and `paymentField` (partial template for a single field row). There is no registry and no runtime switcher — `builder.ts` imports `defaultTheme` directly (the old `registry.ts` / `ThemeId` / `ACTIVE_THEME_ID` are gone).

To add a theme: implement the `Theme` interface in a new file under `$lib/themes/` and switch the import in `builder.ts` (reintroduce a registry only if more than one theme is ever needed).

### UI Layout

**App layout** — single-column tabbed surface (`Details` / `Preview` via the custom `ViewTabs` sliding-pill control in `src/routes/+page.svelte` — the shadcn `tabs` primitive was removed), full-width with a shared `px-[var(--content-x)]` gutter. The AI Copilot is a **toggleable overlay drawer** (not a pinned rail): the desktop `<aside>` (`hidden lg:block lg:w-[26rem] xl:w-[28rem]`) renders only while `ai.desktopOpen`, flying in from the right. **No rail gutter is reserved** — toggling never reflows the page.

- **`Navbar`** (`src/components/Navbar.svelte`) — invisible (transparent: no bg/border/blur/shadow), in-flow top `<header>` at the right content edge that hosts the signed-in `User` trio or the guest `SignInButton`. On `lg+` the row shifts left when `ai.desktopOpen` (the copilot rail is a fixed overlay reserving no layout space, so otherwise the trio would sit under it).
- **`User`** (`src/components/User.svelte`) — avatar shown when signed in, mounted inside `Navbar`. Desktop: hover-expand pill with a Settings (`/settings`, "Copilot settings") icon + Sign out; mobile: tap opens a `Dialog` with the same links.
- **`SignInButton`** (`src/components/SignInButton.svelte`) — signed-out counterpart in the same `Navbar` slot; "Sign in to sync" (desktop) / "Sign in" (mobile), links to `/login`. An invitation, not a gate — guests get the full builder.
- **`Heading`** (`$lib/components/ui/heading/heading.svelte`) — shared heading above the tabs.
- **`ViewTabs`** (`src/components/ViewTabs.svelte`) in `+page.svelte` — custom ARIA tab control (`role="tablist"`/`role="tab"`, animated white sliding-pill indicator) driving a bound `value`; two tabs:
  - **`Details`** — `FixedSenderPanel` + a `Clients` section (count badge, empty-state CTA, `ClientCard` list bound to `flipList` for add/remove FLIP motion, `AddClientButton`).
  - **`Preview`** — `InvoicePreview` of the selected/first client's first generatable invoice.
- **Below tabs** (full-width) — `Separator` + `GenerationPanel`.
- **AI Copilot mount** (`+layout.svelte`, gated by `data.aiEnabled && !!data.user && page.route.id === "/" && !page.error`):
  - Desktop (`lg+`): `AiDesktopLauncher` (fixed bottom-right launcher, hidden while open or generating) toggles `ai.desktopOpen`; the `<aside>` renders `AiSidebar` only while open.
  - Mobile: `AiMobileFab` + `AiMobileSheet`.
  - Always: `AiConfirmDialog` mounts globally for Tier-B confirmations.
- **`Footer`** (`$lib/components/ui/footer/footer.svelte`) — rendered globally below `{@render children()}` in `+layout.svelte` (every route). Uses the `px-[var(--content-x)]` gutter; centered on mobile, `justify-between` row at `sm+`. Links to `/changelog`, an external tools page, and the author URL (`APP_CONFIG.author.url`). This is the only `$lib/components/ui/` component that is hand-authored, not shadcn-generated.

`GenerationPanel` owns the generate loop: iterates the queue from `getGeneratableInvoices(session.clients)` (active-only), calls `buildInvoiceHtml` + `generatePdf` sequentially, tracks progress with `$state<number>` (0–100) bound to a shadcn `Progress`. On completion renders a `Table` of results with per-client download (directory picker or sequential) and ZIP buttons. Uses `svelte-sonner` toasts for success/error feedback.

**`src/components/MonthPickerDialog.svelte`** — Dialog-based multi-month picker for adding invoice entries (multiple months at once). Opened from `ClientCard` to add entries.

**`src/components/SelectDialog.svelte`** — Generic dialog-based single-item picker used in place of native `<select>` elements.

**`src/components/OverflowActions.svelte`** — Mobile-only sheet that replaces inline action icon buttons on `ClientCard` and `PaymentMethodCard` at small breakpoints. Desktop renders the actions inline.

**`src/components/StatusBadge.svelte`** — Reusable active/inactive badge driven by semantic status color tokens (`--color-status-active`, `--color-status-inactive` in `src/app.css`). Inactive clients/entries also render a subtle left accent bar rather than opacity-only dimming.

**`src/components/InvoiceEntryRow.svelte`** — A single invoice entry row. Table layout at `sm+`, card layout on mobile. Includes the active `Switch` toggle.

**`src/components/PaymentMethodCard.svelte`** — Card UI for configuring a single payment method's fields.

**`src/components/AddClientButton.svelte`** — Button that creates a new client entry; shown below the `ClientCard` list.

**`src/components/SectionEyebrow.svelte`** — Small label/eyebrow text rendered above section headings.

### InvoicePreview

`src/components/InvoicePreview.svelte` renders a live scaled preview of the first generatable entry (via `firstGeneratableInvoice(client)`) for the selected client. Uses `srcdoc={html}` on an iframe, derives a CSS scale factor from the current preview-stage width (`stageWidth / 794`) via a Svelte action backed by a `ResizeObserver`. Selected client is `session.selectedClientId` (falling back to `session.clients[0]`). Contextual empty states distinguish no-client, no-entries, and no-active scenarios.

Preview controls (above the stage):

- **Width presets** — `fit | 1440 | 1280 | 768 | 375`. `fit` follows the container; numeric presets constrain the preview stage to a fixed px width so the same scale formula resizes the rendered invoice. Last choice is persisted to `localStorage`.
- **Fullscreen toggle** — uses the Fullscreen API with WebKit vendor-prefix fallbacks (`webkitRequestFullscreen`, `webkitExitFullscreen`, `webkitFullscreenElement`); state is tracked via a `fullscreenchange` listener.

### Motion

GSAP-driven motion lives entirely under `$lib/motion/`. Surface code imports only from `$lib/motion` — never directly from `gsap`.

- **`tokens.ts`** — shared duration/ease/stagger/distance constants. The values are a cross-app cohesion contract; do not change them.
- **`gsap.ts`** — the only place GSAP is loaded. `getGsap()` performs a `browser`-guarded dynamic `import()` of `gsap`, `ScrollTrigger`, and `Flip`, registers the plugins once, and memoizes the bundle. **Never write a top-level `import ... from "gsap"`** anywhere else — GSAP touches `window`/`document` at module eval and must not run during SSR on Cloudflare Workers.
- **`reduced-motion.svelte.ts`** — `prefersReducedMotion` reactive singleton tracking the `prefers-reduced-motion` media query.
- **`view-transition.ts`** — `handleViewTransition` is wired via `onNavigate` in `+layout.svelte` for cross-route View Transitions; it falls back gracefully when the API is unavailable or motion is reduced.
- **`actions.ts`** — the `use:reveal` action for entrance reveals (optionally scroll-triggered).
- **`helpers.ts`** — `stagger`, `flipList` (GSAP Flip for add/remove/reorder list motion), and `motionDuration` (returns `0` when motion is reduced, for Svelte transitions).

**Rules**: never statically import GSAP; all motion checks `prefersReducedMotion.current` (or routes through `motionDuration`); every tween, timeline, and ScrollTrigger is killed on component/action destroy. The `@media (prefers-reduced-motion: reduce)` blocks and the View Transition CSS in `app.css` enforce reduced-motion fallbacks at the CSS layer.

### Toast Notifications

`svelte-sonner` via shadcn `sonner` component. The `Toaster` component is lazy-imported in `onMount` in `+page.svelte`. Individual toasts are fired via dynamic `import("svelte-sonner")` inside async handlers in `GenerationPanel`.

### Server-side Data Hydration

`+page.server.ts` loads full `AppState` from D1 via `loadAppState(db, userId)` **only when signed in**; guests receive empty shells. `+page.svelte` calls `fixed.hydrate(data.appState.fixed, { authed: !!data.user })`, `session.hydrate(..., { authed: !!data.user })`, and `ai.hydrate(data.ai)` inside `untrack()`. In `onMount`: signed-in users with an empty account run `migrateGuestToServer(true)` (imports any prior guest data, then reloads); guests call `fixed.loadGuest()` + `session.loadGuest()` to re-seed from localStorage.

### AI Copilot

An optional natural-language assistant for managing clients, invoices, and payment methods. Inference runs on the **signed-in user's own Cloudflare account** (bring-your-own, billed to them) via the Cloudflare REST API — the owner's `AI` binding is used only to seed Vectorize and to run the RAG reranker per query. Tool execution happens client-side against the same REST API as the manual UI. Gated by the `AI_COPILOT_ENABLED` var (`"false"` disables) **and** by the user having connected their Cloudflare account at `/settings` (chat returns 412 otherwise).

- **`$lib/ai/`** — Client-side AI layer:
  - `types.ts` — shared types: `Frame`, tool-call shapes, `InverseRecord`, `AnomalyResult`, `SafetyTier`.
  - `client.ts` — `runChatFrames(params)` async generator runs a turn via `runChatViaRest(params.creds, params.model, …)` (temperature 0.2, `max_tokens` 1536) on the user's Cloudflare account; buffers the whole response (Workers AI REST is non-streaming) then yields `Frame`s. Builds multimodal user content (`image_url` parts) when `images` are present. (The old `gateway.ts` / AI Gateway dynamic route is deleted.)
  - `embeddings.ts` — `embedDocuments` calls the qwen3 embedding model (`@cf/qwen/qwen3-embedding-0.6b`, 1024 dims) via the owner's `AI` binding — used **only** by the seed endpoint to build the index. Per-query RAG embeddings instead run on the user's account via `runEmbeddingViaRest` (see `rag.ts`).
  - `rag.ts` — `retrieveAppKnowledge(env, creds, query)` is two-stage: embed the message on the user's account (`runEmbeddingViaRest`), run a wide qwen3 cosine search on the owner's `VECTORIZE` index (`CANDIDATE_K` 12, cosine floor `MIN_COSINE` 0.3), then rerank the pool with `bge-reranker-base` (`@cf/baai/bge-reranker-base`) on the owner's `env.AI` and keep the top `FINAL_K` 4 above sigmoid-mapped score `MIN_RERANK_SCORE` 0.5; `formatKnowledge()` renders matches as a numbered list. The reranker fails open to cosine order; the whole step fails open (returns `[]`) so chat never breaks.
  - `knowledge.ts` — `KNOWLEDGE_CORPUS`: the static app-help passages embedded into Vectorize by the seed endpoint.
  - `window.ts` — `windowHistory()` keeps the last `WINDOW_SIZE` (12) messages for sliding-window context.
  - `streaming.ts` — SSE frame encode/decode (`encodeFrame`, `decodeFrame`, `streamFrames`, `sseStream`).
  - `salvage.ts` — `salvageTextToolCalls()` recovers tool calls the model emits as plain-text JSON instead of structured tool-call frames; returns `{ calls, cleanedText }`.
  - `context.ts` — `projectAppState(appState)` serializes current state into a tokenized (`cli_1`, `ent_1`, `pm_1`) prompt context; `decodeTokens` reverses the mapping on returned tool args.
  - `prompts.ts` — static `SYSTEM_PROMPT` + `buildSystemContext(tools)` (tools only); per-turn `buildUserTurn()` injects `CURRENT STATE`, `APP KNOWLEDGE`, and the date into the user message. `FEW_SHOTS` seed an empty conversation; replies are Bangla/English by detected language. `PROMPT_VERSION` is `v3`.
  - `tools-catalog.ts` — `TOOLS_CATALOG`: 19 tools, each tagged Tier A (auto-apply) or Tier B (destructive/money-mutating — requires confirmation). Exports `TIER_MAP` and `resolvedTier()` — `updateClient`/`updateInvoiceEntry` demote from Tier A to Tier B when the patch touches `serviceAmount`, `serviceCurrency`, or `invoicePrefix`.
  - `tool-labels.ts` — `toolLabel(name)` and field-label maps; friendly display names for tools and fields shown in `AiToolBadge` and `AiConfirmDialog`.
  - `schemas.ts` — per-tool Zod arg schemas (`argSchemas`, `ArgsOf`). Server-safe (no DOM/store imports) so `chat/+server.ts` shares them with `tools.ts`.
  - `tools.ts` — per-tool executors; each validates args via `argSchemas`, calls the REST API, and returns `{ inverse, summary }`.
  - `executor.ts` — `executeToolCall()`: validates args, resolves the safety tier, runs anomaly detection, requests confirmation for Tier B, records the action, executes.
  - `safety.ts` — `detectAnomalies()`: five non-blocking detectors (amount outlier, volume surge, missing payment methods, stale period, currency mismatch).
  - `inverse.ts` — builds an `InverseRecord` (reverse tool call + optional snapshot) for every executed tool, enabling undo.
  - `markdown.ts` — minimal AST-based markdown parser; renders AI message text in `AiMessage.svelte` (no markdown library).
  - `errors.ts` — maps technical error strings to friendly user-facing messages; `looksTechnical()` flags raw artifacts (braces, URLs) so they are stripped from rendered replies.
  - `chat-client.ts` — `sendMessage`, `triggerUndo`, conversation CRUD, confirmation responses. On a 412 from `/api/ai/chat` it flips `ai.setConnectRequired(true)` (the sidebar then shows a "connect your Cloudflare account in Settings" CTA).
- **`$lib/server/`** — AI server layer:
  - `ai/cloudflare-config.ts` — `loadCloudflareConfig(db, userId)` reads the `userSettings` row; `isCloudflareConnected(cfg)`; `resolveCloudflareCreds(encryptionKey, cfg)` decrypts the token (via `TOKEN_ENCRYPTION_KEY`) → `{ creds, model } | null`.
  - `ai/run-rest.ts` — direct account-scoped Cloudflare REST calls (no binding): `runChatViaRest(creds, model, input)` (POST `/accounts/{id}/ai/run/{model}`), `runEmbeddingViaRest`, `listChatModels(creds)`. `DEFAULT_MODEL = "@cf/moonshotai/kimi-k2.7-code"`, `EMBEDDING_MODEL = "@cf/qwen/qwen3-embedding-0.6b"`. Throws `CfInferenceError(status, kind, …)` (`kind: "auth" | "rate_limit" | "model_unavailable" | "transport"`).
  - `ai/errors.ts` — `CloudflareNotConnectedError`, `describeCloudflareError(err)` (user-facing messages), `CF_TOKEN_HELP`.
  - `crypto.ts` — AES-GCM-256 token encryption keyed by `TOKEN_ENCRYPTION_KEY` (base64 32-byte): `deriveTokenKey`, `encryptToken` (IV‖ciphertext+tag → `Uint8Array`), `decryptToken`, `maskToken`.
  - `ai-quota.ts` — `checkAndIncrementQuota(kv, userId)`: per-user daily turn limit (default 200) tracked in `AI_QUOTA_KV`; disabled when the KV binding is absent.
  - `ai-spend.ts` — `checkSpendCap` / `recordSpend` / `estimateTurnCostUsd`: per-user monthly USD spend cap (default $1.00, override via `AI_MONTHLY_CAP_USD`) tracked in `AI_QUOTA_KV`; disabled when the KV binding is absent.
  - `ai-undo.ts` — `applyInverse(db, userId, inverse)`: server-side reversal of an action; throws `UndoInvalidatedError` if the target no longer exists.
  - `log.ts` — `logChatTurn` / `logToolExecution`: structured stdout logging with hashed user IDs.
  - `chat/+server.ts` first resolves the user's BYO creds via `resolveCloudflareCreds(env.TOKEN_ENCRYPTION_KEY, …)` and returns **HTTP 412** (`{ error, connect: "/settings" }`) if unconnected — gated before quota. It then buffers the first model turn (run on the user's account via `runChatViaRest`), retrieves RAG context (when `VECTORIZE` is bound), builds the cache key as `sha256(PROMPT_VERSION|state|message)`, validates tool-call args against `argSchemas`, and issues exactly one corrective retry turn — on schema-invalid args **or** when an imperative user message produced no tool call — before persisting. It also blanks any action narration ("Done…") that ran no tool, gated by `IMPERATIVE_RE`/`REFUSAL_RE` so genuine refusals and clarifying questions survive. Tool-only assistant turns persist with empty content but are summarized back into history as `[Performed: …]` so the model doesn't re-fire the prior instruction.
  - `repositories/ai-conversations.ts`, `ai-messages.ts`, `ai-actions.ts` — D1 persistence for the three AI tables.
- **`$lib/stores/ai.svelte.ts`** — the `ai` store (see Store Design).
- **`src/components/ai/`** — `AiSidebar` composes a chat shell from focused sub-components: `AiHeader` (toolbar pairing a `New Chat` action with an adjacent `History` toggle that opens `AiConversationsPanel`), `AiWelcome` (empty-state suggestion cards), `AiMessageList` (renders one `AiMessage` per turn and `AiTypingIndicator` while streaming, wrapped in a `<svelte:boundary>` so a render error degrades to inline retry rather than crashing the pane), and `AiComposer` (the textarea + send input). Remaining pieces: `AiToolBadge`, `AiConfirmDialog`, `AiAnomalyWarning`, `AiConversationsPanel`, `AiMobileFab`, `AiMobileSheet`, `AiDesktopLauncher` (desktop bottom-right launcher button toggling `ai.desktopOpen`), `AiLauncherIcon` (the 2×2-box launcher glyph for the desktop launcher + mobile FAB; the 4-bar row variant is rendered inline by `AiWelcome`, not via this component), `AiImageUpload` (vision attachments: re-encodes images to WebP via `OffscreenCanvas`, max 3 × 8 MB, exposes `triggerUpload`). The BYO Cloudflare connection is configured at the `/settings` route (not in a dialog; the old `AiSettingsDialog.svelte` was removed). Chat styling lives in `$lib/styles/chat-animations.css` (imported in `app.css`) and the `chat-*` design tokens. There is no action-log panel — undo for applied actions stays available via per-action toasts and inline `AiToolBadge` controls.

**Data flow**: user message (+ optional images) → `POST /api/ai/chat` (resolves BYO creds or 412, loads context, retrieves RAG knowledge, runs the model on the user's Cloudflare account via `runChatViaRest`, streams frames) → client parses frames and runs each tool via `executeToolCall` → Tier B tools wait for `AiConfirmDialog` approval → applied actions are recorded and reversible via `POST /api/ai/undo/[id]`.

---

## Development Principles

- **PDF pipeline is client-side only** — `builder.ts`, `generator.ts`, `zip.ts`, `sequential-download.ts`, and all stores run in the browser. Server files handle auth, data persistence, and AI Copilot inference.
- **Prefer existing abstractions** — check `$lib/` before creating new utilities.
- **No duplication** — use `resolver.ts` for token substitution; use `api` client for all fetch calls.
- **Motion policy** — GSAP is the motion engine, accessed only through `$lib/motion`. Never statically import GSAP anywhere (SSR safety on Cloudflare Workers); it loads via a `browser`-guarded dynamic `import()` inside `$lib/motion/gsap.ts`. All motion respects `prefers-reduced-motion`. Always clean up timelines, tweens, and ScrollTriggers on component/action destroy. shadcn `Progress`, `Skeleton`, and Lucide `Loader2` remain valid for loading states.
- **Performance** — PDF generation is blocking by design. Each `generatePdf()` call is sequential. Do not parallelize.
- **Type safety** — TypeScript strict mode. No `any` except for external library compatibility.

---

## Coding Conventions

### Svelte 5 Runes (mandatory)

```svelte
<script lang="ts">
	// Props
	let { client, onUpdate }: ClientCardProps = $props();

	// State
	let expanded = $state(false);

	// Derived
	let isValid = $derived(client.name.length > 0);
</script>
```

- `$state`, `$derived`, `$props`, `$effect` — never legacy `export let` or `$:` reactive statements
- `$effect` only for side effects with external systems; prefer `onMount` for DOM/lifecycle work

### TypeScript

- Strict mode. No `any`. No loose casts.
- `import type { ... }` for type-only imports
- All component prop types defined explicitly
- `cn()` from `$lib/utils` for conditional class merging

### Imports

```typescript
// Correct — use aliases
import { session } from "$lib/stores/session.svelte";
import ClientCard from "$src/components/ClientCard.svelte";

// Wrong — never relative paths from route files
import { session } from "../../../lib/stores/session.svelte";
```

### Arrow Functions

```typescript
// Correct
const generateAll = async () => { ... };

// Wrong — no function declarations
function generateAll() { ... }
```

### Documentation Comments (agent-first)

Code carries agent-facing documentation: module-level purpose blocks, contracts for non-obvious exported symbols (inputs, outputs, side effects, error modes), stated invariants, and notes on non-obvious coupling. Use TSDoc/JSDoc (`/** */`) in `.ts` and in `.svelte` `<script>` blocks; HTML comments (`<!-- -->`) at the top of `.svelte` markup.

The bar is high-signal only: every comment must carry information not already obvious from identifier names, the type signature, or a few lines of surrounding code. Do not restate the next line, narrate the obvious, duplicate what TypeScript types already encode, or add decorative banners. Inline comments survive only for the unpredictable — workarounds, ordering constraints, performance hacks, subtle correctness arguments, references to external specs/issues. When a line does not clear the bar, leave it out. Never reword or remove load-bearing directives (`@ts-*`, `eslint-disable*`, `svelte-ignore`, license headers).

### Tailwind CSS v4

- CSS-first config in `src/app.css` under `@theme inline`. No `tailwind.config.js`.
- CSS variables only for colors — never hardcode hex/rgb/oklch. The palette comes from `@dropout/ds` (`ds/styles/tokens.css`); `app.css` only repoints tool-specific aliases to DS primitives.
- Design is **dark-only** — `app.html` hardcodes `<html class="dark">`. No light mode.

### shadcn-svelte Components

Components in `$lib/components/ui/` are auto-generated. Never modify them. Create wrappers elsewhere. The sole hand-authored exception is `footer/footer.svelte` (a plain app component that happens to live there).
Add components: `bunx shadcn-svelte@latest add <component>`
Editorial components (`Cta`, `IconButton`, `Heading`, `Eyebrow`, `Input`, `Tile`) come from `$lib/ds`, not this directory — see the Design System section.

---

## Code Style

- **Indentation**: Tabs (`.svelte` files: 4-space tab width for Prettier)
- **Quotes**: Double quotes
- **Trailing commas**: None
- **Print width**: 100 (120 for `.svelte`)
- **Arrow parens**: avoid (`x => x`)
- **Plugins**: prettier-plugin-svelte, prettier-plugin-tailwindcss (auto-sorts Tailwind classes)

---

## Agent Behavior Guidelines

- **Read before write** — always use the Read tool before Edit/Write.
- **No assumptions** — verify the invoice pipeline, store signatures, and theme structure before modifying them.
- **Prefer existing abstractions** — `resolver.ts` for token substitution; `api` client for all fetch calls; `requireApiContext` for API route auth.
- **No scope creep** — a bug fix does not need surrounding cleanup.
- **Validate Svelte code** — run `svelte-autofixer` (svelte MCP) before delivering any `.svelte` file changes.
- **Validate before committing** — run `bun run check` and `bun run lint` before every commit. Never commit failing builds.
- **No feature flags** — this is a single-user tool.
- **No backwards-compat shims** — if you change a store shape or API contract, update all callers.

---

## MCP & Tooling Usage

Consult MCP tools in this priority order:

1. **`svelte` MCP** — for any Svelte 5 or SvelteKit code
   - `list-sections` → discover doc sections
   - `get-documentation` → fetch relevant sections
   - `svelte-autofixer` → **mandatory** before delivering Svelte code
2. **Web search** — last resort

Never use `shopify-dev` MCP (this is not a Shopify project).

---

## Testing Practices

No test framework is currently configured. Validation is done through:

- `bun run check` — svelte-check with strict TypeScript
- `bun run lint` — Prettier formatting + ESLint rules
- Manual testing: generate PDFs, verify file names, test directory picker and ZIP fallback, test with multiple clients and months

When adding tests:

- Use Vitest (compatible with the Vite setup)
- Priority test targets: `resolver.ts`, `builder.ts` (invoice ID format), `sequential-download.ts` (group logic), `dto.ts` (row mappers)
- Place test files alongside source: `*.test.ts`

---

## Development Environment

### Prerequisites

- **Bun** ≥ 1.2.0 (package manager and runtime; pinned via `engines` in `package.json`)
- **Node** ^20.19.0 || ≥ 22.12.0 (required by SvelteKit toolchain; pinned via `engines`)
- **Wrangler** (Cloudflare Workers CLI, installed as devDependency)
- **Git 2.5+** (for worktree support)

### Setup

```bash
bun install
bun run dev
```

Signing in and all server-side persistence require D1 + secrets (see below). Without D1 the app still runs fully as a **guest** (localStorage-backed); the PDF pipeline is client-side regardless. The AI Copilot additionally needs a signed-in user with a connected Cloudflare account (`/settings`).

### Cloudflare Bindings

Configured in `wrangler.jsonc`:

- **ASSETS**: static SvelteKit output
- **DB**: D1 database binding (required for auth and data at runtime)
- **AI**: Workers AI binding (owner's account; used to seed the Vectorize index via `/api/ai/seed` + `embedDocuments`, **and** to run the RAG reranker `@cf/baai/bge-reranker-base` per query — Copilot chat + per-query embeddings run on each user's own Cloudflare account via REST, not this binding)
- **VECTORIZE**: Vectorize index `invoice-generator-kb` backing RAG app-knowledge retrieval (optional — RAG is skipped if absent; required by the seed endpoint)
- **AI_QUOTA_KV**: KV namespace backing the AI Copilot per-user daily turn quota, monthly USD spend cap, and the `cf-models:{accountId}` model-list cache (optional — quota/cap disabled if absent)
- **`remote: true`** is set on `AI`, `VECTORIZE`, and `AI_QUOTA_KV` so local `wrangler dev` / `bun run preview` reach real Workers AI, the seeded Vectorize index, and KV. Wrangler cannot emulate these locally — without the flag seeding, RAG, and quota all silently fail in local preview.
- **vars**: `BETTER_AUTH_URL`, `AI_COPILOT_ENABLED` (feature flag), `AI_MONTHLY_CAP_USD` (monthly AI spend cap, USD), `PUBLIC_GOOGLE_CLIENT_ID` (non-secret Google OAuth client id exposed to the browser for One Tap — same value as the `GOOGLE_CLIENT_ID` secret; blank disables One Tap). (`AI_GATEWAY_SLUG` was removed with the gateway architecture.)
- **Routes / custom domain**: served at `invoice-generator.dropoutstudio.co` (`routes: [{ pattern, custom_domain: true }]`); `workers_dev` and `preview_urls` are `false`.
- **`SEED_SECRET`** (secret): header token gating `POST /api/ai/seed`; without it the seed endpoint returns 401
- **`TOKEN_ENCRYPTION_KEY`** (secret): base64-encoded 32-byte AES-GCM key encrypting each user's stored Cloudflare API token at rest (`src/lib/server/crypto.ts`). **Required** for the BYO connection — a missing/wrong key makes decrypt fail and chat return 412.
- **`E2E_BYPASS_AUTH`** (dev-only, not in `wrangler.jsonc`): when set to `"true"` in `.dev.vars`, `hooks.server.ts` synthesizes a test user + session and skips Google OAuth entirely. Lets `bun run preview` exercise auth-gated UI and `/api/*` routes without OAuth. Must never be set in production.
- **Compatibility**: `nodejs_compat` flag
- Run `bun run cf-typegen` after any `wrangler.jsonc` changes

### Cloudflare Secrets (required for auth + AI)

Set via `wrangler secret put` or in the Cloudflare dashboard:

| Secret                 | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Random secret (e.g. `openssl rand -base64 32`)                    |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                            |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                        |
| `TOKEN_ENCRYPTION_KEY` | base64 32-byte AES-GCM key; encrypts users' BYO Cloudflare tokens |
| `SEED_SECRET`          | header token gating `POST /api/ai/seed`                           |

`BETTER_AUTH_URL` is also a non-secret binding in `wrangler.jsonc`. The rest are secrets — never commit them.

Use `bun run preview` (Wrangler-backed) to test auth locally.

### Database Migration

```bash
bun run db:migrate        # Remote (production)
bun run db:migrate:local  # Local (Wrangler preview)
```

Six migrations exist: `0001_better_auth_tables.sql` (Better Auth tables), `0002_daffy_synch.sql` (app tables: clients, invoice_entries, payment_methods, etc.), `0003_cute_vision.sql` (additive `is_active` columns on `clients` and `invoice_entries` with `DEFAULT true NOT NULL`), `0004_marvelous_puck.sql` (AI Copilot tables: `ai_conversations`, `ai_messages`, `ai_actions`), `0005_neat_the_watchers.sql` (the `user_settings` table holding the encrypted BYO Cloudflare connection), and `0006_flaky_synch.sql` (the `passkeys` table for WebAuthn credentials, FK → `users` cascade-delete).

### Clean Rebuild

```bash
rm -rf node_modules/ .wrangler/ .svelte-kit/ && bun install
```

---

## Test auth & mock data (dev only)

**Reach the signed-in builder locally without Google OAuth** — for manual, Playwright, and curl checks. (email/password is disabled, so there is no password to seed; the bypass injects a session directly.)

- **Test user:** `e2e-test-user` / `e2e@test.local` — synthesized into `event.locals.{user,session,currentUser}` by `hooks.server.ts`, which also upserts the `users` row so FK-bound app data has a real owner.
- **Activate:** already on — `.dev.vars` (gitignored) carries `E2E_BYPASS_AUTH=true`. The bypass is **double-gated (defense in depth)**: the flag **AND** a `localhost`/`127.0.0.1` request host, so it is inert on the prod domain even if the flag ever leaked. Primary safety is still flag-absence — Cloudflare never uploads `.dev.vars`. Works under `bun run dev` (Vite) and `bun run preview` (Wrangler, 8787).
- **Seed the workspace:** `bun run db:migrate:local` (once) → `bun run seed`. Idempotent (`seed/seed.sql`, fixed ids + `INSERT OR REPLACE`); inserts realistic app data for the test user — a sender identity (`fixed_settings`), two payment methods, and two clients (a Dhaka creative agency billed in BDT + an e-commerce brand billed in USD), each with a couple of monthly `invoice_entries` (mixed `is_active` — this schema has no explicit paid/unpaid status). Evergreen (`unixepoch('now')` timestamps + `strftime('%Y','now')` year), so it never expires.
- **⚠️ NEVER enable in production.** `E2E_BYPASS_AUTH` must never appear in `wrangler.jsonc` `vars` or secrets — it grants full unauthenticated access. The real Google OAuth / passkey path is byte-for-byte unchanged; the bypass is an additive, double-gated branch.

---

## Project-Specific Warnings

1. **Store hydration uses `untrack`** — `+page.svelte` calls `fixed.hydrate()` and `session.hydrate()` inside `untrack()`. This prevents triggering reactive side effects during initialization. Do not add a second hydrate call anywhere else.

2. **PDF generation is sequential and blocking** — `generatePdf()` uses `html2canvas` which paints to canvas synchronously. Do not parallelize; `GenerationPanel` iterates sequentially via `for...of`, awaiting each.

3. **iframe positioning is intentional — do not change it** — `generator.ts` uses `position: fixed; top: -9999px; left: -9999px; visibility: hidden` on the iframe wrapper. `visibility: hidden` is intentional: it hides the wrapper while `html2canvas` captures `iframeDoc.body` directly. Do not use `display: none` on the iframe or its body — that prevents `html2canvas` from rendering content.

4. **Token substitution is a single-pass regex** — `resolver.ts` resolves `{[A-Z_]+}` tokens in one pass with `String.prototype.replace(/.../g, …)`, so inserted values are never re-scanned (a value containing a token name is not re-substituted); unknown tokens pass through; case-sensitive. (Separately, `builder.ts` substitutes the `{MONTH}` literal in the service description with a plain `String.prototype.replace("{MONTH}", …)`.)

5. **`allClientsValid` gates generation** — the generate button is disabled unless all clients have `name` and `invoicePrefix`. If generation appears broken, check client validation state.

6. **One hardcoded theme, no registry** — `builder.ts` imports `defaultTheme` from `$lib/themes/default.ts` directly; there is no runtime switcher and no `registry.ts`/`ACTIVE_THEME_ID`. Changing the look means editing `defaultTheme` (or swapping the `builder.ts` import).

7. **Never commit `tmp_screenshots/` or `.playwright-cli/`** — visual verification artifacts. Clean up before committing.

8. **shadcn-svelte components in `$lib/components/ui/` are auto-generated** — never modify them by hand. Use the CLI to update.

9. **Auth is optional; sign-in requires D1** — without D1 (plain Vite dev without Wrangler) sign-in is silently disabled and everyone is a guest (localStorage workspace). There is **no auth guard / no `/login` redirect** on the builder. Use `bun run preview` to test sign-in + sync locally.

10. **Do not add email/password auth** — `emailAndPassword` is explicitly disabled in `createAuth`. Sign-in is Google OAuth (with Google One Tap) plus passkeys/WebAuthn (`oneTap()` + `passkey()` plugins); there is no password method, and Google is the only social provider.

11. **Stores are dual-mode (guest localStorage vs. authed D1)** — `fixed.svelte.ts` and `session.svelte.ts` branch on the `authed` flag set at `hydrate(initial, { authed })`. Guests persist to localStorage (`$lib/persistence/`); signed-in users call the REST API. On first sign-in, `migrateGuestToServer` replays guest data into D1 then clears localStorage. Don't assume a single persistence path.

12. **API routes require D1** — `requireApiContext` throws 503 if `platform.env.DB` is unavailable. All `/api/*` routes will fail in plain Vite dev without Wrangler.

13. **html2canvas ignores UA stylesheet overrides on `<a>` elements** — anchor tags get browser-default link colors that persist even with `!important`, inline styles, or `element.style.setProperty()`. Never use `<a>` in PDF templates. Use `div[data-href]` instead; `generator.ts` queries `[data-href]` to build jsPDF link annotations via `pdf.link()`.

14. **Use inline SVG for PDF buttons, not HTML/CSS** — html2canvas CSS cascade is unreliable for button-like elements. The default theme's `paymentMethodLink` renders the payment button as an inline `<svg>` with `fill="#ffffff"` on SVG `<text>`, bypassing the cascade entirely. Do not replace with HTML/CSS.

15. **Generation queue must come from `active.ts`** — never iterate `session.clients → client.invoices` directly for generation. Use `getGeneratableInvoices()` / `firstGeneratableInvoice()` / `countGeneratableInvoices()` from `$lib/invoice/active.ts`. The active filter is a strict AND gate (`client.isActive AND entry.isActive`); deactivating a client cascades to its entries via UI disable + tooltip.

16. **Active toggles use optimistic updates with rollback** — `setClientActive` and `setInvoiceActive` capture the previous `isActive` value, mutate locally, then call the API. On failure they restore the prior state. Do not add a separate "saving" flag; the rollback path is the contract.

17. **AI Copilot gating is two-layer** — the `AI_COPILOT_ENABLED` var disables it globally (in `+layout.server.ts`/`+page.server.ts`); beyond that, each signed-in user must connect their own Cloudflare account at `/settings` or `/api/ai/chat` returns 412. `TOKEN_ENCRYPTION_KEY` is required (decrypts the user's token). The owner's `AI` binding is needed only for seeding; `VECTORIZE` (RAG) and `AI_QUOTA_KV` (quota/cap/model cache) are optional and degrade gracefully.

18. **Every AI tool must produce an inverse** — each executor in `$lib/ai/tools.ts` returns an `InverseRecord` so the action can be reversed via `applyInverse`. When adding or changing a tool, update its inverse in `$lib/ai/inverse.ts` in lockstep, or undo will silently break.

19. **Dev auth bypass is env-gated, not URL-gated** — to exercise auth-gated flows locally, set `E2E_BYPASS_AUTH=true` in `.dev.vars` and run `bun run preview`. The bypass lives in `hooks.server.ts` and synthesizes `event.locals.user`/`session` for every request, so `/api/*` routes (which gate via `requireApiContext`) also pass. The old `?__dev_bypass=1` URL param has been removed — do not reintroduce it.

20. **Never nest a `<button>` inside a `<button>` in collapsible cards** — a native `<button>` wrapping inner `<Button>` actions is invalid HTML; SSR auto-closes the outer button early and desyncs Svelte's hydration walker, causing the client to append a second copy of the entire app (the whole page renders twice — only when content is present). Use `div[role="button"]` with `tabindex="0"` + Enter/Space `onkeydown`, matching `ClientCard`/`PaymentMethodCard`; inner actions `stopPropagation`.

21. **The chat model is the user's choice, set at `/settings`** — there is no fallback chain or AI Gateway anymore (`gateway.ts` is deleted). `run-rest.ts` calls the single selected model directly (`DEFAULT_MODEL = "@cf/moonshotai/kimi-k2.7-code"`); the picker is populated from the user's own account via `/api/cf/models`. The chosen model must support tool-calling and vision.

22. **RAG returns nothing until the index is seeded** — `VECTORIZE` (`invoice-generator-kb`) must be populated by `POST /api/ai/seed` (with the `x-seed-secret` header) before `retrieveAppKnowledge` returns matches. The chat turn degrades silently to no app-knowledge context if the index is empty or unbound. Re-seed whenever `KNOWLEDGE_CORPUS` changes.

23. **The chat route's retry + false-claim suppression is load-bearing — do not remove it** — the model intermittently narrates an action without calling a tool, so nothing runs. `chat/+server.ts` detects this from the _user's_ imperative phrasing (`looksImperative`), not the model's wording, forces one extra retry (`ACTION_RETRY_MESSAGE`), and blanks any leftover action narration. Deleting the suppression or the no-tool-call retry reintroduces the Copilot claiming work it never did. `VECTORIZE`/`AI_QUOTA_KV` must stay `remote: true` (see Cloudflare Bindings) and the tester must have a connected Cloudflare account, or local preview can't run a turn to exercise this path at all.

24. **`TOKEN_ENCRYPTION_KEY` must not change once users connect** — it decrypts the AES-GCM-encrypted tokens in `user_settings`. Rotating or losing it silently breaks every connected user's Copilot (decrypt fails → 412); they must re-enter tokens at `/settings`. Never log or return the raw token — the server only ever exposes `maskToken(...)`.

25. **Don't reintroduce an auth guard on `/` or `/changelog`** — both are intentionally reachable signed-out; the builder runs as a localStorage-backed guest. Only `/settings` and `/api/*` (via `requireApiContext`) require a session. Adding `redirect(302, "/login")` to `+page.server.ts` would break the guest workspace and its sign-in migration.

26. **`src/lib/ds/` is vendored — never hand-edit it** — it is an rsync mirror of `@dropout/ds` (`bun run sync-ds` from `../../dropout-design-system`, `--delete` overwrites local changes). Edit the DS upstream repo, then re-sync. It is deliberately NOT an npm/`file:` dependency — a sibling-path dependency breaks Cloudflare git-push auto-deploy. DS owns the visual tokens; do not redefine the semantic palette in `app.css`.

<!-- SWISS-DESIGN-GLOBAL -->

## Swiss Design — mandatory for all frontend/UI work

For every website and web application, **always apply Swiss International Style principles to all frontend UI and design work, without exception. This is the required structural baseline, not an optional aesthetic direction.** Before creating, editing, reviewing, or auditing UI, read and follow `/Users/beyourahi/.agents/skills/swiss-design/SKILL.md`; when the stack is not Tailwind, translate the implementation syntax while preserving the principles. Enforce its grid-first, mobile-first, typographic, whitespace, hierarchy, restrained-color, responsive, and accessibility rules. Express project and client branding inside this system; brand requirements do not waive the Swiss principles. This directive supersedes conflicting optional style defaults elsewhere.
