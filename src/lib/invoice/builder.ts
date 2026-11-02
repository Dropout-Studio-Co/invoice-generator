/**
 * Assembles the complete HTML document string for a single invoice by filling
 * theme templates via token substitution (see resolver.ts). The output is fed
 * to the client-side PDF pipeline (pdf/generator.ts).
 *
 * Invoice ID format: `{PREFIX}-{MM}{ISSUE_DAY}-{YEAR}` (e.g. `ACME-0101-2026`),
 * where MM is the two-digit month from MONTH_TO_NUMBER. Service description
 * supports a literal `{MONTH}` token (case-sensitive, single replace).
 */
import type { Client, Fixed, InvoiceEntry, SavedPaymentMethod } from "$lib/types";
import { defaultTheme as theme } from "$lib/themes/default";
import { getMethodDef } from "$lib/payments/registry";
import { formatAmount } from "$lib/format/currency";
import { sanitizeFileSegment } from "$lib/format/filename";
import { MONTH_TO_NUMBER } from "./months";
import { resolveTokens } from "./resolver";

const escapeHtml = (value: string): string =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const renderPaymentMethod = (method: SavedPaymentMethod): string => {
	const def = getMethodDef(method.kind);
	const label = escapeHtml(method.label.trim() || def.name);

	if (def.display === "link" && def.linkFieldKey) {
		const url = method.values[def.linkFieldKey]?.trim() ?? "";
		if (!url) return "";
		return resolveTokens(theme.paymentMethodLink, {
			METHOD_LABEL: label,
			LINK_URL: escapeHtml(url),
			LINK_TEXT: escapeHtml(def.linkLabel ?? "Pay")
		});
	}

	const fields = def.fields
		.map((field) => {
			const raw = method.values[field.key]?.trim() ?? "";
			if (!raw) return "";
			const isMultiline = field.type === "textarea";
			return resolveTokens(theme.paymentField, {
				FIELD_LABEL: escapeHtml(field.label),
				FIELD_VALUE: escapeHtml(raw),
				FIELD_VALUE_CLASS: isMultiline ? " is-multiline" : ""
			});
		})
		.filter(Boolean)
		.join("");

	if (!fields) return "";

	return resolveTokens(theme.paymentMethodFields, {
		METHOD_LABEL: label,
		FIELDS: fields
	});
};

// Renders methods in the client's selected order; method IDs with no matching
// saved method (e.g. deleted) are silently dropped. Empty methods render "".
const renderPaymentSection = (client: Client, fixed: Fixed): string => {
	const methodsById = new Map(fixed.paymentMethods.map((m) => [m.id, m]));
	return client.payment.methodIds
		.map((id) => methodsById.get(id))
		.filter((m): m is SavedPaymentMethod => Boolean(m))
		.map((m) => renderPaymentMethod(m))
		.filter(Boolean)
		.join("");
};

export const buildInvoiceHtml = (client: Client, entry: InvoiceEntry, fixed: Fixed): string => {
	const mm = MONTH_TO_NUMBER[entry.month];
	const invoiceId = `${client.invoicePrefix}-${mm}${entry.issueDay}-${client.year}`;
	const amount = formatAmount(client.service.amount, client.service.currency);
	// Single literal `{MONTH}` substitution, applied before HTML-escaping below.
	const description = client.service.description.replace("{MONTH}", entry.month);

	const clientDetails = [
		client.phone ? `<div>${escapeHtml(client.phone)}</div>` : "",
		client.email ? `<div>${escapeHtml(client.email)}</div>` : "",
		...client.address.filter(Boolean).map((line) => `<div>${escapeHtml(line)}</div>`)
	]
		.filter(Boolean)
		.join("");

	const paymentSection = renderPaymentSection(client, fixed);

	return resolveTokens(theme.html, {
		INVOICE_ID: invoiceId,
		MONTH: entry.month,
		ISSUE_DAY: entry.issueDay,
		DUE_DAY: entry.dueDay,
		YEAR: String(client.year),
		FROM_NAME: escapeHtml(fixed.from.name),
		FROM_PHONE: escapeHtml(fixed.from.phone),
		FROM_EMAIL: escapeHtml(fixed.from.email),
		FROM_ADDRESS: escapeHtml(fixed.from.address),
		CLIENT_NAME: escapeHtml(client.name),
		CLIENT_DETAILS: clientDetails,
		DESCRIPTION: escapeHtml(description),
		AMOUNT: amount,
		TOTAL: amount,
		CURRENCY: client.service.currency,
		PAYMENT_SECTION: paymentSection,
		CSS: theme.css
	});
};

// Duplicates the ID format built inline in buildInvoiceHtml; keep both in sync.
export const getInvoiceId = (client: Client, entry: InvoiceEntry): string => {
	const mm = MONTH_TO_NUMBER[entry.month];
	return `${client.invoicePrefix}-${mm}${entry.issueDay}-${client.year}`;
};

// The prefix is user text, so it is sanitized for the download/ZIP name only —
// the invoice ID above stays verbatim for display on the document.
export const getFileName = (client: Client, entry: InvoiceEntry): string => {
	const mm = MONTH_TO_NUMBER[entry.month];
	const prefix = sanitizeFileSegment(client.invoicePrefix);
	return `invoice-${prefix}-${mm}${entry.issueDay}-${client.year}.pdf`;
};
