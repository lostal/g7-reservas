/**
 * Sidebar Navigation Data
 *
 * Defines the navigation structure for the app sidebar.
 * Items are grouped by section and support icons, badges, and sub-items.
 *
 * Role visibility:
 *   employee   → usuario general (puede reservar y ceder si tiene plaza asignada)
 *   admin      → administrador (gestiona usuarios, plazas y configuración)
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
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { type SidebarData } from "../types";

interface SidebarDataParams {
  hasParkingSpot: boolean;
  hasOfficeSpot: boolean;
  visitorBookingEnabled: boolean;
}

export function getSidebarData({
  hasParkingSpot,
  hasOfficeSpot,
  visitorBookingEnabled,
}: SidebarDataParams): SidebarData {
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
    ...(visitorBookingEnabled
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

  const adminParkingItems = [
    ...(visitorBookingEnabled
      ? [{ title: "Visitantes", url: ROUTES.VISITORS, icon: Users }]
      : []),
    { title: "Asignaciones", url: ROUTES.ADMIN_PARKING, icon: LayoutGrid },
  ];

  const adminOficinaItems = [
    { title: "Asignaciones", url: ROUTES.ADMIN_OFFICES, icon: LayoutGrid },
  ];

  return {
    navGroups: [
      {
        title: "General",
        items: [
          {
            title: "Panel",
            url: ROUTES.DASHBOARD,
            icon: LayoutDashboard,
            roles: ["admin"],
          },
          {
            title: "Directorio",
            url: ROUTES.DIRECTORIO,
            icon: BookUser,
          },
          {
            title: "Parking",
            url: ROUTES.PARKING,
            icon: ParkingCircle,
            roles: ["employee"],
            items: parkingSubItems,
          },
          {
            title: "Parking",
            icon: ParkingCircle,
            roles: ["admin"],
            items: adminParkingItems,
          },
          {
            title: "Oficinas",
            url: ROUTES.OFFICES,
            icon: Building2,
            roles: ["employee"],
            items: oficinasSubItems,
          },
          {
            title: "Oficinas",
            icon: Building2,
            roles: ["admin"],
            items: adminOficinaItems,
          },
        ],
      },
      {
        title: "Administración",
        items: [
          {
            title: "Configuración",
            icon: SlidersHorizontal,
            roles: ["admin"],
            items: [
              { title: "General", url: ROUTES.ADMIN_SETTINGS, icon: Globe },
              {
                title: "Parking",
                url: ROUTES.ADMIN_SETTINGS_PARKING,
                icon: ParkingCircle,
              },
              {
                title: "Oficinas",
                url: ROUTES.ADMIN_SETTINGS_OFFICES,
                icon: Building2,
              },
            ],
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
