<script module lang="ts">
	import { tv } from "../../tv";

	export const buttonVariants = tv({
		base: "group/button inline-flex touch-manipulation items-center justify-center gap-2 text-center wrap-anywhere rounded-control text-button leading-5 font-semibold no-underline hover:no-underline focus:no-underline active:no-underline visited:no-underline focus-visible:bg-focus-surface! focus-visible:text-focus-foreground! disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-disabled-background disabled:text-disabled-foreground disabled:opacity-100 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-background aria-disabled:text-disabled-foreground aria-disabled:opacity-100 motion-safe:transition-[background-color,color,opacity] motion-safe:duration-fast motion-safe:ease-standard [&_[data-icon]]:size-4 [&_[data-icon]]:shrink-0",
		variants: {
			variant: {
				default:
					"primary-fill-wipe rounded-full bg-signal text-background uppercase hover:text-primary-hover-foreground focus-visible:bg-focus-button-surface! focus-visible:text-focus-button-foreground! motion-safe:duration-editorial motion-safe:ease-interaction",
				primary:
					"primary-fill-wipe rounded-full bg-signal text-background uppercase hover:text-primary-hover-foreground focus-visible:bg-focus-button-surface! focus-visible:text-focus-button-foreground! motion-safe:duration-editorial motion-safe:ease-interaction",
				secondary: "surface-control text-foreground hover:surface-control-hover",
				outline: "surface-control text-foreground hover:surface-control-hover",
				ghost: "text-foreground hover:surface-control-hover focus-visible:bg-focus-button-surface! focus-visible:text-focus-button-foreground!",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:bg-focus-button-surface! focus-visible:text-focus-button-foreground!",
				link: "text-foreground underline-offset-4 hover:underline focus-visible:bg-focus-button-surface! focus-visible:text-focus-button-foreground!",
				icon: "surface-control relative size-10 shrink-0 rounded-full p-0 text-foreground after:absolute after:content-[''] pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:after:size-11",
				nav: "surface-control rounded-full text-foreground hover:surface-control-hover"
			},
			size: {
				xs: "min-h-9 px-3 py-1 text-caption pointer-coarse:min-h-11",
				sm: "min-h-10 px-3 py-1 pointer-coarse:min-h-11",
				md: "min-h-10 px-4 py-1 pointer-coarse:min-h-11",
				default: "min-h-10 px-4 py-1 pointer-coarse:min-h-11",
				lg: "min-h-11 px-7 py-2",
				icon: "size-10 shrink-0 rounded-full p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:after:size-11",
				"icon-xs": "size-9 shrink-0 rounded-full p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
				"icon-sm": "size-10 shrink-0 rounded-full p-0 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
				"icon-lg": "size-11 shrink-0 rounded-full p-0"
			}
		},
		defaultVariants: { variant: "primary", size: "md" }
	});

	export type ButtonVariant =
		"default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link" | "icon" | "nav";
	export type ButtonSize = "xs" | "sm" | "md" | "default" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { cn } from "../../utils";
	import Spinner from "../Spinner.svelte";

	type Props = HTMLButtonAttributes &
		HTMLAnchorAttributes & {
			variant?: ButtonVariant;
			size?: ButtonSize;
			href?: string | undefined;
			loading?: boolean;
			class?: string;
			children: Snippet;
			ref?: HTMLElement | null;
		};

	let {
		variant = "primary",
		size,
		href,
		loading = false,
		disabled = false,
		onclick,
		tabindex,
		type = "button",
		class: className = "",
		ref = $bindable(null),
		children,
		...rest
	}: Props = $props();
	const inactive = $derived(disabled || loading);
	const resolvedSize = $derived(size ?? (variant === "primary" || variant === "default" ? "lg" : "md"));
	const handleAnchorClick: HTMLAnchorAttributes["onclick"] = event => {
		if (inactive) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		onclick?.(event);
	};
</script>

{#if href !== undefined}
	<a
		bind:this={ref}
		data-slot="button"
		href={inactive ? undefined : href}
		tabindex={inactive ? -1 : tabindex}
		aria-disabled={inactive}
		aria-busy={loading || undefined}
		onclick={handleAnchorClick}
		class={cn(buttonVariants({ variant, size: resolvedSize }), className)}
		{...rest}
	>
		{#if loading}<Spinner />{/if}{@render children()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		{type}
		disabled={inactive}
		tabindex={inactive ? -1 : tabindex}
		aria-busy={loading || undefined}
		{onclick}
		class={cn(buttonVariants({ variant, size: resolvedSize }), className)}
		{...rest}
	>
		{#if loading}<Spinner />{/if}{@render children()}
	</button>
{/if}
