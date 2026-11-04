import { BROWSER_THEME_COLOR } from "./presentation";
import { presentationTokens } from "../tokens/generated";

const escapeHtml = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const renderFatalError = ({
	brand = "",
	status = "%sveltekit.status%",
	title = "This page couldn’t load.",
	homeLabel = "Go home",
	homeHref = "/"
} = {}) => {
	const safeBrand = escapeHtml(brand);
	const brandSuffix = safeBrand ? ` — ${safeBrand}` : "";
	const safeStatus = escapeHtml(status);
	const safeTitle = escapeHtml(title);
	const safeHomeLabel = escapeHtml(homeLabel);
	const safeHomeHref = escapeHtml(homeHref);
	return `<!doctype html>
<html lang="en" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${BROWSER_THEME_COLOR}"><meta name="robots" content="noindex, nofollow"><title>${safeStatus} — Page unavailable${brandSuffix}</title><style>:root{color-scheme:dark;font-family:${presentationTokens.fontFamily};background:${presentationTokens.background};color:${presentationTokens.foreground}}*{box-sizing:border-box}body{min-width:320px;min-height:100dvh;margin:0}main{min-height:100dvh;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:32px;align-content:center;padding:max(clamp(24px,6vw,96px),env(safe-area-inset-top)) max(clamp(16px,4vw,72px),env(safe-area-inset-right)) max(clamp(24px,6vw,96px),env(safe-area-inset-bottom)) max(clamp(16px,4vw,72px),env(safe-area-inset-left));overflow-x:hidden}.code{grid-column:1/-1;font-size:clamp(7rem,24vw,21rem);font-weight:600;letter-spacing:-.08em;line-height:.8;font-variant-numeric:tabular-nums}.copy{grid-column:1/-1;z-index:1}h1{max-width:18ch;margin:0;font-size:clamp(2rem,5vw,5rem);font-weight:500;letter-spacing:-.045em;line-height:.95;text-wrap:balance}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}.action{min-height:44px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;padding:12px 28px;background:${presentationTokens.signal};color:${presentationTokens.background};font:600 13px/1 inherit;text-decoration:none;text-transform:uppercase}.secondary{background:${presentationTokens.secondarySurface};color:${presentationTokens.foreground}}:focus-visible{outline:0;background:${presentationTokens.quiet};color:${presentationTokens.background}}@media(min-width:768px){.code{grid-column:1/span 8}.copy{grid-column:7/-1}}</style></head><body><main><div class="code" aria-hidden="true">${safeStatus}</div><section class="copy"><h1>${safeTitle}</h1><div class="actions"><a class="action" href="">Reload</a><a class="action secondary" href="${safeHomeHref}">${safeHomeLabel}</a></div></section></main></body></html>`;
};
