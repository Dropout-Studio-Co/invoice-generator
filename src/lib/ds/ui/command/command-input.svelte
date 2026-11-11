<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import * as InputGroup from "../input-group/index.js";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		...restProps
	}: CommandPrimitive.InputProps = $props();
</script>

<div data-slot="command-input-wrapper" class="p-1 pb-0">
	<InputGroup.Root class="rounded-control! h-10! *:data-[slot=input-group-addon]:pl-2!">
		<CommandPrimitive.Input
			{value}
			class={cn(
				"text-label disabled:text-disabled-foreground w-full disabled:cursor-not-allowed disabled:opacity-100",
				className
			)}
			{...restProps}
		>
			{#snippet child({ props })}
				<InputGroup.Input {...props} bind:value bind:ref />
			{/snippet}
		</CommandPrimitive.Input>
		<InputGroup.Addon>
			<SearchIcon class="text-muted-foreground size-4 shrink-0" />
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
