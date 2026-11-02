import { describe, expect, it } from "vitest";
import { formatAmount } from "$lib/format/currency";

describe("formatAmount", () => {
	it("renders grouped BDT and USD amounts with their own symbol", () => {
		expect(formatAmount(12500.5, "BDT")).toBe("৳12,500.5");
		expect(formatAmount(12500.5, "USD")).toBe("$12,500.5");
	});

	it("renders zero and negative zero as a bare positive amount", () => {
		expect(formatAmount(0, "BDT")).toBe("৳0");
		expect(formatAmount(-0, "USD")).toBe("$0");
	});

	it("hoists the minus sign ahead of the currency symbol", () => {
		expect(formatAmount(-50, "USD")).toBe("-$50");
		expect(formatAmount(-1250.75, "BDT")).toBe("-৳1,250.75");
	});

	it("rounds to the locale's three fraction digits without trailing zeros", () => {
		expect(formatAmount(1234.5678, "USD")).toBe("$1,234.568");
		expect(formatAmount(0.1 + 0.2, "USD")).toBe("$0.3");
	});

	it("groups large integer amounts", () => {
		expect(formatAmount(1_000_000_000, "BDT")).toBe("৳1,000,000,000");
	});
});
