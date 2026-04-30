"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ─── Theme maps ───────────────────────────────────────────────────────────────

const VARIANT_BG: Record<ToastVariant, string> = {
  success: "#22C55E",  // brand green
  error:   "#EF4444",
  info:    "#3B82F6",
  warning: "#F59E0B",
};

const VARIANT_ICON_BG: Record<ToastVariant, string> = {
  success: "#16A34A",
  error:   "#DC2626",
  info:    "#2563EB",
  warning: "#D97706",
};

const VARIANT_ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={22} strokeWidth={2.5} />,
  error:   <AlertCircle  size={22} strokeWidth={2.5} />,
  info:    <Info         size={22} strokeWidth={2.5} />,
  warning: <AlertTriangle size={22} strokeWidth={2.5} />,
};

const VARIANT_ROLE: Record<ToastVariant, "status" | "alert"> = {
  success: "status",
  error:   "alert",
  info:    "status",
  warning: "alert",
};

// ─── Single Toast card ────────────────────────────────────────────────────────

function ToastCard({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  // Animate in after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => onRemove(item.id), 4000);
  }, [item.id, onRemove]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const bg = VARIANT_BG[item.variant];
  const iconBg = VARIANT_ICON_BG[item.variant];

  return (
    <div
      role={VARIANT_ROLE[item.variant]}
      aria-live={item.variant === "error" || item.variant === "warning" ? "assertive" : "polite"}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      style={{
        background: bg,
        border: "2.5px solid var(--ink)",
        borderRadius: 16,
        boxShadow: "4px 5px 0 var(--ink)",
        padding: "12px 12px 12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        direction: "rtl",
        color: "#fff",
        maxWidth: 360,
        width: "100%",
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        opacity: visible ? 1 : 0,
        transition: "transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease",
        pointerEvents: "auto",
      }}
    >
      {/* Icon square */}
      <div
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          background: iconBg,
          border: "2px solid rgba(255,255,255,0.25)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        {VARIANT_ICON[item.variant]}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
          {item.title}
        </div>
        {item.description && (
          <div style={{ fontWeight: 400, fontSize: 13, marginTop: 3, opacity: 0.9, lineHeight: 1.4 }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="סגור"
        style={{
          width: 28,
          height: 28,
          flexShrink: 0,
          background: "rgba(255,255,255,0.18)",
          border: "1.5px solid rgba(255,255,255,0.35)",
          borderRadius: 7,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          marginTop: 2,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Provider + container ─────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (title, description) => addToast({ variant: "success", title, description }),
    error:   (title, description) => addToast({ variant: "error",   title, description }),
    info:    (title, description) => addToast({ variant: "info",    title, description }),
    warning: (title, description) => addToast({ variant: "warning", title, description }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast portal — top-center mobile, top-right desktop */}
      <div
        aria-label="התראות"
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
          width: "calc(100% - 32px)",
          maxWidth: 360,
        }}
        className="sm:left-auto sm:right-16 sm:transform-none"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
