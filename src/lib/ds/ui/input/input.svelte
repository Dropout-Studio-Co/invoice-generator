<script lang="ts">
	import { getContext } from "svelte";
	import { cn, type WithElementRef } from "../../utils";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "../field-context";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;
	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		id,
		required,
		disabled,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		"aria-required": ariaRequired,
		class: className,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();

	const fieldProps = $derived(field?.props);
	const controlId = $derived(id ?? fieldProps?.id);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const controlDescribedby = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby));
	const controlInvalid = $derived(ariaInvalid ?? fieldProps?.["aria-invalid"]);
	const controlRequiredLabel = $derived(ariaRequired ?? fieldProps?.["aria-required"]);
	const inputClass = $derived(
		cn(
			"field-control placeholder:text-muted-foreground focus:surface-control-hover focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! aria-invalid:bg-destructive/20 aria-invalid:placeholder:text-foreground lg:pointer-fine:text-label file:text-foreground focus-visible:file:text-focus-foreground w-full min-w-0 text-base leading-6 file:bg-transparent file:font-medium disabled:cursor-not-allowed forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] motion-reduce:transition-none lg:pointer-fine:leading-5",
			className
		)
	);
</script>

{#if type === "file"}
	<input
		{...restProps}
		bind:this={ref}
		data-slot={dataSlot}
		class={inputClass}
		type="file"
		bind:files
		bind:value
		id={controlId}
		required={controlRequired}
		disabled={controlDisabled}
		aria-describedby={controlDescribedby}
		aria-invalid={controlInvalid}
		aria-required={controlRequiredLabel}
	/>
{:else}
	<input
		{...restProps}
		bind:this={ref}
		data-slot={dataSlot}
		class={inputClass}
		{type}
		bind:value
		id={controlId}
		required={controlRequired}
		disabled={controlDisabled}
		aria-describedby={controlDescribedby}
		aria-invalid={controlInvalid}
		aria-required={controlRequiredLabel}
	/>
{/if}
