# Invoice Generator

> Every client's monthly invoices, made and downloaded at once.

Generates batches of PDF invoices. Sign in with Google, configure a sender identity, add clients with service details and invoice months, then bulk-generate and download the PDFs individually or as a ZIP. An AI copilot drives the same client and invoice operations through natural-language commands.

**Live**: https://invoice-generator.dropoutstudio.co

Part of the Dropout Studio tools, alongside [Order Processor](https://github.com/Dropout-Studio-Co/order-processor) and [Day Zero](https://github.com/Dropout-Studio-Co/day-zero) — same stack, same Dropout Design System.

---

## Tech Stack

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| Framework          | SvelteKit 2 + Svelte 5 (runes)                   |
| Language           | TypeScript (strict)                              |
| Styling            | Tailwind CSS v4                                  |
| UI / Design System | Dropout Design System (vendored) + shadcn-svelte |
| Auth               | Better Auth (Google OAuth)                       |
| Database           | Cloudflare D1 + Drizzle ORM                      |
| AI Copilot         | Cloudflare Workers AI                            |
| PDF                | html2canvas + jsPDF                              |
| ZIP                | fflate                                           |
| Deployment         | Cloudflare Workers                               |
| Package manager    | Bun                                              |

---

## Setup

**Prerequisites**: Bun, a Cloudflare account with a D1 database named `invoice_generator`, a Google Cloud OAuth 2.0 client.

```bash
git clone https://github.com/Dropout-Studio-Co/invoice-generator.git
cd invoice-generator
bun install
```

Create `.dev.vars` at the project root (Worker runtime secrets, read by the dev server):

```dotenv
BETTER_AUTH_SECRET=      # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Apply migrations and start:

```bash
bun run db:migrate:local
bun run dev              # http://localhost:5173
```

Google sign-in runs against the Wrangler-backed server — use `bun run preview` (`:8787`) for full auth testing, and set `BETTER_AUTH_URL=http://localhost:8787` to match.

---

## Environment Variables

Two gitignored files at the project root, each read by a different tool. Never commit either.

`.dev.vars` — Worker runtime secrets, loaded by the dev server and Wrangler:

| Variable               | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Random secret for session signing              |
| `BETTER_AUTH_URL`      | App base URL — `http://localhost:8787` locally |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                         |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                     |

`.env` — Cloudflare credentials for the Drizzle CLI, used only by the remote `db:*` commands (loaded by Bun):

| Variable                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`  | Cloudflare account ID                        |
| `CLOUDFLARE_DATABASE_ID` | D1 database ID                               |
| `CLOUDFLARE_D1_TOKEN`    | Cloudflare API token with D1 edit permission |

In production, set the `.dev.vars` values as Worker secrets via `wrangler secret put`; `BETTER_AUTH_URL` is a non-secret binding in `wrangler.jsonc`.

---

## Scripts

| Script                     | Description                                   |
| -------------------------- | --------------------------------------------- |
| `bun run dev`              | Dev server on `:5173`                         |
| `bun run preview`          | Wrangler local preview on `:8787` (full auth) |
| `bun run build`            | Production build                              |
| `bun run check`            | Type & Svelte checking (svelte-check)         |
| `bun run lint`             | ESLint                                        |
| `bun run format`           | Prettier auto-format                          |
| `bun run cf-typegen`       | Regenerate Cloudflare types                   |
| `bun run db:generate`      | Generate migration from schema changes        |
| `bun run db:migrate`       | Apply migrations to production D1             |
| `bun run db:migrate:local` | Apply migrations to local D1                  |

---

## Deployment

Set production secrets, then build and deploy:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
bun run build
wrangler deploy
```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:8787/api/auth/callback/google` (local — Wrangler dev server)
   - `https://invoice-generator.dropoutstudio.co/api/auth/callback/google` (production)

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, architecture guidelines, coding standards, and the commit and PR workflow.

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Rahi Khan** · [beyourahi.com](https://beyourahi.com) · [beyourahi@gmail.com](mailto:beyourahi@gmail.com)
