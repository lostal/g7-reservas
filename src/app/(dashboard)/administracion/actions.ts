"use server";

/**
 * Admin Actions
 *
 * Server Actions for admin-only operations:
 * spot CRUD, user role management, and spot assignment.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import {
  createSpotSchema,
  updateSpotSchema,
  deleteSpotSchema,
  updateUserRoleSchema,
  assignSpotToUserSchema,
  deleteUserSchema,
} from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Spot CRUD ───────────────────────────────────────────────

/**
 * Create a new parking spot.
 */
export const createSpot = actionClient
  .schema(createSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("spots")
      .insert({
        label: parsedInput.label,
        type: parsedInput.type,
        assigned_to: parsedInput.assigned_to ?? null,
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
    return { id: data.id };
  });

/**
 * Update an existing parking spot.
 */
export const updateSpot = actionClient
  .schema(updateSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { id, ...updates } = parsedInput;

    const { error } = await supabase.from("spots").update(updates).eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe una plaza con esa etiqueta");
      }
      throw new Error(`Error al actualizar plaza: ${error.message}`);
    }

    revalidatePath("/administracion");
    return { updated: true };
  });

/**
 * Delete a parking spot.
 * Cascade deletes related reservations/cessions (DB constraint).
 */
export const deleteSpot = actionClient
  .schema(deleteSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("spots")
      .delete()
      .eq("id", parsedInput.id);

    if (error) {
      throw new Error(`Error al eliminar plaza: ${error.message}`);
    }

    revalidatePath("/administracion");
    return { deleted: true };
  });

// ─── User Role Management ───────────────────────────────────

/**
 * Update a user's role (admin only).
 */
export const updateUserRole = actionClient
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ role: parsedInput.role })
      .eq("id", parsedInput.user_id);

    if (error) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }

    revalidatePath("/administracion/usuarios");
    return { updated: true };
  });

// ─── Assign Spot to Management User ─────────────────────────

/**
 * Assign (or unassign) a management spot to a user.
 *
 * Rules:
 *   - Only management-type spots can be assigned.
 *   - A spot can only be assigned to one user at a time.
 *   - Passing spot_id = null removes the assignment.
 */
export const assignSpotToUser = actionClient
  .schema(assignSpotToUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { user_id, spot_id } = parsedInput;

    // 1. If unassigning: clear the spot currently assigned to this user
    if (!spot_id) {
      const { error } = await supabase
        .from("spots")
        .update({ assigned_to: null })
        .eq("assigned_to", user_id);

      if (error) throw new Error(`Error al desasignar plaza: ${error.message}`);
      return { assigned: false };
    }

    // 2. Validate spot is management type
    const { data: spot, error: spotErr } = await supabase
      .from("spots")
      .select("id, type, assigned_to")
      .eq("id", spot_id)
      .single();

    if (spotErr || !spot) throw new Error("Plaza no encontrada");
    if (spot.type !== "management") {
      throw new Error("Solo se pueden asignar plazas de tipo 'dirección'");
    }
    if (spot.assigned_to && spot.assigned_to !== user_id) {
      throw new Error("Esa plaza ya está asignada a otro usuario");
    }

    // 3. First, clear any previous spot assigned to this user
    await supabase
      .from("spots")
      .update({ assigned_to: null })
      .eq("assigned_to", user_id);

    // 4. Assign the new spot
    const { error } = await supabase
      .from("spots")
      .update({ assigned_to: user_id })
      .eq("id", spot_id);

    if (error) throw new Error(`Error al asignar plaza: ${error.message}`);

    revalidatePath("/administracion/usuarios");
    revalidatePath("/administracion");
    return { assigned: true };
  });

// ─── Delete User Account ─────────────────────────────────────

/**
 * Permanently delete a user account (auth + cascade profile).
 */
export const deleteUser = actionClient
  .schema(deleteUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase.auth.admin.deleteUser(parsedInput.user_id);

    if (error) {
      throw new Error(`Error al eliminar cuenta: ${error.message}`);
    }

    revalidatePath("/administracion/usuarios");
    return { deleted: true };
  });
