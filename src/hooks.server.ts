/**
 * SvelteKit server hooks. Owns request-scoped auth resolution and response hardening.
 * - `handle`: per-request — instantiates Better Auth, resolves session into event.locals
 *   (user/session/currentUser), delegates Better Auth's own routes, and stamps security
 *   headers (CSP etc.) on EVERY response.
 * - `handleError`: server error → UUID-correlated log + sanitized App.Error.
 * Graceful degradation: if D1 (event.platform.env.DB) is absent, auth is silently disabled
 * and every request is treated as unauthenticated (locals nulled).
 */
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { drizzle } from "drizzle-orm/d1";
import { createAuth } from "$lib/server/auth";
import { users } from "$lib/server/schema";
import { getCurrentUser } from "$lib/hooks/use-current-user";

// Google One Tap loads the GSI script + renders a FedCM iframe from accounts.google.com, so
// script-src/style-src/frame-src must allow it. Passkey/WebAuthn needs no CSP change.
const CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
	"font-src https://fonts.gstatic.com",
	"img-src 'self' data: https://lh3.googleusercontent.com",
	"connect-src 'self' https://accounts.google.com/gsi/",
	"frame-src https://accounts.google.com/gsi/",
	"frame-ancestors 'none'"
].join("; ");

const SECURITY_HEADERS = {
	"Content-Security-Policy": CSP,
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	// `identity-credentials-get` is required for the modern FedCM-based Google One Tap prompt.
	"Permissions-Policy":
		'camera=(), microphone=(), geolocation=(), identity-credentials-get=(self "https://accounts.google.com")'
} as const;

/**
 * Sets SECURITY_HEADERS on the response. Some responses (e.g. from svelteKitHandler) carry
 * immutable headers; setting then throws, so the catch path clones the response into a fresh
 * mutable Headers and reapplies. Returns a response that always carries the security headers.
 */
const applySecurityHeaders = (response: Response): Response => {
	try {
		for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
			response.headers.set(key, value);
		}
		return response;
	} catch {
		const newResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: new Headers(response.headers)
		});
		for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
			newResponse.headers.set(key, value);
		}
		return newResponse;
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth wiring during prerender/build: platform bindings are unavailable.
	if (building) {
		return resolve(event);
	}

	const db = event.platform?.env?.DB;

	if (!db) {
		console.warn("D1 database not available - auth disabled");
		event.locals.user = null;
		event.locals.session = null;
		event.locals.currentUser = null;
		return resolve(event);
	}

	// Synthesizes event.locals to bypass Google OAuth for local dev / Wrangler preview only.
	// DOUBLE-GATED (defense in depth):
	//   (1) E2E_BYPASS_AUTH=true — lives in .dev.vars (gitignored); MUST NOT appear in
	//       wrangler.jsonc/secrets. Cloudflare never uploads .dev.vars, so it can't reach prod —
	//       this flag-absence is the PRIMARY control.
	//   (2) request host is localhost/127.0.0.1 — a SECOND factor, so even if the flag ever leaked
	//       into a deployed env, the bypass stays inert on the prod domain
	//       (invoice-generator.dropoutstudio.co).
	// NOT query-param-gated — the removed ?__dev_bypass=1 must not return (a param is
	// attacker-controlled; a bound env var + the request host are not). Covers Vite dev and
	// Wrangler preview (8787).
	// Synthesizes BOTH user+session so /api/* routes (which gate via requireApiContext) also pass.
	// The user row is upserted (onConflictDoNothing) so FK-bound app data has a real owner.
	// MUST NEVER be enabled in production — it grants full unauthenticated access.
	const isLocalDev = event.url.hostname === "localhost" || event.url.hostname === "127.0.0.1";
	if (isLocalDev && event.platform?.env?.E2E_BYPASS_AUTH === "true") {
		const now = new Date();
		const userId = "e2e-test-user";
		const dz = drizzle(db);
		await dz
			.insert(users)
			.values({
				id: userId,
				email: "e2e@test.local",
				emailVerified: true,
				name: "E2E Test User",
				image: null,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoNothing();
		event.locals.user = {
			id: userId,
			email: "e2e@test.local",
			emailVerified: true,
			name: "E2E Test User",
			image: null,
			createdAt: now,
			updatedAt: now
		} as App.Locals["user"];
		event.locals.session = {
			id: "e2e-test-session",
			userId,
			token: "e2e-test-token",
			expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
			ipAddress: null,
			userAgent: null,
			createdAt: now,
			updatedAt: now
		} as App.Locals["session"];
		event.locals.currentUser = getCurrentUser(event.locals.user);
		return applySecurityHeaders(await resolve(event));
	}

	const env = {
		BETTER_AUTH_SECRET: event.platform?.env?.BETTER_AUTH_SECRET ?? "",
		BETTER_AUTH_URL: event.platform?.env?.BETTER_AUTH_URL ?? "http://localhost:5173",
		GOOGLE_CLIENT_ID: event.platform?.env?.GOOGLE_CLIENT_ID ?? "",
		GOOGLE_CLIENT_SECRET: event.platform?.env?.GOOGLE_CLIENT_SECRET ?? ""
	};

	const auth = createAuth(db, env);

	// A getSession failure must not 500 the whole app — treat as unauthenticated instead.
	try {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
			event.locals.currentUser = getCurrentUser(session.user);
		} else {
			event.locals.session = null;
			event.locals.user = null;
			event.locals.currentUser = null;
		}
	} catch {
		event.locals.session = null;
		event.locals.user = null;
		event.locals.currentUser = null;
	}

	// Better Auth owns its endpoint routes; svelteKitHandler dispatches them, else resolves normally.
	const response = await svelteKitHandler({ event, resolve, auth, building });
	return applySecurityHeaders(response);
};

/**
 * Server error hook. Logs the error with a UUID + request method/path/stack, returns the
 * same UUID plus a sanitized message (generic for 5xx, passthrough for <500) as App.Error.
 */
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	console.error(`[${errorId}] Unhandled error:`, {
		status,
		message,
		url: event.url.pathname,
		method: event.request.method,
		error:
			error instanceof Error
				? { name: error.name, message: error.message, stack: error.stack }
				: error
	});

	return {
		message: status >= 500 ? "An unexpected error occurred" : message,
		errorId
	};
};
