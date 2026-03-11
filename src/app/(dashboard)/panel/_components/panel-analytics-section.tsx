/**
 * PanelAnalyticsSection — Async Server Component
 *
 * Obtiene y renderiza las gráficas de la pestaña "Analítica":
 * tendencia diaria, top spots y distribución de movimientos.
 * Se carga de forma independiente via Suspense (pestaña no activa por defecto).
 */

import {
  getDailyCountsLast30Days,
  getTopSpots,
  getMovementDistribution,
} from "@/lib/queries/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OccupancyAreaChart } from "./occupancy-area-chart";
import { SimpleBarList } from "./simple-bar-list";

interface PanelAnalyticsSectionProps {
  entityId?: string | null;
}

export async function PanelAnalyticsSection({
  entityId,
}: PanelAnalyticsSectionProps) {
  const [dailyCounts, topSpots, movementDistribution] = await Promise.all([
    getDailyCountsLast30Days(30, undefined, entityId),
    getTopSpots(6, undefined, entityId),
    getMovementDistribution(entityId),
  ]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tendencia diaria de ocupación</CardTitle>
          <CardDescription>
            Reservas de empleados y visitas de los últimos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <OccupancyAreaChart data={dailyCounts} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Plazas más reservadas</CardTitle>
            <CardDescription>
              Plazas con más reservas confirmadas este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topSpots.length > 0 ? (
              <SimpleBarList
                items={topSpots.map((s) => ({
                  name: `Plaza ${s.spot_label}`,
                  value: s.count,
                }))}
                barClass="bg-primary"
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Sin datos este mes
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución de movimientos</CardTitle>
            <CardDescription>Tipos de ocupación este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={movementDistribution}
              barClass="bg-muted-foreground"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
