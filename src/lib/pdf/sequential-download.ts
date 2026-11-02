/**
 * Saves generated invoice PDFs to disk. Prefers the File System Access API
 * (showDirectoryPicker → writes a real folder tree); falls back to sequential
 * individual browser downloads (150ms apart to avoid the browser dropping rapid
 * programmatic clicks) when the API is unavailable or the picker is denied.
 *
 * Layout (both paths): files live under an `invoices/` root. A group with a
 * single invoice writes the file directly into root; a group with >1 invoice
 * gets its own `{folderName}` subfolder. User-cancelled picker is surfaced as
 * `cancelled: true`, not an error.
 */
import type { GeneratedInvoice } from "$lib/types";
import { sanitizeFileSegment } from "$lib/format/filename";
import { downloadBlob } from "$lib/utils";

export interface DownloadGroup {
	folderName: string;
	invoices: GeneratedInvoice[];
}

export interface DownloadResult {
	usedDirectoryPicker: boolean;
	fellBackToSequential: boolean;
	cancelled: boolean;
	fileCount: number;
}

// Local shims for the File System Access API (not in the ambient TS lib).
type DirectoryPickerStartIn =
	"desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";

interface DirectoryPickerOptions {
	mode?: "read" | "readwrite";
	id?: string;
	startIn?: DirectoryPickerStartIn;
}

interface DirectoryPickerWindow {
	showDirectoryPicker: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
}

const DOWNLOAD_DELAY_MS = 150;
const DIRECTORY_PICKER_ID = "invoice-generator-downloads";
export const INVOICES_ROOT_FOLDER = "invoices";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Returns a name unique within `used` (which it mutates): on collision it appends
 * " (2)", " (3)", … to `base` before re-attaching `ext`. Prevents two clients
 * that share a file or folder name from overwriting/merging in the same directory.
 */
export const uniqueKey = (used: Set<string>, base: string, ext = ""): string => {
	let candidate = `${base}${ext}`;
	let n = 2;
	while (used.has(candidate)) {
		candidate = `${base} (${n})${ext}`;
		n++;
	}
	used.add(candidate);
	return candidate;
};

/** Splits a file name into [base, ext], preserving a single trailing extension (".pdf"). */
export const splitFileName = (fileName: string): [string, string] => {
	const dot = fileName.lastIndexOf(".");
	return dot > 0 ? [fileName.slice(0, dot), fileName.slice(dot)] : [fileName, ""];
};

const supportsDirectoryPicker = (): boolean =>
	typeof window !== "undefined" &&
	typeof (window as unknown as Partial<DirectoryPickerWindow>).showDirectoryPicker === "function";

const isAbortError = (err: unknown): boolean =>
	err instanceof DOMException && err.name === "AbortError";

const writeFile = async (
	dirHandle: FileSystemDirectoryHandle,
	fileName: string,
	blob: Blob
): Promise<void> => {
	const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
	const writable = await fileHandle.createWritable();
	await writable.write(blob);
	await writable.close();
};

const requestDirectory = async (): Promise<FileSystemDirectoryHandle> => {
	const picker = (window as unknown as DirectoryPickerWindow).showDirectoryPicker;
	return picker({
		mode: "readwrite",
		id: DIRECTORY_PICKER_ID,
		startIn: "downloads"
	});
};

const writeGroupsToDirectory = async (
	root: FileSystemDirectoryHandle,
	groups: DownloadGroup[]
): Promise<void> => {
	const invoicesRoot = await root.getDirectoryHandle(INVOICES_ROOT_FOLDER, { create: true });
	// Files and subfolders share one namespace under invoicesRoot, so dedup both
	// against the same set to avoid overwrite/merge across same-named clients.
	const rootUsed = new Set<string>();

	for (const group of groups) {
		if (group.invoices.length === 0) continue;

		if (group.invoices.length === 1) {
			const [invoice] = group.invoices;
			const [base, ext] = splitFileName(invoice.fileName);
			await writeFile(invoicesRoot, uniqueKey(rootUsed, base, ext), invoice.pdfBlob);
			continue;
		}

		const folder = await invoicesRoot.getDirectoryHandle(
			uniqueKey(rootUsed, sanitizeFileSegment(group.folderName)),
			{ create: true }
		);
		const folderUsed = new Set<string>();
		for (const invoice of group.invoices) {
			const [base, ext] = splitFileName(invoice.fileName);
			await writeFile(folder, uniqueKey(folderUsed, base, ext), invoice.pdfBlob);
		}
	}
};

const triggerSequentialDownloads = async (groups: DownloadGroup[]): Promise<void> => {
	const queue: GeneratedInvoice[] = [];
	for (const group of groups) {
		queue.push(...group.invoices);
	}

	for (let i = 0; i < queue.length; i++) {
		const invoice = queue[i];
		downloadBlob(invoice.pdfBlob, invoice.fileName);
		if (i < queue.length - 1) await sleep(DOWNLOAD_DELAY_MS);
	}
};

export const countFiles = (groups: DownloadGroup[]): number =>
	groups.reduce((total, group) => total + group.invoices.length, 0);

const emptyResult = (fileCount: number): DownloadResult => ({
	usedDirectoryPicker: false,
	fellBackToSequential: false,
	cancelled: false,
	fileCount
});

export const downloadGroups = async (groups: DownloadGroup[]): Promise<DownloadResult> => {
	const fileCount = countFiles(groups);
	if (fileCount === 0) return emptyResult(0);

	if (!supportsDirectoryPicker()) {
		await triggerSequentialDownloads(groups);
		return { ...emptyResult(fileCount), fellBackToSequential: true };
	}

	let root: FileSystemDirectoryHandle;
	try {
		root = await requestDirectory();
	} catch (err) {
		// User dismissed the picker — report as cancelled, not a failure.
		if (isAbortError(err)) {
			return { ...emptyResult(fileCount), cancelled: true };
		}
		console.warn("Directory picker unavailable, falling back to sequential download.", err);
		await triggerSequentialDownloads(groups);
		return { ...emptyResult(fileCount), fellBackToSequential: true };
	}

	await writeGroupsToDirectory(root, groups);
	return { ...emptyResult(fileCount), usedDirectoryPicker: true };
};

export const isUserAbort = (err: unknown): boolean => isAbortError(err);
