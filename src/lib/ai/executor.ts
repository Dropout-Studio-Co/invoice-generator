/**
 * Orchestrates a single tool call end-to-end on the client: validate args →
 * resolve safety tier → detect anomalies → gate Tier-B (or anomaly-escalated)
 * calls behind confirmation → run the executor → record the action (with inverse)
 * for undo → emit result frames via ctx.onResult.
 *
 * Tier model (see ./tools-catalog.ts, ./safety.ts):
 * - READ_ONLY tools (getAppStateSummary) execute immediately, never recorded.
 * - polishText has its own approval path (requestPolishApproval) and is always Tier A.
 * - Otherwise effectiveTier = B if base tier is B OR any anomaly fired; B forces confirmation.
 * Rejected/failed calls are still recorded (with a noop inverse) for history.
 * @see ./tools.ts (executors), ./inverse.ts (inverse builders), $lib/stores/ai.svelte.ts.
 */

import { api } from "$lib/api/client";
import type { AppState } from "$lib/server/dto";
import { session } from "$lib/stores/session.svelte";
import { fixed } from "$lib/stores/fixed.svelte";
import { executors } from "./tools";
import { argSchemas, type ArgsOf } from "./schemas";
import { detectAnomalies } from "./safety";
import { resolvedTier, TIER_MAP, READ_ONLY_TOOLS } from "./tools-catalog";
import { toolLabel, fieldLabel } from "./tool-labels";
import type {
	AnomalyResult,
	AnomalySettings,
	ConfirmationDiffRow,
	Frame,
	InverseRecord,
	ParsedToolCall,
	SafetyTier
} from "./types";
import type { Client } from "$lib/types";

export type { ConfirmationDiffRow } from "./types";

export interface ExecutionContext {
	conversationId: string | null;
	messageId: string | null;
	anomalySettings: AnomalySettings;
	requestConfirmation: (req: ConfirmationRequest) => Promise<boolean>;
	requestPolishApproval: (req: PolishApprovalRequest) => Promise<boolean>;
	onResult: (result: ExecutionFrame) => void;
}

export interface ConfirmationRequest {
	toolCallId: string;
	toolName: string;
	args: unknown;
	tier: SafetyTier;
	anomalies: AnomalyResult[];
	humanLabel: string;
	diff: ConfirmationDiffRow[];
	inverseSummary: string;
}

export interface PolishApprovalRequest {
	toolCallId: string;
	target: string;
	oldText: string;
	newText: string;
}

export type ExecutionFrame = Frame & { t: "tool_result" | "anomaly" };

export interface ExecutionOutcome {
	toolCallId: string;
	toolName: string;
	status: "applied" | "rejected" | "failed";
	actionId: string | null;
	error: string | null;
}

/** Live read of current store state for anomaly detection. Not a deep clone — read-only use only. */
const snapshotAppState = (): AppState => ({
	fixed: fixed.value,
	clients: session.clients,
	selectedClientId: session.selectedClientId,
	expandedClients: {}
});

const humanLabelFor = (toolName: string, args: unknown): string => {
	const a = (args ?? {}) as Record<string, unknown>;
	switch (toolName) {
		case "createClient": {
			const data = (a.data as Record<string, unknown> | undefined) ?? {};
			const name = typeof data.name === "string" ? data.name.trim() : "";
			return name ? `Create client "${name}"` : "Create a new client";
		}
		case "deleteClient": {
			const c = session.clients.find((x) => x.id === a.clientId);
			return `Delete client "${c?.name || a.clientId}" and all its invoices`;
		}
		case "removeInvoiceEntry": {
			const c = session.clients.find((x) => x.id === a.clientId);
			const e = c?.invoices.find((x) => x.id === a.entryId);
			return `Delete the ${e?.month || ""} invoice for "${c?.name || a.clientId}"`;
		}
		case "removePaymentMethod": {
			const m = fixed.value.paymentMethods.find((x) => x.id === a.paymentMethodId);
			return `Delete payment method "${m?.label || m?.kind || a.paymentMethodId}"`;
		}
		case "updatePaymentMethodValue":
			return `Update payment method ${a.field} value`;
		case "updateClient": {
			const c = session.clients.find((x) => x.id === a.clientId);
			const patch = (a.patch as Record<string, unknown>) ?? {};
			const keys = Object.keys(patch).map(fieldLabel).join(", ");
			return `Update ${keys} on client "${c?.name || a.clientId}"`;
		}
		case "updateInvoiceEntry": {
			const c = session.clients.find((x) => x.id === a.clientId);
			const e = c?.invoices.find((x) => x.id === a.entryId);
			const patch = (a.patch as Record<string, unknown>) ?? {};
			const keys = Object.keys(patch).map(fieldLabel).join(", ");
			return `Update ${keys} on the ${e?.month || ""} invoice for "${c?.name || a.clientId}"`;
		}
		default:
			return toolLabel(toolName);
	}
};

