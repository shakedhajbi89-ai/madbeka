"use client";

import { cn } from "@/lib/utils";

export type StickerColor =
  | "pink"
  | "magenta"
  | "yellow"
  | "orange"
  | "red"
  | "blue"
  | "cyan"
  | "lime"
  | "green";

const colorMap: Record<StickerColor, string> = {
  pink: "hsl(var(--sticker-pink))",
  magenta: "hsl(var(--sticker-magenta))",
  yellow: "hsl(var(--sticker-yellow))",
  orange: "hsl(var(--sticker-orange))",
  red: "hsl(var(--sticker-red))",
  blue: "hsl(var(--sticker-blue))",
  cyan: "hsl(var(--sticker-cyan))",
  lime: "hsl(var(--sticker-lime))",
  green: "hsl(var(--primary))",
};

interface StickerTileProps {
  word: string;
  color?: StickerColor;
  rotation?: number;
  withTape?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  selected?: boolean;
  className?: string;
  float?: boolean;
}

const sizeMap = {
  sm: { tile: "w-24 h-24", word: "text-2xl" },
  md: { tile: "w-36 h-36", word: "text-4xl" },
  lg: { tile: "w-52 h-52", word: "text-5xl" },
  xl: { tile: "w-72 h-72", word: "text-7xl" },
};

export function StickerTile({
  word,
  color = "green",
  rotation = 0,
  withTape = false,
  size = "md",
  selected = false,
  className,
  float = false,
}: StickerTileProps) {
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center brutal-card checker-bg shrink-0",
        s.tile,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        float && "float-tile",
        className,
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        ["--r" as string]: `${rotation}deg`,
      }}
    >
      {withTape && (
        <div
          className="absolute -top-3 right-1/4 w-10 h-6 bg-tape opacity-90"
          style={{
            transform: "rotate(-8deg)",
            boxShadow: "0 2px 4px rgba(0,0,0,.15)",
          }}
        />
      )}
      <span
        className={cn("sticker-word", s.word)}
        style={{ color: colorMap[color] }}
      >
        {word}
      </span>
    </div>
  );
}
