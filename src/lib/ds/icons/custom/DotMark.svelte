<script lang="ts">
	import { cn } from "../../utils";
	import type { BrandIconProps } from "../types";

	let { color = "currentColor", size = 8, class: className = "", label }: BrandIconProps = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 8 8"
	fill="none"
	focusable="false"
	class={cn("shrink-0", className)}
	role={label ? "img" : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : "true"}
>
	<circle cx="4" cy="4" r="4" fill={color} />
</svg>
