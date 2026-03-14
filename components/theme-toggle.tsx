"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem("healthie-theme");
  return v === "dark" || v === "light" ? v : null;
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? (systemPrefersDark() ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("healthie-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const isDark = theme === "dark";
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle color mode">
      {isDark ? (
        <svg viewBox="0 0 24 24" role="img">
          <path
            d="M12 3.5a1 1 0 0 1 1 1V6a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1Zm0 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6.5-5a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Zm-13 0a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1ZM12 18a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V19a1 1 0 0 1 1-1Zm6.01-2.86a1 1 0 0 1 1.41 1.41l-1.06 1.06a1 1 0 1 1-1.41-1.41l1.06-1.06Zm-12.02 0 1.06 1.06a1 1 0 1 1-1.41 1.41L4.58 16.55a1 1 0 0 1 1.41-1.41Zm12.02-8.28-1.06 1.06a1 1 0 1 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 1.41Zm-12.02 0A1 1 0 1 1 4.58 4.45l1.06 1.06a1 1 0 0 1-1.41 1.41Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" role="img">
          <path
            d="M20.3 14.5A8.5 8.5 0 0 1 9.5 3.7a.5.5 0 0 0-.53-.7A9.5 9.5 0 1 0 21 15.03a.5.5 0 0 0-.7-.53Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
