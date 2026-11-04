<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	export type CommandRootApi = CommandPrimitive.Root;

	let {
		api = $bindable(null),
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: CommandPrimitive.RootProps & {
		api?: CommandRootApi | null;
	} = $props();
</script>

<CommandPrimitive.Root
	bind:this={api}
	bind:value
	bind:ref
	data-slot="command"
	class={cn(
		"surface-overlay text-popover-foreground flex size-full flex-col overflow-hidden rounded-lg p-1",
		className
	)}
	{...restProps}
/>
