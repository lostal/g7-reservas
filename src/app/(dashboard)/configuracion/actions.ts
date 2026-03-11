"use server";

/**
 * Acciones de configuración del sistema (solo admin)
 *
 * Permite al administrador leer y modificar los valores de system_config.
 * Cada mutación invalida el cache de configuración para que los cambios
 * se reflejen inmediatamente en toda la aplicación.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { invalidateConfigCache } from "@/lib/config";
import { getActiveEntityId } from "@/lib/queries/active-entity";
import {
  updateGlobalConfigSchema,
  updateResourceConfigSchema,
  type UpdateResourceConfigInput,
} from "@/lib/validations";

// ─── Helper interno ───────────────────────────────────────────

/**
 * Actualiza (o inserta) múltiples claves en system_config.
 * Usado para la configuración global que no es específica de sede.
 */
async function upsertConfigs(
  entries: Array<{ key: string; value: unknown }>,
  adminUserId: string
): Promise<void> {
  const supabase = await createClient();

  const rows = entries.map(({ key, value }) => ({
    key,
    value: value as never,
    updated_by: adminUserId,
  }));

  const { error } = await supabase
    .from("system_config")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    throw new Error(`Error al guardar configuración: ${error.message}`);
  }
}

/**
 * Actualiza (o inserta) múltiples claves en entity_config para la sede indicada.
 * Los cambios son específicos de la sede activa y no afectan al resto de sedes.
 */
async function upsertEntityConfigs(
  entityId: string,
  entries: Array<{ key: string; value: unknown }>,
  adminUserId: string
): Promise<void> {
  const supabase = await createClient();

  const rows = entries.map(({ key, value }) => ({
    entity_id: entityId,
    key,
    value: value as never,
    updated_by: adminUserId,
  }));

  const { error } = await supabase
    .from("entity_config")
    .upsert(rows, { onConflict: "entity_id,key" });

  if (error) {
    throw new Error(`Error al guardar configuración de sede: ${error.message}`);
  }
}

/**
 * Convierte un objeto de configuración de recurso al formato de filas
 * de system_config con prefijo.
 */
function resourceConfigToEntries(
  resourceType: "parking" | "office",
  config: UpdateResourceConfigInput
): Array<{ key: string; value: unknown }> {
  const prefix = `${resourceType}.`;
  return Object.entries(config).map(([key, value]) => ({
    key: `${prefix}${key}`,
    value,
  }));
}

// ─── Actualizar configuración global ─────────────────────────

export const updateGlobalConfig = actionClient
  .schema(updateGlobalConfigSchema)
  .action(async ({ parsedInput }) => {
    const adminUser = await requireAdmin();

    const entries = Object.entries(parsedInput).map(([key, value]) => ({
      key,
      value,
    }));

    await upsertConfigs(entries, adminUser.id);
    await invalidateConfigCache();
    revalidatePath("/configuracion/general");

    return { updated: true };
  });

// ─── Actualizar configuración de parking ─────────────────────

export const updateParkingConfig = actionClient
  .schema(updateResourceConfigSchema)
  .action(async ({ parsedInput }) => {
    const adminUser = await requireAdmin();
    const entityId = await getActiveEntityId();

    const entries = resourceConfigToEntries("parking", parsedInput);

    if (entityId) {
      await upsertEntityConfigs(entityId, entries, adminUser.id);
    } else {
      await upsertConfigs(entries, adminUser.id);
    }

    await invalidateConfigCache();
    revalidatePath("/configuracion/parking");
    revalidatePath("/parking");

    return { updated: true };
  });

// ─── Actualizar configuración de oficinas ────────────────────

export const updateOfficeConfig = actionClient
  .schema(updateResourceConfigSchema)
  .action(async ({ parsedInput }) => {
    const adminUser = await requireAdmin();
    const entityId = await getActiveEntityId();

    const entries = resourceConfigToEntries("office", parsedInput);

    if (entityId) {
      await upsertEntityConfigs(entityId, entries, adminUser.id);
    } else {
      await upsertConfigs(entries, adminUser.id);
    }

    await invalidateConfigCache();
    revalidatePath("/configuracion/oficinas");
    revalidatePath("/oficinas");

    return { updated: true };
  });
