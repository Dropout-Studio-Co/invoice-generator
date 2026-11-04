<script lang="ts">
	import { cn } from "../../utils";
	import type { IconProps } from "../types";

	let {
		color = "currentColor",
		size = 24,
		strokeWidth = 2,
		animate = false,
		class: className = "",
		label
	}: IconProps = $props();
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
	class={cn("shrink-0", className, animate && "ds-icon-bell-animate")}
	role={label ? "img" : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : "true"}
>
	<path
		d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
		class={animate ? "ds-icon-bell-body" : undefined}
	/>
	<path d="M10.268 21a2 2 0 0 0 3.464 0" class={animate ? "ds-icon-bell-clapper" : undefined} />
</svg>

<style>
	.ds-icon-bell-animate {
		transform-origin: top center;
		animation: ds-icon-bell-ring 900ms var(--ease-standard) both;
	}

	.ds-icon-bell-body {
		animation: ds-icon-bell-body 1100ms var(--ease-standard) both;
	}

	.ds-icon-bell-clapper {
		animation: ds-icon-bell-clapper 1100ms var(--ease-standard) both;
	}

	@keyframes ds-icon-bell-ring {
		0%,
		100% {
			transform: rotate(0deg);
		}
		16.67% {
			transform: rotate(20deg);
		}
		33.33% {
			transform: rotate(-10deg);
		}
		50% {
			transform: rotate(10deg);
		}
		66.67% {
			transform: rotate(-5deg);
		}
		83.33% {
			transform: rotate(3deg);
		}
	}

	@keyframes ds-icon-bell-body {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(2px);
		}
	}

	@keyframes ds-icon-bell-clapper {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		50% {
			transform: translateX(3px);
		}
		75% {
			transform: translateX(-2px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ds-icon-bell-animate,
		.ds-icon-bell-body,
		.ds-icon-bell-clapper {
			animation: none;
		}
	}
</style>
