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
  CalendarCheck,
  Building2,
  SlidersHorizontal,
  ParkingCircle,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
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
          title: "Espacios",
          icon: LayoutGrid,
          roles: ["employee", "admin"],
          items: [
            {
              title: "Parking",
              url: ROUTES.PARKING,
              icon: ParkingCircle,
            },
            {
              title: "Oficinas",
              url: ROUTES.OFFICES,
              icon: Building2,
            },
            {
              title: "Mapa",
              url: ROUTES.PARKING_MAP,
              icon: MapPin,
            },
          ],
        },
        {
          title: "Mi Actividad",
          url: ROUTES.MIS_RESERVAS,
          icon: CalendarCheck,
          roles: ["employee", "admin"],
        },
        {
          title: "Visitantes",
          url: ROUTES.VISITORS,
          icon: Users,
          // All roles can see visitors; admin is the primary one to manage them
        },
      ],
    },
    {
      title: "Administración",
      items: [
        {
          title: "Plazas",
          url: ROUTES.ADMIN,
          icon: LayoutGrid,
          roles: ["admin"],
        },
        {
          title: "Usuarios",
          url: ROUTES.ADMIN_USERS,
          icon: Users,
          roles: ["admin"],
        },
        {
          title: "Configuración",
          url: ROUTES.ADMIN_SETTINGS,
          icon: SlidersHorizontal,
          roles: ["admin"],
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
