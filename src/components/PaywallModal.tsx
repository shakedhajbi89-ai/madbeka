"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check, Lock } from "lucide-react";
import { Modal } from "./Modal";
import { BrutalButton } from "./BrutalButton";

interface PaywallModalProps {
  onClose: () => void;
}

const PRICE = "₪29";

const FEATURES = [
  "יצירה ועריכה ללא הגבלה",
  "8 פונטים עבריים",
  "יצוא ישיר לוואטסאפ (WebP 512×512 שקוף)",
  "ללא חתימת מים",
  "עדכוני סגנונות לכל החיים",
];

export function PaywallModal({ onClose }: PaywallModalProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const goToCheckout = useCallback(async () => {
    const base = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL;
    if (!base || !userId) {
      setErrMsg("לא ניתן להתחיל את התשלום כרגע. נסה שוב עוד רגע.");
      return;
    }
    setLoading(true);
    setErrMsg("");
    try {
      const res = await fetch("/api/checkout/token", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`token request failed: ${res.status}`);
      const data = (await res.json()) as { token?: string };
      if (!data.token) throw new Error("no token in response");

      const url = new URL(base);
      url.searchParams.set("checkout[custom][user_token]", data.token);
      url.searchParams.set(
        "checkout[success_url]",
        `${window.location.origin}/templates?paid=1`,
      );
      url.searchParams.set("checkout[locale]", "he");
      window.location.href = url.toString();
    } catch (err) {
      console.error("[checkout] token fetch failed:", err);
      setErrMsg("לא ניתן להתחיל את התשלום כרגע. נסה שוב עוד רגע.");
      setLoading(false);
    }
  }, [userId]);

  return (
    <Modal variant="paywall" onClose={onClose}>
      {/* Lock icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "8px auto 16px",
          border: "2.5px solid rgba(255,255,255,0.2)",
        }}
      >
        <Lock size={24} />
      </div>

      <h2
        style={{
          fontFamily: "'Karantina', 'Heebo', sans-serif",
          fontWeight: 700,
          fontSize: 32,
          textAlign: "center",
          color: "#fff",
          marginBottom: 6,
          lineHeight: 1.1,
        }}
      >
        סיימת את 3 החינמיות
      </h2>
      <p
        style={{
          textAlign: "center",
          fontSize: 14,
          color: "rgba(255,255,255,0.82)",
          marginBottom: 20,
        }}
      >
        שדרג למצב מלא והמשך לבנות.
      </p>

      {/* Feature list */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {FEATURES.map((f) => (
          <li
            key={f}
            style={{
              background: "#fff",
              color: "var(--ink)",
              borderRadius: 10,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "hsl(var(--primary))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Check size={12} strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {/* Price */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <span
          style={{
            fontFamily: "'Karantina', 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 52,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {PRICE}
        </span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginRight: 8 }}>
          · חד-פעמי · לתמיד
        </span>
      </div>

      {/* CTA */}
      <BrutalButton
        variant="dark"
        fullWidth
        size="lg"
        loading={loading}
        onClick={goToCheckout}
      >
        🔐 שלם {PRICE} וקבל גישה מלאה
      </BrutalButton>

      {errMsg && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#fff", marginTop: 8 }}>
          {errMsg}
        </p>
      )}

      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "rgba(255,255,255,0.7)",
          marginTop: 10,
        }}
      >
        🔒 נשלם דרך Lemon Squeezy · מאובטח · ללא שאלות
      </p>
    </Modal>
  );
}
