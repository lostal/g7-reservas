/**
 * Dashboard Layout
 *
 * Wraps all protected pages with sidebar + main content area.
 * Uses shadcn/ui SidebarProvider for collapsible sidebar state.
 * SearchProvider enables ⌘K command palette.
 */

import { cookies } from "next/headers";
import { requireAuth } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout";
import type { UserRole } from "@/lib/supabase/types";
import { SearchProvider } from "@/context/search-context";
import { SkipToMain } from "@/components/skip-to-main";
import { getUserPreferences } from "@/lib/queries/preferences";
import { ThemeSync } from "@/components/providers/theme-sync";
import { getResourceConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  getAllEntities,
  getEntityEnabledModules,
  type Entity,
} from "@/lib/queries/entities";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuth();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  // Fetch user preferences, visitor_booking_enabled config, and spot ownership in parallel.
  // getResourceConfig aplica el overlay de entity_config sobre system_config.
  const supabase = await createClient();
  const entityId = await getEffectiveEntityId();
  const [prefs, parkingVisitors, officeVisitors, parkingSpot, officeSpot] =
    await Promise.all([
      getUserPreferences(user.id),
      getResourceConfig("parking", "visitor_booking_enabled", entityId),
      getResourceConfig("office", "visitor_booking_enabled", entityId),
      supabase
        .from("spots")
        .select("id")
        .eq("assigned_to", user.id)
        .eq("resource_type", "parking")
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("spots")
        .select("id")
        .eq("assigned_to", user.id)
        .eq("resource_type", "office")
        .eq("is_active", true)
        .maybeSingle(),
    ]);
  const visitorBookingEnabled = parkingVisitors || officeVisitors;
  const hasParkingSpot = !!parkingSpot.data;
  const hasOfficeSpot = !!officeSpot.data;
  const dbTheme = prefs?.theme ?? "system";

  // Carga de entidades y módulos — try/catch por si la migración no está aplicada aún
  let entities: Entity[] | undefined = undefined;
  let activeEntityId: string | null = null;
  let entityIdPersisted = false;
  let enabledModules: string[] | undefined = undefined;
  let userEntityName: string | undefined = undefined;
  if (user.profile?.role === "admin") {
    try {
      entities = await getAllEntities();
      const cookieEntityId = cookieStore.get("active-entity-id")?.value ?? null;
      // Validate that the cookie references an entity the current admin can access.
      // If User B logs in after User A, the stale cookie must not grant cross-user context.
      const isValidCookieEntity =
        cookieEntityId !== null &&
        entities.some((e) => e.id === cookieEntityId);
      activeEntityId = isValidCookieEntity
        ? cookieEntityId
        : (entities[0]?.id ?? null);
      entityIdPersisted = isValidCookieEntity;
      if (activeEntityId) {
        enabledModules = await getEntityEnabledModules(activeEntityId);
      }
    } catch {
      // table doesn't exist yet — migration pending
      entities = [];
    }
  } else if (user.profile?.entity_id) {
    // Para employees: obtener nombre de sede y módulos habilitados de su sede
    try {
      const [entityRow, employeeModules] = await Promise.all([
        supabase
          .from("entities")
          .select("name")
          .eq("id", user.profile.entity_id)
          .maybeSingle(),
        getEntityEnabledModules(user.profile.entity_id),
      ]);
      userEntityName = entityRow.data?.name ?? undefined;
      enabledModules = employeeModules;
    } catch {
      // migration pending — ignore
    }
  }

  return (
    <SearchProvider
      role={(user.profile?.role ?? "employee") as UserRole}
      visitorBookingEnabled={visitorBookingEnabled}
    >
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <ThemeSync dbTheme={dbTheme} />
        <AppSidebar
          role={(user.profile?.role ?? "employee") as UserRole}
          hasParkingSpot={hasParkingSpot}
          hasOfficeSpot={hasOfficeSpot}
          entities={entities}
          activeEntityId={activeEntityId}
          entityIdPersisted={entityIdPersisted}
          entityName={userEntityName}
          enabledModules={enabledModules}
        />
        <SidebarInset
          className={cn(
            "@container/content",
            "has-data-[layout=fixed]:h-svh",
            "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]"
          )}
        >
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SearchProvider>
  );
}
