<script lang="ts">
	import { Combobox as BitsCombobox } from "bits-ui";
	import { getContext, tick } from "svelte";
	import Check from "@lucide/svelte/icons/check";
	import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import type { ComboboxItem } from "./Combobox.svelte";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "./field-context";

	const uid = $props.id();
	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		value = $bindable<string[]>([]),
		open = $bindable(false),
		items = [],
		name,
		id,
		label,
		placeholder = "Select options…",
		filterPlaceholder = "Filter…",
		noResults = "No results",
		openLabel,
		closeLabel,
		required,
		autocomplete,
		disabled,
		class: className = "",
		contentClass = "",
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		onValueChange,
		children
	}: {
		value?: string[];
		open?: boolean;
		items?: ComboboxItem[];
		name?: string;
		id?: string;
		label?: string;
		placeholder?: string;
		filterPlaceholder?: string;
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
		onValueChange?: (value: string[]) => void;
		children?: Snippet;
	} = $props();

	const fieldProps = $derived(field?.props);
	const triggerId = $derived(id ?? fieldProps?.id ?? `multi-select-${uid}`);
	const labelId = $derived(`${triggerId}-label`);
	const contentId = $derived(`${triggerId}-content`);
	const anchorId = `multi-select-anchor-${uid}`;
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const controlDescribedby = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby));
	const controlInvalid = $derived(ariaInvalid ?? fieldProps?.["aria-invalid"]);
	const selectedLabels = $derived(
		items
			.filter(item => value.includes(item.value))
			.map(item => item.label)
			.join(", ")
	);
	const triggerLabel = $derived(
		ariaLabel ?? (open ? closeLabel : openLabel) ?? (label ? undefined : open ? "Close options" : "Open options")
	);
	let searchValue = $state("");
	const filteredItems = $derived(
		searchValue ? items.filter(item => item.label.toLowerCase().includes(searchValue.toLowerCase())) : items
	);
	const handleInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		searchValue = event.currentTarget.value;
	};
	/** The portaled filter is removed on close; do not restore focus into a detached input. */
	const handleOpenChange = (next: boolean) => {
		const restoreTrigger = !next && document.activeElement?.id === `${triggerId}-filter`;
		open = next;
		if (!next) searchValue = "";
		if (restoreTrigger)
			void tick().then(() => {
				if (
					!open &&
					(document.activeElement === document.body || document.activeElement?.id === `${triggerId}-filter`)
				)
					document.getElementById(triggerId)?.focus();
			});
	};
	let activationOpen = $state<boolean>();
	const rememberActivation = () => {
		activationOpen = open;
	};
	const reconcileActivation = () => {
		const expectedOpen = !(activationOpen ?? open);
		queueMicrotask(() => {
			if (open !== expectedOpen) open = expectedOpen;
			activationOpen = undefined;
		});
	};
	const handleItemPointerUp = (item: ComboboxItem, event: PointerEvent | TouchEvent) => {
		event.preventDefault();
		if (item.disabled) return;
		const next = value.includes(item.value)
			? value.filter(selectedValue => selectedValue !== item.value)
			: [...value, item.value];
		value = next;
		onValueChange?.(next);
	};
	const handleContentPointerUp = (event: PointerEvent | TouchEvent) => {
		if ("pointerType" in event && event.pointerType !== "touch") return;
		const itemElement = (event.target as HTMLElement).closest<HTMLElement>("[data-combobox-item]");
		const item = items.find(candidate => candidate.value === itemElement?.dataset.value);
		if (!item || item.disabled || value.includes(item.value)) return;
		event.stopPropagation();
		handleItemPointerUp(item, event);
	};
</script>

