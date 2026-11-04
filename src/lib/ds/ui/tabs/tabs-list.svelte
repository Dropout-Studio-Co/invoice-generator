<script lang="ts" module>
	import { type VariantProps } from "tailwind-variants";
	import { tv } from "../../tv";

	export const tabsListVariants = tv({
		base: "relative rounded-control p-1 data-[orientation=horizontal]:h-auto data-[orientation=horizontal]:min-h-10 data-[variant=line]:rounded-none group/tabs-list inline-flex w-fit max-w-full items-center data-[orientation=horizontal]:overflow-x-auto data-[orientation=horizontal]:overscroll-x-contain justify-start text-muted-foreground data-[orientation=vertical]:h-fit data-[orientation=vertical]:flex-col data-[orientation=vertical]:justify-start",
		variants: {
			variant: {
				default: "surface-control",
				line: "gap-1 bg-transparent"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { onMount } from "svelte";
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "../../utils";

	let {
		children,
		ref = $bindable(null),
		variant = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	} = $props();

	let indicatorEl: HTMLSpanElement | null = null;
	let activeTrigger: HTMLElement | null = null;
	let activeOrientation = "";
	let activeVariant: TabsListVariant;
	let targetGeometry = "";
	let rafId = 0;
	let restoreId = 0;
	let pendingSelection = false;
	let pendingLayout = false;

	const getList = () => ref as HTMLDivElement | null;

	const getActiveTrigger = (list: HTMLDivElement) =>
		list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');

	const positionIndicator = (selectionChanged: boolean, layoutChanged: boolean) => {
		const list = getList();
		const indicator = indicatorEl;
		const trigger = list ? getActiveTrigger(list) : null;
		if (!list || !indicator || !trigger) {
			if (indicator) indicator.style.opacity = "0";
			activeTrigger = null;
			targetGeometry = "";
			return;
		}

		const listRect = list.getBoundingClientRect();
		const triggerRect = trigger.getBoundingClientRect();
		if (!triggerRect.width || !triggerRect.height) {
			indicator.style.opacity = "0";
			activeTrigger = null;
			targetGeometry = "";
			return;
		}
		const isVertical = list.dataset.orientation === "vertical";
		const isLine = variant === "line";
		const x = triggerRect.left - listRect.left + list.scrollLeft;
		const y = triggerRect.top - listRect.top + list.scrollTop;
		const width = isLine && isVertical ? 2 : triggerRect.width;
		const height = isLine && !isVertical ? 2 : triggerRect.height;
		const indicatorX = isLine && isVertical ? x + triggerRect.width - width : x;
		const indicatorY = isLine && !isVertical ? y + triggerRect.height - height : y;

		const transform = `translate3d(${indicatorX}px,${indicatorY}px,0)`;
		const radius = isLine ? "0px" : getComputedStyle(trigger).borderRadius;
		const geometry = `${transform}|${width}|${height}|${radius}`;
		const geometryChanged = targetGeometry !== geometry;
		if (
			!selectionChanged &&
			indicator.style.opacity === "1" &&
			activeTrigger === trigger &&
			activeOrientation === list.dataset.orientation &&
			activeVariant === variant &&
			targetGeometry === geometry
		) {
			if (layoutChanged) scrollActiveIntoView(list, trigger, false);
			return;
		}

		const firstPlacement = activeTrigger === null;
		const animate =
			selectionChanged &&
			!layoutChanged &&
			activeTrigger !== null &&
			activeTrigger.isConnected &&
			activeTrigger !== trigger &&
			activeOrientation === list.dataset.orientation &&
			activeVariant === variant;
		cancelAnimationFrame(restoreId);
		indicator.style.transition = animate ? "" : "none";
		indicator.style.transform = transform;
		indicator.style.width = `${width}px`;
		indicator.style.height = `${height}px`;
		indicator.style.borderRadius = radius;
		indicator.style.opacity = "1";
		if (!animate) restoreId = requestAnimationFrame(() => indicator.style.removeProperty("transition"));
		activeTrigger = trigger;
		targetGeometry = geometry;
		activeOrientation = list.dataset.orientation ?? "";
		activeVariant = variant;
		if (selectionChanged || layoutChanged || firstPlacement || geometryChanged)
			scrollActiveIntoView(list, trigger, selectionChanged && animate);
	};

	const scrollActiveIntoView = (list: HTMLDivElement, trigger: HTMLElement, smooth: boolean) => {
		const isVertical = list.dataset.orientation === "vertical";
		const viewportSize = isVertical ? list.clientHeight : list.clientWidth;
		const contentSize = isVertical ? list.scrollHeight : list.scrollWidth;
		if (contentSize <= viewportSize) return;

		const listRect = list.getBoundingClientRect();
		const triggerRect = trigger.getBoundingClientRect();
		const current = isVertical ? list.scrollTop : list.scrollLeft;
		const start = (isVertical ? triggerRect.top - listRect.top : triggerRect.left - listRect.left) + current;
		const end = start + (isVertical ? triggerRect.height : triggerRect.width);
		const edge = 44;
		let target = current;
		if (end > current + viewportSize - edge) target = end - viewportSize + edge;
		else if (start < current) target = start;
		const max = contentSize - viewportSize;
		const rtl = !isVertical && getComputedStyle(list).direction === "rtl";
		target = rtl ? Math.max(-max, Math.min(target, 0)) : Math.max(0, Math.min(target, max));
		if (Math.abs(target - current) < 1) return;

		const behavior = smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant";
		if (isVertical) list.scrollTo({ top: target, behavior });
		else list.scrollTo({ left: target, behavior });
	};

	const schedulePosition = (selectionChanged = false, layoutChanged = false) => {
		pendingSelection ||= selectionChanged;
		pendingLayout ||= layoutChanged;
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			const selection = pendingSelection;
			const layout = pendingLayout;
			pendingSelection = false;
			pendingLayout = false;
			positionIndicator(selection, layout);
		});
	};

	onMount(() => {
		const list = getList();
		if (!list) return;

		const indicator = document.createElement("span");
		indicator.dataset.slot = "tabs-indicator";
		indicator.setAttribute("aria-hidden", "true");
		indicator.className =
			"bg-signal pointer-events-none absolute left-0 top-0 z-0 motion-safe:transition-[transform,width,height] motion-safe:duration-[var(--motion-tabs-indicator)] motion-safe:ease-[var(--motion-ease)] motion-reduce:transition-none";
		indicator.style.opacity = "0";
		list.insertBefore(indicator, list.firstChild);
		indicatorEl = indicator;

		const resizeObserver =
			typeof ResizeObserver === "undefined"
				? null
				: new ResizeObserver(entries =>
						schedulePosition(
							false,
							entries.some(entry => entry.target === list)
						)
					);
		const observeTriggers = () => {
			if (!resizeObserver) return;
			resizeObserver.disconnect();
			resizeObserver.observe(list);
			list.querySelectorAll<HTMLElement>('[role="tab"]').forEach(trigger => resizeObserver.observe(trigger));
		};

		const mutationObserver = new MutationObserver(records => {
			if (records.some(record => record.type === "childList")) observeTriggers();
			const selectionChanged = records.some(
				record => record.type === "attributes" && record.attributeName === "data-state"
			);
			const layoutChanged = records.some(
				record =>
					record.type === "childList" ||
					(record.type === "attributes" && record.attributeName !== "data-state")
			);
			schedulePosition(selectionChanged, layoutChanged);
		});
		mutationObserver.observe(list, {
			attributeFilter: ["data-state", "data-orientation", "data-variant"],
			attributes: true,
			childList: true,
			subtree: true
		});
		observeTriggers();

		const onResize = () => schedulePosition(false, true);
		const onFontsReady = () => schedulePosition(false, true);
		window.addEventListener("resize", onResize);
		window.addEventListener("load", onResize);
		document.fonts?.addEventListener("loadingdone", onFontsReady);
		positionIndicator(false, true);

		return () => {
			cancelAnimationFrame(rafId);
			cancelAnimationFrame(restoreId);
			window.removeEventListener("resize", onResize);
			window.removeEventListener("load", onResize);
			document.fonts?.removeEventListener("loadingdone", onFontsReady);
			mutationObserver.disconnect();
			resizeObserver?.disconnect();
			indicator.remove();
			indicatorEl = null;
		};
	});
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
	{children}
/>
