/**
 * Parking Calendar – Vista unificada de calendario
 *
 * Empleado: días coloreados por disponibilidad → click → sheet con plazas
 * Directivo: días coloreados por estado cesión → click/shift+click/drag → ceder
 */

"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  CalendarDayData,
  EmployeeDayStatus,
  ManagementDayStatus,
} from "../calendar-actions";

// ─── Tipos públicos ──────────────────────────────────────────

export type CalendarRole = "employee" | "management";

export interface ParkingCalendarProps {
  role: CalendarRole;
  /** Datos del mes actual, indexados por fecha "yyyy-MM-dd" */
  dayData: Map<string, CalendarDayData>;
  /** Mes visible (primer día del mes) */
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
  /** Dirección de la navegación: 1 → siguiente mes, -1 → mes anterior, 0 → inicial */
  slideDirection?: number;
  /** Fechas seleccionadas por el directivo (multi-selección) */
  selectedDates?: Set<string>;
  /** Tap/click en un día */
  onDayClick: (date: string) => void;
}

// ─── Variantes de animación del mes ──────────────────────────
//
// Se definen como funciones que reciben el valor `custom` de AnimatePresence.
// Esto garantiza que las animaciones de salida (exit) usen siempre la dirección
// actual, no la capturada en el momento de montar el componente.

const EASE_OUT = [0.0, 0.0, 0.2, 1] as const;
const EASE_IN = [0.4, 0.0, 1, 1] as const;

const monthGridVariants = {
  initial: (dir: number) => ({
    x: dir >= 0 ? "22%" : "-22%",
    opacity: 0,
  }),
  animate: {
    x: "0%",
    opacity: 1,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "-22%" : "22%",
    opacity: 0,
    transition: { duration: 0.16, ease: EASE_IN },
  }),
};

const monthTitleVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    y: dir >= 0 ? 5 : -5,
  }),
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir >= 0 ? -5 : 5,
    transition: { duration: 0.14, ease: EASE_IN },
  }),
};

// ─── Colores por estado ──────────────────────────────────────

const EMPLOYEE_COLORS: Record<EmployeeDayStatus, string> = {
  plenty: "bg-emerald-500 text-white hover:bg-emerald-600",
  few: "bg-amber-400 text-white hover:bg-amber-500",
  none: "bg-rose-500 text-white hover:bg-rose-600",
  reserved: "bg-blue-500 text-white hover:bg-blue-600",
  past: "bg-muted text-muted-foreground cursor-default",
  weekend: "bg-transparent text-muted-foreground/60 cursor-default",
};

const MANAGEMENT_COLORS: Record<ManagementDayStatus, string> = {
  "can-cede": "bg-emerald-500 text-white hover:bg-emerald-600",
  "ceded-free": "bg-orange-400 text-white hover:bg-orange-500",
  "ceded-taken": "bg-blue-500 text-white hover:bg-blue-600",
  "in-use": "bg-muted text-muted-foreground cursor-default",
  past: "bg-muted text-muted-foreground cursor-default",
  weekend: "bg-transparent text-muted-foreground/60 cursor-default",
};

// Tooltip/aria-label por estado
const EMPLOYEE_LABELS: Record<EmployeeDayStatus, string> = {
  plenty: "Plazas disponibles",
  few: "Pocas plazas",
  none: "Sin plazas",
  reserved: "Ya tienes reserva",
  past: "Pasado",
  weekend: "Fin de semana",
};

const MANAGEMENT_LABELS: Record<ManagementDayStatus, string> = {
  "can-cede": "Puedes ceder",
  "ceded-free": "Cedida – sin reservar",
  "ceded-taken": "Cedida y reservada",
  "in-use": "En uso",
  past: "Pasado",
  weekend: "Fin de semana",
};

// ─── Leyenda ─────────────────────────────────────────────────

