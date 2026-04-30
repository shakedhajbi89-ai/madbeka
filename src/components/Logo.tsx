import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<LogoSize, number> = {
  sm: 32,
  md: 48,
  lg: 80,
};

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

/**
 * Madbeka logo — black square, white "מ", green underglow, yellow ✦ star.
 * Uses size prop ("sm" | "md" | "lg") → 32 / 48 / 80 px.
 */
export function Logo({ size = "md", className }: LogoProps) {
  const px = SIZE_MAP[size];
  const radius = Math.round(px * 0.22);

  return (
    <div
      className={cn("relative inline-block flex-shrink-0", className)}
      style={{ width: px, height: px }}
      aria-hidden
    >
      {/* Green underglow — offset square behind the black tile */}
      <div
        className="absolute"
        style={{
          inset: 0,
          borderRadius: radius,
          background: "hsl(var(--primary))",
          transform: `translate(${Math.round(px * 0.08)}px, ${Math.round(px * 0.08)}px)`,
        }}
      />
      {/* Black tile */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          borderRadius: radius,
          background: "var(--ink)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heebo), 'Heebo', system-ui, sans-serif",
            fontWeight: 900,
            fontSize: Math.round(px * 0.55),
            lineHeight: 1,
            color: "var(--cream)",
          }}
        >
          מ
        </span>
      </div>
      {/* Yellow ✦ star — top-left corner */}
      <span
        className="absolute pointer-events-none select-none"
        style={{
          top: -Math.round(px * 0.08),
          left: -Math.round(px * 0.05),
          fontSize: Math.round(px * 0.3),
          color: "var(--tape-yellow)",
          lineHeight: 1,
        }}
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}
