"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveEntityAction(entityId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("active-entity-id", entityId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: "lax",
  });
  // Forzar re-render completo del layout para que todos los datos reflejen la nueva sede
  revalidatePath("/", "layout");
}

/**
 * Inicializa la cookie de sede activa si todavía no existe.
 * No dispara revalidatePath — se llama en silencio desde EntitySwitcher
 * en el primer render cuando el layout usó el fallback entities[0].
 */
export async function initActiveEntityCookie(entityId: string): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("active-entity-id")?.value) {
    cookieStore.set("active-entity-id", entityId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
    });
  }
}
