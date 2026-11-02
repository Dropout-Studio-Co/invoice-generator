<!--
	Logged-out counterpart to <User>, rendered inline inside the invisible <Navbar>: a pill inviting
	(not forcing) sign-in. Auth is optional — guests build invoices with a full localStorage-backed
	workspace; signing in adds cross-device sync + the AI Copilot, and imports the guest data once.
	Mirrors the avatar's `sleek border-hair bg-card` treatment so the corner reads consistently.
-->
<script lang="ts">
	import { cn } from "$lib/utils";
	import { CloudUpload } from "@lucide/svelte";
</script>

<a
	href="/login"
	class={cn(
		"sleek border-hair bg-card text-foreground group flex h-10 touch-manipulation items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap backdrop-blur-sm",
		"transition-colors ease-[var(--ease)] active:scale-95 motion-reduce:transition-none",
		"pointer-fine:hover:border-signal/50 focus-visible:outline-signal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
	)}
>
	<CloudUpload
		class="text-ink-muted pointer-fine:group-hover:text-signal h-4 w-4 transition-colors"
		aria-hidden="true"
	/>
	<span class="hidden sm:inline">Sign in to sync</span>
	<span class="sm:hidden">Sign in</span>
</a>
