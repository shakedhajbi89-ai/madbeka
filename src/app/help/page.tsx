"use client";

import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const FAQS = [
  {
    q: "איך אני יוצר מדבקה?",
    a: "עבור לעמוד העורך, הקלד את הטקסט שלך, בחר סגנון ופונט, ולחץ על 'שמור'. המדבקה תישמר בגלריה שלך ותוכל לשתף אותה ישירות לוואטסאפ.",
  },
  {
    q: "איך מוסיפים מדבקה לוואטסאפ?",
    a: "לחץ על כפתור 'שתף' ליד המדבקה. האפליקציה תפתח את וואטסאפ עם קובץ ה-WebP המוכן. שלח אותו לכל שיחה — וואטסאפ יטפל בו כמדבקה.",
  },
  {
    q: "מה ההבדל בין חינם לתוכנית בתשלום?",
    a: "בחינם יש לך 3 מדבקות. לאחר שדרוג ב-₪35 חד-פעמי, תוכל ליצור מדבקות ללא הגבלה עם כל הפונטים, הסגנונות, והסרת רקע מתמונות.",
  },
  {
    q: "איך מבקשים החזר?",
    a: "יש לנו מדיניות החזר מלא תוך 14 יום מהרכישה, כל עוד יצרת פחות מ-5 מדבקות בתשלום. פנה אלינו ל-hello@madbekaapp.co.il ונטפל בהחזר תוך 5–7 ימי עסקים.",
  },
  {
    q: "אילו פורמטים נתמכים?",
    a: "המדבקות מיוצאות כ-WebP שקוף — הפורמט הרשמי של מדבקות וואטסאפ. תוכל גם להוריד כ-PNG שקוף לשימוש עצמאי.",
  },
  {
    q: "האם המדבקות עובדות באייפון?",
    a: "כן. WebP נתמך ב-iOS 14+ ווואטסאפ עובד עם מדבקות בפורמט זה. אם יש בעיה, וודא שוואטסאפ שלך מעודכן.",
  },
  {
    q: "מה לעשות אם השיתוף נכשל?",
    a: "אם שיתוף ישיר לא עובד בדפדפן שלך, השתמש בכפתור 'הורד' ואז שלח את הקובץ ידנית מוואטסאפ. ב-Chrome Android השיתוף הישיר עובד בצורה הטובה ביותר.",
  },
  {
    q: "איך פונים לתמיכה?",
    a: "שלח מייל ל-hello@madbekaapp.co.il. אנחנו עונים בדרך כלל תוך יום עסקים.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "#fff",
        border: "2.5px solid var(--ink)",
        borderRadius: 18,
        boxShadow: open ? "6px 7px 0 var(--ink)" : "4px 5px 0 var(--ink)",
        transition: "box-shadow 150ms ease",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-right"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Heebo', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          color: "var(--ink)",
        }}
        aria-expanded={open}
      >
        <span style={{ flex: 1, textAlign: "right" }}>{q}</span>
        <span
          aria-hidden
          style={{
            display: "flex",
            transition: "transform 200ms ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={18} />
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: "0 20px 18px",
            fontSize: 15,
            lineHeight: 1.65,
            opacity: 0.8,
            borderTop: "1.5px dashed rgba(15,14,12,0.15)",
            paddingTop: 14,
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ background: "var(--cream)" }}
    >
      <Header variant="minimal" />

      <main dir="rtl">
        <div className="mx-auto max-w-2xl px-5 py-8">
          <div
            className="mb-1 text-xs font-bold uppercase tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.55 }}
          >
            עזרה
          </div>
          <h1
            className="mb-2"
            style={{
              fontFamily: "'Karantina', 'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            שאלות נפוצות
          </h1>
          <p className="mb-8 text-[15px] font-bold" style={{ opacity: 0.65 }}>
            לא מצאת תשובה? שלח לנו מייל ונענה תוך יום עסקים.
          </p>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>

          {/* Contact CTA */}
          <div
            className="mt-10 flex items-center gap-4 p-6"
            style={{
              background: "var(--ink)",
              color: "var(--cream)",
              border: "2.5px solid var(--ink)",
              borderRadius: 22,
              boxShadow: "6px 7px 0 var(--wa)",
            }}
          >
            <div
              className="grid h-12 w-12 place-items-center"
              style={{
                background: "var(--wa)",
                border: "2px solid var(--cream)",
                borderRadius: 14,
                boxShadow: "3px 4px 0 var(--cream)",
                flexShrink: 0,
              }}
            >
              <Mail size={22} color="#fff" strokeWidth={2.4} />
            </div>
            <div className="flex-1">
              <div
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                עדיין יש שאלה?
              </div>
              <a
                href="mailto:hello@madbekaapp.co.il"
                className="text-[14px] font-bold underline"
                style={{ color: "var(--wa)", opacity: 0.9 }}
              >
                hello@madbekaapp.co.il
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
