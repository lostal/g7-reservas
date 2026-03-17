/**
 * Tests de Generación de Calendario (ICS y URLs)
 *
 * Verifica la generación de archivos .ics (RFC 5545) y URLs de
 * acceso directo para Google Calendar y Outlook.
 */

import { describe, it, expect } from "vitest";
import {
  generateICSBuffer,
  generateCancellationICSBuffer,
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  type CalendarEventData,
} from "@/lib/calendar";

const LOCATION_FRAGMENT = "Alcobendas";

const baseEvent: CalendarEventData = {
  reservationId: "res-00000000-0000-0000-0000-000000000001",
  spotLabel: "A-01",
  date: "2025-03-15",
  visitorName: "Juan García",
  visitorCompany: "ACME Corp",
  reservedByName: "Manager Test",
};

// ─── generateICSBuffer ────────────────────────────────────────────────────────

describe("generateICSBuffer", () => {
  it("devuelve un Buffer", () => {
    const buf = generateICSBuffer(baseEvent);
    expect(buf).toBeInstanceOf(Buffer);
  });

  it("contiene estructura básica RFC 5545", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("usa METHOD:PUBLISH", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("METHOD:PUBLISH");
  });

  it("incluye la fecha en formato YYYYMMDD", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("DTSTART;VALUE=DATE:20250315");
  });

  it("incluye DTEND como el día siguiente (evento de día completo)", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("DTEND;VALUE=DATE:20250316");
  });

  it("incluye DTEND correcto al cruzar fin de mes", () => {
    const ics = generateICSBuffer({
      ...baseEvent,
      date: "2025-01-31",
    }).toString("utf-8");
    expect(ics).toContain("DTEND;VALUE=DATE:20250201");
  });

  it("incluye el UID con formato correcto", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain(`UID:${baseEvent.reservationId}@sevensuite.app`);
  });

  it("incluye la label de la plaza en el SUMMARY", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("A-01");
  });

  it("incluye el nombre del visitante en la DESCRIPTION", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("Juan García");
  });

  it("incluye la empresa del visitante en la DESCRIPTION", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("ACME Corp");
  });

  it("incluye la ubicación", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain(LOCATION_FRAGMENT);
  });

  it("incluye STATUS:CONFIRMED", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("incluye notas opcionales en la DESCRIPTION cuando se proporcionan", () => {
    const ics = generateICSBuffer({
      ...baseEvent,
      notes: "Plaza reservada con antelación",
    }).toString("utf-8");
    expect(ics).toContain("Plaza reservada con antelación");
  });

  it("no incluye la línea de notas cuando no se proporcionan", () => {
    const ics = generateICSBuffer({ ...baseEvent, notes: undefined }).toString(
      "utf-8"
    );
    expect(ics).not.toContain("\\nNotas:");
  });

  it("usa separador CRLF (\\r\\n) entre líneas", () => {
    const ics = generateICSBuffer(baseEvent).toString("utf-8");
    expect(ics).toMatch(/\r\n/);
  });

  it("escapa caracteres especiales en el SUMMARY (punto y coma)", () => {
    const ics = generateICSBuffer({ ...baseEvent, spotLabel: "A;01" }).toString(
      "utf-8"
    );
    expect(ics).toContain("A\\;01");
  });

  it("escapa caracteres especiales en el SUMMARY (coma)", () => {
    const ics = generateICSBuffer({ ...baseEvent, spotLabel: "A,01" }).toString(
      "utf-8"
    );
    expect(ics).toContain("A\\,01");
  });
});

// ─── generateCancellationICSBuffer ───────────────────────────────────────────

describe("generateCancellationICSBuffer", () => {
  const cancelData = {
    reservationId: "res-00000000-0000-0000-0000-000000000001",
    spotLabel: "A-01",
    date: "2025-03-15",
  };

  it("devuelve un Buffer", () => {
    const buf = generateCancellationICSBuffer(cancelData);
    expect(buf).toBeInstanceOf(Buffer);
  });

  it("contiene estructura básica RFC 5545", () => {
    const ics = generateCancellationICSBuffer(cancelData).toString("utf-8");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("usa METHOD:CANCEL para que los clientes eliminen el evento", () => {
    const ics = generateCancellationICSBuffer(cancelData).toString("utf-8");
    expect(ics).toContain("METHOD:CANCEL");
  });

  it("incluye STATUS:CANCELLED", () => {
    const ics = generateCancellationICSBuffer(cancelData).toString("utf-8");
    expect(ics).toContain("STATUS:CANCELLED");
  });

  it("incluye SEQUENCE:1 para indicar actualización del evento", () => {
    const ics = generateCancellationICSBuffer(cancelData).toString("utf-8");
    expect(ics).toContain("SEQUENCE:1");
  });

  it("usa el mismo UID que el evento original (para emparejarlo)", () => {
    const ics = generateCancellationICSBuffer(cancelData).toString("utf-8");
    expect(ics).toContain(`UID:${cancelData.reservationId}@sevensuite.app`);
  });

  it("incluye la fecha correcta", () => {
    const ics = generateCancellationICSBuffer(cancelData).toString("utf-8");
    expect(ics).toContain("DTSTART;VALUE=DATE:20250315");
  });
});

// ─── generateGoogleCalendarUrl ────────────────────────────────────────────────

describe("generateGoogleCalendarUrl", () => {
  it("devuelve una URL de Google Calendar", () => {
    const url = generateGoogleCalendarUrl(baseEvent);
    expect(url).toContain("https://calendar.google.com/calendar/render");
  });

  it("incluye action=TEMPLATE", () => {
    const url = generateGoogleCalendarUrl(baseEvent);
    expect(url).toContain("action=TEMPLATE");
  });

  it("incluye la label de la plaza en el título", () => {
    const url = generateGoogleCalendarUrl(baseEvent);
    expect(decodeURIComponent(url)).toContain("A-01");
  });

  it("incluye las fechas en formato YYYYMMDD/YYYYMMDD", () => {
    const url = generateGoogleCalendarUrl(baseEvent);
    // URLSearchParams usa + para espacios — usar searchParams para decodificar correctamente
    const params = new URL(url).searchParams;
    expect(params.get("dates")).toBe("20250315/20250316");
  });

  it("incluye la ubicación", () => {
    const url = generateGoogleCalendarUrl(baseEvent);
    const params = new URL(url).searchParams;
    expect(params.get("location")).toContain(LOCATION_FRAGMENT);
  });

  it("incluye el nombre del visitante en los detalles", () => {
    const url = generateGoogleCalendarUrl(baseEvent);
    const params = new URL(url).searchParams;
    expect(params.get("details")).toContain("Juan García");
  });
});

// ─── generateOutlookUrl ───────────────────────────────────────────────────────

describe("generateOutlookUrl", () => {
  it("devuelve una URL de Outlook Web", () => {
    const url = generateOutlookUrl(baseEvent);
    expect(url).toContain("https://outlook.live.com/calendar");
  });

  it("incluye allday=true (evento de día completo)", () => {
    const url = generateOutlookUrl(baseEvent);
    expect(url).toContain("allday=true");
  });

  it("incluye la label de la plaza en el subject", () => {
    const url = generateOutlookUrl(baseEvent);
    expect(decodeURIComponent(url)).toContain("A-01");
  });

  it("incluye la fecha de inicio", () => {
    const url = generateOutlookUrl(baseEvent);
    expect(url).toContain("startdt=2025-03-15");
  });

  it("incluye la ubicación", () => {
    const url = generateOutlookUrl(baseEvent);
    expect(decodeURIComponent(url)).toContain(LOCATION_FRAGMENT);
  });
});
