<!-- Small icon + DS Eyebrow (mono, uppercase, wide-tracked) above a form section heading. -->
<script lang="ts">
	import type { LucideIcon } from "@lucide/svelte";
	import { Eyebrow } from "$lib/ds";

	// LucideIcon is the exported "an icon component" type (`Component<LucideProps>`). Do not use
	// `ComponentProps<typeof Icon>`: the generic Icon takes a discriminated icon/iconNode union,
	// which concrete icons do not satisfy.
	let { icon: Icon, label }: { icon: LucideIcon; label: string } = $props();
</script>

<div class="flex items-center gap-2">
	<Icon size={13} class="text-ink-muted" aria-hidden="true" />
	<Eyebrow>{label}</Eyebrow>
</div>
