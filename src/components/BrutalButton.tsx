"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

export type BrutalButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "destructive";
export type BrutalButtonSize = "sm" | "md" | "lg" | "xl";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT_STYLES: Record<BrutalButtonVariant, string> = {
  primary:     "bg-primary text-white border-[var(--ink)] hover:bg-primary-deep",
  secondary:   "bg-white text-[var(--ink)] border-[var(--ink)] hover:bg-muted",
  dark:        "bg-[var(--ink)] text-[var(--cream)] border-[var(--ink)] hover:opacity-90",
  ghost:       "bg-transparent text-[var(--ink)] border-border-soft hover:bg-muted shadow-none",
  destructive: "bg-destructive text-white border-[var(--ink)] hover:opacity-90",
};

const SIZE_STYLES: Record<BrutalButtonSize, string> = {
  sm: "h-9  px-4 text-sm  gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-base gap-2",
  xl: "h-16 px-9 text-lg gap-2.5",
};

/**
 * BrutalButton — the single source of truth for all page-level CTAs.
 * Variants: primary (green) | secondary (white) | dark (black) | ghost | destructive.
 * Sizes: sm | md | lg | xl.
 * States: hover (lift), active (scale .97), disabled (opacity .5), loading (spinner).
 */
export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      iconLeft,
      iconRight,
      fullWidth,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center font-bold rounded-full",
          "border-[2.5px] brutal-sm",
          "transition-all duration-150 ease-out",
          "active:scale-[.97]",
          "focus-ring",
          "whitespace-nowrap cursor-pointer",
          /* hover lift — only when not ghost */
          variant !== "ghost" && "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:brutal-md",
          /* disabled state */
          "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            width={16}
            height={16}
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          iconLeft
        )}
        <span>{children}</span>
        {!loading && iconRight}
      </button>
    );
  }
);
BrutalButton.displayName = "BrutalButton";
