"use client";

interface ProgressBarStripesProps {
  step: number;
  totalSteps: number;
  percent: number;
  label?: string;
}

export function ProgressBarStripes({
  step,
  totalSteps,
  percent,
}: ProgressBarStripesProps) {
  return (
    <div>
      {/* Bar */}
      <div
        style={{
          height: 14,
          borderRadius: 999,
          border: "2px solid var(--ink)",
          background: "hsl(var(--checker-a))",
          overflow: "hidden",
        }}
      >
        <div
          className="progress-stripes"
          style={{
            height: "100%",
            width: `${percent}%`,
            transition: "width 500ms ease",
            borderRadius: 999,
          }}
        />
      </div>

      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <span>שלב {step} מתוך {totalSteps}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{percent}%</span>
      </div>
    </div>
  );
}
