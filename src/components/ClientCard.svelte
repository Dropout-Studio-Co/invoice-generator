<!--
	Collapsible card editing one client: identity fields, service line, payment-method
	selection, and the invoice schedule. Header doubles as select + expand trigger.
-->
<script lang="ts">
	import { fixed } from "$lib/stores/fixed.svelte";
	import { session, type ClientPatch } from "$lib/stores/session.svelte";
	import { getMethodDef } from "$lib/payments/registry";
	import { formatAmount } from "$lib/format/currency";
	import type { Client, Currency, SavedPaymentMethod } from "$lib/types";
	import { cn } from "$lib/utils";
	import Button from "$lib/components/ui/button.svelte";
	import Input from "$lib/components/ui/input.svelte";
	import Textarea from "$lib/components/ui/textarea.svelte";
	import StatusBadge from "$src/components/StatusBadge.svelte";
	import { Separator } from "$lib/components/ui/separator";
	import { Card, CardContent, CardHeader } from "$lib/components/ui/card";
	import * as Field from "$lib/components/ui/field";
	import * as Table from "$lib/components/ui/table";
	import { Switch } from "$lib/components/ui/switch";
	import SelectDialog from "$src/components/SelectDialog.svelte";
	import InvoiceEntryRow from "$src/components/InvoiceEntryRow.svelte";
	import SectionEyebrow from "$src/components/SectionEyebrow.svelte";
	import MonthPickerDialog from "$src/components/MonthPickerDialog.svelte";
	import OverflowActions from "$src/components/OverflowActions.svelte";
	import { ChevronDown, Check, Plus, ReceiptText, Trash2, Wallet } from "@lucide/svelte";
	import { slide } from "svelte/transition";
	import { motionDuration } from "$lib/motion";
	import { z } from "zod";

	let {
		client,
		index,
		selected,
		onSelect,
		onRemove
	}: {
		client: Client;
		index: number;
		selected: boolean;
		onSelect: () => void;
		onRemove?: () => void;
	} = $props();

	const remove = () => {
		if (onRemove) onRemove();
		else session.removeClient(client.id);
	};

	let nameTouched = $state(false);
	let prefixTouched = $state(false);
	let emailTouched = $state(false);

	const expanded = $derived(session.isClientExpanded(client.id));

	const nameSchema = z.string().trim().min(1, "Client name is required.");
	const prefixSchema = z.string().trim().min(1, "Invoice prefix is required.");
	const optionalEmailSchema = z.union([z.literal(""), z.string().trim().email("Enter a valid client email.")]);
	const patch = (p: ClientPatch) => session.updateClient(client.id, p);
	const valueFromInput = (e: Event) => (e.currentTarget as HTMLInputElement).value;
	const valueFromTextArea = (e: Event) => (e.currentTarget as HTMLTextAreaElement).value;
	const selectCard = (e: KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") onSelect();
	};

	const totalAmount = $derived(formatAmount(client.service.amount, client.service.currency));
	const scheduledMonths = $derived(client.invoices.map(e => e.month));
	const nameError = $derived(
		nameTouched && !nameSchema.safeParse(client.name).success ? "Client name is required." : ""
	);
	const prefixError = $derived(
		prefixTouched && !prefixSchema.safeParse(client.invoicePrefix).success ? "Invoice prefix is required." : ""
	);
	const emailError = $derived(
		emailTouched && !optionalEmailSchema.safeParse(client.email).success ? "Enter a valid client email." : ""
	);
	const badgeNum = $derived(String(index + 1).padStart(2, "0"));

	const savedMethods = $derived(fixed.value.paymentMethods);
	const isMethod = (m: SavedPaymentMethod | undefined): m is SavedPaymentMethod => Boolean(m);
	const selectedMethods = $derived(
		client.payment.methodIds.map(id => savedMethods.find(m => m.id === id)).filter(isMethod)
	);
	const paymentSummary = $derived.by(() => {
		if (selectedMethods.length === 0) return "no payment methods";
		return selectedMethods
			.map(m => getMethodDef(m.kind).shortName)
			.join(" · ")
			.toLowerCase();
	});

	// When exactly one payment method exists and none is attached yet, auto-attach it.
	$effect(() => {
		if (savedMethods.length === 1 && client.payment.methodIds.length === 0) {
			session.ensurePaymentMethodSelected(client.id, savedMethods[0].id);
		}
	});
