"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a sticky top banner when the device goes offline.
 * Listens to navigator.onLine + online/offline events.
 * Respects SSR (defaults to online — no flash on server render).
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Sync with real browser state after hydration
    setIsOffline(!navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        background: "hsl(var(--warning-bg))",
        color: "hsl(var(--warning))",
        borderBottom: "2px solid hsl(var(--warning))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "'Heebo', sans-serif",
        textAlign: "center",
      }}
    >
      <WifiOff size={16} aria-hidden />
      אין חיבור לאינטרנט — חלק מהפעולות לא יעבדו
    </div>
  );
}
