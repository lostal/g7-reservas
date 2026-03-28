"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface VacacionesNavProps {
  canManage: boolean;
}

export function VacacionesNav({ canManage }: VacacionesNavProps) {
  const pathname = usePathname();

  const links = [
    { href: ROUTES.LEAVE_MY_REQUESTS, label: "Mis solicitudes" },
    ...(canManage ? [{ href: ROUTES.LEAVE_MANAGE, label: "Gestionar" }] : []),
  ];

  return (
    <nav className="flex gap-1 border-b pb-0">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
