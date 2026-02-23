"use server";

/**
 * Server Actions de Reservas de Aparcamiento
 *
 * Server Actions para crear y cancelar reservas de aparcamiento de empleados,
 * y funciones de consulta para la vista de lista del parking.
 */

import { actionClient, type ActionResult, success, error } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  createReservationSchema,
  cancelReservationSchema,
} from "@/lib/validations";
import type { SpotWithStatus } from "@/types";
import {
  getUserReservations,
  type ReservationWithDetails,
} from "@/lib/queries/reservations";

// ─── Query Functions ─────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────

/** El parking cierra sábados (6) y domingos (0) */
function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y!, m! - 1, d!).getDay();
  return day === 0 || day === 6;
}

/**
 * Obtiene las plazas disponibles para una fecha dada.
 *
 * Una plaza está "disponible" si:
 * - No tiene una reserva confirmada para esa fecha
 * - Si type='management', debe existir una cesión con status='available'
 * - Está activa
 * - La fecha es un día laborable (el parking cierra fines de semana)
 *
 * Devuelve las plazas que el usuario actual puede reservar.
 */
export async function getAvailableSpotsForDate(
  date: string
): Promise<ActionResult<SpotWithStatus[]>> {
  try {
    // El parking cierra los fines de semana
    if (isWeekend(date)) return success([]);

    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const supabase = await createClient();

    // Obtener todos los datos en paralelo
    const [spotsResult, reservationsResult, cessionsResult, visitorResult] =
      await Promise.all([
        supabase.from("spots").select("*").eq("is_active", true).order("label"),
        supabase
          .from("reservations")
          .select("id, spot_id")
          .eq("date", date)
          .eq("status", "confirmed"),
        supabase
          .from("cessions")
          .select("id, spot_id, status")
          .eq("date", date)
          .neq("status", "cancelled"),
        supabase
          .from("visitor_reservations")
          .select("id, spot_id")
          .eq("date", date)
          .eq("status", "confirmed"),
      ]);

    if (spotsResult.error)
      return error(`Error al obtener plazas: ${spotsResult.error.message}`);

    const spots = spotsResult.data;
    const reservedSpotIds = new Set(
      (reservationsResult.data ?? []).map((r) => r.spot_id)
    );
    const cessionBySpot = new Map(
      (cessionsResult.data ?? []).map((c) => [c.spot_id, c])
    );
    const visitorSpotIds = new Set(
      (visitorResult.data ?? []).map((v) => v.spot_id)
    );

    const available: SpotWithStatus[] = [];

    for (const spot of spots) {
      // Omitir plazas con reservas confirmadas
      if (reservedSpotIds.has(spot.id)) continue;

      // Omitir plazas con reservas de visitantes
      if (visitorSpotIds.has(spot.id)) continue;

      if (spot.type === "management") {
        // Plazas de dirección: solo disponibles si existe una cesión activa
        const cession = cessionBySpot.get(spot.id);
        if (!cession || cession.status !== "available") continue;

        available.push({
          id: spot.id,
          label: spot.label,
          type: spot.type,
          assigned_to: spot.assigned_to,
          position_x: spot.position_x,
          position_y: spot.position_y,
          status: "ceded",
        });
      } else {
        available.push({
          id: spot.id,
          label: spot.label,
          type: spot.type,
          assigned_to: spot.assigned_to,
          position_x: spot.position_x,
          position_y: spot.position_y,
          status: "free",
        });
      }
    }

    return success(available);
  } catch (err) {
    console.error("Error en getAvailableSpotsForDate:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener plazas disponibles"
    );
  }
}

/**
 * Obtiene las reservas confirmadas futuras del usuario actual.
 * Devuelve reservas desde hoy en adelante, con detalles de plaza.
 */
export async function getMyReservations(): Promise<
  ActionResult<ReservationWithDetails[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const reservations = await getUserReservations(user.id);
    return success(reservations);
  } catch (err) {
    console.error("Error en getMyReservations:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener tus reservas"
    );
  }
}

/**
 * Crea una nueva reserva de aparcamiento.
 *
 * Reglas de negocio:
 * - El usuario debe estar autenticado
 * - Una reserva por usuario por día (garantizado por índice único de la BD)
 * - Una reserva por plaza por día (garantizado por índice único de la BD)
 * - La plaza debe estar libre o cedida para esa fecha
 */
export const createReservation = actionClient
  .schema(createReservationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    // Check if user already has a reservation for this date
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", parsedInput.date)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existing) {
      throw new Error("Ya tienes una reserva para este día");
    }

    // Insert reservation.
    // El trigger trg_sync_cession_status en la BD sincroniza automáticamente
    // cession.status → "reserved" dentro de la misma transacción, por lo que
    // no es necesario ningún sync manual aquí.
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        spot_id: parsedInput.spot_id,
        user_id: user.id,
        date: parsedInput.date,
        notes: parsedInput.notes ?? null,
      })
      .select("id")
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        throw new Error("Esta plaza ya está reservada para este día");
      }
      throw new Error(`Error al crear reserva: ${error.message}`);
    }

    return { id: data.id };
  });

/**
 * Cancela una reserva existente.
 *
 * Reglas de negocio:
 * - El usuario debe ser el propietario de la reserva (o admin — garantizado por RLS)
 * - El trigger trg_sync_cession_status revierte cession.status → "available"
 *   automáticamente si era una plaza de dirección cedida.
 */
export const cancelReservation = actionClient
  .schema(cancelReservationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", parsedInput.id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(`Error al cancelar reserva: ${error.message}`);
    }

    return { cancelled: true };
  });
