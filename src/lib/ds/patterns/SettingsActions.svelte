<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	/**
	 * The one in-section Settings save-footer language. Pure layout — it owns the
	 * rule: status and actions remain beside each other while their content fits,
	 * then wrap within the section. Buttons grow to fill a narrow action row.
	 * Unlike the sticky `SettingsSaveBar`, this footer lives inside its section.
	 * `children` is the button(s), typically a `Cta`.
	 * Pass `status` for the optional left-side hint (Saving… / Saved / unsaved note).
	 */
	let {
		status = undefined,
		class: className = "",
		children
	}: {
		status?: Snippet;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={cn("flex flex-wrap items-center gap-3 pt-5", status ? "justify-between" : "justify-end", className)}>
	{#if status}
		<div
			class="text-muted-foreground text-caption flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-2 text-pretty wrap-anywhere"
		>
			{@render status()}
		</div>
	{/if}
	<div class="ms-auto flex max-w-full min-w-0 flex-wrap gap-2 [&>*]:flex-1 [&>*]:justify-center">
		{@render children()}
	</div>
</div>
