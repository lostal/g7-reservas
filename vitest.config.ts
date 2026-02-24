import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    // Limpiar mocks automáticamente antes de cada test (best practice)
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Solo medir cobertura en lógica de negocio — no en UI components ni páginas
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/app/**/actions.ts",
        "src/app/**/calendar-actions.ts",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/__tests__/**",
        // Archivo auto-generado por Supabase CLI
        "src/lib/supabase/database.types.ts",
        // Tipos re-exportados sin lógica
        "src/lib/supabase/types.ts",
      ],
      // Umbrales de cobertura — reflejan la cobertura actual de lógica de negocio
      thresholds: {
        lines: 40,
        branches: 35,
        functions: 44,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