function CalendarLegend({ role }: { role: CalendarRole }) {
  if (role === "employee") {
    return (
      <div className="flex flex-wrap gap-3 text-xs">
        <LegendItem color="bg-emerald-500" label="Hay plazas" />
        <LegendItem color="bg-amber-400" label="Pocas plazas" />
        <LegendItem color="bg-rose-500" label="Sin plazas" />
        <LegendItem color="bg-blue-500" label="Ya reservaste" />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <LegendItem color="bg-emerald-500" label="Puedes ceder" />
      <LegendItem color="bg-orange-400" label="Cedida libre" />
      <LegendItem color="bg-blue-500" label="Cedida y reservada" />
      <LegendItem color="bg-muted border" label="En uso / pasado" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block size-3 rounded-full border border-black/10",
          color
        )}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

// ─── Celda de día ────────────────────────────────────────────

interface DayCellProps {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  role: CalendarRole;
  data?: CalendarDayData;
  isSelected?: boolean;
  onClick: (dateStr: string) => void;
}

function DayCell({
  dateStr,
  dayNumber,
  isCurrentMonth,
  isToday: isTodayFlag,
  role,
  data,
  isSelected,
  onClick,
}: DayCellProps) {
  if (!isCurrentMonth) {
    return <div className="aspect-square min-h-11 rounded-xl" aria-hidden />;
  }

  const status =
    role === "employee"
      ? (data?.employeeStatus ?? "past")
      : (data?.managementStatus ?? "past");

  const colorClass =
    role === "employee"
      ? EMPLOYEE_COLORS[status as EmployeeDayStatus]
      : MANAGEMENT_COLORS[status as ManagementDayStatus];

  const label =
    role === "employee"
      ? EMPLOYEE_LABELS[status as EmployeeDayStatus]
      : MANAGEMENT_LABELS[status as ManagementDayStatus];

  const isInteractive =
    role === "employee"
      ? !["past", "weekend"].includes(status)
      : status === "can-cede";

  // Para directivo: también seleccionable si ya está cedida (para cancelar)
  const isManagementCancellable =
    role === "management" && status === "ceded-free";

  const canInteract = isInteractive || isManagementCancellable;

  return (
    <button
      type="button"
      aria-label={`${dayNumber} – ${label}`}
      aria-pressed={isSelected}
      disabled={!canInteract}
      className={cn(
        "relative aspect-square min-h-11 w-full rounded-xl text-sm font-semibold select-none",
        "focus-visible:ring-ring transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-60",
        colorClass,
        isTodayFlag && "ring-2 ring-white/50 ring-inset",
        isSelected && "ring-foreground scale-95 ring-2 ring-offset-1"
        // Tamaño touch-friendly en móvil garantizado por min-h + aspect-square
      )}
      onClick={() => onClick(dateStr)}
    >
      <span className="relative z-10">{dayNumber}</span>
      {/* Indicador de disponibilidad para empleado — nunca en fines de semana ni pasados */}
      {role === "employee" &&
        data?.availableCount !== undefined &&
        data.availableCount > 0 &&
        status !== "reserved" &&
        status !== "weekend" &&
        status !== "past" && (
          <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[9px] leading-none opacity-80">
            {data.availableCount}
          </span>
        )}
    </button>
  );
}

// ─── Componente Principal ─────────────────────────────────────

export function ParkingCalendar({
  role,
  dayData,
  currentMonth,
  slideDirection = 0,
  onMonthChange,
  selectedDates = new Set(),
  onDayClick,
}: ParkingCalendarProps) {
  const monthKey = format(currentMonth, "yyyy-MM");

  // Construir las semanas del mes (siempre 6 semanas visuales para estabilidad)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="space-y-4">
      {/* Header navegación de mes */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Título del mes animado — sube/baja según la dirección */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.h3
              key={monthKey + "-title"}
              custom={slideDirection}
              variants={monthTitleVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-base font-semibold capitalize"
            >
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </motion.h3>
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Días de la semana — estáticos, no cambian */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-muted-foreground py-1 text-center text-xs font-medium"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Grid del mes — ambas animaciones ocurren en paralelo (popLayout).
          Sin overflow-hidden: el ring del día actual no queda recortado en esquinas.
          El overflow horizontal queda tapado por opacity:0 en los extremos y por
          el html{overflow-x:hidden} global. */}
      <AnimatePresence mode="popLayout" custom={slideDirection}>
        <motion.div
          key={monthKey}
          custom={slideDirection}
          variants={monthGridVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="grid grid-cols-7 gap-1"
        >
          {weeks.map((week) =>
            week.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const inCurrentMonth = isSameMonth(date, currentMonth);
              const today = isToday(date);
              const data = dayData.get(dateStr);
              const isSelected = selectedDates.has(dateStr);

              return (
                <DayCell
                  key={dateStr}
                  dateStr={dateStr}
                  dayNumber={date.getDate()}
                  isCurrentMonth={inCurrentMonth}
                  isToday={today}
                  role={role}
                  data={data}
                  isSelected={isSelected}
                  onClick={onDayClick}
                />
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Leyenda — se desliza suavemente cuando el grid de arriba cambia de altura */}
      <motion.div
        layout
        transition={{ layout: { type: "spring", stiffness: 350, damping: 30 } }}
      >
        <CalendarLegend role={role} />
      </motion.div>

      {role === "management" && (
        <motion.p
          layout
          transition={{
            layout: { type: "spring", stiffness: 350, damping: 30 },
          }}
          className="text-muted-foreground text-xs"
        >
          Toca varios días para seleccionarlos y ceder tu plaza.
        </motion.p>
      )}
    </div>
  );
}
