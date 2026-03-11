import { requireAdmin } from "@/lib/supabase/auth";
import { getAllEntities } from "@/lib/queries/entities";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { EntidadesProvider } from "./_components/entidades-provider";
import { EntidadesTable } from "./_components/entidades-table";
import { EntidadesDialogs } from "./_components/entidades-dialogs";
import { EntidadesPrimaryButtons } from "./_components/entidades-primary-buttons";
import { Building2 } from "lucide-react";
import type { Entidad } from "./_components/entidades-schema";

export const metadata = {
  title: "Sedes | Administración",
};

export default async function EntidadesPage() {
  await requireAdmin();

  let entidades: Entidad[] = [];
  let tableError: string | null = null;

  try {
    entidades = await getAllEntities();
  } catch {
    tableError =
      "La tabla de sedes no está disponible todavía. Aplica las migraciones 00002+00005 en Supabase y ejecuta pnpm db:types.";
  }

  return (
    <EntidadesProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">Sedes</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona las sedes del grupo y sus módulos habilitados.
            </p>
          </div>
          {!tableError && <EntidadesPrimaryButtons />}
        </div>

        {tableError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <Building2 className="text-muted-foreground size-10" />
            <p className="text-muted-foreground text-sm">{tableError}</p>
          </div>
        ) : (
          <EntidadesTable entidades={entidades} />
        )}
      </Main>

      <EntidadesDialogs />
    </EntidadesProvider>
  );
}
