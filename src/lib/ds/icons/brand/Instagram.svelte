<script lang="ts">
	import { cn } from "../../utils";
	import type { BrandIconProps } from "../types";

	let { color = "currentColor", size = 24, class: className = "", label }: BrandIconProps = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	focusable="false"
	class={cn("shrink-0", className)}
	role={label ? "img" : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : "true"}
>
	<path
		fill={color}
		fill-rule="evenodd"
		d="M7 2.5h10A4.5 4.5 0 0 1 21.5 7v10a4.5 4.5 0 0 1-4.5 4.5H7A4.5 4.5 0 0 1 2.5 17V7A4.5 4.5 0 0 1 7 2.5Zm0 2A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h10a2.5 2.5 0 0 0 2.5-2.5V7A2.5 2.5 0 0 0 17 4.5H7Zm5 3A4.5 4.5 0 1 0 12 16.5 4.5 4.5 0 0 0 12 7.5Zm0 2A2.5 2.5 0 1 1 12 14.5 2.5 2.5 0 0 1 12 9.5Zm5.25-2.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"
	/>
</svg>
