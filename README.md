# Invoice Generator

Create every client's invoice for the month in one go, then download them all together.

A small web app for freelancers and studios. It turns your sender details, clients, monthly line items, and payment methods into matching PDF invoices.

## What you can do

- Save your sender details and payment methods once: bank transfer, bKash, Nagad, Rocket, Wise, Payoneer, PayPal, or custom.
- Add clients with an invoice prefix, service description, amount, currency (BDT or USD), and one or more months.
- Preview an invoice, then generate every active invoice in one run.
- Download invoices individually, into a folder you choose, or as a single ZIP file.
- Optionally sign in to sync across devices and use an AI copilot for edits.

## Requirements

- [Bun](https://bun.sh) 1.2 or newer
- Node.js 20.19+ or 22.12+
- A Cloudflare account with a D1 database named `invoice_generator` (for sign-in and sync)
- A Google Cloud OAuth 2.0 client (for Google sign-in)

You can use the app without an account or any Cloudflare setup; data is then saved in your browser only.

## Setup

```bash
git clone https://github.com/Dropout-Studio-Co/invoice-generator.git
cd invoice-generator
bun install
```

Create `.dev.vars` in the project root and fill in the values:

```dotenv
BETTER_AUTH_SECRET=      # generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Apply the database migrations to your local D1 database:

```bash
bun run db:migrate:local
```

## Run

```bash
bun run dev
```

Open http://localhost:5173. The dev server binds the local D1 database through `wrangler.jsonc`, so sign-in works here too. To test the production build, use the Wrangler-backed preview:

```bash
bun run preview
```

Open http://localhost:8787. Keep `BETTER_AUTH_URL=http://localhost:8787` and add this redirect URI to your Google OAuth client:

```text
http://localhost:8787/api/auth/callback/google
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Signs sessions; generate a random value |
| `BETTER_AUTH_URL` | App URL; must match the origin you use for OAuth |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `TOKEN_ENCRYPTION_KEY` | Base64 32-byte key that encrypts stored Cloudflare tokens; required for the AI copilot |
| `AI_COPILOT_ENABLED` | Set to `"false"` to disable the AI copilot |

The remote `db:*` commands read `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_D1_TOKEN` from `.env`.

Never commit `.dev.vars` or `.env`; they contain secrets. `E2E_BYPASS_AUTH` is for local testing only and must never be enabled in production.

## Troubleshooting

**Sign-in does nothing under `bun run dev`.** Run `bun run db:migrate:local` first so the local database has tables, then check `BETTER_AUTH_SECRET` and the Google values in `.dev.vars`.

**Google sign-in fails with a redirect error.** Add the callback URI above to your OAuth client, and make sure `BETTER_AUTH_URL` matches the origin you opened.

**The Generate button stays disabled.** Every client needs a name and an invoice prefix, and the client and invoice must be active.

## License

MIT — see [LICENSE](./LICENSE).
