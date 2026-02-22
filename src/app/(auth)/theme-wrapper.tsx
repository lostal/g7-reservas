"use client";

import { ThemeProvider } from "@/components/providers";

/**
 * Auth Theme Wrapper
 *
 * Fuerza el tema claro en todas las páginas de autenticación
 * mediante la prop `forcedTheme` de next-themes, sin afectar al
 * resto de la app ni duplicar variables CSS.
 */
export function AuthThemeWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ThemeProvider forcedTheme="light">{children}</ThemeProvider>;
}
