<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "../utils";

	let {
		children,
		class: className = "",
		activationDuration = 450
	}: {
		children: Snippet<[boolean]>;
		class?: string;
		activationDuration?: number;
	} = $props();

	let pointerInside = $state(false);
	let focusInside = $state(false);
	let activated = $state(false);
	let activationTimer: ReturnType<typeof setTimeout> | undefined;
	const animate = $derived(pointerInside || focusInside || activated);

	const handlePointerEnter = () => {
		pointerInside = true;
	};

	const handlePointerLeave = () => {
		pointerInside = false;
	};

	const handleFocusIn = () => {
		focusInside = true;
	};

	const handleFocusOut = (event: FocusEvent) => {
		const currentTarget = event.currentTarget;
		if (currentTarget instanceof HTMLElement && !currentTarget.contains(event.relatedTarget as Node | null))
			focusInside = false;
	};

	const handleActivation = () => {
		activated = true;
		if (activationTimer) clearTimeout(activationTimer);
		activationTimer = setTimeout(() => (activated = false), activationDuration);
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") handleActivation();
	};

	$effect(() => () => {
		if (activationTimer) clearTimeout(activationTimer);
	});
</script>

<span
	role="presentation"
	class={cn("group/icon-trigger inline-flex", className)}
	onpointerenter={handlePointerEnter}
	onpointerleave={handlePointerLeave}
	onfocusin={handleFocusIn}
	onfocusout={handleFocusOut}
	onpointerdown={handleActivation}
	onclick={handleActivation}
	onkeydown={handleKeydown}
>
	{@render children(animate)}
</span>
