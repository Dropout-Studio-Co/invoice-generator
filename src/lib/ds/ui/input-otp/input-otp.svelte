<script lang="ts">
	import { PinInput as InputOTPPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		...restProps
	}: InputOTPPrimitive.RootProps = $props();
</script>

<InputOTPPrimitive.Root
	bind:ref
	bind:value
	data-slot="input-otp"
	spellcheck={false}
	class={cn(
		"has-disabled:text-disabled-foreground flex items-center gap-2 has-disabled:opacity-100 data-disabled:cursor-not-allowed motion-reduce:transition-none",
		className
	)}
	{...restProps}
/>
