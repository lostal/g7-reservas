"use client";

import * as React from "react";
import { toast } from "sonner";

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";

import { getVisitorReservationsAction } from "../actions";
import type { VisitorReservationWithDetails } from "@/lib/queries/visitor-reservations";
import { VisitantesProvider } from "./visitors-provider";
import { VisitantesPrimaryButtons } from "./visitors-primary-buttons";
import { VisitantesTable } from "./visitors-table";
import { VisitantesDialogs } from "./visitors-dialogs";

interface VisitantesClientProps {
  currentUserId: string;
  currentUserRole: "employee" | "admin";
}

export function VisitantesClient({
  currentUserId,
  currentUserRole,
}: VisitantesClientProps) {
  const [data, setData] = React.useState<VisitorReservationWithDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVisitorReservationsAction();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al cargar las reservas de visitantes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <VisitantesProvider
      onRefresh={fetchData}
      currentUserId={currentUserId}
      currentUserRole={currentUserRole}
    >
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Visitantes</h2>
            <p className="text-muted-foreground">
              Gestiona las reservas de aparcamiento para visitantes externos.
            </p>
          </div>
          <VisitantesPrimaryButtons />
        </div>

        <VisitantesTable data={data} isLoading={isLoading} />
      </Main>

      <VisitantesDialogs />
    </VisitantesProvider>
  );
}
