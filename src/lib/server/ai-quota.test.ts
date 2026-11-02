import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAndIncrementQuota, getQuotaUsage } from "$lib/server/ai-quota";
import { estimateTurnCostUsd, checkSpendCap, recordSpend } from "$lib/server/ai-spend";

const fakeKv = () => {
	const store = new Map<string, string>();
	const kv = {
		get: async (key: string) => store.get(key) ?? null,
		put: async (key: string, value: string) => {
			store.set(key, value);
		}
	} as unknown as KVNamespace;
	return { kv, store };
};

afterEach(() => {
	vi.useRealTimers();
});

describe("daily AI quota", () => {
	it("disables the quota when the KV binding is absent", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-12-31T23:59:00Z"));

		const result = await checkAndIncrementQuota(undefined, "user-1");

		expect(result).toEqual({
			allowed: true,
			count: 0,
			limit: 200,
			resetsAt: "2027-01-01T00:00:00.000Z"
		});
	});

	it("keys the counter by UTC day and increments only allowed turns", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-15T23:59:59Z"));
		const { kv, store } = fakeKv();

		expect(await checkAndIncrementQuota(kv, "user-1")).toMatchObject({ allowed: true, count: 1 });
		expect(store.get("ai:quota:user-1:2026-03-15")).toBe("1");
		expect(await checkAndIncrementQuota(kv, "user-1")).toMatchObject({ allowed: true, count: 2 });
		expect(store.get("ai:quota:user-1:2026-03-15")).toBe("2");
	});

	it("rejects a turn at the limit without consuming budget", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
		const { kv, store } = fakeKv();
		store.set("ai:quota:user-1:2026-03-15", "2");

		const denied = await checkAndIncrementQuota(kv, "user-1", 2);

		expect(denied).toMatchObject({ allowed: false, count: 2, limit: 2 });
		expect(store.get("ai:quota:user-1:2026-03-15")).toBe("2");
	});

	it("starts a fresh counter across the New Year UTC boundary", async () => {
		vi.useFakeTimers();
		const { kv, store } = fakeKv();

		vi.setSystemTime(new Date("2026-12-31T23:00:00Z"));
		await checkAndIncrementQuota(kv, "user-1");

		vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
		const next = await checkAndIncrementQuota(kv, "user-1");

		expect(next.count).toBe(1);
		expect(store.get("ai:quota:user-1:2026-12-31")).toBe("1");
		expect(store.get("ai:quota:user-1:2027-01-01")).toBe("1");
	});

	it("reads usage without incrementing it", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-30T10:00:00Z"));
		const { kv, store } = fakeKv();
		store.set("ai:quota:user-1:2026-06-30", "7");

		expect(await getQuotaUsage(kv, "user-1")).toMatchObject({ allowed: true, count: 7 });
		expect(store.get("ai:quota:user-1:2026-06-30")).toBe("7");
	});
});

describe("monthly AI spend cap", () => {
	it("estimates cost from token counts at the documented rates", () => {
		expect(estimateTurnCostUsd(1_000_000, 0)).toBeCloseTo(0.35);
		expect(estimateTurnCostUsd(0, 1_000_000)).toBeCloseTo(0.75);
		expect(estimateTurnCostUsd(0, 0)).toBe(0);
	});

	it("falls back to the default cap for unusable configuration", async () => {
		expect((await checkSpendCap(undefined, "user-1", undefined)).capUsd).toBe(1);
		expect((await checkSpendCap(undefined, "user-1", "0")).capUsd).toBe(1);
		expect((await checkSpendCap(undefined, "user-1", "-5")).capUsd).toBe(1);
		expect((await checkSpendCap(undefined, "user-1", "2.5")).capUsd).toBe(2.5);
	});

	it("records spend with six decimals and stops at the cap", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-12-31T12:00:00Z"));
		const { kv, store } = fakeKv();

		await recordSpend(kv, "user-1", 1_000_000, 0);

		expect(store.get("ai:spend:user-1:2026-12")).toBe("0.350000");
		expect(await checkSpendCap(kv, "user-1", "0.35")).toMatchObject({
			allowed: false,
			spentUsd: 0.35
		});
	});

	it("starts the spend counter over in a new UTC month", async () => {
		vi.useFakeTimers();
		const { kv, store } = fakeKv();

		vi.setSystemTime(new Date("2026-12-31T23:59:00Z"));
		await recordSpend(kv, "user-1", 1_000_000, 0);

		vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
		expect(await checkSpendCap(kv, "user-1", "1")).toMatchObject({ allowed: true, spentUsd: 0 });
		expect(store.has("ai:spend:user-1:2026-12")).toBe(true);
		expect(store.has("ai:spend:user-1:2027-01")).toBe(false);
	});

	it("no-ops when the KV binding is absent", async () => {
		await expect(recordSpend(undefined, "user-1", 1_000, 1_000)).resolves.toBeUndefined();
	});
});
