"use client";

/**
 * MisReservasClient
 *
 * Componente cliente compartido para Mis Reservas (employee) y Mis Cesiones (management).
 * Agrupa los ítems por período temporal y permite cancelar directamente desde aquí.
 *
 * Patrones reutilizados del proyecto:
 * - Filas de lista de MyReservationsSection (reservations-view.tsx)
 * - Badges de estado de CessionsView (cessations-view.tsx)
 * - Separadores con etiqueta de grupo (patrón shadcn-admin)
 */

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarDays,
  Loader2,
  Repeat2,
  Trash2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cancelReservation } from "@/app/(dashboard)/parking/actions";
import { cancelCession } from "@/app/(dashboard)/parking/cession-actions";
import type { ReservationWithDetails } from "@/lib/queries/reservations";
import type { CessionWithDetails } from "@/lib/queries/cessions";
import { ROUTES } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────

type Mode = "reservations" | "cessions";

interface MisReservasClientProps {
  mode: Mode;
  reservations?: ReservationWithDetails[];
  cessions?: CessionWithDetails[];
}

type GroupKey = "esta-semana" | "este-mes" | "mas-adelante";

// ─── Helpers ─────────────────────────────────────────────────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function getGroupKey(dateStr: string): GroupKey {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = parseLocalDate(dateStr);
  const diffDays = Math.floor(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 6) return "esta-semana";
  if (
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
    return "este-mes";
  return "mas-adelante";
}

const GROUP_LABELS: Record<GroupKey, string> = {
  "esta-semana": "Esta semana",
  "este-mes": "Este mes",
  "mas-adelante": "Más adelante",
};
const GROUP_ORDER: GroupKey[] = ["esta-semana", "este-mes", "mas-adelante"];

// ─── Cession Status Badge ────────────────────────────────────

