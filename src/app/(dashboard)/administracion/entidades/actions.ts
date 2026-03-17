"use server";

/**
 * Acciones de gestión de sedes/entidades
 *
 * Server Actions exclusivas para administradores:
 * CRUD de entidades y gestión de módulos por sede.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import {
  createEntitySchema,
  updateEntitySchema,
  deleteEntitySchema,
  toggleEntityModuleSchema,
} from "@/lib/validations";

// ─── Entity CRUD ──────────────────────────────────────────────

/**
 * Crea una nueva sede.
 */
export const createEntity = actionClient
  .schema(createEntitySchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entities")
      .insert({
        name: parsedInput.name,
        short_code: parsedInput.short_code.toUpperCase(),
        is_active: parsedInput.is_active ?? true,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505")
        throw new Error("Ya existe una sede con ese nombre o código");
      console.error(
        "[entities] createEntity DB error:",
        error.message,
        error.code
      );
      throw new Error("Error al crear la sede");
    }
    revalidatePath("/administracion/entidades");
    return { id: data.id };
  });

/**
 * Actualiza una sede existente.
 */
export const updateEntity = actionClient
  .schema(updateEntitySchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const { id, ...updates } = parsedInput;
    if (updates.short_code)
      updates.short_code = updates.short_code.toUpperCase();
    const { error } = await supabase
      .from("entities")
      .update(updates)
      .eq("id", id);
    if (error) {
      if (error.code === "23505")
        throw new Error("Ya existe una sede con ese nombre o código");
      console.error(
        "[entities] updateEntity DB error:",
        error.message,
        error.code
      );
      throw new Error("Error al actualizar la sede");
    }
    revalidatePath("/administracion/entidades");
    return { updated: true };
  });

/**
 * Elimina una sede.
 */
export const deleteEntity = actionClient
  .schema(deleteEntitySchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("entities")
      .delete()
      .eq("id", parsedInput.id);
    if (error) {
      console.error(
        "[entities] deleteEntity DB error:",
        error.message,
        error.code
      );
      throw new Error("Error al eliminar la sede");
    }
    revalidatePath("/administracion/entidades");
    return { deleted: true };
  });

/**
 * Activa o desactiva un módulo para una sede.
 */
export const toggleEntityModule = actionClient
  .schema(toggleEntityModuleSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();
    const { entity_id, module, enabled } = parsedInput;
    const { error } = await supabase
      .from("entity_modules")
      .upsert(
        { entity_id, module, enabled },
        { onConflict: "entity_id,module" }
      );
    if (error) {
      console.error(
        "[entities] toggleEntityModule DB error:",
        error.message,
        error.code
      );
      throw new Error("Error al actualizar el módulo");
    }
    revalidatePath("/administracion/entidades");
    return { updated: true };
  });
