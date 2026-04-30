"use client";

import { useCallback, useRef } from "react";
import { Modal } from "./Modal";
import { BrutalButton } from "./BrutalButton";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel}>
      <div style={{ paddingTop: 8 }}>
        <h2
          style={{
            fontFamily: "'Karantina', 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 26,
            color: "var(--ink)",
            marginBottom: description ? 8 : 24,
            textAlign: "right",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              fontSize: 14,
              color: "hsl(var(--muted-foreground))",
              marginBottom: 24,
              textAlign: "right",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}

        {/* RTL: destructive action on right side visually = first in DOM with dir=rtl */}
        <div style={{ display: "flex", gap: 10 }}>
          <BrutalButton
            variant={destructive ? "destructive" : "primary"}
            size="md"
            fullWidth
            onClick={onConfirm}
          >
            {confirmLabel}
          </BrutalButton>
          <BrutalButton
            variant="ghost"
            size="md"
            fullWidth
            onClick={onCancel}
          >
            {cancelLabel}
          </BrutalButton>
        </div>
      </div>
    </Modal>
  );
}

// ─── Promise-based helper ──────────────────────────────────────────────────────

// Usage:
//   const confirmed = await confirmDialog({ title: "למחוק?", destructive: true });

type ConfirmOptions = Omit<ConfirmDialogProps, "onConfirm" | "onCancel">;

/**
 * Mount a ConfirmDialog imperatively and return a Promise<boolean>.
 * Requires that <ConfirmDialogHost /> is rendered somewhere in the tree
 * (or use the hook approach instead).
 *
 * Simple alternative: just manage `showConfirm` state in the parent and
 * render <ConfirmDialog> conditionally — that's the pattern we use in this app.
 */
export function useConfirm() {
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => resolveRef.current?.(true), []);
  const handleCancel  = useCallback(() => resolveRef.current?.(false), []);

  return { confirm, handleConfirm, handleCancel };
}
