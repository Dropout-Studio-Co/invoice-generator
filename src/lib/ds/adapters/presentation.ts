import { presentationTokens } from "../tokens/generated";

export const BROWSER_THEME_COLOR = presentationTokens.browserThemeColor;

export const emailPresentation = {
	page: `margin:0;background:${presentationTokens.background};color:${presentationTokens.foreground};font-family:${presentationTokens.fontFamily}`,
	container: "max-width:600px;margin:0 auto;padding:40px 24px",
	brand:
		"margin:0 0 32px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase",
	title: "margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:600",
	body: `margin:0 0 16px;color:${presentationTokens.muted};font-size:16px;line-height:1.625`,
	button: `display:inline-block;margin-top:8px;border-radius:999px;background:${presentationTokens.signal};color:${presentationTokens.background};padding:14px 24px;font-size:13px;font-weight:600;text-decoration:none;text-transform:uppercase`,
	footer: `margin:32px 0 0;padding-top:24px;color:${presentationTokens.quiet};font-size:12px;line-height:1.5`
} as const;
