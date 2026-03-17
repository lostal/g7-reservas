"use server";

/**
 * Directorio Server Actions
 *
 * Admin-only actions for managing users from the directory view.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import {
  updateDirectorioUserSchema,
  createDirectorioUserSchema,
} from "@/lib/validations";

/**
 * Actualiza nombre, puesto, teléfono y sede de un usuario en profiles.
 */
export const updateDirectorioUser = actionClient
  .schema(updateDirectorioUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const updates: Record<string, string | null> = {
      full_name: parsedInput.nombre,
      job_title: parsedInput.puesto || null,
      phone: parsedInput.telefono || null,
      entity_id: parsedInput.entity_id || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", parsedInput.user_id);

    if (error) {
      console.error(
        "[directorio] updateDirectorioUser DB error:",
        error.message,
        error.code
      );
      throw new Error("Error al actualizar el usuario");
    }

    revalidatePath("/directorio");
    return { updated: true };
  });

/**
 * Crea un nuevo usuario en auth + profile (vía trigger handle_new_user).
 * Requiere confirmación manual de email o que el usuario establezca contraseña.
 */
export const createDirectorioUser = actionClient
  .schema(createDirectorioUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email: parsedInput.correo,
      email_confirm: true,
      user_metadata: {
        full_name: parsedInput.nombre,
        entity_id: parsedInput.entity_id || null,
        phone: parsedInput.telefono || null,
      },
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        throw new Error("Ya existe un usuario con ese correo electrónico.");
      }
      console.error(
        "[directorio] createDirectorioUser auth error:",
        error.message
      );
      throw new Error("Error al crear el usuario");
    }

    // Update job_title if provided (not in trigger metadata).
    // The user is already created at this point; log a warning but do not throw
    // if this secondary update fails (avoids leaving auth without a usable account).
    if (parsedInput.puesto && data.user) {
      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ job_title: parsedInput.puesto })
        .eq("id", data.user.id);

      if (updateError) {
        console.warn(
          "[directorio] createDirectorioUser job_title update failed:",
          { userId: data.user.id, error: updateError.message }
        );
      }
    }

    revalidatePath("/directorio");
    return { created: true };
  });
