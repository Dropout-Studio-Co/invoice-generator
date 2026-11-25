<!--
	Dialog for adding multiple invoice months at once. Already-scheduled months are shown
	locked (struck-through, non-toggleable); the rest accumulate in `pending` until confirmed.
	`variant` switches between the dashed empty-state trigger and the inline "Add months" button.
-->
<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import Button from "$lib/components/ui/button.svelte";
	import { cn } from "$lib/utils";
	import { Cta, Eyebrow } from "$lib/ds";
	import { MONTHS } from "$lib/invoice/months";
	import type { MonthName } from "$lib/types";
	import { Check, Loader2, Plus } from "@lucide/svelte";

	let {
		scheduledMonths = [],
		onConfirm,
		disabled = false,
		variant = "default"
	}: {
		scheduledMonths: MonthName[];
		onConfirm: (months: MonthName[]) => Promise<void>;
		disabled?: boolean;
		variant?: "empty" | "default";
	} = $props();

	let open = $state(false);
	let pending = $state<MonthName[]>([]);
	let loading = $state(false);

	const toggleMonth = (month: MonthName) => {
		if (scheduledMonths.includes(month)) return;
		pending = pending.includes(month) ? pending.filter(m => m !== month) : [...pending, month];
	};

	const confirm = async () => {
		loading = true;
		await onConfirm(pending);
		loading = false;
		open = false;
	};

	const MONTH_ABBR: Record<MonthName, string> = {
		January: "Jan",
		February: "Feb",
		March: "Mar",
		April: "Apr",
		May: "May",
		June: "Jun",
		July: "Jul",
		August: "Aug",
		September: "Sep",
		October: "Oct",
		November: "Nov",
		December: "Dec"
	};
</script>

<Dialog.Root bind:open>
	{#if variant === "empty"}
		<Dialog.Trigger
			{disabled}
			onclick={() => (pending = [])}
			class="border-hair text-ink-muted pointer-fine:hover:bg-ink-2 pointer-fine:hover:text-foreground focus-visible:outline-signal h-auto min-h-20 w-full cursor-pointer touch-manipulation rounded-xl border border-dashed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pointer-fine:hover:border-white/30"
			aria-label="Add months"
		>
			<div class="flex flex-col items-center gap-2 py-3">
				<Plus size={16} aria-hidden="true" />
				<span class=" text-xs tracking-wider uppercase">Add months</span>
			</div>
		</Dialog.Trigger>
	{:else}
		<Dialog.Trigger
			{disabled}
			onclick={() => (pending = [])}
			class="border-hair text-foreground pointer-fine:hover:border-signal pointer-fine:hover:bg-ink-2 focus-visible:outline-signal inline-flex h-10 w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full border bg-transparent px-5  text-xs whitespace-nowrap uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Add months"
		>
			<Plus size={14} aria-hidden="true" />
			Add months
		</Dialog.Trigger>
	{/if}

	<Dialog.Content
		class="data-open:slide-in-from-bottom-2 data-closed:slide-out-to-bottom-1 gap-0 p-0 sm:max-w-sm"
		showCloseButton={false}
	>
		<Dialog.Header class="border-hair border-b px-4 py-3">
			<Dialog.Title>
				<Eyebrow as="span">Add months</Eyebrow>
			</Dialog.Title>
			<Dialog.Description class="text-ink-muted mt-1.5 text-left text-xs text-pretty">
				Select months to schedule invoices for.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid grid-cols-4 gap-2 p-3">
			{#each MONTHS as month (month)}
				{@const isScheduled = scheduledMonths.includes(month)}
				{@const isSelected = pending.includes(month)}
				<button
					type="button"
					disabled={isScheduled}
					onclick={() => toggleMonth(month)}
					class={cn(
						"focus-visible:outline-signal relative flex h-10 touch-manipulation items-center justify-center rounded-lg border  text-xs tracking-wider whitespace-nowrap uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
						isScheduled
							? "border-hair text-ink-muted cursor-not-allowed line-through opacity-30"
							: isSelected
								? "border-signal bg-ink-2 text-foreground cursor-pointer"
								: "border-hair text-ink-muted pointer-fine:hover:bg-ink-2 pointer-fine:hover:text-foreground cursor-pointer pointer-fine:hover:border-white/30"
					)}
					aria-pressed={isSelected}
					aria-disabled={isScheduled}
				>
					{#if isSelected}
						<Check size={10} class="text-signal absolute top-1 right-1" aria-hidden="true" />
					{/if}
					{MONTH_ABBR[month]}
				</button>
			{/each}
		</div>

		<div class="border-hair flex items-center justify-between border-t px-4 py-3">
			{#if pending.length > 0}
				<span class="text-ink-muted text-micro tracking-wider whitespace-nowrap tabular-nums">
					{pending.length} selected
				</span>
			{:else}
				<span></span>
			{/if}
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					class="touch-manipulation rounded-full"
					onclick={() => (open = false)}
				>
					Cancel
				</Button>
				<Cta variant="primary" arrow={false} disabled={pending.length === 0 || loading} onclick={confirm}>
					<span class="inline-flex items-center gap-2">
						{#if loading}
							<Loader2 size={14} class="animate-spin" aria-hidden="true" />
						{/if}
						Confirm
					</span>
				</Cta>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
