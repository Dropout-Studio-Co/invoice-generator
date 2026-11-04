/**
 * The canonical `tailwind-variants` factory for the system.
 *
 * tailwind-variants v4 ships its own compiled tables in the default entry, which
 * do not know the Dropout type scale: `text-caption` and `text-background` would
 * be classified together and one would be dropped. The lite entry has no table of
 * its own and accepts an injected merger, so this factory injects the very same
 * `tailwind-merge` instance `cn()` uses (see `./utils`).
 *
 * One engine, one table, one result — for recipes and for `cn()` call sites alike.
 * Import `tv` from here, never from `tailwind-variants` directly.
 */
import { createTV } from "tailwind-variants/lite";
import { twMerge } from "./utils";

export const tv = createTV({ twMerge });
