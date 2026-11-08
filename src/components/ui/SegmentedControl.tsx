import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: ReadonlyArray<SegmentedOption<T> | T>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

/** Controle segmentado. Ver docs/design/cc-theme.css (.cc-seg) e Login.dc.html */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  label,
  name,
  className,
  style,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cx("cc-seg", className)}
      role="group"
      aria-label={label}
      style={style}
    >
      {options.map((opt) => {
        const item: SegmentedOption<T> =
          typeof opt === "string" ? { value: opt as T, label: opt } : opt;
        const isSelected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled || item.disabled}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
