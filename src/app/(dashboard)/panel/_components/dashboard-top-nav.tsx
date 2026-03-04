/**
 * DashboardTopNav
 *
 * Client component wrapper for the TopNav used in the dashboard header.
 * Needed because usePathname() requires "use client".
 */

"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { TopNav } from "@/components/layout";

const linksByRole: Record<string, { title: string; href: string }[]> = {
  employee: [
    { title: "Dashboard", href: ROUTES.DASHBOARD },
    { title: "Reservas", href: ROUTES.PARKING },
    { title: "Mapa", href: ROUTES.PARKING_MAP },
    { title: "Visitantes", href: ROUTES.VISITORS },
  ],
  admin: [
    { title: "Dashboard", href: ROUTES.DASHBOARD },
    { title: "Visitantes", href: ROUTES.VISITORS },
    { title: "Plazas", href: ROUTES.ADMIN },
    { title: "Usuarios", href: ROUTES.ADMIN_USERS },
  ],
};

interface DashboardTopNavProps {
  role: string;
}

export function DashboardTopNav({ role }: DashboardTopNavProps) {
  const pathname = usePathname();
  const links = linksByRole[role] ?? linksByRole.employee!;
  return (
    <TopNav
      links={links.map((link) => ({
        ...link,
        isActive: pathname === link.href,
      }))}
    />
  );
}
