<!--
	Renders one chat turn. User messages show as a plain bubble; assistant messages are parsed
	through the in-house markdown AST (no markdown library) and sanitized first. Also renders the
	streaming wave placeholder before content arrives and any AiToolBadge calls below the bubble.
-->
<script lang="ts">
	import type { AiMessage } from "$lib/stores/ai.svelte";
	import type { MdBlock, MdInline } from "$lib/ai/markdown";
	import { parseMarkdown, sanitizeAssistantText } from "$lib/ai/markdown";
	import AiToolBadge from "./AiToolBadge.svelte";
	import { cn } from "$lib/utils";

	let { message }: { message: AiMessage } = $props();

	const isUser = $derived(message.role === "user");
	const blocks = $derived<MdBlock[]>(isUser ? [] : parseMarkdown(sanitizeAssistantText(message.content)));
	const waveBars = [0, 1, 2, 3, 4];

	const timeLabel = $derived.by(() => {
		const parsed = Date.parse(message.createdAt);
		if (Number.isNaN(parsed)) return "";
		const seconds = Math.round((Date.now() - parsed) / 1000);
		if (seconds < 45) return "just now";
		const minutes = Math.round(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.round(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.round(hours / 24)}d ago`;
	});
</script>

{#snippet inline(nodes: MdInline[])}
	{#each nodes as node, i (i)}
		{#if node.type === "text"}{node.value}{:else if node.type === "bold"}<strong
				class="text-chat-text-primary font-semibold"
			>
				{node.value}
			</strong>{:else if node.type === "italic"}<em class="text-chat-text-secondary opacity-80">
				{node.value}
			</em>{:else if node.type === "code"}<code
				class="bg-chat-surface text-chat-text-primary rounded px-1 py-0.5 text-[0.85em]"
			>
				{node.value}
			</code>{:else if node.type === "link"}<a
				href={node.href}
				target="_blank"
				rel="noopener noreferrer"
				class="text-chat-text-primary decoration-chat-accent/50 hover:decoration-chat-accent font-medium underline underline-offset-2 transition-colors"
			>
				{node.label}
			</a>{/if}
	{/each}
{/snippet}

<div class={cn("mb-3 flex", isUser ? "justify-end" : "justify-start")}>
	<div
		class={cn(
			"flex max-w-[88%] min-w-0 flex-col gap-1.5",
			isUser ? "chat-message-enter-right items-end" : "chat-message-enter items-start"
		)}
	>
		{#if isUser}
			{#if message.images && message.images.length > 0}
				<div class="flex flex-wrap justify-end gap-1.5">
					{#each message.images as image, i (i)}
						<img
							src={image}
							alt="Attachment {i + 1}"
							class="border-chat-border-subtle max-h-44 rounded-2xl rounded-br-md border border-solid object-cover"
						/>
					{/each}
				</div>
			{/if}
			{#if message.content}
				<div
					class="bg-chat-user-bubble text-chat-text-primary rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed"
				>
					<span class="break-words whitespace-pre-wrap">{message.content}</span>
				</div>
			{/if}
		{:else if message.content}
			<div
				class="border-chat-border-subtle bg-chat-bot-bubble text-chat-text-secondary rounded-2xl rounded-bl-md border border-solid px-4 py-2.5 text-sm"
			>
				<div class="space-y-2.5 leading-relaxed">
					{#each blocks as block, bi (bi)}
						{#if block.type === "paragraph"}
							<p class="text-pretty">
								{#each block.lines as line, li (li)}
									{#if li > 0}<br />{/if}{@render inline(line)}
								{/each}
							</p>
						{:else if block.type === "heading"}
							<p class="text-chat-text-primary text-label font-semibold text-balance">
								{@render inline(block.nodes)}
							</p>
						{:else if block.type === "list"}
							<ul class="space-y-1">
								{#each block.items as item, ii (ii)}
									<li class="flex gap-2">
										<span class="text-chat-text-muted shrink-0 tabular-nums select-none">
											{block.ordered ? `${ii + 1}.` : "•"}
										</span>
										<span class="min-w-0 text-pretty">{@render inline(item)}</span>
									</li>
								{/each}
							</ul>
						{:else if block.type === "codeblock"}
							<p class="text-pretty whitespace-pre-wrap">{block.value}</p>
						{/if}
					{/each}
				</div>
			</div>
		{:else if message.streaming}
			<div
				class="bg-chat-bot-bubble border-chat-border-subtle flex items-end gap-[3px] rounded-2xl rounded-bl-md border border-solid px-4 py-3"
				role="status"
				aria-label="Generating response"
			>
				{#each waveBars as bar (bar)}
					<span
						class="chat-gen-bar bg-chat-text-secondary/40 h-[18px] w-0.5 rounded-[1px]"
						style="animation-delay: {bar * 0.12}s"
						aria-hidden="true"
					></span>
				{/each}
				<span class="sr-only">Generating response…</span>
			</div>
		{/if}

		{#if message.toolCalls.length > 0}
			<div class="flex w-full flex-col gap-1.5">
				{#each message.toolCalls as call (call.id)}
					<AiToolBadge {call} />
				{/each}
			</div>
		{/if}

		{#if (message.content || (message.images && message.images.length > 0)) && timeLabel}
			<span class="text-chat-text-muted text-micro px-1 tabular-nums">{timeLabel}</span>
		{/if}
	</div>
</div>
