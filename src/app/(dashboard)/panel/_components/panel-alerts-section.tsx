/**
 * PanelAlertsSection — Async Server Component
 *
 * Obtiene ocupación actual y renderiza el widget de alertas del sistema.
 */

import { getSpotsByDate } from "@/lib/queries/spots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminAlerts } from "./admin-alerts";

interface PanelAlertsSectionProps {
  today: string;
}

export async function PanelAlertsSection({ today }: PanelAlertsSectionProps) {
  const spots = await getSpotsByDate(today);

  const totalSpots = spots.length;
  const occupiedSpots = spots.filter(
    (s) =>
      s.status === "reserved" ||
      s.status === "occupied" ||
      s.status === "visitor-blocked"
  ).length;
  const occupancyPercent =
    totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminAlerts occupancyPercent={occupancyPercent} />
      </CardContent>
    </Card>
  );
}
