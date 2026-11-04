export const FIELD_CONTEXT = Symbol("dropout-field");

export type FieldControlProps = {
	id: string;
	"aria-describedby"?: string;
	"aria-invalid"?: "true";
	"aria-required"?: "true";
	required: boolean;
	disabled: boolean;
};

export type FieldContext = {
	readonly props: FieldControlProps;
};

export const mergeDescribedBy = (...values: Array<string | null | undefined>) => {
	const ids = values.flatMap((value) => value?.split(/\s+/) ?? []).filter(Boolean);
	return [...new Set(ids)].join(" ") || undefined;
};
