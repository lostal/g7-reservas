/**
 * Application-wide constants
 *
 * Centralized config values, magic strings, and defaults.
 */

/** Application metadata */
export const APP_NAME = "Seven Suite";
export const APP_DESCRIPTION = "Sistema de gestión de espacios corporativos";

/** Route paths */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CALLBACK: "/auth/callback",
  DASHBOARD: "/panel",
  /** Home page for non-admin roles (employee) */
  PARKING: "/parking",
  MIS_RESERVAS: "/mis-reservas",
  PARKING_CESSIONS: "/parking/cesiones",
  /** @deprecated La ruta del mapa se ha movido a /oficinas/mapa; mantener para redirect */
  PARKING_MAP: "/parking/mapa",
  OFFICES_MAP: "/oficinas/mapa",
  PARKING_RESERVAS: "/parking/reservas",
  OFFICES_RESERVAS: "/oficinas/reservas",
  VISITORS: "/parking/visitantes",
  ADMIN: "/administracion",
  ADMIN_PARKING: "/parking/asignaciones",
  ADMIN_OFFICES: "/oficinas/asignaciones",
  ADMIN_SETTINGS: "/configuracion/general",
  ADMIN_SETTINGS_PARKING: "/configuracion/parking",
  ADMIN_SETTINGS_OFFICES: "/configuracion/oficinas",

  OFFICES: "/oficinas",
  OFFICES_CESSIONS: "/oficinas/cesiones",
  ADMIN_ENTITIES: "/administracion/entidades",
  DIRECTORIO: "/directorio",
  SETTINGS: "/ajustes/perfil",
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
  role: "admin" | "employee" | string | undefined | null
): string {
  if (role === "admin") return ROUTES.DASHBOARD;
  return ROUTES.PARKING;
}

/** External links */
export const EXTERNAL = {
  SEDE_ADDRESS: "Sede GRUPOSIETE, Madrid",
} as const;

// ─── Spot type labels ─────────────────────────────────────────────────────────
//
// Los valores del enum en BD (`standard`, `visitor`) son identificadores
// técnicos internos. Esta función traduce esos valores a etiquetas de negocio
// según el módulo, ya que el mismo valor `visitor` tiene connotaciones
// distintas según el recurso:
//   • parking / visitor  → "Visitas"    (plaza para visitantes externos)
//   • office  / visitor  → "Flexible"   (plaza sin propietario fijo)
//   • */standard         → "Fija"       (plaza asignada a un usuario)

export function getSpotTypeLabel(
  type: "standard" | "visitor",
  resourceType: "parking" | "office"
): string {
  if (type === "standard") return "Fija";
  return resourceType === "office" ? "Flexible" : "Visitas";
}
