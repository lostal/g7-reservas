/**
 * Servicio de Email — Resend + React Email
 *
 * Envío de emails transaccionales para confirmaciones de reservas de visitantes.
 * Adjunta el archivo .ics para añadir el evento al calendario del visitante.
 */

import { createElement } from "react";
import { Resend } from "resend";
import {
  VisitorReservationEmail,
  type VisitorReservationEmailProps,
} from "./templates/visitor-reservation";
import {
  VisitorCancellationEmail,
  type VisitorCancellationEmailProps,
} from "./templates/visitor-cancellation";

function getResendClient(): { resend: Resend; fromAddress: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY no configurada — email no enviado");
    return null;
  }
  const fromAddress = process.env.RESEND_FROM_EMAIL;
  if (!fromAddress) {
    console.warn("RESEND_FROM_EMAIL no configurada — email no enviado");
    return null;
  }
  return { resend: new Resend(apiKey), fromAddress };
}

/** Parámetros para enviar el email de confirmación de visitante */
export interface SendVisitorEmailParams extends VisitorReservationEmailProps {
  /** Dirección de email del destinatario */
  to: string;
  /** Archivo .ics para añadir el evento al calendario */
  icsBuffer: Buffer;
}

/**
 * Envía el email de confirmación de reserva al visitante.
 * Adjunta el .ics para que el visitante pueda añadir el evento a su calendario.
 * Si no hay API key configurada, registra un aviso y no hace nada.
 */
export async function sendVisitorReservationEmail(
  params: SendVisitorEmailParams
): Promise<void> {
  const client = getResendClient();
  if (!client) return;
  const { resend, fromAddress } = client;

  const { to, icsBuffer, ...emailProps } = params;

  const { error } = await resend.emails.send({
    from: `Gruposiete <${fromAddress}>`,
    to,
    subject: `Plaza ${params.spotLabel} reservada — ${params.date}`,
    react: createElement(VisitorReservationEmail, emailProps),
    attachments: [
      {
        filename: `reserva-plaza-${params.spotLabel.toLowerCase().replace(/\s+/g, "-")}.ics`,
        content: icsBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Error al enviar email al visitante: ${error.message}`);
  }
}

/** Parámetros para enviar el email de cancelación */
export interface SendVisitorCancellationEmailParams extends VisitorCancellationEmailProps {
  to: string;
  /** Archivo .ics con METHOD:CANCEL para eliminar el evento del calendario */
  icsBuffer: Buffer;
}

/**
 * Envía el email de cancelación de reserva al visitante.
 * Adjunta el .ics de cancelación para que su app de calendario
 * elimine el evento automáticamente.
 */
export async function sendVisitorCancellationEmail(
  params: SendVisitorCancellationEmailParams
): Promise<void> {
  const client = getResendClient();
  if (!client) return;
  const { resend, fromAddress } = client;

  const { to, icsBuffer, ...emailProps } = params;

  const { error } = await resend.emails.send({
    from: `Gruposiete <${fromAddress}>`,
    to,
    subject: `Plaza ${params.spotLabel} cancelada — ${params.date}`,
    react: createElement(VisitorCancellationEmail, emailProps),
    attachments: [
      {
        filename: `cancelacion-plaza-${params.spotLabel.toLowerCase().replace(/\s+/g, "-")}.ics`,
        content: icsBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(
      `Error al enviar email de cancelación al visitante: ${error.message}`
    );
  }
}
