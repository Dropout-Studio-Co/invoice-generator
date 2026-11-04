<script lang="ts">
	import { PinInput as InputOTPPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let { ref = $bindable(null), cell, class: className, ...restProps }: InputOTPPrimitive.CellProps = $props();
</script>

<InputOTPPrimitive.Cell
	{cell}
	bind:ref
	data-slot="input-otp-slot"
	class={cn(
		"surface-control data-[active=true]:bg-focus-surface data-[active=true]:text-focus-foreground aria-invalid:bg-destructive/20 text-label duration-fast ease-standard first:rounded-s-control last:rounded-e-control disabled:bg-disabled-background disabled:text-disabled-foreground relative flex size-10 items-center justify-center transition-colors data-[active=true]:z-10 motion-reduce:transition-none",
		className
	)}
	{...restProps}
>
	{cell.char}
	{#if cell.hasFakeCaret}
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="animate-caret-blink bg-foreground h-4 w-px duration-1000"></div>
		</div>
	{/if}
</InputOTPPrimitive.Cell>