const displayValue = (value: unknown): string => {
	if (value === undefined || value === null || value === "") return "—";
	if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

const currentClientField = (client: Client | undefined, key: string): unknown => {
	if (!client) return undefined;
	switch (key) {
		case "name":
			return client.name;
		case "invoicePrefix":
			return client.invoicePrefix;
		case "phone":
			return client.phone;
		case "email":
			return client.email;
		case "address":
			return client.address;
		case "serviceDescription":
			return client.service.description;
		case "serviceAmount":
			return client.service.amount;
		case "serviceCurrency":
			return client.service.currency;
		case "year":
			return client.year;
		case "isActive":
			return client.isActive;
		default:
			return undefined;
	}
};

const buildConfirmationDetail = (
	toolName: string,
	args: unknown
): { diff: ConfirmationDiffRow[]; inverseSummary: string } => {
	const a = (args ?? {}) as Record<string, unknown>;
	const diff: ConfirmationDiffRow[] = [];
	switch (toolName) {
		case "updateClient": {
			const client = session.clients.find((x) => x.id === a.clientId);
			const patch = (a.patch as Record<string, unknown>) ?? {};
			for (const [key, value] of Object.entries(patch)) {
				diff.push({
					label: fieldLabel(key),
					current: displayValue(currentClientField(client, key)),
					proposed: displayValue(value)
				});
			}
			return { diff, inverseSummary: "Undo restores the client's previous values." };
		}
		case "updateInvoiceEntry": {
			const client = session.clients.find((x) => x.id === a.clientId);
			const entry = client?.invoices.find((x) => x.id === a.entryId) as
				Record<string, unknown> | undefined;
			const patch = (a.patch as Record<string, unknown>) ?? {};
			for (const [key, value] of Object.entries(patch)) {
				diff.push({
					label: fieldLabel(key),
					current: displayValue(entry?.[key]),
					proposed: displayValue(value)
				});
			}
			return { diff, inverseSummary: "Undo restores the invoice entry's previous values." };
		}
		case "updatePaymentMethodValue": {
			const method = fixed.value.paymentMethods.find((x) => x.id === a.paymentMethodId);
			const field = String(a.field ?? "");
			diff.push({
				label: fieldLabel(field),
				current: displayValue(method?.values?.[field]),
				proposed: displayValue(a.value)
			});
			return { diff, inverseSummary: "Undo restores the previous value." };
		}
		case "updateFixedField": {
			const field = String(a.field ?? "") as "name" | "phone" | "email" | "address";
			diff.push({
				label: fieldLabel(field),
				current: displayValue(fixed.value.from[field]),
				proposed: displayValue(a.value)
			});
			return { diff, inverseSummary: "Undo restores the previous sender value." };
		}
		case "deleteClient":
			return { diff, inverseSummary: "Undo recreates the client and all of its invoices." };
		case "removeInvoiceEntry":
			return { diff, inverseSummary: "Undo restores the deleted invoice entry." };
		case "removePaymentMethod":
			return { diff, inverseSummary: "Undo restores the payment method and its links." };
		case "addInvoiceEntries":
			return { diff, inverseSummary: "Undo removes the entries that were added." };
		default:
			return { diff, inverseSummary: "Undo reverts this change." };
	}
};

const currentPolishText = (target: string, clientId?: string, paymentMethodId?: string): string => {
	switch (target) {
		case "clientServiceDescription": {
			const client = clientId ? session.clients.find((x) => x.id === clientId) : undefined;
			return client?.service.description ?? "";
		}
		case "paymentMethodLabel": {
			const method = paymentMethodId
				? fixed.value.paymentMethods.find((x) => x.id === paymentMethodId)
				: undefined;
			return method?.label ?? "";
		}
		case "fromName":
			return fixed.value.from.name;
		case "fromPhone":
			return fixed.value.from.phone;
		case "fromEmail":
			return fixed.value.from.email;
		case "fromAddress":
			return fixed.value.from.address;
		default:
			return "";
	}
};

/** Persists the action (including inverse + status) to /api/ai/actions for the undo history; swallows failure and returns null. */
const recordAction = async (params: {
	conversationId: string | null;
	messageId: string | null;
	toolName: string;
	inputs: unknown;
	inverse: InverseRecord;
	safetyTier: SafetyTier;
	requiredConfirmation: boolean;
	anomalies: AnomalyResult[];
	applied: boolean;
	status: "applied" | "rejected" | "failed";
	error: string | null;
}): Promise<string | null> => {
	try {
		const created = await api.post<{ id: string }>("/api/ai/actions", {
			conversationId: params.conversationId,
			messageId: params.messageId,
			toolName: params.toolName,
			inputs: params.inputs,
			inverse: params.inverse,
			safetyTier: params.safetyTier,
			requiredConfirmation: params.requiredConfirmation,
			anomalyTriggered:
				params.anomalies.length > 0 ? params.anomalies.map((a) => a.key).join(",") : null,
			applied: params.applied,
			status: params.status,
			error: params.error
		});
		return created.id;
	} catch (err) {
		console.error("[ai-executor] failed to record action", err);
		return null;
	}
};

const isKnownTool = (name: string): name is keyof typeof argSchemas => name in argSchemas;

/**
 * Validates + runs one tool call, driving confirmation/anomaly UI through `ctx`
 * callbacks and reporting progress via `ctx.onResult`. Never throws — every
 * failure path returns an ExecutionOutcome with status "failed". Unknown or
 * schema-invalid tools fail fast before any side effect.
 */
export const executeToolCall = async (
	call: ParsedToolCall,
	ctx: ExecutionContext
): Promise<ExecutionOutcome> => {
	if (!isKnownTool(call.name)) {
		const outcome: ExecutionOutcome = {
			toolCallId: call.id,
			toolName: call.name,
			status: "failed",
			actionId: null,
			error: `Unknown tool: ${call.name}`
		};
		ctx.onResult({
			t: "tool_result",
			id: call.id,
			status: "failed",
			error: outcome.error ?? undefined
		});
		return outcome;
	}

	const schema = argSchemas[call.name];
	const parsed = schema.safeParse(call.args ?? {});
	if (!parsed.success) {
		const message = parsed.error.issues[0]?.message ?? "Invalid arguments";
		ctx.onResult({
			t: "tool_result",
			id: call.id,
			status: "failed",
			error: `Validation failed: ${message}`
		});
		return {
			toolCallId: call.id,
			toolName: call.name,
			status: "failed",
			actionId: null,
			error: message
		};
	}

	const args = parsed.data as ArgsOf<typeof call.name>;

	if (READ_ONLY_TOOLS.has(call.name)) {
		try {
			const executor = executors[call.name];
			const result = await executor(args as never);
			ctx.onResult({
				t: "tool_result",
				id: call.id,
				status: "applied",
				summary: result.summary
			});
			return {
				toolCallId: call.id,
				toolName: call.name,
				status: "applied",
				actionId: null,
				error: null
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Tool execution failed";
			ctx.onResult({ t: "tool_result", id: call.id, status: "failed", error: message });
			return {
				toolCallId: call.id,
				toolName: call.name,
				status: "failed",
				actionId: null,
				error: message
			};
		}
	}

	if (call.name === "polishText") {
		const polishArgs = args as ArgsOf<"polishText">;
		ctx.onResult({ t: "tool_result", id: call.id, status: "pending_confirmation" });
		const approved = await ctx.requestPolishApproval({
			toolCallId: call.id,
			target: polishArgs.target,
			oldText: currentPolishText(
				polishArgs.target,
				polishArgs.clientId,
				polishArgs.paymentMethodId
			),
			newText: polishArgs.proposedText
		});
		if (!approved) {
			const actionId = await recordAction({
				conversationId: ctx.conversationId,
				messageId: ctx.messageId,
				toolName: call.name,
				inputs: args,
				inverse: { tool: "noop", args: {} },
				safetyTier: "A",
				requiredConfirmation: true,
				anomalies: [],
				applied: false,
				status: "rejected",
				error: null
			});
			ctx.onResult({
				t: "tool_result",
				id: call.id,
				status: "rejected",
				actionId: actionId ?? undefined
			});
			return {
				toolCallId: call.id,
				toolName: call.name,
				status: "rejected",
				actionId,
				error: null
			};
		}
		try {
			const result = await executors.polishText(polishArgs);
			const actionId = await recordAction({
				conversationId: ctx.conversationId,
				messageId: ctx.messageId,
				toolName: call.name,
				inputs: args,
				inverse: result.inverse,
				safetyTier: "A",
				requiredConfirmation: true,
				anomalies: [],
				applied: true,
				status: "applied",
				error: null
			});
			ctx.onResult({
				t: "tool_result",
				id: call.id,
				status: "applied",
				summary: result.summary,
				actionId: actionId ?? undefined
			});
			return {
				toolCallId: call.id,
				toolName: call.name,
				status: "applied",
				actionId,
				error: null
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Tool execution failed";
			const actionId = await recordAction({
				conversationId: ctx.conversationId,
				messageId: ctx.messageId,
				toolName: call.name,
				inputs: args,
				inverse: { tool: "noop", args: {} },
				safetyTier: "A",
				requiredConfirmation: true,
				anomalies: [],
				applied: false,
				status: "failed",
				error: message
			});
			ctx.onResult({
				t: "tool_result",
				id: call.id,
				status: "failed",
				error: message,
				actionId: actionId ?? undefined
			});
			return {
				toolCallId: call.id,
				toolName: call.name,
				status: "failed",
				actionId,
				error: message
			};
		}
	}

	const baseTier: SafetyTier = resolvedTier(call.name, args);
	const anomalies = detectAnomalies(call.name, args, snapshotAppState(), ctx.anomalySettings);
	if (anomalies.length > 0) {
		ctx.onResult({
			t: "anomaly",
			toolCallId: call.id,
			reasons: anomalies.map((a) => `${a.key}: ${a.reason}`)
		});
	}
	const effectiveTier: SafetyTier = baseTier === "B" || anomalies.length > 0 ? "B" : "A";
	const requiredConfirmation = effectiveTier === "B";

	if (requiredConfirmation) {
		ctx.onResult({ t: "tool_result", id: call.id, status: "pending_confirmation" });
		const detail = buildConfirmationDetail(call.name, args);
		const approved = await ctx.requestConfirmation({
			toolCallId: call.id,
			toolName: call.name,
			args,
			tier: effectiveTier,
			anomalies,
			humanLabel: humanLabelFor(call.name, args),
			diff: detail.diff,
			inverseSummary: detail.inverseSummary
		});
		if (!approved) {
			const actionId = await recordAction({
				conversationId: ctx.conversationId,
				messageId: ctx.messageId,
				toolName: call.name,
				inputs: args,
				inverse: { tool: "noop", args: {} },
				safetyTier: effectiveTier,
				requiredConfirmation,
				anomalies,
				applied: false,
				status: "rejected",
				error: null
			});
			ctx.onResult({
				t: "tool_result",
				id: call.id,
				status: "rejected",
				actionId: actionId ?? undefined
			});
			return {
				toolCallId: call.id,
				toolName: call.name,
				status: "rejected",
				actionId,
				error: null
			};
		}
	}

	try {
		const executor = executors[call.name];
		const result = await executor(args as never);
		const actionId = await recordAction({
			conversationId: ctx.conversationId,
			messageId: ctx.messageId,
			toolName: call.name,
			inputs: args,
			inverse: result.inverse,
			safetyTier: effectiveTier,
			requiredConfirmation,
			anomalies,
			applied: true,
			status: "applied",
			error: null
		});
		ctx.onResult({
			t: "tool_result",
			id: call.id,
			status: "applied",
			summary: result.summary,
			actionId: actionId ?? undefined
		});
		return {
			toolCallId: call.id,
			toolName: call.name,
			status: "applied",
			actionId,
			error: null
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Tool execution failed";
		const actionId = await recordAction({
			conversationId: ctx.conversationId,
			messageId: ctx.messageId,
			toolName: call.name,
			inputs: args,
			inverse: { tool: "noop", args: {} },
			safetyTier: effectiveTier,
			requiredConfirmation,
			anomalies,
			applied: false,
			status: "failed",
			error: message
		});
		ctx.onResult({
			t: "tool_result",
			id: call.id,
			status: "failed",
			error: message,
			actionId: actionId ?? undefined
		});
		return {
			toolCallId: call.id,
			toolName: call.name,
			status: "failed",
			actionId,
			error: message
		};
	}
};

export const isToolKnown = (name: string): boolean => name in TIER_MAP;
