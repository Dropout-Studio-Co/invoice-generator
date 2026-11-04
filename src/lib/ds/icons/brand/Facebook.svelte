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
		d="M13.6 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h2.8v8h3.8Z"
	/>
</svg>
