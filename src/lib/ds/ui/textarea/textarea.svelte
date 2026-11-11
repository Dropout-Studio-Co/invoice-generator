<script lang="ts">
	import { getContext } from "svelte";
	import { cn, type WithElementRef, type WithoutChildren } from "../../utils";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "../field-context";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		ref = $bindable(null),
		value = $bindable(),
		id,
		required,
		disabled,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		"aria-required": ariaRequired,
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();

	const fieldProps = $derived(field?.props);
	const controlId = $derived(id ?? fieldProps?.id);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const controlDescribedby = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby));
	const controlInvalid = $derived(ariaInvalid ?? fieldProps?.["aria-invalid"]);
	const controlRequiredLabel = $derived(ariaRequired ?? fieldProps?.["aria-required"]);
</script>

<textarea
	{...restProps}
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"field-control placeholder:text-muted-foreground field-entry aria-invalid:bg-destructive/20 aria-invalid:placeholder:text-foreground lg:pointer-fine:text-label min-h-28 w-full min-w-0 resize-y text-base leading-6 disabled:cursor-not-allowed motion-reduce:transition-none lg:pointer-fine:leading-5",
		className
	)}
	bind:value
	id={controlId}
	required={controlRequired}
	disabled={controlDisabled}
	aria-describedby={controlDescribedby}
	aria-invalid={controlInvalid}
	aria-required={controlRequiredLabel}></textarea>
