"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <button
      onClick={() => signOut(() => router.push("/"))}
      className="press-active inline-flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold"
      style={{
        background: "transparent",
        color: "var(--ink)",
        border: "2px solid var(--ink)",
        borderRadius: 12,
        cursor: "pointer",
      }}
    >
      <LogOut size={14} />
      התנתק
    </button>
  );
}
