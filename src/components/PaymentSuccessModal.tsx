"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "./Modal";
import { BrutalButton } from "./BrutalButton";
import { Confetti } from "./Confetti";

interface PaymentSuccessModalProps {
  onClose: () => void;
}

const REDIRECT_SECONDS = 3;

export function PaymentSuccessModal({ onClose }: PaymentSuccessModalProps) {
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          // Remove ?paid=1 from URL and stay on /templates
          const url = new URL(window.location.href);
          url.searchParams.delete("paid");
          window.history.replaceState({}, "", url.toString());
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onClose]);

  const handleNow = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const url = new URL(window.location.href);
    url.searchParams.delete("paid");
    window.history.replaceState({}, "", url.toString());
    onClose();
  };

  return (
    <Modal variant="success" onClose={handleNow}>
      {/* Confetti — absolute, positioned over the modal card */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <Confetti />
      </div>

      {/* Green check circle */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: "hsl(var(--primary))",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "8px auto 20px",
          border: "2.5px solid var(--ink)",
          boxShadow: "var(--shadow-brutal-md)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Check size={48} strokeWidth={3} />
      </div>

      <h2
        style={{
          fontFamily: "'Karantina', 'Heebo', sans-serif",
          fontWeight: 700,
          fontSize: 40,
          textAlign: "center",
          color: "var(--ink)",
          marginBottom: 6,
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
        }}
      >
        תודה!
      </h2>
      <p style={{ textAlign: "center", fontSize: 14, color: "hsl(var(--muted-foreground))", marginBottom: 4, position: "relative", zIndex: 1 }}>
        קיבלת גישה מלאה למדבקות.
      </p>
      <p style={{ textAlign: "center", fontSize: 12, color: "hsl(var(--muted-foreground))", marginBottom: 24, position: "relative", zIndex: 1 }}>
        קבלה נשלחה לאימייל שלך.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
        <BrutalButton variant="primary" fullWidth size="md" onClick={handleNow}>
          חוזרים לעורך בעוד {countdown}...
        </BrutalButton>
        <BrutalButton variant="ghost" fullWidth size="md" onClick={handleNow}>
          ← חזרה לעורך עכשיו
        </BrutalButton>
      </div>
    </Modal>
  );
}
