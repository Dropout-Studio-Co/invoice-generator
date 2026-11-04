<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { cn } from "../../utils";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import OctagonXIcon from "@lucide/svelte/icons/octagon-x";
	import InfoIcon from "@lucide/svelte/icons/info";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";

	let {
		theme = "dark",
		class: className,
		toastOptions = {},
		expand = false,
		onfocusin,
		onfocusout,
		onpointerdowncapture,
		onpointercancelcapture,
		...restProps
	}: SonnerProps = $props();
	/** Pointer leave must not collapse a stack containing keyboard focus. */
	let focusWithin = $state(false);

	/** End canceled drags at zero displacement so Sonner clears its own pointer/direction state. */
	const cancelSwipe = (event: PointerEvent) => {
		const toast = event.target instanceof Element ? event.target.closest("[data-sonner-toast]") : null;
		if (!(toast instanceof HTMLElement) || toast.dataset.swiping !== "true") return;
		toast.style.setProperty("--swipe-amount-x", "0px");
		toast.style.setProperty("--swipe-amount-y", "0px");
		toast.dispatchEvent(
			new PointerEvent("pointerup", {
				bubbles: true,
				pointerId: event.pointerId,
				pointerType: event.pointerType
			})
		);
	};

	/** Classify native scroll ownership before pointerdown, including content/viewport changes. */
	const observeTouchOwnership = (root: HTMLElement) => {
		let observed: Element[] = [];
		const refresh = () => {
			const targets = [
				root,
				...root.querySelectorAll(
					"[data-sonner-toast], [data-content], [data-title], [data-description], [data-button]"
				)
			];
			for (const target of observed) if (!targets.includes(target)) resize.unobserve(target);
			for (const target of targets) if (!observed.includes(target)) resize.observe(target);
			observed = targets;
			const stackScrolls =
				getComputedStyle(root).overflowY === "auto" && root.scrollHeight > root.clientHeight + 1;
			for (const toast of root.querySelectorAll<HTMLElement>("[data-sonner-toast]"))
				toast.dataset.dsScrollable = String(stackScrolls || toast.scrollHeight > toast.clientHeight + 1);
		};
		const resize = new ResizeObserver(refresh);
		const content = new MutationObserver(refresh);
		content.observe(root, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["data-expanded", "data-mounted"]
		});
		refresh();
		return () => {
			resize.disconnect();
			content.disconnect();
		};
	};
</script>

<Sonner
	{@attach observeTouchOwnership}
	{theme}
	expand={expand || focusWithin}
	onfocusin={event => {
		focusWithin = true;
		onfocusin?.(event);
	}}
	onfocusout={event => {
		focusWithin = event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget);
		onfocusout?.(event);
	}}
	onpointerdowncapture={event => {
		onpointerdowncapture?.(event);
		const target = event.target instanceof Element ? event.target.closest("[data-sonner-toast]") : null;
		if (event.pointerType === "touch" && target instanceof HTMLElement && target.dataset.dsScrollable === "true")
			event.stopPropagation();
	}}
	onpointercancelcapture={event => {
		cancelSwipe(event);
		onpointercancelcapture?.(event);
	}}
	class={cn(
		"toaster group [--ds-toast-bottom:var(--offset-bottom)] [--ds-toast-top:var(--offset-top)] max-[600px]:[--ds-toast-bottom:var(--mobile-offset-bottom)] max-[600px]:[--ds-toast-top:var(--mobile-offset-top)] [@media(max-width:600px)]:w-[calc(100%-var(--mobile-offset-left)-var(--mobile-offset-right))]!",
		"[&:has([data-expanded=true])]:flex [&:has([data-expanded=true])]:max-h-[calc(100dvh-var(--ds-toast-top)-var(--ds-toast-bottom))] [&:has([data-expanded=true])]:gap-(--gap) [&:has([data-expanded=true])]:overflow-y-auto [&:has([data-expanded=true])]:overscroll-contain [&:has([data-expanded=true])[data-y-position=bottom]]:flex-col-reverse [&:has([data-expanded=true])[data-y-position=top]]:flex-col",
		"[&_[data-sonner-toast]]:h-auto! [&_[data-sonner-toast]]:max-h-[calc(100dvh-var(--ds-toast-top)-var(--ds-toast-bottom))] [&_[data-sonner-toast]]:touch-pinch-zoom! [&_[data-sonner-toast]]:flex-wrap! [&_[data-sonner-toast]]:items-start! [&_[data-sonner-toast]]:overflow-y-auto [&_[data-sonner-toast]]:overscroll-contain [&_[data-sonner-toast]]:wrap-anywhere [&_[data-sonner-toast][data-ds-scrollable=true]]:touch-pan-y! [&_[data-sonner-toast][data-expanded=true]]:relative! [&_[data-sonner-toast][data-expanded=true]]:shrink-0 [&_[data-sonner-toast][data-expanded=true]]:[--y:translateY(0px)]! [@media(max-width:600px)]:[&_[data-sonner-toast]]:w-full!",
		"[&_[data-button]]:ms-0! [&_[data-button]]:h-auto! [&_[data-button]]:min-h-6 [&_[data-button]]:max-w-full! [&_[data-button]]:min-w-0! [&_[data-button]]:shrink! [&_[data-button]]:py-2 [&_[data-button]]:wrap-anywhere [&_[data-button]]:whitespace-normal! [&_[data-content]]:min-w-0! [&_[data-content]]:flex-[1_1_10rem]!",
		"[&_[data-close-button]:focus-visible]:bg-focus-surface! [&_[data-close-button]:focus-visible]:text-focus-foreground! [&_[data-button]]:pointer-coarse:min-h-11 [&_[data-button]]:pointer-coarse:min-w-11 [&_[data-close-button]]:start-auto! [&_[data-close-button]]:end-2! [&_[data-close-button]]:top-2! [&_[data-close-button]]:transform-none! [&_[data-close-button]]:border-0! [&_[data-close-button]]:shadow-none! [&_[data-close-button]]:pointer-coarse:min-h-11 [&_[data-close-button]]:pointer-coarse:min-w-11 [&_[data-sonner-toast]:has([data-close-button])]:pe-14!",
		className
	)}
	style="--normal-bg: var(--popover); --normal-text: var(--popover-foreground); --normal-border: transparent; --border-width: 0px;"
	toastOptions={{
		...toastOptions,
		classes: {
			...toastOptions.classes,
			toast: cn(
				"surface-modal rounded-lg !border-0 text-popover-foreground shadow-lg",
				toastOptions.classes?.toast
			)
		}
	}}
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="size-4" />
	{/snippet}
</Sonner>
