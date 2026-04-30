"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  /** Width in px or CSS string. Default: "100%" */
  width?: number | string;
  /** Height in px or CSS string. Default: 20 */
  height?: number | string;
  /** Border radius. Default: 12 */
  radius?: number | string;
}

/**
 * Generic brutal-style skeleton tile.
 *
 * Shimmer animation respects prefers-reduced-motion — falls back to a
 * static muted block so the UI still communicates "loading" without motion.
 */
export function Skeleton({ className, width = "100%", height = 20, radius = 12 }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="טוען..."
      className={cn("skeleton-shimmer", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: typeof radius === "number" ? `${radius}px` : radius,
        background: "rgba(15,14,12,0.08)",
        border: "2px solid rgba(15,14,12,0.10)",
        overflow: "hidden",
        position: "relative",
      }}
    />
  );
}

/** 6 sticker-tile skeletons for the gallery grid */
export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden"
          style={{
            background: "rgba(15,14,12,0.04)",
            border: "2.5px solid rgba(15,14,12,0.10)",
            borderRadius: 20,
            boxShadow: "5px 6px 0 rgba(15,14,12,0.07)",
          }}
        >
          <Skeleton
            className="aspect-square w-full"
            height="100%"
            radius="0"
          />
          <div className="flex items-center justify-between px-3 py-2.5">
            <Skeleton width={60} height={10} radius={6} />
            <Skeleton width={36} height={10} radius={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 4 skeleton rows for account history table */
export function HistorySkeleton() {
  return (
    <div
      style={{
        background: "#fff",
        border: "2.5px solid rgba(15,14,12,0.12)",
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      {/* header row */}
      <div
        className="hidden grid-cols-[60px_1fr_1.2fr_1fr_80px] gap-4 px-5 py-3 sm:grid"
        style={{ background: "rgba(15,14,12,0.04)", borderBottom: "2px solid rgba(15,14,12,0.10)" }}
      >
        {[40, 80, 100, 70, 50].map((w, i) => (
          <Skeleton key={i} width={w} height={10} radius={5} />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="grid items-center gap-4 px-5 py-3.5 sm:grid-cols-[60px_1fr_1.2fr_1fr_80px]"
          style={{ borderBottom: i < 3 ? "1.5px dashed rgba(15,14,12,0.10)" : "none" }}
        >
          <Skeleton width={44} height={44} radius={10} />
          <Skeleton width="70%" height={18} radius={8} />
          <Skeleton width={90} height={12} radius={6} />
          <Skeleton width={50} height={12} radius={6} />
          <div className="hidden justify-end sm:flex">
            <Skeleton width={60} height={30} radius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}
