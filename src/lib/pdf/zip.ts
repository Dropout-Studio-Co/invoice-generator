/**
 * ZIP fallback for invoice downloads: packages all groups into a single
 * `invoices.zip` mirroring the same `invoices/` folder tree as the directory
 * picker (single-invoice groups at root, multi-invoice groups in a subfolder).
 *
 * Uses fflate zipSync at `level: 0` (store, no compression) — PDFs are already
 * compressed, so deflating wastes CPU for ~no size win.
 */
import { zipSync, type Zippable } from "fflate";
import { sanitizeFileSegment } from "$lib/format/filename";
import {
	countFiles,
	INVOICES_ROOT_FOLDER,
	splitFileName,
	uniqueKey,
	type DownloadGroup
} from "$lib/pdf/sequential-download";
import { downloadBlob } from "$lib/utils";

const ZIP_FILE_NAME = "invoices.zip";

const blobToBytes = async (blob: Blob): Promise<Uint8Array> =>
	new Uint8Array(await blob.arrayBuffer());

const buildZippable = async (groups: DownloadGroup[]): Promise<Zippable> => {
	const root: Zippable = {};
	// Object keys collide silently — dedup files and subfolders against one set
	// (they share the root namespace) so same-named clients aren't dropped.
	const rootUsed = new Set<string>();

	for (const group of groups) {
		if (group.invoices.length === 0) continue;

		if (group.invoices.length === 1) {
			const [invoice] = group.invoices;
			const [base, ext] = splitFileName(invoice.fileName);
			root[uniqueKey(rootUsed, base, ext)] = await blobToBytes(invoice.pdfBlob);
			continue;
		}

		const folder: Zippable = {};
		const folderUsed = new Set<string>();
		for (const invoice of group.invoices) {
			const [base, ext] = splitFileName(invoice.fileName);
			folder[uniqueKey(folderUsed, base, ext)] = await blobToBytes(invoice.pdfBlob);
		}
		root[uniqueKey(rootUsed, sanitizeFileSegment(group.folderName))] = folder;
	}

	return { [INVOICES_ROOT_FOLDER]: root };
};

export interface ZipDownloadResult {
	fileCount: number;
	zipFileName: string;
}

export const downloadInvoicesZip = async (groups: DownloadGroup[]): Promise<ZipDownloadResult> => {
	const fileCount = countFiles(groups);
	if (fileCount === 0) return { fileCount: 0, zipFileName: ZIP_FILE_NAME };

	const zippable = await buildZippable(groups);
	const zipped = zipSync(zippable, { level: 0 });
	const blob = new Blob([new Uint8Array(zipped)], { type: "application/zip" });
	downloadBlob(blob, ZIP_FILE_NAME);

	return { fileCount, zipFileName: ZIP_FILE_NAME };
};
