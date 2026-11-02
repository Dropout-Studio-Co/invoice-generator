import { describe, expect, it } from "vitest";
import { MONTHS } from "$lib/invoice/months";
import {
	createClientSchema,
	createMethodSchema,
	reorderSchema,
	setSelectedSchema,
	updateClientSchema,
	updateEntrySchema
} from "$lib/server/validation";

describe("updateClientSchema", () => {
	it("accepts a partial patch with unicode text and a zero amount", () => {
		const result = updateClientSchema.safeParse({
			name: "Zürich 東京",
			invoicePrefix: "ACME",
			serviceAmount: 0,
			serviceCurrency: "USD",
			year: 2026
		});
		expect(result.success).toBe(true);
	});

	it("rejects negative and over-limit service amounts", () => {
		expect(updateClientSchema.safeParse({ serviceAmount: -0.01 }).success).toBe(false);
		expect(updateClientSchema.safeParse({ serviceAmount: 1_000_000_001 }).success).toBe(false);
	});

	it("bounds the year to an integer within 2000–2099", () => {
		expect(updateClientSchema.safeParse({ year: 1999 }).success).toBe(false);
		expect(updateClientSchema.safeParse({ year: 2026.5 }).success).toBe(false);
		expect(updateClientSchema.safeParse({ year: 2100 }).success).toBe(false);
	});

	it("rejects currencies outside the supported enum", () => {
		expect(updateClientSchema.safeParse({ serviceCurrency: "EUR" }).success).toBe(false);
	});

	it("rejects an empty patch", () => {
		expect(updateClientSchema.safeParse({}).success).toBe(false);
	});
});

describe("updateEntrySchema", () => {
	it("accepts every calendar month and partial day strings", () => {
		expect(MONTHS.every((month) => updateEntrySchema.safeParse({ month }).success)).toBe(true);
		expect(updateEntrySchema.safeParse({ issueDay: "", dueDay: "7" }).success).toBe(true);
		expect(updateEntrySchema.safeParse({ issueDay: "07" }).success).toBe(true);
	});

	it("rejects malformed days and unknown months", () => {
		expect(updateEntrySchema.safeParse({ issueDay: "123" }).success).toBe(false);
		expect(updateEntrySchema.safeParse({ issueDay: "-1" }).success).toBe(false);
		expect(updateEntrySchema.safeParse({ month: "Jan" }).success).toBe(false);
	});

	it("rejects an empty patch", () => {
		expect(updateEntrySchema.safeParse({}).success).toBe(false);
	});
});

describe("other request schemas", () => {
	it("accepts only registered payment-method kinds", () => {
		expect(createMethodSchema.safeParse({ kind: "bkash" }).success).toBe(true);
		expect(createMethodSchema.safeParse({ kind: "bank-transfer" }).success).toBe(false);
	});

	it("allows clearing the selected client and bounds reorder payloads", () => {
		expect(setSelectedSchema.safeParse({ selectedClientId: null }).success).toBe(true);
		expect(
			reorderSchema.safeParse({ orderedIds: Array.from({ length: 64 }, (_, i) => `m${i}`) }).success
		).toBe(true);
		expect(
			reorderSchema.safeParse({ orderedIds: Array.from({ length: 65 }, (_, i) => `m${i}`) }).success
		).toBe(false);
	});

	it("creates a client with an optional template id", () => {
		expect(createClientSchema.safeParse({ templateId: null }).success).toBe(true);
		expect(createClientSchema.safeParse({ templateId: "abc" }).success).toBe(true);
		expect(createClientSchema.safeParse({ templateId: 5 }).success).toBe(false);
	});
});
