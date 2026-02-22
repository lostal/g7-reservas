"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme Provider
 *
 * Wraps the app with next-themes for dark/light mode.
 * Uses class strategy to match Tailwind's .dark variant.
 * Acepta cualquier prop de NextThemesProvider (p.ej. forcedTheme).
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" {...props}>
      {children}
    </NextThemesProvider>
  );
}
