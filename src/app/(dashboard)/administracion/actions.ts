"use server";

/**
 * Acciones de administración
 *
 * Server Actions exclusivas para administradores:
 * CRUD de plazas, gestión de roles de usuario y asignación de plazas.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import {
  createSpotSchema,
  updateSpotSchema,
  deleteSpotSchema,
  updateUserRoleSchema,
  assignSpotToUserSchema,
  deleteUserSchema,
} from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEntityId } from "@/lib/queries/active-entity";

// ─── Spot CRUD ───────────────────────────────────────────────

/**
 * Crea una nueva plaza.
 */
export const createSpot = actionClient
  .schema(createSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const entityId = await getActiveEntityId();

    const { data, error } = await supabase
      .from("spots")
      .insert({
        label: parsedInput.label,
        type: parsedInput.type,
        resource_type: parsedInput.resource_type,
        assigned_to: parsedInput.assigned_to ?? null,
        entity_id: entityId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          `Ya existe una plaza con la etiqueta "${parsedInput.label}"`
        );
      }
      throw new Error(`Error al crear plaza: ${error.message}`);
    }

    revalidatePath("/administracion");
    revalidatePath("/parking/asignaciones");
    revalidatePath("/oficinas/asignaciones");
    revalidatePath("/parking");
    revalidatePath("/oficinas");
    return { id: data.id };
  });

/**
 * Actualiza una plaza existente.
 */
export const updateSpot = actionClient
  .schema(updateSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const activeEntityId = await getActiveEntityId();

    const { id, ...updates } = parsedInput;

    // Verificar que el spot pertenece a la sede activa (o es global)
    if (activeEntityId) {
      const { data: spot } = await supabase
        .from("spots")
        .select("entity_id")
        .eq("id", id)
        .single();
      if (
        spot &&
        spot.entity_id !== null &&
        spot.entity_id !== activeEntityId
      ) {
        throw new Error("No tienes permisos para modificar esta plaza");
      }
    }

    const { error } = await supabase.from("spots").update(updates).eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe una plaza con esa etiqueta");
      }
      throw new Error(`Error al actualizar plaza: ${error.message}`);
    }

    revalidatePath("/administracion");
    revalidatePath("/parking/asignaciones");
    revalidatePath("/oficinas/asignaciones");
    revalidatePath("/parking");
    revalidatePath("/oficinas");
    return { updated: true };
  });

/**
 * Elimina una plaza.
 * Elimina en cascada reservas y cesiones relacionadas (restricción de BD).
 */
export const deleteSpot = actionClient
  .schema(deleteSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const activeEntityId = await getActiveEntityId();

    // Verificar que el spot pertenece a la sede activa (o es global)
    if (activeEntityId) {
      const { data: spot } = await supabase
        .from("spots")
        .select("entity_id")
        .eq("id", parsedInput.id)
        .single();
      if (
        spot &&
        spot.entity_id !== null &&
        spot.entity_id !== activeEntityId
      ) {
        throw new Error("No tienes permisos para eliminar esta plaza");
      }
    }

    const { error } = await supabase
      .from("spots")
      .delete()
      .eq("id", parsedInput.id);

    if (error) {
      throw new Error(`Error al eliminar plaza: ${error.message}`);
    }

    revalidatePath("/administracion");
    revalidatePath("/parking/asignaciones");
    revalidatePath("/oficinas/asignaciones");
    revalidatePath("/parking");
    revalidatePath("/oficinas");
    return { deleted: true };
  });

// ─── User Role Management ───────────────────────────────────

/**
 * Actualiza el rol de un usuario (solo administradores).
 */
export const updateUserRole = actionClient
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const activeEntityId = await getActiveEntityId();

    // Verificar que el usuario objetivo pertenece a la sede activa
    if (activeEntityId) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("entity_id")
        .eq("id", parsedInput.user_id)
        .single();
      if (
        targetProfile &&
        targetProfile.entity_id !== null &&
        targetProfile.entity_id !== activeEntityId
      ) {
        throw new Error("No tienes permisos para modificar este usuario");
      }
    }

    const { error } = await supabase
      .from("profiles")
      // Cast: roles 'manager' | 'hr' added in migration 00003; valid once applied
      .update({ role: parsedInput.role as "employee" | "admin" })
      .eq("id", parsedInput.user_id);

    if (error) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }

    return { updated: true };
  });

// ─── Assign Spot to User ──────────────────────────────────────────

/**
 * Asigna (o desasigna) una plaza a un usuario.
 *
 * Reglas:
 *   - Las plazas de visitas (type='visitor') no se pueden asignar a usuarios.
 *   - Una plaza solo puede estar asignada a un usuario a la vez.
 *   - Pasar spot_id = null elimina la asignación.
 */
