import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  variant?: "primary" | "multi" | "ghost";
  className?: string;
}

export function Eyebrow({
  children,
  variant = "primary",
  className,
}: EyebrowProps) {
  if (variant === "ghost") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-muted-foreground",
          className,
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide",
        "bg-primary-soft text-primary-deep border border-primary/20",
        className,
      )}
    >
      {variant === "primary" && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      )}
      {children}
    </span>
  );
}

export function YellowTape({
  className,
  rotation = -8,
}: {
  className?: string;
  rotation?: number;
}) {
  return (
    <div
      className={cn("absolute w-12 h-7 bg-tape", className)}
      style={{
        transform: `rotate(${rotation}deg)`,
        boxShadow: "0 2px 6px rgba(0,0,0,.18)",
      }}
    />
  );
}
