"use server";

/**
 * Server Actions de Ajustes
 *
 * Acciones para actualizar el perfil, preferencias e integración con Microsoft
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, requireManagement } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import {
  updateProfileSchema,
  updateNotificationPreferencesSchema,
  updateOutlookPreferencesSchema,
  updateCessionRulesSchema,
  updatePreferencesSchema,
  updateThemeSchema,
  type UpdateProfileInput,
  type UpdateNotificationPreferencesInput,
  type UpdateOutlookPreferencesInput,
  type UpdateCessionRulesInput,
  type UpdatePreferencesInput,
  type UpdateThemeInput,
} from "@/lib/validations";

// ─── Update Profile ──────────────────────────────────────────

export async function updateProfile(data: UpdateProfileInput) {
  const user = await requireAuth();
  const validated = updateProfileSchema.parse(data);

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: validated.full_name,
      avatar_url: validated.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error al actualizar el perfil:", error);
    throw new Error("No se pudo actualizar el perfil");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Update Notification Preferences ─────────────────────────

export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesInput
) {
  const user = await requireAuth();
  const validated = updateNotificationPreferencesSchema.parse(data);

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_preferences")
    .update({
      notification_channel: validated.notification_channel,
      notify_reservation_confirmed: validated.notify_reservation_confirmed,
      notify_reservation_reminder: validated.notify_reservation_reminder,
      notify_cession_reserved: validated.notify_cession_reserved,
      notify_alert_triggered: validated.notify_alert_triggered,
      notify_visitor_confirmed: validated.notify_visitor_confirmed,
      notify_daily_digest: validated.notify_daily_digest,
      daily_digest_time: validated.daily_digest_time || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "Error al actualizar las preferencias de notificación:",
      error
    );
    throw new Error("No se pudieron actualizar las preferencias");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Update Outlook Preferences ──────────────────────────────

export async function updateOutlookPreferences(
  data: UpdateOutlookPreferencesInput
) {
  const user = await requireAuth();
  const validated = updateOutlookPreferencesSchema.parse(data);

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_preferences")
    .update({
      outlook_create_events: validated.outlook_create_events,
      outlook_calendar_name: validated.outlook_calendar_name || "Parking",
      outlook_sync_enabled: validated.outlook_sync_enabled,
      outlook_sync_interval: validated.outlook_sync_interval || 15,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al actualizar las preferencias de Outlook:", error);
    throw new Error("No se pudieron actualizar las preferencias de Outlook");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Update Auto-Cession Rules (Management Only) ─────────────

export async function updateCessionRules(data: UpdateCessionRulesInput) {
  const user = await requireManagement();

  const validated = updateCessionRulesSchema.parse(data);

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_preferences")
    .update({
      auto_cede_on_ooo: validated.auto_cede_on_ooo,
      auto_cede_notify: validated.auto_cede_notify,
      auto_cede_days: validated.auto_cede_days,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al actualizar las reglas de cesión:", error);
    throw new Error("No se pudieron actualizar las reglas de cesión");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Update Preferences (Combined Theme + View) ─────────────

export async function updatePreferences(data: UpdatePreferencesInput) {
  const user = await requireAuth();
  const validated = updatePreferencesSchema.parse(data);

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_preferences")
    .update({
      theme: validated.theme,
      default_view: validated.default_view,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al actualizar las preferencias:", error);
    throw new Error("No se pudieron actualizar las preferencias");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Disconnect Microsoft Account ───────────────────────────

export async function disconnectMicrosoftAccount() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_microsoft_tokens")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al desvincular la cuenta de Microsoft:", error);
    throw new Error("No se pudo desvincular la cuenta de Microsoft");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Test Teams Notification (Stub for Future) ───────────────

export async function testTeamsNotification() {
  const user = await requireAuth();

  // TODO: Implementar cuando el bot de Teams esté listo
  // Por ahora, devolver éxito

  console.warn(
    `[STUB] Enviaría notificación de prueba al usuario ${user.email} via bot de Teams`
  );

  return {
    success: true,
    message: "Función de prueba (pendiente implementar bot de Teams)",
  };
}

// ─── Force Calendar Sync (Stub for Future) ───────────────────

export async function forceCalendarSync() {
  const user = await requireAuth();

  // TODO: Implementar cuando la sincronización con Outlook esté lista
  // Por ahora, devolver éxito

  console.warn(
    `[STUB] Forzaría sincronización de calendario para el usuario ${user.email} con Outlook`
  );

  return {
    success: true,
    message: "Función de sincronización (pendiente implementar Outlook API)",
  };
}

// ─── Update Theme ─────────────────────────────────────────────

export async function updateTheme(data: UpdateThemeInput) {
  const user = await requireAuth();
  const validated = updateThemeSchema.parse(data);

  const supabase = await createClient();

  const { error } = await supabase
    .from("user_preferences")
    .update({ theme: validated.theme, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error al actualizar el tema:", error);
    throw new Error("No se pudo actualizar el tema");
  }

  revalidatePath("/ajustes");
  return { success: true };
}

// ─── Delete Own Account ───────────────────────────────────────

export async function deleteSelfAccount() {
  const user = await requireAuth();
  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    throw new Error(`Error al eliminar la cuenta: ${error.message}`);
  }

  return { deleted: true };
}