<div class={cn("flex min-w-0 flex-col gap-2", className)}>
	{#if label}<label id={labelId} for={triggerId} class="text-foreground text-label">{label}</label>{/if}
	<BitsCombobox.Root
		type="multiple"
		{items}
		bind:value={value as never}
		bind:open
		required={controlRequired}
		disabled={controlDisabled}
		onValueChange={onValueChange as never}
		onOpenChange={handleOpenChange}
	>
		<div id={anchorId}>
			<BitsCombobox.Trigger
				id={triggerId}
				onpointerdown={rememberActivation}
				onclick={reconcileActivation}
				aria-label={triggerLabel}
				aria-labelledby={ariaLabelledby}
				aria-describedby={controlDescribedby}
				data-invalid={controlInvalid ? "true" : undefined}
				class="field-control focus:surface-control-hover focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! lg:pointer-fine:text-label flex min-h-11 w-full min-w-0 items-center justify-between gap-2 text-start text-base leading-6 disabled:cursor-not-allowed motion-reduce:transition-none forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] lg:pointer-fine:leading-5"
			>
				<span class={cn("min-w-0 truncate", !selectedLabels && "text-muted-foreground")}
					>{selectedLabels || placeholder}</span
				>
				<ChevronsUpDown size={16} class="text-muted-foreground shrink-0" aria-hidden="true" />
			</BitsCombobox.Trigger>
		</div>
		<BitsCombobox.Portal>
			<BitsCombobox.Content
				id={contentId}
				aria-labelledby={label ? labelId : undefined}
				aria-label={label ? undefined : placeholder}
				customAnchor={`#${anchorId}`}
				class={cn(
					"surface-overlay rounded-control z-50 flex max-h-[min(18rem,var(--bits-combobox-content-available-height))] w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] flex-col overflow-hidden motion-reduce:transition-none",
					contentClass
				)}
			>
				<BitsCombobox.Input
					id={`${triggerId}-filter`}
					aria-controls={open ? contentId : undefined}
					placeholder={filterPlaceholder}
					{autocomplete}
					aria-label={filterPlaceholder}
					oninput={handleInput}
					class="field-control field-entry lg:pointer-fine:text-label h-11 min-h-11 w-full shrink-0 px-3 text-base"
				/>
				<div
					role="presentation"
					class="min-h-0 overflow-hidden"
					onpointerupcapture={handleContentPointerUp}
					ontouchend={handleContentPointerUp}
				>
					<BitsCombobox.Viewport
						class="max-h-[max(0px,calc(min(18rem,var(--bits-combobox-content-available-height))-2.75rem))] overflow-y-auto overscroll-contain p-1"
					>
						{#each filteredItems as item (item.value)}
							<BitsCombobox.Item
								value={item.value}
								label={item.label}
								disabled={item.disabled ?? false}
								onpointerup={(event: PointerEvent) => handleItemPointerUp(item, event)}
								ontouchend={(event: TouchEvent) => handleItemPointerUp(item, event)}
								class="text-muted-foreground data-highlighted:surface-control-hover data-highlighted:text-foreground data-selected:text-foreground data-[state=checked]:text-foreground rounded-choice text-label data-disabled:text-disabled-foreground flex min-h-11 cursor-pointer items-center justify-between gap-2 px-2.5 py-2.5 select-none data-disabled:pointer-events-none data-disabled:opacity-100"
							>
								{#snippet children({ selected })}
									<span class="min-w-0 wrap-anywhere whitespace-normal">{item.label}</span>
									{#if selected}<Check
											size={16}
											class="text-signal shrink-0"
											aria-hidden="true"
										/>{/if}
								{/snippet}
							</BitsCombobox.Item>
						{:else}
							<div class="text-muted-foreground text-label px-2.5 py-3" role="status">{noResults}</div>
						{/each}
					</BitsCombobox.Viewport>
				</div>
			</BitsCombobox.Content>
		</BitsCombobox.Portal>
	</BitsCombobox.Root>
	{#if name}
		{#each value as selectedValue (selectedValue)}
			<input type="hidden" {name} value={selectedValue} {autocomplete} />
		{/each}
	{/if}
	{#if children}{@render children()}{/if}
</div>
