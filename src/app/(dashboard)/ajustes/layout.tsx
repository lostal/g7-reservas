/**
 * Settings Layout
 *
 * Shared layout for all settings pages with sidebar navigation.
 * Based on shadcn-admin settings layout pattern.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Separator } from "@/components/ui/separator";
import { SettingsSidebar } from "./components/settings-sidebar";

export const metadata = {
  title: "Ajustes - Seven Suite",
  description: "Configura tus preferencias y ajustes de la aplicación",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

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
        {/* Page Header */}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Ajustes
          </h1>
          <p className="text-muted-foreground">
            Gestiona la configuración de tu cuenta y preferencias de la
            aplicación
          </p>
        </div>

        <Separator className="my-4 lg:my-6" />

        {/* Settings Layout: Sidebar + Content */}
        <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
          {/* Sidebar Navigation */}
          <aside className="top-0 lg:sticky lg:w-1/5">
            <SettingsSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex w-full overflow-y-hidden p-1">{children}</div>
        </div>
      </Main>
    </>
  );
}
