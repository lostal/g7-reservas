/**
 * Queries de Cesiones
 *
 * Funciones de servidor para leer datos de cesiones.
 */

import { createClient } from "@/lib/supabase/server";
import type { Cession } from "@/lib/supabase/types";

/** Tipo interno para la query con joins de plaza y perfil */
type CessionJoin = Cession & {
  spots: { label: string } | null;
  profiles: { full_name: string } | null;
};

/** Fila de cesión con etiqueta de plaza y nombre de usuario */
export interface CessionWithDetails extends Cession {
  spot_label: string;
  user_name: string;
}

/**
 * Obtiene todas las cesiones no canceladas para una fecha específica,
 * con detalles de plaza y usuario.
 */
export async function getCessionsByDate(
  date: string
): Promise<CessionWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cessions")
    .select(
      "*, spots!cessions_spot_id_fkey(label), profiles!cessions_user_id_fkey(full_name)"
    )
    .eq("date", date)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .returns<CessionJoin[]>();

  if (error) throw new Error(`Error al obtener cesiones: ${error.message}`);

  return data.map((c) => ({
    ...c,
    spots: undefined,
    profiles: undefined,
    spot_label: c.spots?.label ?? "",
    user_name: c.profiles?.full_name ?? "",
  })) as CessionWithDetails[];
}

/**
 * Obtiene las cesiones no canceladas futuras de un usuario.
 * Devuelve cesiones desde hoy en adelante, ordenadas por fecha.
 */
export async function getUserCessions(
  userId: string
): Promise<CessionWithDetails[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0]!;

  const { data, error } = await supabase
    .from("cessions")
    .select(
      "*, spots!cessions_spot_id_fkey(label), profiles!cessions_user_id_fkey(full_name)"
    )
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .gte("date", today)
    .order("date")
    .returns<CessionJoin[]>();

  if (error)
    throw new Error(`Error al obtener cesiones del usuario: ${error.message}`);

  return data.map((c) => ({
    ...c,
    spots: undefined,
    profiles: undefined,
    spot_label: c.spots?.label ?? "",
    user_name: c.profiles?.full_name ?? "",
  })) as CessionWithDetails[];
}
