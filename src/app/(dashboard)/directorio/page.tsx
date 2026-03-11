import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getAllEntities } from "@/lib/queries/entities";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { DirectorioProvider } from "./_components/directorio-provider";
import { DirectorioTable } from "./_components/directorio-table";
import { DirectorioPrimaryButtons } from "./_components/directorio-primary-buttons";
import { DirectorioDialogs } from "./_components/directorio-dialogs";
import { type DirectorioUser } from "./_components/directorio-schema";

export default async function DirectorioPage() {
  const user = await requireAuth();
  const isAdmin = user.profile?.role === "admin";
  const supabase = await createClient();
  const userEntityId = user.profile?.entity_id ?? null;

  let profilesQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, job_title, phone, entity_id, entities(name)"
    )
    .order("full_name");

  // Los empleados solo ven usuarios de su propia sede;
  // los administradores ven el directorio global.
  if (!isAdmin && userEntityId) {
    profilesQuery = profilesQuery.eq("entity_id", userEntityId);
  }

  const [{ data: profiles }, entities] = await Promise.all([
    profilesQuery,
    getAllEntities(),
  ]);

  const directorioData: DirectorioUser[] = (profiles ?? []).map((p) => {
    const entityName =
      p.entities && !Array.isArray(p.entities) ? p.entities.name : "";
    return {
      id: p.id,
      nombre: p.full_name,
      correo: p.email,
      rol: p.role ?? "employee",
      puesto: p.job_title ?? "",
      telefono: p.phone ?? "",
      entity_id: p.entity_id ?? null,
      entity_name: entityName,
    };
  });

  return (
    <DirectorioProvider isAdmin={isAdmin} entities={entities}>
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
        <DirectorioTable data={directorioData} entities={entities} />
      </Main>

      <DirectorioDialogs />
    </DirectorioProvider>
  );
}
