<script lang="ts">
	import { getContext, type Snippet } from "svelte";
	import { ChevronDown } from "@lucide/svelte";
	import type { HTMLSelectAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import { selectBase } from "../styles/recipes";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "./field-context";

	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		value = $bindable(),
		id,
		required,
		disabled,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		"aria-required": ariaRequired,
		class: className = "",
		children,
		...rest
	}: Omit<HTMLSelectAttributes, "children" | "value" | "id" | "required" | "disabled"> & {
		value?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		"aria-describedby"?: string;
		"aria-invalid"?: boolean | "true" | "false";
		"aria-required"?: boolean | "true" | "false";
		class?: string;
		children: Snippet;
	} = $props();

	const fieldProps = $derived(field?.props);
	const controlId = $derived(id ?? fieldProps?.id);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const controlDescribedby = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby));
	const controlInvalid = $derived(ariaInvalid ?? fieldProps?.["aria-invalid"]);
	const controlRequiredLabel = $derived(ariaRequired ?? fieldProps?.["aria-required"]);
</script>

<div class="relative w-full">
	<select
		{...rest}
		bind:value
		id={controlId}
		required={controlRequired}
		disabled={controlDisabled}
		aria-describedby={controlDescribedby}
		aria-invalid={controlInvalid}
		aria-required={controlRequiredLabel}
		class={cn(
			selectBase,
			"appearance-none pe-10 forced-colors:appearance-auto forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
			className
		)}
	>
		{@render children()}
	</select>
	<ChevronDown
		aria-hidden="true"
		class="text-muted-foreground pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
	/>
</div>
