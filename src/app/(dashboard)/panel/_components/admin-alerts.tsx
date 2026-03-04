/**
 * AdminAlerts Component
 *
 * Shows system status alerts for the admin panel.
 * Only rendered for admin role.
 */

import { AlertTriangle } from "lucide-react";

interface AdminAlertsProps {
  /** Today's occupancy percentage */
  occupancyPercent: number;
}

export function AdminAlerts({ occupancyPercent }: AdminAlertsProps) {
  return (
    <div className="space-y-4">
      <OccupancyIndicator percent={occupancyPercent} />
      <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
        <div className="text-muted-foreground text-sm">
          Sin alertas pendientes
        </div>
      </div>
    </div>
  );
}

function OccupancyIndicator({ percent }: { percent: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Ocupación hoy
        </span>
        <span className="font-medium">{percent}%</span>
      </div>
      <div className="bg-muted h-2 w-full rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
