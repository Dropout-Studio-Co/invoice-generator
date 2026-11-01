import { describe, expect, it } from "vitest";
import type { Client, Fixed, InvoiceEntry, SavedPaymentMethod } from "$lib/types";
import { MONTHS, MONTH_TO_NUMBER } from "$lib/invoice/months";
import { buildInvoiceHtml, getFileName, getInvoiceId } from "$lib/invoice/builder";
import { isMethodComplete } from "$lib/payments/registry";

const entry = (over: Partial<InvoiceEntry> = {}): InvoiceEntry => ({
	id: "entry-1",
	month: "January",
	issueDay: "05",
	dueDay: "12",
	isActive: true,
	...over
});

const client = (over: Partial<Client> = {}): Client => ({
	id: "client-1",
	name: "Acme & Sons",
	invoicePrefix: "ACME",
	phone: "+880 1700-000000",
	email: "billing@acme.test",
	address: ["12 Road <One>", "Dhaka"],
	service: { description: "Consulting for {MONTH}", amount: 12500.5, currency: "BDT" },
	payment: { methodIds: [] },
	year: 2026,
	isActive: true,
	invoices: [],
	...over
});

const fixed = (
	from: Partial<Fixed["from"]> = {},
	paymentMethods: SavedPaymentMethod[] = []
): Fixed => ({
	from: { name: "Rahi", phone: "", email: "me@example.test", address: "Dhaka", ...from },
	paymentMethods
});

const bankMethod: SavedPaymentMethod = {
	id: "method-bank",
	kind: "bank",
	label: "Main bank",
	values: { holder: "Rahi", bankName: "DBBL", account: "123456", branch: "Gulshan" }
};

const wiseMethod: SavedPaymentMethod = {
	id: "method-wise",
	kind: "wise",
	label: "",
	values: { link: "https://wise.com/pay/x?a=1&b=2", email: "" }
};

describe("invoice months", () => {
	it("keeps the calendar order and maps every month to a unique two-digit number", () => {
		expect(MONTHS).toHaveLength(12);
		expect(MONTHS[0]).toBe("January");
		expect(MONTHS[11]).toBe("December");
		expect(Object.values(MONTH_TO_NUMBER).every((value) => /^\d{2}$/.test(value))).toBe(true);
		expect(new Set(Object.values(MONTH_TO_NUMBER)).size).toBe(12);
		expect(MONTH_TO_NUMBER.December).toBe("12");
	});
});

describe("invoice number composition", () => {
	it("composes prefix + zero-padded month + issue day + client year", () => {
		expect(getInvoiceId(client(), entry())).toBe("ACME-0105-2026");
		expect(getInvoiceId(client({ year: 2031 }), entry({ month: "July", issueDay: "09" }))).toBe(
			"ACME-0709-2031"
		);
		expect(getInvoiceId(client(), entry({ month: "December", issueDay: "31" }))).toBe(
			"ACME-1231-2026"
		);
	});

	it("keeps the invoice id verbatim while sanitizing the download file name", () => {
		const unsafe = client({ invoicePrefix: "ACME / 2026" });
		expect(getInvoiceId(unsafe, entry())).toBe("ACME / 2026-0105-2026");
		expect(getFileName(unsafe, entry())).toBe("invoice-ACME - 2026-0105-2026.pdf");
	});

	it("removes path separators, reserved characters and trailing dots from file names", () => {
		expect(getFileName(client({ invoicePrefix: "ACME/Beta" }), entry())).toBe(
			"invoice-ACME-Beta-0105-2026.pdf"
		);
		expect(getFileName(client({ invoicePrefix: 'CON:"US"|?' }), entry())).toBe(
			"invoice-CON--US----0105-2026.pdf"
		);
		expect(getFileName(client({ invoicePrefix: "ACME." }), entry())).toBe(
			"invoice-ACME-0105-2026.pdf"
		);
	});

	it("preserves unicode in both the invoice id and file name", () => {
		const unicode = client({ invoicePrefix: "Zürich-東京" });
		expect(getInvoiceId(unicode, entry())).toBe("Zürich-東京-0105-2026");
		expect(getFileName(unicode, entry())).toBe("invoice-Zürich-東京-0105-2026.pdf");
	});
});

