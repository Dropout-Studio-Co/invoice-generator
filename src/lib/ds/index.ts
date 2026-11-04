/**
 * Dropout DS — private vendored entry point.
 *
 * Authorized consumers use this barrel for canonical controls, Dropout language,
 * reusable compositions, and compatibility aliases. Import tokens once from
 * `styles/tokens.css`; advanced anatomy lives under the explicit `ui` entry.
 */
export { cn } from "./utils";
export { Button, buttonVariants } from "./ui/button";
export { default as Input } from "./ui/input/input.svelte";
export { default as Textarea } from "./ui/textarea/textarea.svelte";
export {
	Alert,
	Checkbox,
	Combobox,
	DataTable,
	Dialog,
	EmptyState,
	Field,
	MultiSelect,
	NativeSelect,
	Radio,
	Select,
	Spinner
} from "./ui";
export { Cta, Eyebrow, Heading, IconButton, StatusBadge, Tile } from "./signature";
export { SettingsActions, SettingsRow, SettingsSaveBar, SettingsSection } from "./patterns";
export { IconTrigger } from "./icons";
export * as BrandIcons from "./icons/brand";
export * as CustomIcons from "./icons/custom";
export * as MovingIcons from "./icons/moving";
export type { BrandIconProps, IconProps, IconSize } from "./icons/types";
export {
	AlertDialog,
	Badge,
	Breadcrumb,
	Card,
	CheckboxPrimitive,
	Command,
	ContextMenu,
	DialogPrimitive,
	Drawer,
	DropdownMenu,
	InputGroup,
	InputOTP,
	Pagination,
	Popover,
	Progress,
	RadioGroup,
	Sheet,
	Skeleton,
	Sonner,
	Switch,
	Table,
	Tabs,
	Tooltip
} from "./ui";
export { motion, prefersReducedMotion } from "./motion";
export {
	inputBase,
	labelBase,
	bodyBase,
	helperBase,
	metaBase,
	tileBase,
	tileSelected,
	tileUnselected,
	pillBase,
	pillSelected,
	pillUnselected
} from "./styles/recipes";
