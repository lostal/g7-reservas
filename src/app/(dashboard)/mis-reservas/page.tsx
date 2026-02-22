/**
 * Mis Reservas / Mis Cesiones
 *
 * Employee  → muestra todas sus reservas futuras agrupadas por período.
 * Management → muestra todas sus cesiones futuras agrupadas por período.
 * Admin      → redirige al panel.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { requireAuth } from "@/lib/supabase/auth";
import { getUserReservations } from "@/lib/queries/reservations";
import { getUserCessions } from "@/lib/queries/cessions";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { MisReservasClient } from "./_components/mis-reservas-client";

export default async function MisReservasPage() {
  const user = await requireAuth();
  const role = user.profile?.role ?? "employee";

  if (role === "admin") {
    redirect(ROUTES.DASHBOARD);
  }

  const isManagement = role === "management";

  const [reservations, cessions] = await Promise.all([
    !isManagement ? getUserReservations(user.id) : Promise.resolve([]),
    isManagement ? getUserCessions(user.id) : Promise.resolve([]),
  ]);

  const title = isManagement ? "Mis Cesiones" : "Mis Reservas";
  const count = isManagement ? cessions.length : reservations.length;
  const countLabel = isManagement
    ? `${count} cesión${count !== 1 ? "es" : ""} programada${count !== 1 ? "s" : ""}`
    : `${count} reserva${count !== 1 ? "s" : ""} confirmada${count !== 1 ? "s" : ""}`;

  return (
    <>
      <Header fixed>
        <div />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">
              {count > 0
                ? countLabel
                : isManagement
                  ? "No tienes cesiones programadas"
                  : "No tienes reservas próximas"}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.PARKING}>
              {isManagement ? "Ceder plaza" : "Reservar plaza"}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <MisReservasClient
          mode={isManagement ? "cessions" : "reservations"}
          reservations={reservations}
          cessions={cessions}
        />
      </Main>
    </>
  );
}
