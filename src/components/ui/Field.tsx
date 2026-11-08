import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./cx";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  full?: boolean;
  prefix?: ReactNode;
  inputClassName?: string;
  children?: ReactNode;
}

/** Campo de texto ou formulário com rótulo, prefixo opcional, dica e erro. */
export function Field({
  label,
  hint,
  error,
  full,
  prefix,
  id: externalId,
  className,
  inputClassName,
  children,
  ...inputProps
}: FieldProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const hintId = `${id}-hint`;

  return (
    <label className={cx("cc-field", full && "cc-field--full", className)} htmlFor={id}>
      <span className="cc-field__label">{label}</span>
      {children ?? (
        <span className={cx("cc-input", error && "cc-input--error")}>
          {prefix && <span className="cc-input__prefix">{prefix}</span>}
          <input
            id={id}
            className={cx("cc-input__text", inputClassName)}
            aria-invalid={!!error}
            aria-describedby={error || hint ? hintId : undefined}
            {...inputProps}
          />
        </span>
      )}
      {(error || hint) && (
        <span id={hintId} className={cx("cc-field__hint", error && "cc-field__hint--error")}>
          {error ?? hint}
        </span>
      )}
    </label>
  );
}
