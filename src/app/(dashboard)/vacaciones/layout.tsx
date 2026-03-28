import { requireAuth } from "@/lib/auth/helpers";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { VacacionesNav } from "./_components/vacaciones-nav";

export const metadata = { title: "Vacaciones - Seven Suite" };

export default async function VacacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const role = user.profile?.role ?? "employee";
  const canManage = role === "manager" || role === "hr" || role === "admin";

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vacaciones</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tus solicitudes de ausencia y vacaciones.
          </p>
        </div>

        <VacacionesNav canManage={canManage} />

        {children}
      </Main>
    </>
  );
}
