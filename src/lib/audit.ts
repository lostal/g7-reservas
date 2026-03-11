/**
 * Audit Log
 *
 * Función helper para registrar eventos de auditoría en `audit_events`.
 * Llamar EXPLÍCITAMENTE en las acciones sensibles:
 *   - payslip.viewed    — descarga de nómina
 *   - leave.approved    — aprobación de vacaciones
 *   - leave.rejected    — rechazo de vacaciones
 *   - role.changed      — cambio de rol de usuario
 *   - document.deleted  — borrado de documento
 *   - user.deleted      — borrado de cuenta
 *
 * No usar como middleware — siempre llamar explícitamente.
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { Json } from "@/lib/supabase/database.types";

export type AuditEventType =
  | "payslip.viewed"
  | "leave.approved"
  | "leave.rejected"
  | "role.changed"
  | "document.deleted"
  | "user.deleted";

export type AuditEntityType = "document" | "leave_request" | "profile" | "user";

/**
 * Registra un evento de auditoría.
 * Silencioso en caso de error — nunca debe bloquear la acción principal.
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  entityType: AuditEntityType,
  entityId: string | null,
  metadata: Json = {}
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    const supabase = await createClient();
    await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_email: user.email,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId ?? undefined,
      metadata,
    });
  } catch (err) {
    // Audit log failure must never break the caller action
    console.error("[audit] logAuditEvent error:", err);
  }
}
