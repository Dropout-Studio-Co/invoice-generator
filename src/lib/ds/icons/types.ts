export type IconSize = number | string;

export type IconProps = {
	size?: IconSize;
	color?: string;
	strokeWidth?: number;
	animate?: boolean;
	class?: string;
	label?: string;
};

export type BrandIconProps = Omit<IconProps, "strokeWidth" | "animate">;
