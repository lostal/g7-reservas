/**
 * PanelStatsSection — Async Server Component
 *
 * Obtiene y renderiza las tarjetas de KPI del panel admin de forma independiente,
 * permitiendo que Suspense muestre un skeleton mientras carga.
 */

import { getSpotsByDate } from "@/lib/queries/spots";
import {
  getMonthlyReservationCount,
  getActiveUsersThisMonth,
  getVisitorsTodayCount,
} from "@/lib/queries/stats";
import { AdminStatsCards } from "./admin-stats-cards";

interface PanelStatsSectionProps {
  today: string;
}

export async function PanelStatsSection({ today }: PanelStatsSectionProps) {
  const [spots, monthlyReservations, activeUsers, visitorsToday] =
    await Promise.all([
      getSpotsByDate(today),
      getMonthlyReservationCount(),
      getActiveUsersThisMonth(),
      getVisitorsTodayCount(today),
    ]);

  const totalSpots = spots.length;
  const freeSpots = spots.filter(
    (s) => s.status === "free" || s.status === "ceded"
  ).length;
  const occupiedSpots = spots.filter(
    (s) =>
      s.status === "reserved" ||
      s.status === "occupied" ||
      s.status === "visitor-blocked"
  ).length;
  const occupancyPercent =
    totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

  return (
    <AdminStatsCards
      freeSpots={freeSpots}
      totalSpots={totalSpots}
      occupancyPercent={occupancyPercent}
      monthlyReservations={monthlyReservations}
      activeUsersMonth={activeUsers}
      visitorsToday={visitorsToday}
    />
  );
}
