/**
 * Tests del Servicio de Email (Resend + React Email)
 *
 * Verifica que:
 * - sendVisitorReservationEmail no hace nada si faltan env vars
 * - sendVisitorReservationEmail envía el email correctamente
 * - sendVisitorCancellationEmail no hace nada si faltan env vars
 * - sendVisitorCancellationEmail envía el email correctamente
 * - Se lanza error cuando Resend devuelve error
 * - Los parámetros se pasan correctamente a Resend
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResendSend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: mockResendSend } };
  }),
}));

import {
  sendVisitorReservationEmail,
  sendVisitorCancellationEmail,
} from "@/lib/email";

function setResendEnvVars() {
  vi.stubEnv("RESEND_API_KEY", "re_test_123456");
  vi.stubEnv("RESEND_FROM_EMAIL", "noreply@empresa.com");
}

const icsBuffer = Buffer.from("BEGIN:VCALENDAR\nEND:VCALENDAR");
const baseReservationParams = {
  to: "visitante@externo.com",
  spotLabel: "A-01",
  date: "2026-06-15",
  visitorName: "María García",
  spotLabelDisplay: "Plaza A-01",
  visitorCompany: "Acme Corp",
  reservedByName: "Admin User",
  googleCalendarUrl: "https://calendar.google.com",
  outlookUrl: "https://outlook.live.com",
  icsBuffer,
};

const baseCancellationParams = {
  to: "visitante@externo.com",
  spotLabel: "A-01",
  date: "2026-06-15",
  visitorName: "María García",
  spotLabelDisplay: "Plaza A-01",
  visitorCompany: "Acme Corp",
  cancelledByName: "Admin User",
  icsBuffer,
};

describe("sendVisitorReservationEmail", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns early when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "noreply@empresa.com");
    await sendVisitorReservationEmail(baseReservationParams);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("returns early when RESEND_FROM_EMAIL is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123456");
    await sendVisitorReservationEmail(baseReservationParams);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("returns early when both env vars are missing", async () => {
    await sendVisitorReservationEmail(baseReservationParams);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends email with correct parameters when env vars are set", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: { id: "msg_001" },
      error: null,
    });

    await sendVisitorReservationEmail(baseReservationParams);

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const callArgs = mockResendSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    expect(callArgs.from).toContain("noreply@empresa.com");
    expect(callArgs.to).toBe("visitante@externo.com");
    expect(callArgs.subject).toContain("Plaza A-01 reservada");
    expect(callArgs.subject).toContain("2026-06-15");
    expect(callArgs.react).toBeDefined();
    expect(callArgs.attachments).toHaveLength(1);
    const attachment = (
      callArgs.attachments as Array<Record<string, unknown>>
    )[0];
    expect(attachment!.filename).toContain("reserva-plaza-a-01");
    expect(attachment!.content).toBe(icsBuffer);
  });

  it("throws when Resend returns an error", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Rate limit exceeded" },
    });

    await expect(
      sendVisitorReservationEmail(baseReservationParams)
    ).rejects.toThrow(
      "Error al enviar email al visitante: Rate limit exceeded"
    );
  });

  it("includes correct from header format", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: { id: "msg_002" },
      error: null,
    });

    await sendVisitorReservationEmail(baseReservationParams);

    const callArgs = mockResendSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArgs.from).toBe("Seven Suite <noreply@empresa.com>");
  });

  it("sanitizes spot label in ICS filename", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: { id: "msg_003" },
      error: null,
    });

    await sendVisitorReservationEmail({
      ...baseReservationParams,
      spotLabel: "Plaza A 01",
    });

    const callArgs = mockResendSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    const attachment = (
      callArgs.attachments as Array<Record<string, unknown>>
    )[0];
    expect(attachment!.filename).toBe("reserva-plaza-plaza-a-01.ics");
  });
});

describe("sendVisitorCancellationEmail", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns early when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "noreply@empresa.com");
    await sendVisitorCancellationEmail(baseCancellationParams);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("returns early when RESEND_FROM_EMAIL is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_123456");
    await sendVisitorCancellationEmail(baseCancellationParams);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("sends cancellation email with correct parameters", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: { id: "msg_cancel" },
      error: null,
    });

    await sendVisitorCancellationEmail(baseCancellationParams);

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const callArgs = mockResendSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    expect(callArgs.to).toBe("visitante@externo.com");
    expect(callArgs.subject).toContain("Plaza A-01 cancelada");
    expect(callArgs.subject).toContain("2026-06-15");
    expect(callArgs.react).toBeDefined();
    expect(callArgs.attachments).toHaveLength(1);
    const attachment = (
      callArgs.attachments as Array<Record<string, unknown>>
    )[0];
    expect(attachment!.filename).toContain("cancelacion-plaza-a-01");
    expect(attachment!.content).toBe(icsBuffer);
  });

  it("throws when Resend returns an error for cancellation", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid recipient" },
    });

    await expect(
      sendVisitorCancellationEmail(baseCancellationParams)
    ).rejects.toThrow(
      "Error al enviar email de cancelación al visitante: Invalid recipient"
    );
  });

  it("includes correct from header format for cancellation", async () => {
    setResendEnvVars();
    mockResendSend.mockResolvedValueOnce({
      data: { id: "msg_004" },
      error: null,
    });

    await sendVisitorCancellationEmail(baseCancellationParams);

    const callArgs = mockResendSend.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArgs.from).toBe("Seven Suite <noreply@empresa.com>");
  });
});
