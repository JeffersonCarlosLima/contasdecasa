import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
}

/** Um `primary` por tela. `danger` só para excluir. Ver docs/design/componentes/Button.md */
export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("cc-btn", `cc-btn--${variant}`, size === "sm" && "cc-btn--sm", className)}
      {...rest}
    />
  );
}

export const buttonClass = (variant: Variant = "secondary", size: "md" | "sm" = "md") =>
  cx("cc-btn", `cc-btn--${variant}`, size === "sm" && "cc-btn--sm");
