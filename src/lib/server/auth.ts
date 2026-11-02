/**
 * Better Auth factory, instantiated PER REQUEST in hooks.server.ts (Workers has no
 * long-lived module state; the D1 binding arrives per request).
 * INVARIANT: Google OAuth is the ONLY sign-in method — emailAndPassword is intentionally
 * disabled; do not enable it. usePlural matches the snake_case plural table names in schema.ts.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oneTap } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

interface AuthEnv {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
}

export const createAuth = (d1: D1Database, env: AuthEnv) => {
	const db = drizzle(d1, { schema });

	// Passkeys (incl. Face ID / Touch ID / Android biometrics — platform authenticators)
	// are bound to the rpID (registrable domain) and the request origin must match exactly.
	// Both are derived from BETTER_AUTH_URL so dev (localhost), preview, and prod all work.
	const authUrl = new URL(env.BETTER_AUTH_URL);
	const isLocal = authUrl.hostname === "localhost" || authUrl.hostname === "127.0.0.1";
	const rpID = authUrl.hostname;
	const passkeyOrigin = isLocal
		? ["http://localhost:5173", "http://localhost:8787"]
		: authUrl.origin;

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			usePlural: true,
			schema
		}),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: {
			enabled: false
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET
			}
		},
		plugins: [
			// Google One Tap — frictionless overlay on the existing Google OAuth (no new
			// provider, no new table). Reuses the configured Google client; the browser
			// client (auth-client.ts) supplies the public client id.
			oneTap(),
			// Passkey / WebAuthn = device biometrics (Face ID / Touch ID; also Windows Hello /
			// Android fingerprint — all platform authenticators). `authenticatorAttachment:
			// "platform"` gates registration to the built-in biometric, excluding roaming
			// security keys; `userVerification: "required"` forces the biometric/PIN gesture.
			// Registration-time only, so existing passkeys keep working.
			passkey({
				rpID,
				rpName: "Invoice Generator",
				origin: passkeyOrigin,
				authenticatorSelection: {
					authenticatorAttachment: "platform",
					residentKey: "required",
					userVerification: "required"
				}
			})
		],
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			// 5-minute signed cookie cache avoids a DB read on every request; sessions
			// resolve from the cookie until maxAge elapses, then re-hit D1.
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5,
				version: "1"
			}
		},
		// Rate limit state lives in the rate_limits table (schema.ts), not memory — required
		// because Workers isolates do not share in-process state across requests.
		rateLimit: {
			enabled: true,
			window: 60,
			max: 20,
			storage: "database"
		},
		advanced: {
			cookiePrefix: "invoice-generator",
			useSecureCookies: true,
			// Better Auth 1.7 resolves the client IP from `x-forwarded-for` alone, and a
			// header with more than one value (a client-supplied XFF that Cloudflare
			// appends to) resolves to no IP at all — the rate limiter then collapses every
			// caller into one shared per-path bucket. Cloudflare overwrites
			// `cf-connecting-ip` at the edge, so it is single-valued and cannot be spoofed.
			ipAddress: {
				ipAddressHeaders: ["cf-connecting-ip"]
			}
		},
		// OAuth callbacks/CSRF are rejected from origins not listed here; the two localhost
		// ports cover Vite dev (5173) and Wrangler preview (8787), plus the branded domain.
		trustedOrigins: [
			"http://localhost:5173",
			"http://localhost:8787",
			"https://invoice-generator.dropoutstudio.co"
		]
	});
};

export type Auth = ReturnType<typeof createAuth>;