describe("invoice template payload", () => {
	it("renders the meta block with id, issue/due dates and formatted totals", () => {
		const html = buildInvoiceHtml(client(), entry(), fixed());
		expect(html).toContain("<title>Invoice ACME-0105-2026</title>");
		expect(html).toContain("January 05, 2026");
		expect(html).toContain("January 12, 2026");
		expect(html).toContain('<span class="item-amount">৳12,500.5</span>');
		expect(html).toContain('<div class="totals-value">৳12,500.5</div>');
		expect(html).toContain("All amounts in BDT");
	});

	it("substitutes {MONTH} once and never re-scans inserted text", () => {
		const html = buildInvoiceHtml(
			client({
				service: { description: "{MONTH} audit — keep {CSS} literal", amount: 0, currency: "USD" }
			}),
			entry({ month: "March" }),
			fixed()
		);
		expect(html).toMatch(/class="item-description">March audit — keep \{CSS\} literal<\/span>/);
	});

	it("escapes HTML in every user-controlled text field", () => {
		const html = buildInvoiceHtml(
			client({
				name: 'Zürich <script>alert("x")</script> & Co',
				phone: "<b>123</b>",
				address: ["Line & <one>"],
				service: { description: '<img src=x onerror="x"> {MONTH}', amount: 0, currency: "USD" }
			}),
			entry(),
			fixed({ name: "<Admin>" })
		);
		expect(html).toContain("Zürich &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; Co");
		expect(html).not.toContain("<script>alert");
		expect(html).toContain("&lt;b&gt;123&lt;/b&gt;");
		expect(html).toContain("Line &amp; &lt;one&gt;");
		expect(html).toContain("&lt;img src=x onerror=&quot;x&quot;&gt; January");
		expect(html).toContain("&lt;Admin&gt;");
	});

	it("formats zero and negative totals without losing the sign", () => {
		const zero = buildInvoiceHtml(
			client({ service: { description: "Free", amount: 0, currency: "USD" } }),
			entry(),
			fixed()
		);
		const negative = buildInvoiceHtml(
			client({ service: { description: "Credit", amount: -50, currency: "USD" } }),
			entry(),
			fixed()
		);
		expect(zero).toContain('<div class="totals-value">$0</div>');
		expect(negative).toContain('<div class="totals-value">-$50</div>');
	});

	it("renders selected payment methods in client order and drops unknown ids", () => {
		const html = buildInvoiceHtml(
			client({ payment: { methodIds: ["deleted", "method-wise", "method-bank"] } }),
			entry(),
			fixed({}, [bankMethod, wiseMethod])
		);
		expect(html.indexOf("Pay with Wise")).toBeLessThan(html.indexOf("Main bank"));
		expect(html).toContain('data-href="https://wise.com/pay/x?a=1&amp;b=2"');
		expect(html).toContain('Account holder: <span class="pm-value">Rahi</span>');
		expect(html).toContain("Branch: <span");
	});

	it("omits methods whose required fields are blank and falls back to the catalog name", () => {
		const incomplete: SavedPaymentMethod = {
			id: "method-empty",
			kind: "bkash",
			label: "bKash",
			values: { holder: "", number: "  ", accountType: "" }
		};
		const html = buildInvoiceHtml(
			client({ payment: { methodIds: ["method-empty"] } }),
			entry(),
			fixed({}, [incomplete])
		);
		expect(html).not.toContain("bKash");

		const unlabeled = buildInvoiceHtml(
			client({ payment: { methodIds: ["method-bank"] } }),
			entry(),
			fixed({}, [{ ...bankMethod, label: "   " }])
		);
		expect(unlabeled).toContain("Bank transfer");
	});

	it("escapes payment labels and values", () => {
		const custom: SavedPaymentMethod = {
			id: "method-custom",
			kind: "custom",
			label: "<b>Bank</b>",
			values: { details: "<iframe>details</iframe>" }
		};
		const html = buildInvoiceHtml(
			client({ payment: { methodIds: ["method-custom"] } }),
			entry(),
			fixed({}, [custom])
		);
		expect(html).toContain("&lt;b&gt;Bank&lt;/b&gt;");
		expect(html).toContain("&lt;iframe&gt;details&lt;/iframe&gt;");
	});
});

describe("payment method completeness", () => {
	it("requires only non-optional fields", () => {
		expect(
			isMethodComplete({
				id: "1",
				kind: "bank",
				label: "",
				values: { holder: "A", bankName: "B", account: "C" }
			})
		).toBe(true);
		expect(
			isMethodComplete({
				id: "2",
				kind: "bank",
				label: "",
				values: { holder: "A", bankName: "B", account: " " }
			})
		).toBe(false);
		expect(
			isMethodComplete({
				id: "3",
				kind: "wise",
				label: "",
				values: { link: "https://wise.com/pay/x" }
			})
		).toBe(true);
	});
});
