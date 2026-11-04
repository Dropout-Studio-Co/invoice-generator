<script lang="ts">
	import { setContext, type Snippet } from "svelte";
	import { cn } from "../utils";
	import { helperBase, labelBase } from "../styles/recipes";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldControlProps, type FieldContext } from "./field-context";

	const uid = $props.id();
	let {
		label,
		id,
		htmlFor,
		description,
		error,
		required = false,
		disabled = false,
		class: className = "",
		control,
		children,
		"aria-describedby": externalDescribedBy,
		"aria-invalid": externalAriaInvalid
	}: {
		label: string;
		id?: string;
		htmlFor?: string;
		description?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		control?: Snippet<[FieldControlProps]>;
		children?: Snippet<[FieldControlProps]>;
		"aria-describedby"?: string;
		"aria-invalid"?: boolean | "true" | "false";
	} = $props();

	const controlId = $derived(id ?? htmlFor ?? `field-${uid}`);
	const descriptionId = $derived(description ? `${controlId}-description` : undefined);
	const errorId = $derived(error ? `${controlId}-error` : undefined);
	const invalid = $derived(Boolean(error) || externalAriaInvalid === true || externalAriaInvalid === "true");
	const describedBy = $derived(mergeDescribedBy(externalDescribedBy, descriptionId, errorId));
	const controlProps = $derived<FieldControlProps>({
		id: controlId,
		"aria-describedby": describedBy,
		"aria-invalid": invalid ? "true" : undefined,
		"aria-required": required ? "true" : undefined,
		required,
		disabled
	});

	const fieldContext: FieldContext = {
		get props() {
			return controlProps;
		}
	};

	setContext(FIELD_CONTEXT, fieldContext);
</script>

<div
	class={cn("flex flex-col gap-2", className)}
	data-invalid={invalid ? "true" : undefined}
	data-disabled={disabled ? "true" : undefined}
>
	<label for={controlId} class={cn(labelBase, "mb-0", disabled ? "text-disabled-foreground" : "text-foreground")}
		>{label}{#if required}<span aria-hidden="true"> *</span>{/if}</label
	>
	{#if control}
		{@render control(controlProps)}
	{:else if children}
		{@render children(controlProps)}
	{/if}
	{#if description}<p id={descriptionId} class={helperBase}>{description}</p>{/if}
	{#if error}<p id={errorId} class="text-caption text-destructive" aria-live="polite">{error}</p>{/if}
</div>
