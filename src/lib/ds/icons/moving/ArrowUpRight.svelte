<script lang="ts">
	import { cn } from "../../utils";
	import type { IconProps } from "../types";

	let {
		color = "currentColor",
		size = 24,
		strokeWidth = 2,
		animate = false,
		class: className = "",
		label,
		"data-icon": dataIcon
	}: IconProps & { "data-icon"?: string } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	focusable="false"
	data-icon={dataIcon}
	class={cn("ds-icon-arrow-up-right shrink-0", className, animate && "ds-icon-arrow-up-right-animate")}
	role={label ? "img" : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : "true"}
>
	<path d="M7 7h10v10" class="ds-icon-arrow-up-right-head" />
	<path d="M17 7 12 12" class="ds-icon-arrow-up-right-head" />
	<path d="m7 17 5-5" />
</svg>

<style>
	.ds-icon-arrow-up-right-head {
		transform-box: fill-box;
		transform-origin: center;
		transition: transform var(--motion-fast) var(--motion-ease-standard);
	}

	.ds-icon-arrow-up-right-animate .ds-icon-arrow-up-right-head,
	:global(.group:focus-visible) .ds-icon-arrow-up-right-head,
	:global(.group:active) .ds-icon-arrow-up-right-head {
		transform: translate(2px, -2px);
	}

	@media (hover: hover) and (pointer: fine) {
		:global(.group:hover) .ds-icon-arrow-up-right-head {
			transform: translate(2px, -2px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ds-icon-arrow-up-right-head {
			transform: none !important;
			transition: none;
		}
	}
</style>
