/**
 * Filesystem-safe file/folder segments for downloads and ZIP entries.
 *
 * Invoice prefixes and client names are user-controlled and may contain path
 * separators ("ACME / UK"), Windows-reserved characters (":"), or control
 * characters. Left raw, those either break the browser download name or, worse,
 * create unintended directories / traversal paths inside `invoices.zip` (a ZIP
 * entry containing "/" is a folder boundary). Unicode is preserved — only
 * characters that are illegal in a path segment are replaced with "-".
 */
const UNSAFE_SEGMENT_CHARS = /[\p{Cc}<>:"/\\|?*]/gu;
// Windows rejects trailing dots/spaces, and they are invisible in most UIs.
const TRAILING_DOTS_OR_SPACES = /[. ]+$/;

export const sanitizeFileSegment = (value: string): string =>
	value.replace(UNSAFE_SEGMENT_CHARS, "-").replace(TRAILING_DOTS_OR_SPACES, "");
