/**
 * Sidebar Navigation Data
 *
 * Defines the navigation structure for the app sidebar.
 * Items are grouped by section and support icons, badges, and sub-items.
 *
 * Role visibility:
 *   employee   → usuario general (puede reservar y ceder si tiene plaza asignada)
 *   admin      → administrador (gestiona usuarios, plazas y configuración)
 *
 * Estructura de grupos:
 *   "Sede activa"  → Contenido que varía según la sede seleccionada (módulos habilitados)
 *   "Global"       → Siempre visible para admins: Directorio, Sedes, Ajustes
 */

import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  User,
  Bell,
  Cloud,
  MapPin,
  LayoutGrid,
  Building2,
  SlidersHorizontal,
  ParkingCircle,
  ArrowLeftRight,
  CalendarCheck,
  Globe,
  BookUser,
  Landmark,
  Palmtree,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { type SidebarData } from "../types";
import type { UserRole } from "@/lib/db/types";

interface SidebarDataParams {
  hasParkingSpot: boolean;
  hasOfficeSpot: boolean;
  /** List of enabled module keys for the active/assigned entity. */
  enabledModules?: string[];
  /** Unread announcement count for the current user — shown as badge on Tablón. */
  unreadAnnouncementsCount?: number;
}

export function getSidebarData({
  hasParkingSpot,
  hasOfficeSpot,
  enabledModules,
  unreadAnnouncementsCount = 0,
}: SidebarDataParams): SidebarData {
  const parkingEnabled = !enabledModules || enabledModules.includes("parking");
  const officeEnabled = !enabledModules || enabledModules.includes("office");
  const vacacionesEnabled =
    !enabledModules || enabledModules.includes("vacaciones");
  const tablonEnabled = !enabledModules || enabledModules.includes("tablon");
  // "visitors" es un módulo independiente dentro del módulo parking
  const visitorsEnabled =
    parkingEnabled && (!enabledModules || enabledModules.includes("visitors"));

  const tablonBadge =
    unreadAnnouncementsCount > 0 ? String(unreadAnnouncementsCount) : undefined;

  // ─── Subitems de empleado ─────────────────────────────────
  const parkingSubItems = [
    hasParkingSpot
      ? {
          title: "Cesiones",
          url: ROUTES.PARKING_CESSIONS,
          icon: ArrowLeftRight,
        }
      : {
          title: "Reservas",
          url: ROUTES.PARKING_RESERVAS,
          icon: CalendarCheck,
        },
    ...(visitorsEnabled
      ? [{ title: "Visitantes", url: ROUTES.VISITORS, icon: Users }]
      : []),
  ];

  const oficinasSubItems = [
    hasOfficeSpot
      ? {
          title: "Cesiones",
          url: ROUTES.OFFICES_CESSIONS,
          icon: ArrowLeftRight,
        }
      : {
          title: "Reservas",
          url: ROUTES.OFFICES_RESERVAS,
          icon: CalendarCheck,
        },
    { title: "Mapa", url: ROUTES.OFFICES_MAP, icon: MapPin },
  ];

  // ─── Subitems de admin ────────────────────────────────────
  const adminParkingItems = [
    ...(visitorsEnabled
      ? [{ title: "Visitantes", url: ROUTES.VISITORS, icon: Users }]
      : []),
    { title: "Asignaciones", url: ROUTES.ADMIN_PARKING, icon: LayoutGrid },
  ];

  const adminOficinaItems = [
    { title: "Asignaciones", url: ROUTES.ADMIN_OFFICES, icon: LayoutGrid },
  ];

  const configSubItems = [
    { title: "General", url: ROUTES.ADMIN_SETTINGS, icon: Globe },
    ...(parkingEnabled
      ? [
          {
            title: "Parking",
            url: ROUTES.ADMIN_SETTINGS_PARKING,
            icon: ParkingCircle,
          },
        ]
      : []),
    ...(officeEnabled
      ? [
          {
            title: "Oficinas",
            url: ROUTES.ADMIN_SETTINGS_OFFICES,
            icon: Building2,
          },
        ]
      : []),
  ];

  return {
    navGroups: [
      // ─── Sede activa: varía según módulos habilitados ──────
      {
        title: "Sede activa",
        items: [
          // Panel (admin — analytics de la sede activa)
          {
            title: "Panel",
            url: ROUTES.DASHBOARD,
            icon: LayoutDashboard,
            roles: ["admin"] as UserRole[],
          },
          // Parking (employee)
          ...(parkingEnabled
            ? [
                {
                  title: "Parking",
                  url: ROUTES.PARKING,
                  icon: ParkingCircle,
                  roles: ["employee"] as UserRole[],
                  items: parkingSubItems,
                },
              ]
            : []),
          // Parking (admin)
          ...(parkingEnabled
            ? [
                {
                  title: "Parking",
                  icon: ParkingCircle,
                  roles: ["admin"] as UserRole[],
                  items: adminParkingItems,
                },
              ]
            : []),
          // Oficinas (employee)
          ...(officeEnabled
            ? [
                {
                  title: "Oficinas",
                  url: ROUTES.OFFICES,
                  icon: Building2,
                  roles: ["employee"] as UserRole[],
                  items: oficinasSubItems,
                },
              ]
            : []),
          // Oficinas (admin)
          ...(officeEnabled
            ? [
                {
                  title: "Oficinas",
                  icon: Building2,
                  roles: ["admin"] as UserRole[],
                  items: adminOficinaItems,
                },
              ]
            : []),
          // Vacaciones — employee ve solo "Mis solicitudes"
          ...(vacacionesEnabled
            ? [
                {
                  title: "Vacaciones",
                  icon: Palmtree,
                  roles: ["employee"] as UserRole[],
                  items: [
                    {
                      title: "Mis solicitudes",
                      url: ROUTES.LEAVE_MY_REQUESTS,
                      icon: CalendarCheck,
                    },
                  ],
                },
                // manager/hr/admin ven también "Gestionar"
                {
                  title: "Vacaciones",
                  icon: Palmtree,
                  roles: ["manager", "hr", "admin"] as UserRole[],
                  items: [
                    {
                      title: "Mis solicitudes",
                      url: ROUTES.LEAVE_MY_REQUESTS,
                      icon: CalendarCheck,
                    },
                    {
                      title: "Gestionar",
                      url: ROUTES.LEAVE_MANAGE,
                      icon: ClipboardList,
                    },
                  ],
                },
              ]
            : []),
          // Tablón — todos ven las novedades; manager/hr/admin también pueden gestionar
          ...(tablonEnabled
            ? [
                {
                  title: "Tablón",
                  url: ROUTES.TABLON,
                  icon: Megaphone,
                  badge: tablonBadge,
                  roles: ["employee"] as UserRole[],
                },
                {
                  title: "Tablón",
                  icon: Megaphone,
                  badge: tablonBadge,
                  roles: ["manager", "hr", "admin"] as UserRole[],
                  items: [
                    {
                      title: "Novedades",
                      url: ROUTES.TABLON,
                      icon: Megaphone,
                    },
                    {
                      title: "Gestionar",
                      url: ROUTES.TABLON_MANAGE,
                      icon: ClipboardList,
                    },
                  ],
                },
              ]
            : []),
          // Configuración (admin — configuración de la sede activa)
          {
            title: "Configuración",
            icon: SlidersHorizontal,
            roles: ["admin"] as UserRole[],
            items: configSubItems,
          },
        ],
      },
      // ─── Global: siempre visibles para admins ──────────────
      {
        title: "Global",
        items: [
          {
            title: "Directorio",
            url: ROUTES.DIRECTORIO,
            icon: BookUser,
            roles: ["admin"] as UserRole[],
          },
          {
            title: "Sedes",
            url: ROUTES.ADMIN_ENTITIES,
            icon: Landmark,
            roles: ["admin"] as UserRole[],
          },
          {
            title: "Ajustes",
            icon: Settings,
            items: [
              {
                title: "Perfil",
                url: ROUTES.SETTINGS,
                icon: User,
              },
              {
                title: "Notificaciones",
                url: ROUTES.SETTINGS_NOTIFICATIONS,
                icon: Bell,
              },
              {
                title: "Preferencias",
                url: ROUTES.SETTINGS_PREFERENCES,
                icon: Settings,
              },
              {
                title: "Microsoft 365",
                url: ROUTES.SETTINGS_MICROSOFT,
                icon: Cloud,
              },
              {
                title: "Seguridad",
                url: ROUTES.SETTINGS_SECURITY,
                icon: Shield,
              },
            ],
          },
        ],
      },
    ],
  };
}
