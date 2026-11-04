import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge configured with the Dropout custom type scale.
 *
 * Without this, twMerge can't tell `text-micro`/`text-subtitle`/… are font
 * *sizes* — they aren't t-shirt sizes or arbitrary lengths, so they fall through
 * to the catch-all `text-{color}` group. The result: any class list that merges a
 * custom size with a color (e.g. an `Eyebrow`'s `text-micro` + `text-ink-muted`)
 * silently drops the size and the element falls back to the inherited font size.
 *
 * Registering the scale's literals under `font-size` makes them win over the
 * color validator (a literal class part outranks a validator in the class map),
 * so size and color coexist. Keep this list in sync with the `--text-*` tokens in
 * `tokens.css`.
 */
/**
 * The custom-type-scale config for tailwind-merge. Exported so the shared
 * `tailwind-variants` factory in `./tv` can inject the SAME merger — tv's own
 * default tables would otherwise collapse a custom font-size (e.g.
 * `text-caption`) together with a color (e.g. `text-background`) and drop one of
 * them. One config, one engine, everywhere.
 */
export const twMergeConfig = {
	extend: {
		classGroups: {
			"font-size": [
				{
					text: [
						"micro",
						"caption",
						"label",
						"body",
						"body-lg",
						"button",
						"lead",
						"subtitle",
						"title-sm",
						"title",
						"title-lg",
						"display",
						"hero"
					]
				}
			]
		}
	}
};

/**
 * The single Tailwind conflict resolver for the system: `tailwind-merge`
 * extended with the Dropout type scale. Exported so `tv()` (see `./tv`) runs the
 * identical table as `cn()`.
 */
export const twMerge = extendTailwindMerge(twMergeConfig);

/**
 * Merge class lists with Tailwind conflict resolution.
 * @see https://github.com/dcastil/tailwind-merge
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Keep keyboard focus inside a scrollable overlay visible without moving the page. */
export const revealFocusedElement = (event: FocusEvent) => {
	const target = event.target;
	if (target instanceof HTMLElement) target.scrollIntoView({ block: "nearest", inline: "nearest" });
};

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
