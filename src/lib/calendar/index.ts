/**
 * Generación de eventos de calendario
 *
 * Genera archivos ICS (iCalendar) y URLs de acceso directo para
 * Google Calendar y Outlook Web. Sin dependencias externas.
 *
 * El ICS es compatible con Apple Calendar, Google Calendar,
 * Outlook (desktop y web), Thunderbird y cualquier app RFC 5545.
 */

const LOCATION =
  "Avda. la industria, 4, Edificio Natea. Edificio 2. Escalera 1 - 1ºB, 28108 Alcobendas, Madrid";

export interface CalendarEventData {
  reservationId: string;
  spotLabel: string;
  /** Fecha en formato YYYY-MM-DD */
  date: string;
  visitorName: string;
  visitorCompany: string;
  reservedByName: string;
  notes?: string | null;
}

/** Convierte YYYY-MM-DD a YYYYMMDD (formato ICS para VALUE=DATE) */
function toICSDate(date: string): string {
  return date.replace(/-/g, "");
}

/** Día siguiente en formato YYYYMMDD (DTEND exclusivo para eventos de día completo) */
function nextDayICS(date: string): string {
  // Parsear con componentes locales para evitar desfase UTC en zonas UTC+N
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(y!, m! - 1, d! + 1);
  const yy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/** Escapa texto para el formato ICS (RFC 5545) */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Timestamp UTC actual en formato ICS (YYYYMMDDTHHMMSSZ) */
function nowICS(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

/**
 * Genera un Buffer con el contenido de un archivo .ics de cancelación.
 * Usa METHOD:CANCEL para que Apple Calendar, Outlook y Google Calendar
 * eliminen el evento automáticamente al abrir el adjunto.
 */
export function generateCancellationICSBuffer(data: {
  reservationId: string;
  spotLabel: string;
  date: string;
}): Buffer {
  const summary = icsEscape(
    `Plaza ${data.spotLabel} — Aparcamiento Gruposiete`
  );

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gruposiete//Aparcamiento//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${toICSDate(data.date)}`,
    `DTEND;VALUE=DATE:${nextDayICS(data.date)}`,
    `SUMMARY:${summary}`,
    `UID:${data.reservationId}@gruposiete.parking`,
    `DTSTAMP:${nowICS()}`,
    "SEQUENCE:1",
    "STATUS:CANCELLED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return Buffer.from(ics, "utf-8");
}

/**
 * Genera un Buffer con el contenido de un archivo .ics para la reserva.
 * Cuando el visitante abre el adjunto, su app de calendario pregunta
 * si desea añadir el evento (Apple Calendar, Outlook, Google Calendar…).
 */
export function generateICSBuffer(data: CalendarEventData): Buffer {
  const summary = icsEscape(
    `Plaza ${data.spotLabel} — Aparcamiento Gruposiete`
  );
  const description = icsEscape(
    `Plaza reservada para ${data.visitorName} (${data.visitorCompany}).\\nReservado por: ${data.reservedByName}` +
      (data.notes ? `\\nNotas: ${data.notes}` : "")
  );
  const location = icsEscape(LOCATION);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gruposiete//Aparcamiento//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${toICSDate(data.date)}`,
    `DTEND;VALUE=DATE:${nextDayICS(data.date)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `UID:${data.reservationId}@gruposiete.parking`,
    `DTSTAMP:${nowICS()}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return Buffer.from(ics, "utf-8");
}

/**
 * Genera la URL de acceso directo para añadir el evento a Google Calendar.
 * No requiere autenticación ni credenciales.
 */
export function generateGoogleCalendarUrl(data: CalendarEventData): string {
  const title = `Plaza ${data.spotLabel} — Aparcamiento Gruposiete`;
  const details =
    `Plaza reservada para ${data.visitorName} (${data.visitorCompany}).\nReservado por: ${data.reservedByName}` +
    (data.notes ? `\nNotas: ${data.notes}` : "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toICSDate(data.date)}/${nextDayICS(data.date)}`,
    details,
    location: LOCATION,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera la URL de acceso directo para añadir el evento a Outlook Web (Microsoft 365).
 * Funciona tanto con cuentas personales (outlook.live.com) como corporativas.
 */
export function generateOutlookUrl(data: CalendarEventData): string {
  const title = `Plaza ${data.spotLabel} — Aparcamiento Gruposiete`;
  const body =
    `Plaza reservada para ${data.visitorName} (${data.visitorCompany}).\nReservado por: ${data.reservedByName}` +
    (data.notes ? `\nNotas: ${data.notes}` : "");

  const params = new URLSearchParams({
    subject: title,
    startdt: data.date,
    enddt: data.date,
    allday: "true",
    body,
    location: LOCATION,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
