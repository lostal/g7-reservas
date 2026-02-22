/**
 * Validation Schemas
 *
 * Zod schemas for Server Actions and form validation.
 * Shared between client (form validation) and server (action validation).
 */

import { z } from "zod/v4";

// ─── Reservations ────────────────────────────────────────────

export const createReservationSchema = z.object({
  spot_id: z.string().uuid(),
  date: z.iso.date(),
  notes: z.string().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

// ─── Cessions ────────────────────────────────────────────────

export const createCessionSchema = z.object({
  spot_id: z.string().uuid(),
  dates: z.array(z.iso.date()).min(1, "Selecciona al menos un día"),
});

export type CreateCessionInput = z.infer<typeof createCessionSchema>;

// ─── Visitors ────────────────────────────────────────────────

export const createVisitorReservationSchema = z.object({
  spot_id: z.string().uuid(),
  date: z.iso.date(),
  visitor_name: z.string().min(1, "Nombre requerido").max(200),
  visitor_company: z.string().min(1, "Empresa requerida").max(200),
  visitor_email: z.email("Email inválido"),
  notes: z.string().max(500).optional(),
});

export type CreateVisitorReservationInput = z.infer<
  typeof createVisitorReservationSchema
>;

// ─── Admin: Spots ────────────────────────────────────────────

export const createSpotSchema = z.object({
  label: z.string().min(1, "Etiqueta requerida").max(20),
  type: z.enum(["management", "visitor"]),
  assigned_to: z.string().uuid().optional(),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;

export const updateSpotSchema = createSpotSchema
  .omit({ assigned_to: true })
  .partial()
  .extend({
    id: z.string().uuid(),
    is_active: z.boolean().optional(),
  });

export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

// ─── Cancel Operations ───────────────────────────────────────

/** Schema base reutilizado por todas las operaciones de cancelación por id. */
const cancelByIdSchema = z.object({ id: z.string().uuid() });

export const cancelReservationSchema = cancelByIdSchema;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

export const cancelCessionSchema = cancelByIdSchema;
export type CancelCessionInput = z.infer<typeof cancelCessionSchema>;

export const cancelVisitorReservationSchema = cancelByIdSchema;
export type CancelVisitorReservationInput = z.infer<
  typeof cancelVisitorReservationSchema
>;

export const updateVisitorReservationSchema =
  createVisitorReservationSchema.extend({
    id: z.string().uuid(),
  });

export type UpdateVisitorReservationInput = z.infer<
  typeof updateVisitorReservationSchema
>;

// ─── Admin: Spots Delete ─────────────────────────────────────

export const deleteSpotSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteSpotInput = z.infer<typeof deleteSpotSchema>;

// ─── Admin: Users ────────────────────────────────────────────

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["employee", "management", "admin"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

// ─── Admin: Delete user account ────────────────────────────

export const deleteUserSchema = z.object({
  user_id: z.string().uuid(),
});
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;

// ─── Admin: Assign spot to management user ───────────────────

export const assignSpotToUserSchema = z.object({
  user_id: z.string().uuid(),
  /** UUID of the spot to assign, or null to unassign */
  spot_id: z.string().uuid().nullable(),
});

export type AssignSpotToUserInput = z.infer<typeof assignSpotToUserSchema>;

// ─── Settings: Profile ───────────────────────────────────────

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido").max(200).optional(),
  avatar_url: z.string().url("URL inválida").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── Settings: Notifications ─────────────────────────────────

export const updateNotificationPreferencesSchema = z.object({
  notification_channel: z.enum(["teams", "email", "both"]),
  notify_reservation_confirmed: z.boolean(),
  notify_reservation_reminder: z.boolean(),
  notify_cession_reserved: z.boolean(),
  notify_alert_triggered: z.boolean(),
  notify_visitor_confirmed: z.boolean(),
  notify_daily_digest: z.boolean(),
  daily_digest_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato HH:MM")
    .optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

// ─── Settings: Preferences (Theme + View) ────────────────────

export const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]),
  default_view: z.enum(["map", "list", "calendar"]),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ─── Settings: Theme only ─────────────────────────────────────

export const updateThemeSchema = z.object({
  theme: z.enum(["light", "dark"]),
});

export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;

// ─── Settings: Outlook Sync ──────────────────────────────────

export const updateOutlookPreferencesSchema = z.object({
  outlook_create_events: z.boolean(),
  outlook_calendar_name: z.string().min(1).max(100).optional(),
  outlook_sync_enabled: z.boolean(),
  outlook_sync_interval: z.number().int().min(5).max(120).optional(), // 5-120 minutes
});

export type UpdateOutlookPreferencesInput = z.infer<
  typeof updateOutlookPreferencesSchema
>;

// ─── Settings: Auto-Cession Rules (Management) ───────────────

export const updateCessionRulesSchema = z.object({
  auto_cede_on_ooo: z.boolean(),
  auto_cede_notify: z.boolean(),
  auto_cede_days: z.array(z.number().int().min(0).max(6)), // 0-6 (Sun-Sat)
});

export type UpdateCessionRulesInput = z.infer<typeof updateCessionRulesSchema>;