</script>

<Card
	class={cn(
		"status-transition relative py-0",
		!client.isActive &&
			"bg-status-inactive-bg before:bg-status-inactive-border before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full"
	)}
>
	<CardHeader class="px-0 py-0">
		<!--
			div[role="button"] not a native <button>: this header wraps inner action
			buttons (Switch, remove, expand). A <button> inside a <button> is invalid HTML —
			SSR closes the outer button early, desyncing hydration and rendering the app twice.
		-->
		<div
			role="button"
			tabindex="0"
			aria-pressed={selected}
			aria-expanded={expanded}
			onclick={() => {
				onSelect();
				session.toggleClientExpanded(client.id);
			}}
			onkeydown={selectCard}
			class="pointer-fine:hover:bg-accent/40 flex min-w-0 cursor-pointer touch-manipulation items-center gap-3 px-4 py-3 transition-colors select-none"
		>
			<span
				class={cn(
					"status-transition text-muted-foreground text-caption w-6 shrink-0  whitespace-nowrap tabular-nums",
					!client.isActive && "opacity-70"
				)}
			>
				{badgeNum}
			</span>
			<div class={cn("status-transition min-w-0 flex-1", !client.isActive && "opacity-70")}>
				<div class="flex min-w-0 items-center gap-2">
					<p class="min-w-0 truncate text-sm font-medium">{client.name || "New client"}</p>
					<StatusBadge status={client.isActive ? "active" : "inactive"} size="sm" />
				</div>
				<p class="text-muted-foreground truncate text-xs">
					{client.invoicePrefix || "No prefix"} · {client.invoices.length} scheduled
				</p>
			</div>
			<div
				class={cn(
					"status-transition hidden shrink-0 items-center gap-1.5 sm:flex",
					!client.isActive && "opacity-70"
				)}
			>
				<span class="bg-muted text-muted-foreground text-caption rounded-md px-1.5 py-0.5 whitespace-nowrap">
					{client.service.currency}
				</span>
				<span
					class="bg-muted text-muted-foreground text-caption max-w-[140px] truncate rounded-md px-1.5 py-0.5 whitespace-nowrap"
				>
					{paymentSummary}
				</span>
			</div>
			<!-- stopPropagation so toggling active does not also select/expand the card. -->
			<div
				role="presentation"
				onclick={e => e.stopPropagation()}
				onkeydown={e => e.stopPropagation()}
				class="flex shrink-0 items-center"
			>
				<Switch
					checked={client.isActive}
					onCheckedChange={v => session.setClientActive(client.id, v)}
					aria-label={client.isActive ? "Deactivate client" : "Activate client"}
					class="data-[state=checked]:bg-status-active-track data-[state=unchecked]:bg-status-inactive-track status-transition"
				/>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-muted-foreground pointer-fine:hover:bg-destructive/10 pointer-fine:hover:text-destructive hidden h-9 w-9 shrink-0 sm:flex sm:h-7 sm:w-7"
				onclick={e => {
					e.stopPropagation();
					remove();
				}}
				aria-label="Remove client"
			>
				<Trash2 size={12} aria-hidden="true" />
			</Button>
			<div class="sm:hidden">
				<OverflowActions
					label={client.name || "Client"}
					actions={[
						{
							label: "Remove client",
							icon: Trash2,
							variant: "destructive" as const,
							onSelect: remove
						}
					]}
				/>
			</div>
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-muted-foreground pointer-fine:hover:text-foreground size-11 shrink-0 sm:size-7"
				onclick={e => {
					e.stopPropagation();
					session.toggleClientExpanded(client.id);
				}}
				aria-label={expanded ? "Collapse client" : "Expand client"}
			>
				<ChevronDown
					size={14}
					class={cn("transition-transform duration-200", expanded && "rotate-180")}
					aria-hidden="true"
				/>
			</Button>
		</div>
	</CardHeader>

	{#if expanded}
		<div transition:slide={{ duration: motionDuration("base") }}>
			<CardContent
				class={cn("status-transition border-border space-y-5 border-t pb-4", !client.isActive && "opacity-70")}
			>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<Field.Field class="gap-1.5" data-invalid={nameError !== ""}>
						<Field.FieldLabel for="name-{client.id}">Client name</Field.FieldLabel>
						<Input
							id="name-{client.id}"
							placeholder="e.g., Ollivanders Wand Shop"
							value={client.name}
							aria-invalid={nameError !== ""}
							oninput={e => patch({ name: valueFromInput(e) })}
							onblur={() => (nameTouched = true)}
							class={nameError ? "border-destructive focus-visible:border-destructive" : ""}
						/>
						{#if nameError}
							<Field.FieldError>{nameError}</Field.FieldError>
						{/if}
					</Field.Field>
					<Field.Field class="gap-1.5" data-invalid={prefixError !== ""}>
						<Field.FieldLabel for="prefix-{client.id}">Invoice prefix</Field.FieldLabel>
						<Input
							id="prefix-{client.id}"
							placeholder="e.g., OLLIVAND"
							value={client.invoicePrefix}
							aria-invalid={prefixError !== ""}
							oninput={e => patch({ invoicePrefix: valueFromInput(e) })}
							onblur={() => (prefixTouched = true)}
							class={prefixError ? "border-destructive focus-visible:border-destructive" : ""}
						/>
						{#if prefixError}
							<Field.FieldError>{prefixError}</Field.FieldError>
						{/if}
					</Field.Field>
					<Field.Field class="gap-1.5">
						<Field.FieldLabel for="phone-{client.id}">Phone</Field.FieldLabel>
						<Input
							id="phone-{client.id}"
							type="tel"
							placeholder="e.g., +880 1XXXXXXXXX"
							value={client.phone}
							oninput={e => patch({ phone: valueFromInput(e) })}
						/>
					</Field.Field>
					<Field.Field class="gap-1.5" data-invalid={emailError !== ""}>
						<Field.FieldLabel for="email-{client.id}">Email</Field.FieldLabel>
						<Input
							id="email-{client.id}"
							type="email"
							placeholder="e.g., orders@ollivanders.co"
							value={client.email}
							aria-invalid={emailError !== ""}
							oninput={e => patch({ email: valueFromInput(e) })}
							onblur={() => (emailTouched = true)}
							class={emailError ? "border-destructive focus-visible:border-destructive" : ""}
						/>
						{#if emailError}
							<Field.FieldError>{emailError}</Field.FieldError>
						{/if}
					</Field.Field>
					<Field.Field class="gap-1.5 sm:col-span-2">
						<Field.FieldLabel for="address-{client.id}">Address</Field.FieldLabel>
						<Textarea
							id="address-{client.id}"
							placeholder="e.g., 93A Diagon Alley, London"
							value={client.address[0] ?? ""}
							oninput={e => patch({ address: [valueFromTextArea(e)] })}
						/>
					</Field.Field>
				</div>

				<Separator />

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<Field.Field class="gap-1.5 sm:col-span-2">
						<Field.FieldLabel for="desc-{client.id}">Service description</Field.FieldLabel>
						<Textarea
							id="desc-{client.id}"
							placeholder="e.g., Spellwork retainer for {'{MONTH}'}"
							value={client.service.description}
							oninput={e => patch({ serviceDescription: valueFromTextArea(e) })}
						/>
						<Field.FieldDescription>
							Insert
							<code class="bg-muted text-foreground text-caption rounded px-1 py-0.5">
								{"{MONTH}"}
							</code>
							to auto-fill each invoice's month name (e.g. January).
						</Field.FieldDescription>
					</Field.Field>
					<Field.Field class="gap-1.5">
						<Field.FieldLabel for="amount-{client.id}">Amount</Field.FieldLabel>
						<Input
							id="amount-{client.id}"
							type="number"
							min="0"
							placeholder="0"
							value={String(client.service.amount)}
							oninput={e => patch({ serviceAmount: parseFloat(valueFromInput(e)) || 0 })}
							class="tabular-nums"
						/>
					</Field.Field>
					<Field.Field class="gap-1.5">
						<Field.FieldLabel for="currency-{client.id}">Currency</Field.FieldLabel>
						<SelectDialog
							value={client.service.currency}
							title="Currency"
							columns={2}
							options={[
								{ value: "BDT", label: "BDT (৳)" },
								{ value: "USD", label: "USD ($)" }
							]}
							onSelect={v => patch({ serviceCurrency: v as Currency })}
						/>
					</Field.Field>
					<Field.Field class="gap-1.5">
						<Field.FieldLabel for="year-{client.id}">Year</Field.FieldLabel>
						<Input
							id="year-{client.id}"
							type="number"
							min="2020"
							max="2099"
							value={String(client.year)}
							oninput={e => patch({ year: parseInt(valueFromInput(e)) || new Date().getFullYear() })}
							class="tabular-nums"
						/>
					</Field.Field>
				</div>

				<Separator />

				<div class="space-y-3">
					<div class="flex items-center justify-between gap-3">
						<SectionEyebrow icon={Wallet} label="Payment methods" />
						{#if savedMethods.length > 0}
							<p class="text-ink-muted text-micro tracking-wider whitespace-nowrap tabular-nums">
								{client.payment.methodIds.length} of {savedMethods.length} selected
							</p>
						{/if}
					</div>

					{#if savedMethods.length === 0}
						<div
							class="border-hair text-ink-muted grid min-h-20 w-full place-items-center rounded-xl border border-dashed text-center text-xs"
						>
							<div class="space-y-1 px-3">
								<p class="font-medium text-balance">No payment methods configured</p>
								<p class="text-pretty">Add one in the sender panel to attach it to invoices.</p>
							</div>
						</div>
					{:else}
						<div class="flex flex-wrap gap-1.5">
							{#each savedMethods as method (method.id)}
								{@const def = getMethodDef(method.kind)}
								{@const active = client.payment.methodIds.includes(method.id)}
								<button
									type="button"
									onclick={() => session.togglePaymentMethod(client.id, method.id)}
									class={cn(
										"group inline-flex touch-manipulation items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
										active
											? "border-brand bg-brand/10 text-success"
											: "border-border text-muted-foreground pointer-fine:hover:border-foreground/40 pointer-fine:hover:text-foreground"
									)}
									aria-pressed={active}
								>
									{#if active}
										<Check size={12} aria-hidden="true" />
									{:else}
										<Plus size={12} aria-hidden="true" />
									{/if}
									<span class="font-medium whitespace-nowrap">{method.label || def.name}</span>
									<span
										class={cn(
											"text-caption  whitespace-nowrap uppercase",
											active ? "text-success/80" : "text-muted-foreground"
										)}
									>
										{def.shortName}
									</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<Separator />

				<div class="space-y-3">
					<div class="flex items-center justify-between gap-3">
						<SectionEyebrow icon={ReceiptText} label="Invoice schedule" />
						{#if client.invoices.length > 0}
							<p class="text-ink-muted text-micro tracking-wider whitespace-nowrap">
								{client.invoices.length} rows
							</p>
						{/if}
					</div>

					{#if client.invoices.length === 0}
						<MonthPickerDialog
							{scheduledMonths}
							onConfirm={months => session.addInvoiceEntries(client.id, months)}
							variant="empty"
						/>
					{:else}
						<div class="hidden sm:block">
							<Table.Root>
								<Table.Header>
									<Table.Row class="border-border pointer-fine:hover:bg-transparent">
										<Table.Head class="text-caption h-8 pl-0 tracking-wider uppercase">
											Month
										</Table.Head>
										<Table.Head
											class="text-caption h-8 w-[72px] text-center tracking-wider uppercase"
										>
											Issue
										</Table.Head>
										<Table.Head
											class="text-caption h-8 w-[72px] text-center tracking-wider uppercase"
										>
											Due
										</Table.Head>
										<Table.Head class="text-caption h-8 w-12 text-center tracking-wider uppercase">
											Active
										</Table.Head>
										<Table.Head class="h-8 w-8"></Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each client.invoices as entry (entry.id)}
										<InvoiceEntryRow
											clientId={client.id}
											clientActive={client.isActive}
											{entry}
											as="row"
										/>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
						<div class="block space-y-2 sm:hidden">
							{#each client.invoices as entry (entry.id)}
								<InvoiceEntryRow
									clientId={client.id}
									clientActive={client.isActive}
									{entry}
									as="card"
								/>
							{/each}
						</div>

						<div class="text-muted-foreground flex items-center justify-between gap-3 text-xs">
							<span class="whitespace-nowrap">
								{client.invoices.length} invoice{client.invoices.length !== 1 ? "s" : ""}
							</span>
							<span class=" whitespace-nowrap tabular-nums">
								{totalAmount} × {client.invoices.length}
							</span>
						</div>

						<MonthPickerDialog
							{scheduledMonths}
							onConfirm={months => session.addInvoiceEntries(client.id, months)}
						/>
					{/if}
				</div>
			</CardContent>
		</div>
	{/if}
</Card>
