"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type ModalVariant = "default" | "paywall" | "success";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  variant?: ModalVariant;
  /** Extra class on the inner card */
  cardClassName?: string;
}

const VARIANT_BG: Record<ModalVariant, string> = {
  default: "hsl(var(--card))",
  paywall: "hsl(var(--primary))",
  success: "#fff",
};

const VARIANT_CLOSE_BG: Record<ModalVariant, string> = {
  default: "#fff",
  paywall: "rgba(15,14,12,0.25)",
  success: "#fff",
};

const VARIANT_CLOSE_COLOR: Record<ModalVariant, string> = {
  default: "var(--ink)",
  paywall: "#fff",
  success: "var(--ink)",
};

export function Modal({ children, onClose, variant = "default" }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap — focus the card on mount, return focus on unmount
  const previousFocus = useRef<Element | null>(null);
  useEffect(() => {
    previousFocus.current = document.activeElement;
    cardRef.current?.focus();
    return () => {
      (previousFocus.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-4 anim-scale-in"
      style={{
        background: "rgba(14,14,14,0.55)",
        backdropFilter: "blur(4px)",
      }}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: VARIANT_BG[variant],
          border: "2.5px solid var(--ink)",
          boxShadow: "var(--shadow-brutal-lg)",
          borderRadius: "var(--radius-modal)",
          maxWidth: 480,
          width: "100%",
          padding: 28,
          position: "relative",
          outline: "none",
          overflow: "hidden",
        }}
      >
        {/* Close button — top-LEFT in RTL = visual top-right */}
        <button
          onClick={onClose}
          aria-label="סגור"
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            width: 28,
            height: 28,
            background: VARIANT_CLOSE_BG[variant],
            border: "2px solid var(--ink)",
            borderRadius: 7,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: VARIANT_CLOSE_COLOR[variant],
          }}
        >
          <X size={14} />
        </button>

        {children}
      </div>
    </div>
  );
}
