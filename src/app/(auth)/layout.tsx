import { AuthThemeWrapper } from "./theme-wrapper";

/**
 * Auth Layout
 *
 * Wraps authentication pages (login, callback).
 * Minimal layout — no sidebar, no nav.
 * AuthThemeWrapper fuerza el tema claro vía next-themes forcedTheme.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthThemeWrapper>
      <div className="bg-background flex min-h-svh items-center justify-center">
        {children}
      </div>
    </AuthThemeWrapper>
  );
}
