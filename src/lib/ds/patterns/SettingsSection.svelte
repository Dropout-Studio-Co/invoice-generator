<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import { helperBase } from "../styles/recipes";
	import Heading from "../signature/Heading.svelte";

	/**
	 * One canonical Settings section card — a contextual raised surface with a
	 * header (optional icon chip + title + muted subtitle) and a padded body.
	 * Shared across every product's Settings page so sections line up identically.
	 * Pass `header` for trailing header content (e.g. a status pill).
	 * The title and trailing header wrap against their allocated space, including
	 * narrow desktop panels and enlarged or localized text.
	 */
	let {
		title,
		subtitle = undefined,
		icon = undefined,
		header = undefined,
		class: className = "",
		children,
		...restProps
	}: {
		title: string;
		subtitle?: string;
		icon?: Component<{ class?: string; size?: number }>;
		header?: Snippet;
		class?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement> = $props();

	const Icon = $derived(icon);
</script>

<section class={cn("surface-context overflow-hidden rounded-lg", className)} {...restProps}>
	<header class="surface-2 flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
		{#if Icon}
			<span
				class="surface-control text-muted-foreground rounded-control flex size-8 shrink-0 items-center justify-center lg:size-7"
			>
				<Icon class="size-4 lg:size-3.5" />
			</span>
		{/if}
		<div class="flex min-w-0 flex-1 basis-48 flex-col gap-1 wrap-anywhere">
			<Heading as="h2" size="title-sm" class="lg:text-subtitle whitespace-normal">{title}</Heading>
			{#if subtitle}
				<span class={cn(helperBase, "text-muted-foreground")}>{subtitle}</span>
			{/if}
		</div>
		{#if header}
			<div class="ms-auto max-w-full min-w-0 wrap-anywhere">{@render header()}</div>
		{/if}
	</header>
	<div class="flex flex-col gap-6 px-5 py-6 sm:px-6">
		{@render children()}
	</div>
</section>
