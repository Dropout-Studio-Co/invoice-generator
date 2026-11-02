import { unzipSync } from "fflate";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeneratedInvoice } from "$lib/types";
import { countFiles, splitFileName, uniqueKey } from "$lib/pdf/sequential-download";
import { downloadInvoicesZip } from "$lib/pdf/zip";

const { downloads } = vi.hoisted(() => ({
	downloads: [] as Array<{ blob: Blob; fileName: string }>
}));

vi.mock("$lib/utils", () => ({
	downloadBlob: (blob: Blob, fileName: string) => {
		downloads.push({ blob, fileName });
	}
}));

const invoice = (fileName: string): GeneratedInvoice => ({
	clientId: "client-1",
	clientName: "Acme",
	fileName,
	invoiceId: `id-${fileName}`,
	year: 2026,
	pdfBlob: new Blob([new Uint8Array([1, 2, 3])])
});

const zipEntries = async (index = 0): Promise<string[]> =>
	Object.keys(unzipSync(new Uint8Array(await downloads[index].blob.arrayBuffer())))
		.filter((entry) => !entry.endsWith("/"))
		.sort();

describe("download name helpers", () => {
	it("splits a single trailing extension and tolerates names without one", () => {
		expect(splitFileName("invoice-ACME-0101-2026.pdf")).toEqual(["invoice-ACME-0101-2026", ".pdf"]);
		expect(splitFileName("a.b.pdf")).toEqual(["a.b", ".pdf"]);
		expect(splitFileName("no-extension")).toEqual(["no-extension", ""]);
		expect(splitFileName(".hidden")).toEqual([".hidden", ""]);
	});

	it("dedupes collisions in insertion order while keeping the extension last", () => {
		const used = new Set<string>();
		expect(uniqueKey(used, "invoice", ".pdf")).toBe("invoice.pdf");
		expect(uniqueKey(used, "invoice", ".pdf")).toBe("invoice (2).pdf");
		expect(uniqueKey(used, "invoice", ".pdf")).toBe("invoice (3).pdf");
	});

	it("counts files across groups, ignoring empty groups", () => {
		expect(
			countFiles([
				{ folderName: "one", invoices: [invoice("a.pdf")] },
				{ folderName: "empty", invoices: [] },
				{ folderName: "two", invoices: [invoice("b.pdf"), invoice("c.pdf")] }
			])
		).toBe(3);
	});
});

describe("invoices.zip entry naming", () => {
	beforeEach(() => {
		downloads.length = 0;
	});

	it("stores single-invoice groups at the root and multi-invoice groups in folders", async () => {
		const result = await downloadInvoicesZip([
			{ folderName: "Acme-2026-Invoices", invoices: [invoice("invoice-ACME-0101-2026.pdf")] },
			{
				folderName: "Beta-2026-Invoices",
				invoices: [invoice("invoice-BETA-0201-2026.pdf"), invoice("invoice-BETA-0301-2026.pdf")]
			}
		]);

		expect(result).toEqual({ fileCount: 3, zipFileName: "invoices.zip" });
		expect(downloads).toHaveLength(1);
		expect(downloads[0].fileName).toBe("invoices.zip");
		expect(await zipEntries()).toEqual([
			"invoices/Beta-2026-Invoices/invoice-BETA-0201-2026.pdf",
			"invoices/Beta-2026-Invoices/invoice-BETA-0301-2026.pdf",
			"invoices/invoice-ACME-0101-2026.pdf"
		]);
	});

	it("renames duplicate file and folder names instead of merging them", async () => {
		await downloadInvoicesZip([
			{ folderName: "Acme", invoices: [invoice("invoice-ACME.pdf")] },
			{ folderName: "Acme", invoices: [invoice("invoice-ACME.pdf")] },
			{ folderName: "Twin", invoices: [invoice("x-1.pdf"), invoice("x-2.pdf")] },
			{ folderName: "Twin", invoices: [invoice("y-1.pdf"), invoice("y-2.pdf")] }
		]);

		const entries = await zipEntries();
		expect(entries).toContain("invoices/invoice-ACME.pdf");
		expect(entries).toContain("invoices/invoice-ACME (2).pdf");
		expect(entries).toContain("invoices/Twin/x-1.pdf");
		expect(entries).toContain("invoices/Twin (2)/y-1.pdf");
	});

	it("sanitizes path separators in folder names so entries cannot nest unexpectedly", async () => {
		await downloadInvoicesZip([
			{
				folderName: "ACME/UK:x-2026-Invoices",
				invoices: [invoice("invoice-ACME-0101-2026.pdf"), invoice("invoice-ACME-0201-2026.pdf")]
			}
		]);

		expect(await zipEntries()).toEqual([
			"invoices/ACME-UK-x-2026-Invoices/invoice-ACME-0101-2026.pdf",
			"invoices/ACME-UK-x-2026-Invoices/invoice-ACME-0201-2026.pdf"
		]);
	});

	it("does not download anything when there are no invoices", async () => {
		const result = await downloadInvoicesZip([{ folderName: "empty", invoices: [] }]);
		expect(result).toEqual({ fileCount: 0, zipFileName: "invoices.zip" });
		expect(downloads).toHaveLength(0);
	});
});
