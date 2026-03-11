import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

/**
 * Shared button component. Will be replaced with shadcn/ui Button
 * once Tailwind CSS is configured in Phase 1.
 */
export function Button({ variant = "primary", size = "md", children, ...props }: ButtonProps) {
  return (
    <button data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  );
}
