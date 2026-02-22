/**
 * Queries de Reservas
 *
 * Funciones de servidor para leer datos de reservas.
 */

import { createClient } from "@/lib/supabase/server";
import type { Reservation } from "@/lib/supabase/types";

/** Tipo interno para la query con joins de plaza y perfil */
type ReservationJoin = Reservation & {
  spots: { label: string } | null;
  profiles: { full_name: string } | null;
};

/** Fila de reserva con etiqueta de plaza y nombre de usuario */
export interface ReservationWithDetails extends Reservation {
  spot_label: string;
  user_name: string;
}

/**
 * Obtiene todas las reservas confirmadas para una fecha específica,
 * con detalles de plaza y usuario.
 */
export async function getReservationsByDate(
  date: string
): Promise<ReservationWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "*, spots!reservations_spot_id_fkey(label), profiles!reservations_user_id_fkey(full_name)"
    )
    .eq("date", date)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .returns<ReservationJoin[]>();

  if (error) throw new Error(`Error al obtener reservas: ${error.message}`);

  return data.map((r) => ({
    ...r,
    spots: undefined,
    profiles: undefined,
    spot_label: r.spots?.label ?? "",
    user_name: r.profiles?.full_name ?? "",
  })) as ReservationWithDetails[];
}

/**
 * Obtiene las reservas confirmadas futuras de un usuario.
 * Devuelve reservas desde hoy en adelante, ordenadas por fecha.
 */
export async function getUserReservations(
  userId: string
): Promise<ReservationWithDetails[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0]!;

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "*, spots!reservations_spot_id_fkey(label), profiles!reservations_user_id_fkey(full_name)"
    )
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date")
    .returns<ReservationJoin[]>();

  if (error)
    throw new Error(`Error al obtener reservas del usuario: ${error.message}`);

  return data.map((r) => ({
    ...r,
    spots: undefined,
    profiles: undefined,
    spot_label: r.spots?.label ?? "",
    user_name: r.profiles?.full_name ?? "",
  })) as ReservationWithDetails[];
}

/**
 * Comprueba si un usuario ya tiene una reserva confirmada en una fecha dada.
 * Devuelve la reserva si existe, null en caso contrario.
 */
export async function getUserReservationForDate(
  userId: string,
  date: string
): Promise<Reservation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("status", "confirmed")
    .maybeSingle();

  if (error) throw new Error(`Error al comprobar reserva: ${error.message}`);

  return data;
}
