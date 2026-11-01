<!--
	Root layout. Owns the global app shell, cross-route View Transitions, and the
	AI Copilot mount. Copilot is gated to the home route only: `data.aiEnabled`
	(feature flag) AND route id `/` AND no active error. The copilot is a toggleable
	OVERLAY (default closed): desktop (lg+) opens a fixed right-rail <aside> via
	AiDesktopLauncher / ai.desktopOpen; mobile gets AiMobileFab + AiMobileSheet. As
	an overlay it reserves NO layout space — content stays full-width whether open or
	closed, so toggling never reflows the page. AiConfirmDialog mounts globally for
	Tier-B confirmations.
-->
<script lang="ts">
	import "../app.css";
	import type { Snippet } from "svelte";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { onNavigate } from "$app/navigation";
	import { handleViewTransition, motionDuration } from "$lib/motion";
	import { ai } from "$lib/stores/ai.svelte";
	import { Footer } from "$lib/components/ui/footer";
	import AiSidebar from "$src/components/ai/AiSidebar.svelte";
	import AiConfirmDialog from "$src/components/ai/AiConfirmDialog.svelte";
	import AiDesktopLauncher from "$src/components/ai/AiDesktopLauncher.svelte";
	import AiMobileFab from "$src/components/ai/AiMobileFab.svelte";
	import AiMobileSheet from "$src/components/ai/AiMobileSheet.svelte";
	import type { LayoutData } from "./$types";

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// Wires cross-route View Transitions; no-ops when the API is unavailable or motion is reduced.
	onNavigate(handleViewTransition);

	// Copilot is a signed-in perk: hidden for guests (paid AI calls + needs the
	// server). Its /api/ai/* routes stay 401-gated regardless.
	const showCopilot = $derived(data.aiEnabled && !!data.user && page.route.id === "/" && !page.error);
</script>

<svelte:head>
	<title>Invoice Generator</title>
	<meta name="description" content="Client-side batch invoice PDF generator for recurring billing." />
</svelte:head>

<!-- No rail gutter: the copilot is an overlay drawer, so content stays full-width whether open or
	closed (toggling never reflows the page). -->
<div class="flex min-h-dvh flex-col">
	<a
		href="#main"
		class="focus:bg-card focus:text-foreground focus:outline-signal sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:inline-flex focus:items-center focus:rounded-xl focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-2 focus:outline-offset-2"
	>
		Skip to content
	</a>
	<div class="flex grow flex-col">
		{@render children()}
	</div>
	<Footer />
</div>

{#if showCopilot}
	{#if ai.desktopOpen}
		<aside
			class="fixed top-0 right-0 z-40 hidden h-dvh p-2.5 lg:block lg:w-[26rem] xl:w-[28rem]"
			transition:fly={{ x: 448, duration: motionDuration("base"), opacity: 1 }}
		>
			<AiSidebar onClose={ai.closeDesktop} />
		</aside>
	{/if}

	<!-- AiMobileFab must precede AiDesktopLauncher: the mobile sheet restores focus via
		querySelector('[aria-label="Open AI chat"]'), which returns the first match in DOM order. -->
	<AiMobileFab />
	<AiDesktopLauncher />
	<AiMobileSheet />
	<AiConfirmDialog />
{/if}
