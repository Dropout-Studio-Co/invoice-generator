export const FIELD_CONTEXT = Symbol("dropout-field");

export type FieldControlProps = {
	id: string;
	"aria-describedby"?: string | undefined;
	"aria-invalid"?: "true" | undefined;
	"aria-required"?: "true" | undefined;
	required?: boolean | undefined;
	disabled?: boolean | undefined;
};

export type FieldContext = {
	readonly props: FieldControlProps;
};

export const mergeDescribedBy = (...values: Array<string | null | undefined>) => {
	const ids = values.flatMap((value) => value?.split(/\s+/) ?? []).filter(Boolean);
	return [...new Set(ids)].join(" ") || undefined;
};
