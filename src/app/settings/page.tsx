"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut, User, Globe } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrutalButton } from "@/components/BrutalButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function SettingsPage() {
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/");
  };

  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ background: "var(--cream)" }}
    >
      <Header variant="minimal" />

      <main dir="rtl">
        <div className="mx-auto max-w-xl px-5 py-8">
          {/* Page title */}
          <div
            className="mb-1 text-xs font-bold uppercase tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.55 }}
          >
            הגדרות
          </div>
          <h1
            className="mb-8"
            style={{
              fontFamily: "'Karantina', 'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            הגדרות
          </h1>

          <div className="flex flex-col gap-5">
            {/* Card: Profile */}
            <div
              className="p-6"
              style={{
                background: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 22,
                boxShadow: "6px 7px 0 var(--ink)",
              }}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <div
                  className="grid h-10 w-10 place-items-center"
                  style={{
                    background: "var(--cream)",
                    border: "2px solid var(--ink)",
                    borderRadius: 12,
                    boxShadow: "3px 4px 0 var(--ink)",
                  }}
                >
                  <User size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Karantina', 'Heebo', sans-serif",
                      fontWeight: 700,
                      fontSize: 24,
                      lineHeight: 1,
                    }}
                  >
                    פרופיל
                  </div>
                  {user?.primaryEmailAddress && (
                    <div className="text-[13px]" style={{ opacity: 0.6 }}>
                      {user.primaryEmailAddress.emailAddress}
                    </div>
                  )}
                </div>
              </div>
              <BrutalButton
                variant="secondary"
                size="sm"
                onClick={() => openUserProfile()}
              >
                עריכת פרופיל
              </BrutalButton>
            </div>

            {/* Card: Language */}
            <div
              className="p-6"
              style={{
                background: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 22,
                boxShadow: "6px 7px 0 var(--ink)",
              }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div
                  className="grid h-10 w-10 place-items-center"
                  style={{
                    background: "var(--cream)",
                    border: "2px solid var(--ink)",
                    borderRadius: 12,
                    boxShadow: "3px 4px 0 var(--ink)",
                  }}
                >
                  <Globe size={18} strokeWidth={2.4} />
                </div>
                <div
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: 1,
                  }}
                >
                  שפה
                </div>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-bold"
                style={{
                  background: "var(--cream)",
                  border: "1.5px solid var(--ink)",
                  borderRadius: 10,
                  opacity: 0.8,
                }}
              >
                🇮🇱 עברית
                <span style={{ opacity: 0.5, fontSize: 12 }}>(ברירת מחדל)</span>
              </div>
            </div>

            {/* Card: Sign out */}
            <div
              className="p-6"
              style={{
                background: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 22,
                boxShadow: "6px 7px 0 var(--ink)",
              }}
            >
              <div
                className="mb-3"
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: 1,
                }}
              >
                התנתקות
              </div>
              <p className="mb-4 text-[14px]" style={{ opacity: 0.65 }}>
                תצא מהחשבון במכשיר זה. הנתונים שלך נשמרים.
              </p>
              <BrutalButton
                variant="destructive"
                size="sm"
                iconLeft={<LogOut size={15} />}
                loading={signingOut}
                onClick={() => setShowSignOutConfirm(true)}
              >
                התנתק
              </BrutalButton>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="minimal" />

      {showSignOutConfirm && (
        <ConfirmDialog
          title="להתנתק?"
          description="תצא מהחשבון. תוכל להתחבר מחדש בכל עת."
          confirmLabel="כן, התנתק"
          cancelLabel="ביטול"
          destructive
          onConfirm={handleSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </div>
  );
}
