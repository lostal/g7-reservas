import { getCurrentUser } from "@/lib/supabase/auth";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { DirectorioProvider } from "./_components/directorio-provider";
import { DirectorioTable } from "./_components/directorio-table";
import { DirectorioPrimaryButtons } from "./_components/directorio-primary-buttons";
import { DirectorioDialogs } from "./_components/directorio-dialogs";
import { directorioData } from "./_components/directorio-data";

export default async function DirectorioPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === "admin";

  return (
    <DirectorioProvider isAdmin={isAdmin}>
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
            <h2 className="text-2xl font-bold tracking-tight">Directorio</h2>
            <p className="text-muted-foreground">
              Directorio de empleados de todas las sedes.
            </p>
          </div>
          <DirectorioPrimaryButtons />
        </div>
        <DirectorioTable data={directorioData} />
      </Main>

      <DirectorioDialogs />
    </DirectorioProvider>
  );
}
