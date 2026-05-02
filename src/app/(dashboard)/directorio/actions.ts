"use server";

/**
 * Directorio Server Actions
 *
 * Admin-only actions for managing users from the directory view.
 */

import { randomBytes } from "node:crypto";

import { actionClient } from "@/lib/actions";
import { db } from "@/lib/db";
import { profiles, users, userPreferences } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getActiveEntityId } from "@/lib/queries/active-entity";
import {
  updateDirectorioUserSchema,
  createDirectorioUserSchema,
} from "@/lib/validations";

async function assertEntityInAdminScope(entityId?: string | null) {
  let activeEntityId: string | null = null;
  try {
    activeEntityId = await getActiveEntityId();
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("outside a request scope")) throw err;
  }

  if (activeEntityId && entityId && entityId !== activeEntityId) {
    throw new Error("No tienes permisos para gestionar usuarios de otra sede");
  }
  return activeEntityId;
}

function createTemporaryPassword(): string {
  return randomBytes(18).toString("base64url");
}

/**
 * Actualiza nombre, puesto, teléfono y sede de un usuario en profiles.
 */
export const updateDirectorioUser = actionClient
  .schema(updateDirectorioUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const activeEntityId = await assertEntityInAdminScope(
      parsedInput.entity_id
    );

    if (activeEntityId) {
      const [targetProfile] = await db
        .select({ entityId: profiles.entityId })
        .from(profiles)
        .where(eq(profiles.id, parsedInput.user_id))
        .limit(1);

      if (
        targetProfile?.entityId &&
        targetProfile.entityId !== activeEntityId
      ) {
        throw new Error("No tienes permisos para modificar este usuario");
      }
    }

    await db
      .update(profiles)
      .set({
        fullName: parsedInput.nombre,
        jobTitle: parsedInput.puesto || null,
        phone: parsedInput.telefono || null,
        entityId: parsedInput.entity_id || null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, parsedInput.user_id));

    revalidatePath("/directorio");
    return { updated: true };
  });

/**
 * Crea un nuevo usuario con perfil y preferencias por defecto.
 */
export const createDirectorioUser = actionClient
  .schema(createDirectorioUserSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    await assertEntityInAdminScope(parsedInput.entity_id);

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsedInput.correo))
      .limit(1);

    if (existing) {
      throw new Error("Ya existe un usuario con ese correo electrónico.");
    }

    // Create a temporary hashed password (user should reset it)
    const tempPassword = createTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: parsedInput.correo,
        name: parsedInput.nombre,
        password: hashedPassword,
      })
      .returning({ id: users.id });

    if (!user) throw new Error("Error al crear el usuario");

    // Create profile
    await db
      .insert(profiles)
      .values({
        id: user.id,
        email: parsedInput.correo,
        fullName: parsedInput.nombre,
        jobTitle: parsedInput.puesto || null,
        phone: parsedInput.telefono || null,
        entityId: parsedInput.entity_id || null,
        role: "employee",
      })
      .onConflictDoNothing();

    // Create default preferences
    await db
      .insert(userPreferences)
      .values({ userId: user.id })
      .onConflictDoNothing();

    revalidatePath("/directorio");
    return { created: true, temp_password: tempPassword };
  });
