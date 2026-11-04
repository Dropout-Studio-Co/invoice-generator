<script lang="ts">
	import { Combobox as BitsCombobox } from "bits-ui";
	import { getContext } from "svelte";
	import Check from "@lucide/svelte/icons/check";
	import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "./field-context";

	export type ComboboxItem = { value: string; label: string; disabled?: boolean };

	const uid = $props.id();
	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		value = $bindable<string | undefined>(),
		open = $bindable(false),
		items = [],
		name,
		id,
		label,
		placeholder = "Search…",
		noResults = "No results",
		openLabel = "Open suggestions",
		closeLabel = "Close suggestions",
		required,
		autocomplete,
		disabled,
		class: className = "",
		contentClass = "",
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		"aria-required": ariaRequired,
		onValueChange,
		children
	}: {
		value?: string;
		open?: boolean;
		items?: ComboboxItem[];
		name?: string;
		id?: string;
		label?: string;
		placeholder?: string;
		noResults?: string;
		openLabel?: string;
		closeLabel?: string;
		required?: boolean;
		autocomplete?: HTMLInputAttributes["autocomplete"];
		disabled?: boolean;
		class?: string;
		contentClass?: string;
		"aria-label"?: string;
		"aria-labelledby"?: string;
		"aria-describedby"?: string;
		"aria-invalid"?: boolean | "true" | "false";
		"aria-required"?: boolean | "true" | "false";
		onValueChange?: (value: string | undefined) => void;
		children?: Snippet;
	} = $props();

	const fieldProps = $derived(field?.props);
	const inputId = $derived(id ?? fieldProps?.id ?? `combobox-${uid}`);
	const labelId = $derived(`${inputId}-label`);
	const contentId = $derived(`${inputId}-content`);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const controlDescribedby = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby));
	const controlInvalid = $derived(ariaInvalid ?? fieldProps?.["aria-invalid"]);
	const controlRequiredLabel = $derived(ariaRequired ?? fieldProps?.["aria-required"]);
	let searchValue = $state("");
	const filteredItems = $derived(
		searchValue ? items.filter(item => item.label.toLowerCase().includes(searchValue.toLowerCase())) : items
	);
	const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		searchValue = event.currentTarget.value;
	};
	const handleOpenChange = (next: boolean) => {
		open = next;
		if (!next) searchValue = "";
	};
</script>

<div class={cn("flex min-w-0 flex-col gap-2", className)}>
	{#if label}<label id={labelId} for={inputId} class="text-foreground text-label">{label}</label>{/if}
	<BitsCombobox.Root
		type="single"
		{items}
		bind:value={value as never}
		bind:open
		required={controlRequired}
		disabled={controlDisabled}
		onValueChange={onValueChange as never}
		onOpenChange={handleOpenChange}
	>
		<div class="relative">
			<BitsCombobox.Input
				id={inputId}
				aria-controls={open ? contentId : undefined}
				{placeholder}
				{autocomplete}
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledby ?? (label ? labelId : undefined)}
				aria-describedby={controlDescribedby}
				aria-invalid={controlInvalid}
				aria-required={controlRequiredLabel}
				disabled={controlDisabled}
				oninput={handleInput}
				class="field-control placeholder:text-muted-foreground focus:surface-control-hover focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! lg:pointer-fine:text-label w-full pe-10 text-base leading-6 motion-reduce:transition-none forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] lg:pointer-fine:leading-5"
			/>
			<BitsCombobox.Trigger
				aria-label={open ? closeLabel : openLabel}
				class="text-muted-foreground absolute inset-y-0 end-0 inline-flex min-h-11 w-11 items-center justify-center"
			>
				<ChevronsUpDown size={16} aria-hidden="true" />
			</BitsCombobox.Trigger>
		</div>
		<BitsCombobox.Portal>
			<BitsCombobox.Content
				id={contentId}
				aria-labelledby={label ? labelId : undefined}
				aria-label={label ? undefined : placeholder}
				class={cn(
					"surface-overlay rounded-control z-50 max-h-[min(18rem,var(--bits-combobox-content-available-height))] w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] overflow-hidden motion-reduce:transition-none",
					contentClass
				)}
			>
				<BitsCombobox.Viewport class="max-h-[inherit] overflow-y-auto overscroll-contain p-1">
					{#each filteredItems as item (item.value)}
						<BitsCombobox.Item
							value={item.value}
							label={item.label}
							disabled={item.disabled ?? false}
							class="text-muted-foreground data-highlighted:surface-control-hover data-highlighted:text-foreground data-selected:text-foreground data-[state=checked]:text-foreground rounded-choice text-label data-disabled:text-disabled-foreground flex min-h-11 cursor-pointer items-center justify-between gap-2 px-2.5 py-2.5 select-none data-disabled:pointer-events-none data-disabled:opacity-100"
						>
							{#snippet children({ selected })}
								<span class="min-w-0 wrap-anywhere whitespace-normal">{item.label}</span>
								{#if selected}<Check size={16} class="text-signal shrink-0" aria-hidden="true" />{/if}
							{/snippet}
						</BitsCombobox.Item>
					{:else}
						<div class="text-muted-foreground text-label px-2.5 py-3" role="status">{noResults}</div>
					{/each}
				</BitsCombobox.Viewport>
			</BitsCombobox.Content>
		</BitsCombobox.Portal>
	</BitsCombobox.Root>
	{#if name}<input type="hidden" {name} value={value ?? ""} {autocomplete} />{/if}
	{#if children}{@render children()}{/if}
</div>
