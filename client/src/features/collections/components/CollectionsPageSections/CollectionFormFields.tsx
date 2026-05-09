import type {
  ComponentProps,
  ReactElement,
  TextareaHTMLAttributes,
} from "react";

import type { CollectionOption } from "../../utils/collectionPresentation";

interface TextFieldProps
  extends Omit<ComponentProps<"input">, "onChange" | "value"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function TextField({
  id,
  label,
  value,
  onValueChange,
  className = "",
  ...inputProps
}: TextFieldProps): ReactElement {
  return (
    <label
      htmlFor={id}
      className="flex flex-col gap-2 text-sm font-semibold text-primary-gray"
    >
      {label}
      <input
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={`field w-full bg-secondary-black/80 text-primary-white placeholder:text-primary-gray ${className}`}
        {...inputProps}
      />
    </label>
  );
}

interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function TextareaField({
  id,
  label,
  value,
  onValueChange,
  className = "",
  ...textareaProps
}: TextareaFieldProps): ReactElement {
  return (
    <label
      htmlFor={id}
      className="flex flex-col gap-2 text-sm font-semibold text-primary-gray"
    >
      {label}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={`field min-h-24 w-full resize-y bg-secondary-black/80 text-primary-white placeholder:text-primary-gray ${className}`}
        {...textareaProps}
      />
    </label>
  );
}

interface SegmentedFieldProps<TValue extends string> {
  legend: string;
  name: string;
  value: TValue;
  options: readonly CollectionOption<TValue>[];
  disabled?: boolean;
  onChange: (value: TValue) => void;
}

export function SegmentedField<TValue extends string>({
  legend,
  name,
  value,
  options,
  disabled = false,
  onChange,
}: SegmentedFieldProps<TValue>): ReactElement {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="text-sm font-semibold text-primary-gray">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-semibold transition ${
                isSelected
                  ? "border-accent bg-accent/15 text-primary-white shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]"
                  : "border-[var(--surface-glass-border)] bg-secondary-black/45 text-primary-gray hover:border-accent/60 hover:text-primary-white"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
