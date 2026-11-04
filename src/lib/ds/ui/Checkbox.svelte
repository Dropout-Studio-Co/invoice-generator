<script lang="ts">
	import { getContext } from "svelte";
	import Check from "@lucide/svelte/icons/check";
	import Minus from "@lucide/svelte/icons/minus";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import { helperBase } from "../styles/recipes";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "./field-context";

	/**
	 * The canonical checkbox: one native control with a branded indicator, native
	 * form submission, and a 44px target for pointer and keyboard interaction.
	 */
	const uid = $props.id();
	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		label,
		description,
		class: className = "",
		id,
		value,
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		required,
		disabled,
		readonly = false,
		onclick,
		...rest
	}: Omit<HTMLInputAttributes, "type" | "checked" | "value" | "required" | "disabled" | "readonly"> & {
		checked?: boolean;
		indeterminate?: boolean;
		required?: boolean | null;
		disabled?: boolean | null;
		readonly?: boolean | null;
		label?: string;
		description?: string;
		class?: string;
		value?: string | number | boolean;
	} = $props();

	const fieldProps = $derived(field?.props);
	const checkboxId = $derived(id ?? fieldProps?.id ?? `checkbox-${uid}`);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const descriptionId = $derived(description ? `${checkboxId}-description` : undefined);
	const describedBy = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby, descriptionId));
	const invalid = $derived(ariaInvalid === true || ariaInvalid === "true" || fieldProps?.["aria-invalid"] === "true");
	const inputClass =
		"peer absolute inset-0 z-10 size-11 cursor-pointer appearance-none rounded-control opacity-0 focus-visible:outline-none disabled:cursor-not-allowed";
	const indicatorClass =
		"pointer-events-none flex size-5 items-center justify-center rounded-choice bg-(--ds-control-background) motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-standard peer-focus-visible:bg-focus-surface! peer-focus-visible:text-focus-foreground! peer-disabled:text-disabled-foreground peer-disabled:bg-disabled-background peer-active:opacity-80";
	const indicatorClassFor = (isChecked: boolean, isIndeterminate: boolean) =>
		cn(
			indicatorClass,
			invalid
				? "bg-destructive/20 text-destructive"
				: isChecked || isIndeterminate
					? "bg-signal text-background"
					: "text-transparent peer-hover:surface-control-hover"
		);
	const handleClick: NonNullable<HTMLInputAttributes["onclick"]> = event => {
		if (readonly) event.preventDefault();
		onclick?.(event);
	};
</script>

{#snippet checkboxInput()}
	<span class={cn("relative flex size-11 shrink-0 items-center justify-center", label ? "" : className)}>
		<input
			{...rest}
			bind:checked
			bind:indeterminate
			id={checkboxId}
			type="checkbox"
			value={value == null ? undefined : String(value)}
			required={controlRequired}
			disabled={controlDisabled}
			aria-label={ariaLabel ?? (!ariaLabelledby ? label : undefined)}
			aria-labelledby={ariaLabelledby}
			aria-describedby={describedBy}
			aria-invalid={ariaInvalid ?? (invalid ? "true" : undefined)}
			aria-checked={indeterminate ? "mixed" : checked}
			aria-required={controlRequired ? "true" : undefined}
			aria-readonly={readonly ? "true" : undefined}
			data-state={indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"}
			data-readonly={readonly ? "" : undefined}
			onclick={handleClick}
			class={inputClass}
		/>
		<span class={indicatorClassFor(checked, indeterminate)} aria-hidden="true">
			{#if indeterminate}<Minus size={13} strokeWidth={2.5} />{:else if checked}<Check
					size={13}
					strokeWidth={2.5}
				/>{/if}
		</span>
	</span>
{/snippet}

{#if label}
	<div class={cn("flex min-h-11 items-start", className)}>
		{@render checkboxInput()}
		<label
			for={checkboxId}
			class="text-label text-foreground flex min-h-11 flex-1 cursor-pointer flex-col gap-1 ps-3"
		>
			<span>{label}</span>
			{#if description}<span id={descriptionId} class={cn(helperBase, "text-muted-foreground")}
					>{description}</span
				>{/if}
		</label>
	</div>
{:else}{@render checkboxInput()}{/if}
