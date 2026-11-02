import { describe, expect, it } from "vitest";
import type { Client, InvoiceEntry, MonthName } from "$lib/types";
import {
	countGeneratableInvoices,
	firstGeneratableInvoice,
	getGeneratableInvoices
} from "$lib/invoice/active";

const entry = (id: string, month: MonthName, isActive = true): InvoiceEntry => ({
	id,
	month,
	issueDay: "01",
	dueDay: "07",
	isActive
});

const client = (id: string, isActive: boolean, invoices: InvoiceEntry[]): Client => ({
	id,
	name: id,
	invoicePrefix: id.toUpperCase(),
	phone: "",
	email: "",
	address: [""],
	service: { description: "", amount: 0, currency: "BDT" },
	payment: { methodIds: [] },
	year: 2026,
	isActive,
	invoices
});

describe("getGeneratableInvoices", () => {
	it("applies the strict client-active AND entry-active gate", () => {
		const clients = [
			client("active", true, [entry("a1", "January"), entry("a2", "February", false)]),
			client("inactive", false, [entry("b1", "January")])
		];
		expect(getGeneratableInvoices(clients).map(({ client: c, entry: e }) => [c.id, e.id])).toEqual([
			["active", "a1"]
		]);
	});

	it("preserves client and entry order", () => {
		const clients = [
			client("first", true, [entry("f2", "March", false), entry("f1", "January")]),
			client("second", true, [entry("s1", "April")])
		];
		expect(getGeneratableInvoices(clients).map(({ entry: e }) => e.id)).toEqual(["f1", "s1"]);
	});

	it("returns nothing for an empty client list", () => {
		expect(getGeneratableInvoices([])).toEqual([]);
	});
});

describe("countGeneratableInvoices", () => {
	it("counts only invoices that pass both gates", () => {
		const clients = [
			client("one", true, [entry("1", "January"), entry("2", "February")]),
			client("two", false, [entry("3", "March")])
		];
		expect(countGeneratableInvoices(clients)).toBe(2);
		expect(countGeneratableInvoices([])).toBe(0);
	});
});

describe("firstGeneratableInvoice", () => {
	it("returns the first active entry of an active client", () => {
		const target = client("one", true, [entry("off", "January", false), entry("on", "February")]);
		expect(firstGeneratableInvoice(target)?.id).toBe("on");
	});

	it("returns null for an inactive client or a client with no active entries", () => {
		expect(firstGeneratableInvoice(client("off", false, [entry("1", "January")]))).toBeNull();
		expect(firstGeneratableInvoice(client("on", true, [entry("1", "January", false)]))).toBeNull();
	});
});
