"use client";

const COLORS = [
  "hsl(var(--sticker-pink))",
  "hsl(var(--sticker-yellow))",
  "hsl(var(--primary))",
  "hsl(var(--sticker-blue))",
  "hsl(var(--sticker-orange))",
  "hsl(var(--sticker-magenta))",
  "hsl(var(--sticker-cyan))",
  "hsl(var(--sticker-lime))",
];

const PARTICLE_COUNT = 24;

export function Confetti() {
  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const distance = 90 + (i % 3) * 30;
        const cx = Math.cos(angle) * distance;
        const cy = Math.sin(angle) * distance;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              top: "50%",
              left: "50%",
              background: color,
              // CSS custom props for the keyframe animation
              ["--cx" as string]: `${cx}px`,
              ["--cy" as string]: `${cy}px`,
              animationDelay: `${i * 25}ms`,
              animationDuration: "1400ms",
            }}
          />
        );
      })}
    </>
  );
}