function CessionStatusBadge({ status }: { status: string }) {
  if (status === "available") {
    return (
      <Badge
        variant="secondary"
        className="shrink-0 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
      >
        Disponible
      </Badge>
    );
  }
  if (status === "reserved") {
    return (
      <Badge variant="default" className="shrink-0">
        Reservada
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0">
      {status}
    </Badge>
  );
}

// ─── Reservation Row ─────────────────────────────────────────

function ReservationRow({
  reservation,
  cancellingId,
  onCancel,
}: {
  reservation: ReservationWithDetails;
  cancellingId: string | null;
  onCancel: (id: string) => void;
}) {
  const date = parseLocalDate(reservation.date);
  const isToday = reservation.date === new Date().toISOString().split("T")[0];

  return (
    <div
      className={`flex items-center gap-4 py-3.5 pl-3 transition-colors ${
        isToday ? "border-primary border-l-2" : "border-l-2 border-transparent"
      }`}
    >
      {/* Date column */}
      <div className="w-7 shrink-0 text-center">
        <p className="text-muted-foreground mb-0.5 text-[10px] leading-none font-medium tracking-widest uppercase">
          {format(date, "EEE", { locale: es })}
        </p>
        <p
          className={`text-2xl leading-none font-bold tabular-nums ${
            isToday ? "text-primary" : "text-foreground"
          }`}
        >
          {format(date, "d")}
        </p>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Plaza {reservation.spot_label}</p>
        <p className="text-muted-foreground truncate text-xs capitalize">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Cancel */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="hover:bg-destructive/10 hover:text-destructive shrink-0"
            onClick={() => onCancel(reservation.id)}
            disabled={cancellingId === reservation.id}
          >
            {cancellingId === reservation.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cancelar reserva</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ─── Cession Row ─────────────────────────────────────────────

function CessionRow({
  cession,
  cancellingId,
  onCancel,
}: {
  cession: CessionWithDetails;
  cancellingId: string | null;
  onCancel: (id: string) => void;
}) {
  const date = parseLocalDate(cession.date);
  const isToday = cession.date === new Date().toISOString().split("T")[0];

  return (
    <div
      className={`flex items-center gap-4 py-3.5 pl-3 transition-colors ${
        isToday ? "border-primary border-l-2" : "border-l-2 border-transparent"
      }`}
    >
      {/* Date column */}
      <div className="w-7 shrink-0 text-center">
        <p className="text-muted-foreground mb-0.5 text-[10px] leading-none font-medium tracking-widest uppercase">
          {format(date, "EEE", { locale: es })}
        </p>
        <p
          className={`text-2xl leading-none font-bold tabular-nums ${
            isToday ? "text-primary" : "text-foreground"
          }`}
        >
          {format(date, "d")}
        </p>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Plaza {cession.spot_label}</p>
        <p className="text-muted-foreground truncate text-xs capitalize">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* Status + cancel */}
      <div className="flex shrink-0 items-center gap-2">
        <CessionStatusBadge status={cession.status} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onCancel(cession.id)}
              disabled={cancellingId === cession.id}
            >
              {cancellingId === cession.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancelar cesión</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────

function EmptyState({ mode }: { mode: Mode }) {
  return (
    <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <div className="bg-muted rounded-full p-3">
        {mode === "cessions" ? (
          <Repeat2 className="text-muted-foreground size-6" />
        ) : (
          <CalendarDays className="text-muted-foreground size-6" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">
          {mode === "cessions"
            ? "No tienes cesiones programadas"
            : "No tienes reservas próximas"}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {mode === "cessions"
            ? "Ve a Parking para ceder tu plaza fácilmente"
            : "Ve a Parking para reservar una plaza disponible"}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={ROUTES.PARKING}>
          {mode === "cessions" ? "Ir a Parking" : "Reservar plaza"}
          <ArrowRight className="ml-2 size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function MisReservasClient({
  mode,
  reservations: initialReservations = [],
  cessions: initialCessions = [],
}: MisReservasClientProps) {
  const [reservations, setReservations] =
    React.useState<ReservationWithDetails[]>(initialReservations);
  const [cessions, setCessions] =
    React.useState<CessionWithDetails[]>(initialCessions);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const items: Array<ReservationWithDetails | CessionWithDetails> =
    mode === "reservations" ? reservations : cessions;

  const grouped = React.useMemo(() => {
    const result: Record<GroupKey, typeof items> = {
      "esta-semana": [],
      "este-mes": [],
      "mas-adelante": [],
    };
    for (const item of items) {
      result[getGroupKey(item.date)].push(item);
    }
    return result;
  }, [items]);

  const handleCancelReservation = async (id: string) => {
    setCancellingId(id);
    try {
      const result = await cancelReservation({ id });
      if (result.success) {
        toast.success("Reserva cancelada");
        setReservations((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al cancelar la reserva");
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelCession = async (id: string) => {
    setCancellingId(id);
    try {
      const result = await cancelCession({ id });
      if (result.success) {
        const msg = result.data.reservationAlsoCancelled
          ? "Cesión cancelada y reserva del empleado anulada"
          : "Cesión cancelada";
        toast.success(msg);
        setCessions((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Error al cancelar la cesión");
    } finally {
      setCancellingId(null);
    }
  };

  if (items.length === 0) {
    return <EmptyState mode={mode} />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {GROUP_ORDER.map((groupKey) => {
          const groupItems = grouped[groupKey];
          if (!groupItems || groupItems.length === 0) return null;

          return (
            <div key={groupKey} className="space-y-2">
              {/* Group header */}
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {GROUP_LABELS[groupKey]}
                </span>
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-xs tabular-nums">
                  {groupItems.length}
                </span>
              </div>

              {/* Rows */}
              <div className="divide-border/50 divide-y">
                {groupItems.map((item) =>
                  mode === "reservations" ? (
                    <ReservationRow
                      key={item.id}
                      reservation={item as ReservationWithDetails}
                      cancellingId={cancellingId}
                      onCancel={handleCancelReservation}
                    />
                  ) : (
                    <CessionRow
                      key={item.id}
                      cession={item as CessionWithDetails}
                      cancellingId={cancellingId}
                      onCancel={handleCancelCession}
                    />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
