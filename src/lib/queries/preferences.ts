/**
 * Queries de Preferencias
 *
 * Consultas de servidor para preferencias de usuario y estado de la integración con Microsoft
 */

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import {
  validateUserPreferences,
  type ValidatedUserPreferences,
} from "@/lib/supabase/helpers";

// ─── Obtener preferencias de usuario ─────────────────────────

export async function getUserPreferences(
  userId: string
): Promise<ValidatedUserPreferences | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error al obtener las preferencias del usuario:", error);
    return null;
  }

  return validateUserPreferences(data);
}

// ─── Obtener estado de conexión con Microsoft ─────────────────

export type MicrosoftConnectionStatus = {
  connected: boolean;
  scopes: string[];
  lastSync: string | null;
  lastOOOCheck: string | null;
  currentOOOStatus: boolean;
  teamsConnected: boolean;
  outlookConnected: boolean;
};

export async function getMicrosoftConnectionStatus(
  userId: string
): Promise<MicrosoftConnectionStatus | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_microsoft_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Sin filas = usuario no ha conectado su cuenta de Microsoft
      return {
        connected: false,
        scopes: [],
        lastSync: null,
        lastOOOCheck: null,
        currentOOOStatus: false,
        teamsConnected: false,
        outlookConnected: false,
      };
    }
    // Error real de DB — loguearlo y retornar null para que el caller lo distinga
    console.error("[preferences] getMicrosoftConnectionStatus DB error:", {
      userId,
      code: error.code,
      message: error.message,
    });
    return null;
  }

  // Comprobar si el token ha expirado
  const isExpired = new Date(data.token_expires_at) < new Date();

  return {
    connected: !isExpired,
    scopes: data.scopes || [],
    lastSync: data.last_calendar_sync_at,
    lastOOOCheck: data.last_ooo_check_at,
    currentOOOStatus: data.current_ooo_status,
    teamsConnected: !!data.teams_user_id,
    outlookConnected: !!data.outlook_calendar_id,
  };
}

// ─── Obtener info de plaza asignada (para usuarios con plaza fija) ──

export type AssignedSpotInfo = {
  spot: {
    id: string;
    label: string;
    type: string;
  } | null;
  statusToday: "occupied" | "ceded" | "reserved" | "unknown";
  nextCession: {
    id: string;
    date: string;
    status: string;
  } | null;
};

export async function getAssignedSpotInfo(
  userId: string,
  resourceType: "parking" | "office" = "parking"
): Promise<AssignedSpotInfo> {
  const supabase = await createClient();

  // Obtener la plaza asignada al usuario para el tipo de recurso solicitado
  const { data: spot, error: spotError } = await supabase
    .from("spots")
    .select("id, label, type")
    .eq("assigned_to", userId)
    .eq("resource_type", resourceType)
    .maybeSingle();

  if (spotError || !spot) {
    return {
      spot: null,
      statusToday: "unknown",
      nextCession: null,
    };
  }

  // Obtener la fecha de hoy
  const today = new Date().toISOString().split("T")[0]!;

  // Paralelizar: cesión de hoy + próxima cesión futura en una sola ronda
  const [{ data: todayCession }, { data: nextCession }] = await Promise.all([
    supabase
      .from("cessions")
      .select("id, status")
      .eq("spot_id", spot.id)
      .eq("date", today)
      .neq("status", "cancelled")
      .maybeSingle(),
    supabase
      .from("cessions")
      .select("id, date, status")
      .eq("spot_id", spot.id)
      .gte("date", today)
      .neq("status", "cancelled")
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  // Determinar el estado
  let statusToday: "occupied" | "ceded" | "reserved" | "unknown" = "occupied";

  if (todayCession) {
    statusToday = todayCession.status === "reserved" ? "reserved" : "ceded";
  }

  return {
    spot: {
      id: spot.id,
      label: spot.label,
      type: spot.type,
    },
    statusToday,
    nextCession: nextCession ?? null,
  };
}

// ─── Tipo de retorno del perfil combinado ─────────────────────

export interface UserProfileWithPreferences {
  profile: Profile;
  preferences: ValidatedUserPreferences | null;
  /** null si hubo un error real de DB (distinto de "sin tokens") */
  microsoftStatus: MicrosoftConnectionStatus | null;
  /** Plazas asignadas por tipo de recurso */
  assignedSpots: {
    parking: AssignedSpotInfo | null;
    office: AssignedSpotInfo | null;
  };
}

// ─── Obtener perfil con preferencias (combinado) ──────────────

export async function getUserProfileWithPreferences(
  userId: string
): Promise<UserProfileWithPreferences | null> {
  const supabase = await createClient();

  // Obtener perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error al obtener el perfil:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });
    return null;
  }

  // Obtener preferencias, estado Microsoft y plazas asignadas en paralelo
  const [preferences, microsoftStatus, parkingSpotData, officeSpotData] =
    await Promise.all([
      getUserPreferences(userId),
      getMicrosoftConnectionStatus(userId),
      getAssignedSpotInfo(userId, "parking"),
      getAssignedSpotInfo(userId, "office"),
    ]);

  return {
    profile,
    preferences,
    microsoftStatus,
    assignedSpots: {
      parking: parkingSpotData.spot ? parkingSpotData : null,
      office: officeSpotData.spot ? officeSpotData : null,
    },
  };
}
