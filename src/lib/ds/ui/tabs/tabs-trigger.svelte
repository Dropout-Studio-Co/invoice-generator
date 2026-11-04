<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"text-muted-foreground hover:text-foreground focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! dark:text-muted-foreground dark:hover:text-foreground rounded-choice text-label motion-safe:duration-fast motion-safe:ease-standard disabled:text-disabled-foreground relative z-[1] inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 px-1.5 py-0.5 font-medium whitespace-nowrap group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start disabled:pointer-events-none disabled:opacity-100 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 motion-safe:transition-[background-color,color] pointer-coarse:min-h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		"group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:text-background group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
		className
	)}
	{...restProps}
/>
