/**
 * Application-wide constants
 *
 * Centralized config values, magic strings, and defaults.
 */

/** Maximum days in advance a reservation can be made (configurable via admin) */
export const DEFAULT_MAX_ADVANCE_DAYS = 14;

/** Application metadata */
export const APP_NAME = "GRUPOSIETE Parking";
export const APP_DESCRIPTION =
  "Sistema de gestión de reservas de parking corporativo";

/** Route paths */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CALLBACK: "/auth/callback",
  DASHBOARD: "/panel",
  /** Home page for non-admin roles (management & employee) */
  INICIO: "/inicio",
  PARKING: "/parking",
  MIS_RESERVAS: "/mis-reservas",
  PARKING_CESSATIONS: "/parking/cesiones",
  PARKING_MAP: "/parking/mapa",
  CALENDAR: "/calendario",
  VISITORS: "/visitantes",
  ADMIN: "/administracion",
  ADMIN_USERS: "/administracion/usuarios",
  SETTINGS: "/ajustes",
  SETTINGS_NOTIFICATIONS: "/ajustes/notificaciones",
  SETTINGS_PREFERENCES: "/ajustes/preferencias",
  SETTINGS_MICROSOFT: "/ajustes/microsoft",
  SETTINGS_SECURITY: "/ajustes/seguridad",
} as const;

/**
 * Returns the first page a user should land on after login,
 * mirroring the order of items in the sidebar (first visible item per role).
 */
export function getHomeRouteForRole(
  role: "admin" | "management" | "employee" | string | undefined | null
): string {
  if (role === "admin") return ROUTES.DASHBOARD;
  return ROUTES.PARKING;
}

/** External links */
export const EXTERNAL = {
  SEDE_ADDRESS: "Sede GRUPOSIETE, Madrid",
} as const;
