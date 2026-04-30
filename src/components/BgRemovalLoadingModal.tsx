"use client";

import { Cloud, Scan, Scissors, Sparkles } from "lucide-react";
import { ProgressBarStripes } from "./ProgressBarStripes";

export type BgRemovalStage = 1 | 2 | 3 | 4;

interface BgRemovalLoadingModalProps {
  stage: BgRemovalStage;
  onCancel: () => void;
}

const STAGES = [
  {
    step: 1,
    Icon: Cloud,
    title: "טוען מודל פעם ראשונה...",
    sub: "כ-30 שניות, רק בפעם הראשונה",
    percent: 8,
  },
  {
    step: 2,
    Icon: Scan,
    title: "מנתח את התמונה...",
    sub: "מזהה גבולות ופריטים",
    percent: 35,
  },
  {
    step: 3,
    Icon: Scissors,
    title: "מסיר רקע...",
    sub: "מבודד את האובייקט",
    percent: 65,
  },
  {
    step: 4,
    Icon: Sparkles,
    title: "משייף קצוות...",
    sub: "מנקה את הפיקסלים האחרונים",
    percent: 92,
  },
] as const;

export function BgRemovalLoadingModal({ stage, onCancel }: BgRemovalLoadingModalProps) {
  const current = STAGES[stage - 1];
  const { Icon } = current;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 anim-scale-in"
      style={{
        background: "rgba(14,14,14,0.55)",
        backdropFilter: "blur(4px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="מסיר רקע"
      dir="rtl"
    >
      <div
        className="glow-bg"
        style={{
          width: 360,
          maxWidth: "100%",
          background: "hsl(var(--card))",
          border: "2.5px solid var(--ink)",
          borderRadius: "var(--radius-card-lg)",
          boxShadow: "var(--shadow-brutal-lg)",
          padding: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Stage icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "hsl(var(--primary))",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            border: "2.5px solid var(--ink)",
            boxShadow: "var(--shadow-brutal-md)",
          }}
        >
          <Icon size={28} />
        </div>

        <h3
          style={{
            fontFamily: "'Karantina', 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            textAlign: "center",
            color: "var(--ink)",
            marginBottom: 4,
          }}
        >
          {current.title}
        </h3>
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "hsl(var(--muted-foreground))",
            marginBottom: 20,
          }}
        >
          {current.sub}
        </p>

        <ProgressBarStripes
          step={current.step}
          totalSteps={4}
          percent={current.percent}
        />

        {/* Cancel */}
        <button
          onClick={onCancel}
          style={{
            width: "100%",
            height: 36,
            marginTop: 20,
            borderRadius: 999,
            border: "1.5px solid hsl(var(--border-soft))",
            background: "transparent",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            color: "var(--ink)",
          }}
        >
          ביטול
        </button>

        {/* Privacy banner */}
        <div
          style={{
            marginTop: 20,
            padding: "8px 12px",
            background: "rgba(244,196,48,0.2)",
            border: "1px solid rgba(244,196,48,0.4)",
            borderRadius: 10,
            fontSize: 11,
            color: "hsl(var(--foreground) / .8)",
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <span>💡</span>
          <span>הכול רץ אצלך במכשיר — שום דבר לא נשלח לשרת.</span>
        </div>
      </div>
    </div>
  );
}
