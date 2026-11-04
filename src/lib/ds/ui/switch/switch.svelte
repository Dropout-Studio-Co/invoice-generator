<script lang="ts">
	import { Switch as SwitchPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = "default",
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
		"data-[state=checked]:not-data-disabled:not-aria-invalid:bg-signal data-[state=unchecked]:not-data-disabled:not-aria-invalid:surface-control aria-invalid:bg-destructive/20 peer group/switch duration-fast ease-standard data-disabled:text-disabled-foreground data-disabled:bg-disabled-background focus-visible:bg-focus-surface! relative inline-flex shrink-0 items-center rounded-full transition-none after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-100 data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9 motion-reduce:transition-none pointer-coarse:min-h-11 pointer-coarse:min-w-11",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			"bg-background not-forced-colors:group-aria-invalid/switch:group-not-data-disabled/switch:group-not-focus-visible/switch:bg-foreground duration-fast ease-standard forced-colors:group-focus-visible/switch:bg-focus-foreground pointer-events-none block rounded-full transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-[state=checked]:translate-x-[calc(100%_-_4px)] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[calc(100%_-_4px)] group-data-[size=default]/switch:data-[state=unchecked]:translate-x-0 group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0 motion-reduce:transition-none rtl:group-data-[size=default]/switch:data-[state=checked]:translate-x-[calc(-100%_+_4px)] rtl:group-data-[size=sm]/switch:data-[state=checked]:translate-x-[calc(-100%_+_4px)] forced-colors:bg-[CanvasText]",
			""
		)}
	/>
</SwitchPrimitive.Root>
