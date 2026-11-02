<!--
	Mobile-only overflow menu (dialog of actions) replacing the inline action icons on
	ClientCard / PaymentMethodCard at small breakpoints. Trigger and items stopPropagation
	because the menu sits inside those cards' clickable headers.
-->
<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { cn } from "$lib/utils";
	import { Eyebrow } from "$lib/ds";
	import { MoreVertical, type LucideIcon } from "@lucide/svelte";

	// LucideIcon is the exported "an icon component" type (`Component<LucideProps>`). Do not use
	// `ComponentProps<typeof Icon>`: the generic Icon takes a discriminated icon/iconNode union,
	// which concrete icons do not satisfy.
	type IconComponent = LucideIcon;

	export interface OverflowAction {
		label: string;
		icon?: IconComponent;
		onSelect: () => void;
		variant?: "default" | "destructive";
		disabled?: boolean;
	}

	let {
		actions,
		label = "More actions",
		class: className = ""
	}: {
		actions: OverflowAction[];
		label?: string;
		class?: string;
	} = $props();

	let open = $state(false);

	const handleAction = (action: OverflowAction, e: MouseEvent) => {
		e.stopPropagation();
		if (action.disabled) return;
		action.onSelect();
		open = false;
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		aria-label={label}
		onclick={(e: MouseEvent) => e.stopPropagation()}
		class={cn(
			"text-ink-muted pointer-fine:hover:bg-ink-2 pointer-fine:hover:text-foreground focus-visible:outline-signal inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
			className
		)}
	>
		<MoreVertical size={16} aria-hidden="true" />
	</Dialog.Trigger>

	<Dialog.Content
		class="data-open:slide-in-from-bottom-2 data-closed:slide-out-to-bottom-1 gap-0 p-0 sm:max-w-sm"
		showCloseButton={false}
	>
		<Dialog.Header class="border-hair border-b px-4 py-3">
			<Dialog.Title>
				<Eyebrow as="span">{label}</Eyebrow>
			</Dialog.Title>
		</Dialog.Header>

		<div class="flex flex-col p-2">
			{#each actions as action, idx (idx)}
				{@const Icon = action.icon}
				<button
					type="button"
					disabled={action.disabled}
					onclick={e => handleAction(action, e)}
					class={cn(
						"flex min-h-12 w-full touch-manipulation items-center gap-3 rounded-lg px-3 text-left transition-colors",
						"pointer-fine:hover:bg-ink-2 pointer-fine:hover:text-foreground",
						"focus:bg-ink-2 focus:text-foreground",
						"disabled:cursor-not-allowed disabled:opacity-40",
						action.variant === "destructive" &&
							"text-destructive pointer-fine:hover:bg-destructive/10 pointer-fine:hover:text-destructive"
					)}
				>
					{#if Icon}
						<Icon size={16} aria-hidden="true" />
					{/if}
					<span class="text-sm font-medium whitespace-nowrap">{action.label}</span>
				</button>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
