<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let { ref = $bindable(null), class: className, ...restProps }: CommandPrimitive.LinkItemProps = $props();
</script>

<CommandPrimitive.LinkItem
	bind:ref
	data-slot="command-item"
	class={cn(
		"data-selected:surface-control-hover data-selected:text-foreground focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! data-selected:*:[svg]:text-foreground group/command-item rounded-choice text-label data-[disabled=true]:text-disabled-foreground relative flex min-h-10 cursor-default items-center gap-2 px-2 py-1.5 select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-100 pointer-coarse:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
/>
