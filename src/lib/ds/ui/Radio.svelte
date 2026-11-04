<script lang="ts" generics="T extends string | number">
	import { getContext } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import { helperBase } from "../styles/recipes";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "./field-context";

	const uid = $props.id();
	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		group = $bindable(),
		value,
		label,
		description,
		id,
		required,
		disabled,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		class: className,
		...rest
	}: Omit<HTMLInputAttributes, "type" | "value"> & {
		group?: T;
		value: T;
		label: string;
		description?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		"aria-describedby"?: string;
		"aria-invalid"?: boolean | "true" | "false";
		class?: string;
	} = $props();

	const fieldProps = $derived(field?.props);
	const radioId = $derived(id ?? fieldProps?.id ?? `radio-${uid}`);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const descriptionId = $derived(description ? `${radioId}-description` : undefined);
	const describedBy = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby, descriptionId));
	const invalid = $derived(ariaInvalid === true || ariaInvalid === "true" || fieldProps?.["aria-invalid"] === "true");
	const inputClass =
		"peer absolute inset-0 z-10 size-11 cursor-pointer appearance-none rounded-full opacity-0 focus-visible:outline-none disabled:cursor-not-allowed";
	const indicatorClass =
		"pointer-events-none flex size-5 items-center justify-center rounded-full motion-safe:transition-colors motion-safe:duration-fast motion-safe:ease-standard peer-focus-visible:bg-focus-surface! peer-focus-visible:text-focus-foreground! peer-disabled:bg-disabled-background peer-disabled:text-disabled-foreground peer-active:opacity-80";
	const indicatorClassFor = (selected: boolean) =>
		cn(
			indicatorClass,
			invalid
				? "bg-destructive/20 text-destructive"
				: selected
					? "bg-signal text-background"
					: "surface-control text-transparent peer-hover:surface-control-hover"
		);
</script>

<label class={cn("flex min-h-11 items-start", className)} for={radioId}>
	<span class="relative flex size-11 shrink-0 items-center justify-center">
		<input
			{...rest}
			id={radioId}
			type="radio"
			bind:group
			{value}
			required={controlRequired}
			disabled={controlDisabled}
			aria-describedby={describedBy}
			data-invalid={invalid ? "true" : undefined}
			data-state={group === value ? "checked" : "unchecked"}
			class={inputClass}
		/>
		<span class={indicatorClassFor(group === value)} aria-hidden="true">
			{#if group === value}<span class="size-2 rounded-full bg-current"></span>{/if}
		</span>
	</span>
	<span class="text-label text-foreground flex min-h-11 flex-1 flex-col gap-1 ps-3">
		<span>{label}</span>{#if description}<span id={descriptionId} class={cn(helperBase, "text-muted-foreground")}
				>{description}</span
			>{/if}
	</span>
</label>
