<script lang="ts">
	import { Select } from "bits-ui";
	import { getContext, onMount, type Snippet } from "svelte";
	import Check from "@lucide/svelte/icons/check";
	import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
	import type { HTMLSelectAttributes } from "svelte/elements";
	import { cn } from "../utils";
	import { selectBase } from "../styles/recipes";
	import { FIELD_CONTEXT, mergeDescribedBy, type FieldContext } from "./field-context";

	/**
	 * A progressive-enhancement select. Native HTML owns SSR, no-JS behavior, and
	 * form submission. Bits UI is mounted after hydration and takes over the
	 * public id, keyboard interaction, and visual presentation.
	 */
	export type SelectItem = { value: string; label: string; disabled?: boolean };

	const uid = $props.id();
	const field = getContext<FieldContext | undefined>(FIELD_CONTEXT);
	let {
		value = $bindable(),
		open = $bindable(false),
		items,
		children,
		name,
		form,
		id,
		portalTarget,
		contentLayer,
		required,
		autocomplete,
		placeholder = "Select…",
		disabled,
		class: className = "",
		contentClass = "",
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledby,
		"aria-describedby": ariaDescribedby,
		"aria-invalid": ariaInvalid,
		"aria-required": ariaRequired,
		onchange,
		onValueChange
	}: {
		value?: string;
		open?: boolean;
		items?: SelectItem[];
		children?: Snippet;
		name?: string;
		form?: string;
		id?: string;
		portalTarget?: string;
		contentLayer?: string;
		required?: boolean;
		autocomplete?: HTMLSelectAttributes["autocomplete"];
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		contentClass?: string;
		"aria-label"?: string;
		"aria-labelledby"?: string;
		"aria-describedby"?: string;
		"aria-invalid"?: boolean | "true" | "false";
		"aria-required"?: boolean | "true" | "false";
		onchange?: HTMLSelectAttributes["onchange"];
		onValueChange?: (value: string) => void;
	} = $props();

	const fieldProps = $derived(field?.props);
	const publicId = $derived(id ?? fieldProps?.id ?? `select-${uid}`);
	const controlRequired = $derived(required ?? fieldProps?.required ?? false);
	const controlDisabled = $derived(disabled ?? fieldProps?.disabled ?? false);
	const controlDescribedby = $derived(mergeDescribedBy(fieldProps?.["aria-describedby"], ariaDescribedby));
	const controlInvalid = $derived(ariaInvalid ?? fieldProps?.["aria-invalid"]);
	const controlRequiredLabel = $derived(ariaRequired ?? fieldProps?.["aria-required"]);
	const nativeId = $derived(`${publicId}-native`);

	let nativeSelect = $state<HTMLSelectElement>();
	let enhanced = $state(false);
	let nativeItems = $state<SelectItem[]>([]);
	const resolvedItems = $derived(items ?? nativeItems);
	const selectedLabel = $derived(resolvedItems.find(item => item.value === value)?.label ?? "");
	const triggerLabel = $derived(ariaLabel ? `${ariaLabel}: ${selectedLabel || placeholder}` : undefined);

	const syncNativeItems = () => {
		if (!nativeSelect) return;
		nativeItems = [...nativeSelect.options]
			.filter(option => option.value !== "")
			.map(option => ({
				value: option.value,
				label: option.textContent ?? "",
				disabled: option.disabled
			}));
	};

	const handleNativeChange = (event: Event & { currentTarget: HTMLSelectElement }) => {
		value = event.currentTarget.value;
		onchange?.(event);
		onValueChange?.(value);
	};

	const changeValue = (next: string) => {
		value = next;
		if (!nativeSelect) return;
		nativeSelect.value = next;
		nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
	};
	const handleItemPointerUp = (item: SelectItem, event: PointerEvent | TouchEvent) => {
		event.preventDefault();
		if (!item.disabled && value !== item.value) changeValue(item.value);
		open = false;
	};
	const handleContentPointerUp = (event: PointerEvent | TouchEvent) => {
		if ("pointerType" in event && event.pointerType !== "touch") return;
		const itemElement = (event.target as HTMLElement).closest<HTMLElement>("[data-value]");
		const item = items?.find(candidate => candidate.value === itemElement?.dataset.value);
		if (!item) return;
		event.stopPropagation();
		handleItemPointerUp(item, event);
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

	onMount(() => {
		syncNativeItems();
		enhanced = true;
		if (!children || !nativeSelect) return;
		const observer = new MutationObserver(syncNativeItems);
		observer.observe(nativeSelect, { childList: true, subtree: true, characterData: true, attributes: true });
		return () => observer.disconnect();
	});
</script>

{#if enhanced}
	<Select.Root
		type="single"
		bind:value={value as never}
		bind:open
		disabled={controlDisabled}
		items={resolvedItems}
		onValueChange={changeValue as never}
	>
		<Select.Trigger
			id={publicId}
			onpointerdown={rememberActivation}
			onclick={reconcileActivation}
			aria-label={triggerLabel}
			aria-labelledby={ariaLabelledby}
			aria-describedby={controlDescribedby}
			aria-invalid={controlInvalid}
			class={cn(
				selectBase,
				"data-[placeholder]:text-muted-foreground disabled:text-disabled-foreground disabled:bg-disabled-background flex items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-100 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
				className
			)}
		>
			<span class="min-w-0 truncate">{selectedLabel || placeholder}</span>
			<ChevronsUpDown size={16} class="text-muted-foreground shrink-0" aria-hidden="true" />
		</Select.Trigger>
		<Select.Portal {...portalTarget !== undefined ? { to: portalTarget } : {}}>
			<Select.Content
				sideOffset={6}
				{...contentLayer !== undefined ? { "data-overlay-layer": contentLayer } : {}}
				class={cn(
					"surface-overlay rounded-control z-50 max-h-[min(18rem,var(--bits-select-content-available-height))] w-[var(--bits-select-anchor-width)] min-w-[var(--bits-select-anchor-width)] overflow-hidden",
					"motion-safe:data-[state=open]:animate-[ds-fade-in_150ms_var(--ease)] motion-reduce:animate-none",
					contentClass
				)}
			>
				<div
					role="presentation"
					onpointerupcapture={handleContentPointerUp}
					ontouchend={handleContentPointerUp}
				>
					<Select.Viewport
						class="max-h-[min(18rem,var(--bits-select-content-available-height))] overflow-y-auto overscroll-contain p-1"
					>
						{#each resolvedItems as item (item.value)}
							<Select.Item
								value={item.value}
								label={item.label}
								disabled={item.disabled ?? false}
								onpointerup={(event: PointerEvent) => handleItemPointerUp(item, event)}
								ontouchend={(event: TouchEvent) => handleItemPointerUp(item, event)}
								class="text-muted-foreground data-highlighted:surface-control-hover data-highlighted:text-foreground data-[state=checked]:text-foreground rounded-choice duration-fast ease-standard text-label data-disabled:text-disabled-foreground flex min-h-11 cursor-pointer items-center justify-between gap-2 px-2.5 py-2.5 transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-100 pointer-coarse:py-3"
							>
								{#snippet children({ selected })}
									<span class="min-w-0 wrap-anywhere whitespace-normal">{item.label}</span>
									{#if selected}
										<Check size={16} class="text-signal shrink-0" aria-hidden="true" />
									{/if}
								{/snippet}
							</Select.Item>
						{/each}
					</Select.Viewport>
				</div>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
{/if}

<select
	bind:this={nativeSelect}
	{name}
	{form}
	id={enhanced ? nativeId : publicId}
	required={controlRequired}
	disabled={controlDisabled}
	{autocomplete}
	aria-hidden={enhanced ? "true" : undefined}
	aria-label={ariaLabel}
	aria-labelledby={ariaLabelledby}
	aria-describedby={controlDescribedby}
	aria-invalid={controlInvalid}
	aria-required={controlRequiredLabel}
	tabindex={enhanced ? -1 : undefined}
	onchange={handleNativeChange}
	bind:value
	class={cn(selectBase, enhanced && "sr-only !m-[-1px] !size-px !min-h-0 !w-px !max-w-none !p-0", className)}
>
	{#if children}
		{@render children()}
	{:else}
		<option value="" disabled={controlRequired}>{placeholder}</option>
		{#each resolvedItems as item (item.value)}
			<option value={item.value} disabled={item.disabled}>{item.label}</option>
		{/each}
	{/if}
</select>
