/**
 * PanelChartsSection — Async Server Component
 *
 * Obtiene y renderiza el gráfico de barras de reservas + actividad reciente.
 * Se carga de forma independiente via Suspense.
 */

import {
  getDailyCountsLast30Days,
  getRecentActivity,
} from "@/lib/queries/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReservationsOverviewChart } from "./reservations-overview-chart";
import { RecentActivity } from "./recent-activity";

export async function PanelChartsSection() {
  const [dailyCounts, recentActivity] = await Promise.all([
    getDailyCountsLast30Days(30),
    getRecentActivity(8),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      <Card className="col-span-1 lg:col-span-4">
        <CardHeader>
          <CardTitle>Reservas — últimos 30 días</CardTitle>
          <CardDescription>
            Reservas de empleados y visitas confirmadas por día
          </CardDescription>
        </CardHeader>
        <CardContent className="ps-2">
          <ReservationsOverviewChart data={dailyCounts} />
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>
            Últimas reservas registradas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivity items={recentActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
