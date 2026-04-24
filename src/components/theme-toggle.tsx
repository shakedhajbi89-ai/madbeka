"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "madbeka:theme";

/**
 * Reads the user's persisted choice first, then falls back to the OS's
 * prefers-color-scheme. Applies the theme to <html> immediately so there is no
 * flash of wrong theme between the inline script (see layout.tsx) and React
 * hydration.
 */
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initial mount — read + apply. Deferred to microtask so no state changes in
  // the effect body (react-hooks/set-state-in-effect friendly).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const initial = readInitialTheme();
      applyTheme(initial);
      setTheme(initial);
      setMounted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  // Avoid hydration mismatch — until we've read the stored choice, render a
  // static placeholder with identical dimensions.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="החלף מצב כהה"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <span className="text-lg" aria-hidden="true">
          ☀️
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
      title={theme === "dark" ? "מצב בהיר" : "מצב כהה"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      <span className="text-lg" aria-hidden="true">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
