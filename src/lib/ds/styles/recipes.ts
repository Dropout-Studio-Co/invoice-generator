/**
 * Form + surface base-class consts — the hoisted vocabulary behind Dropout's
 * inputs, tiles, and pills. Exported so surfaces can be composed natively
 * (the way the live onboarding dialog does) as well as via the components.
 *
 * Contextual surfaces inherit a semantic fill from their immediate parent;
 * state feedback uses fills, foreground, and opacity rather than strokes.
 */

/** Text input / textarea. 16px on coarse inputs (no iOS zoom); contextual fill and the field-entry focus contract. */
export const inputBase =
	"field-control field-entry w-full text-base leading-6 placeholder:text-muted-foreground disabled:cursor-not-allowed aria-invalid:bg-destructive/20 aria-invalid:placeholder:text-foreground lg:pointer-fine:text-label lg:pointer-fine:leading-5";

/** Select triggers and native selects. Fill focus, not the text-entry ring. */
export const selectBase =
	"field-control w-full text-base leading-6 placeholder:text-muted-foreground focus-visible:bg-focus-surface focus-visible:text-focus-foreground disabled:cursor-not-allowed aria-invalid:bg-destructive/20 aria-invalid:placeholder:text-foreground lg:pointer-fine:text-label lg:pointer-fine:leading-5";

/** Field label — uppercase, micro. */
export const labelBase = "mb-2.5 block text-micro text-muted-foreground uppercase";

/**
 * Prose roles — one canonical class per role so surfaces stop hand-picking
 * text-sm / text-xs / text-body interchangeably. Fixed sizes (body copy doesn't
 * need to scale; the problem is consistency, not responsiveness). Compose with
 * layout via cn(), e.g. cn(bodyBase, "max-w-prose mt-2").
 */
/** Body copy / paragraphs / page intros. */
export const bodyBase = "text-body leading-body text-foreground";
/** Muted helper / hint / description text (under a field or section header). */
export const helperBase = "text-caption leading-relaxed text-muted-foreground text-pretty";
/** Quiet metadata — timestamps, counts, secondary table data. */
export const metaBase = "text-caption text-muted-foreground tabular-nums";

/** Selectable tile (radio/checkbox surface). Compose with selected/unselected. */
export const tileBase =
	"rounded-control p-3 text-left transition-colors duration-base ease-standard focus-visible:bg-focus-surface focus-visible:text-focus-foreground active:opacity-90";
export const tileSelected = "surface-2 font-semibold text-foreground";
export const tileUnselected = "surface-control hover:surface-control-hover";

/** Choice pill (compact selectable chip). */
export const pillBase =
	"inline-flex max-w-full min-w-0 items-center justify-center rounded-full px-4 py-2 text-micro text-center wrap-anywhere uppercase transition-colors duration-base ease-standard focus-visible:bg-focus-surface focus-visible:text-focus-foreground pointer-coarse:min-h-11";
export const pillSelected = "bg-signal font-semibold text-background";
export const pillUnselected =
	"surface-control text-muted-foreground hover:surface-control-hover hover:text-foreground";