export const assignSpotToUser = actionClient
  .schema(assignSpotToUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { user_id, spot_id, resource_type } = parsedInput;

    // 1. If unassigning: clear only the spot of the given resource_type for this user
    if (!spot_id) {
      const { error } = await supabase
        .from("spots")
        .update({ assigned_to: null })
        .eq("assigned_to", user_id)
        .eq("resource_type", resource_type);

      if (error) throw new Error(`Error al desasignar plaza: ${error.message}`);
      return { assigned: false };
    }

    // 2. Validate spot is assigned type
    const { data: spot, error: spotErr } = await supabase
      .from("spots")
      .select("id, type, resource_type, assigned_to, entity_id")
      .eq("id", spot_id)
      .single();

    if (spotErr || !spot) throw new Error("Plaza no encontrada");
    if (spot.type === "visitor") {
      throw new Error("No se pueden asignar plazas de visitas a usuarios");
    }
    if (spot.assigned_to && spot.assigned_to !== user_id) {
      throw new Error("Esa plaza ya está asignada a otro usuario");
    }

    // Verificar que el spot pertenece a la sede activa
    const activeEntityId = await getActiveEntityId();
    if (
      activeEntityId &&
      spot.entity_id !== null &&
      spot.entity_id !== activeEntityId
    ) {
      throw new Error("Esta plaza no pertenece a la sede activa");
    }

    // Verificar que el usuario objetivo pertenece a la sede activa
    if (activeEntityId) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("entity_id")
        .eq("id", user_id)
        .single();
      if (
        targetProfile &&
        targetProfile.entity_id !== null &&
        targetProfile.entity_id !== activeEntityId
      ) {
        throw new Error("Este usuario no pertenece a la sede activa");
      }
    }

    // 3. Assign the new spot FIRST — if this fails the user's previous assignment
    //    remains intact. Order matters: assign → clear avoids leaving the user
    //    with zero spots if the second step fails.
    const { error } = await supabase
      .from("spots")
      .update({ assigned_to: user_id })
      .eq("id", spot_id);

    if (error) {
      console.error("[admin] assignSpotToUser assign error:", {
        userId: user_id,
        spotId: spot_id,
        error: error.message,
      });
      throw new Error(`Error al asignar plaza: ${error.message}`);
    }

    // 4. Clear any previous spot of the SAME resource_type assigned to this user
    //    (preserves assignments of the other resource_type). Runs AFTER successful
    //    assignment — worst case on failure: user has two spots, not zero.
    const { error: cleanupError } = await supabase
      .from("spots")
      .update({ assigned_to: null })
      .eq("assigned_to", user_id)
      .eq("resource_type", spot.resource_type)
      .neq("id", spot_id); // Don't clear the spot we just assigned

    if (cleanupError) {
      console.error("[admin] assignSpotToUser cleanup error:", {
        userId: user_id,
        resourceType: spot.resource_type,
        error: cleanupError.message,
      });
      throw new Error(
        `Error al limpiar la plaza anterior: ${cleanupError.message}`
      );
    }

    revalidatePath("/parking/asignaciones");
    revalidatePath("/oficinas/asignaciones");
    return { assigned: true };
  });

// ─── Assign User to Spot ──────────────────────────────────────────

/**
 * Asigna (o desasigna) un usuario a una plaza — perspectiva desde la plaza.
 * Complementaria a `assignSpotToUser` que opera desde la perspectiva del usuario.
 */
export const assignUserToSpot = actionClient
  .schema(
    z.object({
      spot_id: z.string().uuid(),
      user_id: z.string().uuid().nullable(),
      resource_type: z.enum(["parking", "office"]),
    })
  )
  .action(async ({ parsedInput }) => {
    const { spot_id, user_id, resource_type } = parsedInput;
    await requireAdmin();
    const supabase = await createClient();

    if (!user_id) {
      const { error } = await supabase
        .from("spots")
        .update({ assigned_to: null })
        .eq("id", spot_id);
      if (error)
        throw new Error(`Error al desasignar usuario: ${error.message}`);
      revalidatePath("/parking/asignaciones");
      revalidatePath("/oficinas/asignaciones");
      return { assigned: false };
    }

    // Verificar que el spot pertenece a la sede activa
    const activeEntityId = await getActiveEntityId();
    if (activeEntityId) {
      const { data: spot } = await supabase
        .from("spots")
        .select("entity_id")
        .eq("id", spot_id)
        .single();
      if (
        spot &&
        spot.entity_id !== null &&
        spot.entity_id !== activeEntityId
      ) {
        throw new Error("Esta plaza no pertenece a la sede activa");
      }
    }

    // 1. Assign user to this spot FIRST — if this fails the user's previous
    //    assignment remains intact. Order matters: assign → clear avoids
    //    leaving the user with zero spots if the second step fails.
    const { error } = await supabase
      .from("spots")
      .update({ assigned_to: user_id })
      .eq("id", spot_id);

    if (error) throw new Error(`Error al asignar usuario: ${error.message}`);

    // 2. Clear previous spot of same resource_type for this user (except
    //    the one we just assigned). Worst case on failure: user has two spots,
    //    not zero — a recoverable state.
    await supabase
      .from("spots")
      .update({ assigned_to: null })
      .eq("assigned_to", user_id)
      .eq("resource_type", resource_type)
      .neq("id", spot_id);

    revalidatePath("/parking/asignaciones");
    revalidatePath("/oficinas/asignaciones");
    return { assigned: true };
  });

// ─── Delete User Account ─────────────────────────────────────

/**
 * Elimina permanentemente una cuenta de usuario (auth + cascade perfil).
 */
export const deleteUser = actionClient
  .schema(deleteUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const activeEntityId = await getActiveEntityId();

    // Verificar que el usuario objetivo pertenece a la sede activa
    if (activeEntityId) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("entity_id")
        .eq("id", parsedInput.user_id)
        .single();
      if (
        targetProfile &&
        targetProfile.entity_id !== null &&
        targetProfile.entity_id !== activeEntityId
      ) {
        throw new Error("No tienes permisos para eliminar este usuario");
      }
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.deleteUser(
      parsedInput.user_id
    );

    if (error) {
      throw new Error(`Error al eliminar cuenta: ${error.message}`);
    }

    return { deleted: true };
  });
