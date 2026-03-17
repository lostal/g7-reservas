/**
 * Panel de Administración (Admin Dashboard)
 *
 * Server Component — admin only.
 * Non-admin roles are redirected to /parking.
 *
 * Usa Suspense granular por sección para que el HTML empiece a streamear
 * antes de que las queries más lentas terminen.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/supabase/auth";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { toServerDateStr } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/lib/constants";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";
import { DashboardTopNav } from "./_components/dashboard-top-nav";
import { PanelStatsSection } from "./_components/panel-stats-section";
import { PanelChartsSection } from "./_components/panel-charts-section";
import { PanelAnalyticsSection } from "./_components/panel-analytics-section";
import { PanelAlertsSection } from "./_components/panel-alerts-section";
import {
  StatsSkeleton,
  ChartsSkeleton,
  AnalyticsSkeleton,
  AlertsSkeleton,
} from "./_components/panel-skeleton";
import { PanelSectionErrorBoundary } from "./_components/panel-error-boundary";

export default async function PanelPage() {
  const user = await requireAuth();
  const role = user.profile?.role ?? "employee";

  if (role !== "admin") {
    redirect(ROUTES.PARKING);
  }

  const today = toServerDateStr(new Date());
  const entityId = await getEffectiveEntityId();

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <DashboardTopNav role="admin" />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
          <p className="text-muted-foreground text-sm">
            {formatDateLong(today)}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="analytics">Analítica</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Resumen ─────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats cards — bloqueo mínimo, solo 4 queries rápidas */}
            <PanelSectionErrorBoundary>
              <Suspense key={entityId ?? "global"} fallback={<StatsSkeleton />}>
                <PanelStatsSection today={today} entityId={entityId} />
              </Suspense>
            </PanelSectionErrorBoundary>

            {/* Chart + Actividad reciente */}
            <PanelSectionErrorBoundary>
              <Suspense fallback={<ChartsSkeleton />}>
                <PanelChartsSection entityId={entityId} />
              </Suspense>
            </PanelSectionErrorBoundary>

            {/* Admin alerts */}
            <PanelSectionErrorBoundary>
              <Suspense fallback={<AlertsSkeleton />}>
                <PanelAlertsSection today={today} entityId={entityId} />
              </Suspense>
            </PanelSectionErrorBoundary>
          </TabsContent>

          {/* ── Analítica ────────────────────────────────────── */}
          <TabsContent value="analytics" className="space-y-4">
            <PanelSectionErrorBoundary>
              <Suspense fallback={<AnalyticsSkeleton />}>
                <PanelAnalyticsSection entityId={entityId} />
              </Suspense>
            </PanelSectionErrorBoundary>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
