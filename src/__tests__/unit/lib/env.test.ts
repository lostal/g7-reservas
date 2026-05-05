/**
 * Tests de validación de variables de entorno
 *
 * Verifica que validateEnv:
 * - Acepta un conjunto completo de variables válidas
 * - Lanza error si faltan variables requeridas
 * - Lanza error si las variables requeridas están vacías
 * - Acepta variables opcionales correctamente
 * - Valida el formato de RESEND_FROM_EMAIL y NEXT_PUBLIC_APP_URL
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// No need to mock anything — the module reads process.env directly
import { validateEnv } from "@/lib/env";

describe("validateEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  function setRequiredEnvVars() {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    vi.stubEnv("AUTH_SECRET", "super-secret-auth-key-32chars-long");
    vi.stubEnv("MICROSOFT_CLIENT_ID", "ms-client-id-12345");
    vi.stubEnv("MICROSOFT_CLIENT_SECRET", "ms-client-secret-abcde");
    vi.stubEnv("MICROSOFT_TENANT_ID", "ms-tenant-id-67890");
  }

  it("returns typed env object when all required vars are present", () => {
    setRequiredEnvVars();
    const env = validateEnv();
    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
    expect(env.AUTH_SECRET).toBe("super-secret-auth-key-32chars-long");
    expect(env.MICROSOFT_CLIENT_ID).toBe("ms-client-id-12345");
    expect(env.MICROSOFT_CLIENT_SECRET).toBe("ms-client-secret-abcde");
    expect(env.MICROSOFT_TENANT_ID).toBe("ms-tenant-id-67890");
  });

  it("throws when DATABASE_URL is missing", () => {
    setRequiredEnvVars();
    vi.stubEnv("DATABASE_URL", "");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("throws when AUTH_SECRET is missing", () => {
    setRequiredEnvVars();
    vi.stubEnv("AUTH_SECRET", "");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("throws when MICROSOFT_CLIENT_ID is missing", () => {
    setRequiredEnvVars();
    vi.stubEnv("MICROSOFT_CLIENT_ID", "");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("throws when MICROSOFT_CLIENT_SECRET is missing", () => {
    setRequiredEnvVars();
    vi.stubEnv("MICROSOFT_CLIENT_SECRET", "");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("throws when MICROSOFT_TENANT_ID is missing", () => {
    setRequiredEnvVars();
    vi.stubEnv("MICROSOFT_TENANT_ID", "");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("throws when DATABASE_URL is not set in env", () => {
    // Required vars must be explicitly set; DATABASE_URL is omitted
    vi.stubEnv("AUTH_SECRET", "secret");
    vi.stubEnv("MICROSOFT_CLIENT_ID", "id");
    vi.stubEnv("MICROSOFT_CLIENT_SECRET", "secret");
    vi.stubEnv("MICROSOFT_TENANT_ID", "tenant");
    // DATABASE_URL might be set by vitest config; override with empty
    vi.stubEnv("DATABASE_URL", "");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("accepts optional RESEND_API_KEY and RESEND_FROM_EMAIL", () => {
    setRequiredEnvVars();
    vi.stubEnv("RESEND_API_KEY", "re_test_key_123");
    vi.stubEnv("RESEND_FROM_EMAIL", "noreply@empresa.com");
    const env = validateEnv();
    expect(env.RESEND_API_KEY).toBe("re_test_key_123");
    expect(env.RESEND_FROM_EMAIL).toBe("noreply@empresa.com");
  });

  it("accepts missing optional vars (undefined)", () => {
    setRequiredEnvVars();
    const env = validateEnv();
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.RESEND_FROM_EMAIL).toBeUndefined();
    expect(env.NEXT_PUBLIC_APP_URL).toBeUndefined();
  });

  it("rejects invalid RESEND_FROM_EMAIL format", () => {
    setRequiredEnvVars();
    vi.stubEnv("RESEND_FROM_EMAIL", "not-an-email");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });

  it("accepts valid NEXT_PUBLIC_APP_URL", () => {
    setRequiredEnvVars();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.empresa.com");
    const env = validateEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://app.empresa.com");
  });

  it("rejects invalid NEXT_PUBLIC_APP_URL format", () => {
    setRequiredEnvVars();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");
    expect(() => validateEnv()).toThrow("Invalid environment variables");
  });
});
