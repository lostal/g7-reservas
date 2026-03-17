/**
 * Configuración del sistema — Layout
 *
 * Layout compartido para todas las páginas de configuración del sistema.
 * Réplica del patrón del layout de ajustes de usuario pero con acceso
 * restringido a admin y secciones de sistema.
 */

import { requireAdmin } from "@/lib/supabase/auth";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Separator } from "@/components/ui/separator";
import { AdminSettingsSidebar } from "./_components/admin-settings-sidebar";

export const metadata = {
  title: "Configuración del sistema - Seven Suite",
  description:
    "Configura los parámetros del sistema: límites de reserva, disponibilidad y funcionalidades",
};

export default async function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Configuración del sistema
          </h1>
          <p className="text-muted-foreground">
            Gestiona los parámetros globales de la aplicación, límites de
            reserva y configuración por tipo de recurso
          </p>
        </div>

        <Separator className="my-4 lg:my-6" />

        <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="top-0 lg:sticky lg:w-1/5">
            <AdminSettingsSidebar />
          </aside>
          <div className="flex w-full overflow-y-hidden p-1">{children}</div>
        </div>
      </Main>
    </>
  );
}
