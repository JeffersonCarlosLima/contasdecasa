import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface CategoryChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `chart-1` … `chart-6`; omita para chips de pessoa (passe `leading`). */
  color?: string;
  leading?: ReactNode;
  pressed?: boolean;
}

export function CategoryChip({ color, leading, pressed = false, children, type = "button", ...rest }: CategoryChipProps) {
  return (
    <button type={type} className="cc-chip" aria-pressed={pressed} {...rest}>
      {leading ?? (color && <span className="cc-chip__dot" style={{ background: `var(--${color})` }} />)}
      {children}
    </button>
  );
}
