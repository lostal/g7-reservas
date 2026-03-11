/**
 * Visitors Page
 *
 * Gestión de reservas de aparcamiento para visitantes externos.
 * Cualquier empleado autenticado puede crear reservas; el visitante
 * recibe un email con su plaza y pases digitales (Apple/Google Wallet).
 *
 * Server Component: pasa `key={entityId}` al componente cliente para
 * forzar un remount completo (y re-fetch de datos) al cambiar de sede.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";
import { VisitantesClient } from "./_components/visitantes-client";

export default async function VisitantesPage() {
  const user = await requireAuth();
  const entityId = await getEffectiveEntityId();

  return (
    <VisitantesClient
      key={entityId ?? "global"}
      currentUserId={user.id}
      currentUserRole={user.profile?.role === "admin" ? "admin" : "employee"}
    />
  );
}
