/**
 * Server-side driver for one chat turn: builds the OpenAI Chat Completions
 * request (system + windowed history + multimodal user content), runs it on the
 * USER's own Cloudflare account via the Workers AI REST API (BYO — billed to the
 * user, not the owner's bound `env.AI`), and yields parsed `Frame`s while
 * accumulating the final `RawChatResult` (full text, tool calls, token usage).
 *
 * The REST call is BUFFERED (not streamed): the whole turn returns at once, then
 * the text + tool_call frames are yielded together. The chat endpoint already
 * consumes this generator in buffered mode (`streamText: false` on the first turn),
 * so the SSE wire contract the browser client reads is unchanged.
 *
 * Runs on the Worker, not the browser. @see ./types.ts, $lib/server/ai/run-rest.ts.
 */

import type { Frame, ParsedToolCall, ToolCatalogEntry } from "./types";
import { runChatViaRest, CfInferenceError, type CloudflareCreds } from "$lib/server/ai/run-rest";

export interface RunChatParams {
	systemContext: string;
	history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
	userMessage: string;
	conversationId: string;
	tools: ToolCatalogEntry[];
	images?: string[];
	maxTokens?: number;
	cacheKey?: string;
	/** User's account-scoped creds + the picked model — inference runs here. */
	creds: CloudflareCreds;
	model: string;
}

export interface RawChatResult {
	text: string;
	toolCalls: ParsedToolCall[];
	inputTokens: number;
	outputTokens: number;
	servedModel?: string;
}

type ContentPart =
	{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

const buildToolsPayload = (tools: ToolCatalogEntry[]) =>
	tools.map((t) => ({
		type: "function",
		function: {
			name: t.name,
			description: t.description,
			parameters: t.parameters
		}
	}));

/** Plain string when no images; otherwise a multimodal content-part array (text + image_url). */
const buildUserContent = (text: string, images?: string[]): string | ContentPart[] => {
	if (!images || images.length === 0) return text;
	return [
		{ type: "text", text },
		...images.map((url): ContentPart => ({ type: "image_url", image_url: { url } }))
	];
};

/** Coerces a REST tool-call `arguments` (object or JSON string) to a plain value; `{}` on failure. */
const parseToolArgs = (raw: unknown): unknown => {
	if (raw == null) return {};
	if (typeof raw === "object") return raw;
	if (typeof raw === "string") {
		if (raw.trim().length === 0) return {};
		try {
			return JSON.parse(raw);
		} catch {
			return {};
		}
	}
	return {};
};

/**
 * Yields `text`/`tool_call`/`error` frames for the turn and RETURNS the accumulated
 * RawChatResult as the generator's return value (consume via the for-await done value).
 *
 * Protocol notes (unchanged from the streaming era so the consumer is untouched):
 * - Defaults: temperature 0.2, max_tokens 1536, thinking disabled.
 * - `tools` are only attached when non-empty (omitting them changes model behavior).
 * - Tool-call frames are emitted AFTER any text frame (args are already complete here).
 * - Malformed argument JSON degrades to `{}` rather than throwing.
 * - A REST failure (CfInferenceError or otherwise) surfaces as a single `error` frame,
 *   then the partial result is returned. The endpoint maps it to a user-facing frame.
 */
export const runChatFrames = async function* (
	params: RunChatParams
): AsyncGenerator<Frame, RawChatResult> {
	const messages: Array<Record<string, unknown>> = [
		{ role: "system", content: params.systemContext },
		...params.history.map((m) => ({ role: m.role, content: m.content })),
		{ role: "user", content: buildUserContent(params.userMessage, params.images) }
	];

	const result: RawChatResult = {
		text: "",
		toolCalls: [],
		inputTokens: 0,
		outputTokens: 0,
		servedModel: params.model
	};

	let out;
	try {
		out = await runChatViaRest(params.creds, params.model, {
			messages,
			tools: params.tools.length > 0 ? buildToolsPayload(params.tools) : undefined,
			max_tokens: params.maxTokens ?? 1536,
			temperature: 0.2
		});
	} catch (err) {
		const message =
			err instanceof CfInferenceError
				? `Workers AI error (${err.status || "network"})`
				: err instanceof Error
					? err.message
					: "Model invocation failed";
		yield { t: "error", message };
		return result;
	}

	result.inputTokens = out.usage?.prompt_tokens ?? 0;
	result.outputTokens = out.usage?.completion_tokens ?? 0;

	if (typeof out.response === "string" && out.response.length > 0) {
		result.text = out.response;
		yield { t: "text", delta: out.response };
	}

	for (const tc of out.tool_calls ?? []) {
		const name = typeof tc.name === "string" ? tc.name : "";
		if (name.length === 0) continue;
		const call: ParsedToolCall = {
			id: crypto.randomUUID(),
			name,
			args: parseToolArgs(tc.arguments)
		};
		result.toolCalls.push(call);
		yield { t: "tool_call", id: call.id, name: call.name, args: call.args };
	}

	return result;
};
