/**
 * Configuración del sistema — Oficinas
 */

export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/supabase/auth";
import { getAllResourceConfigs } from "@/lib/config";
import { getActiveEntityId } from "@/lib/queries/active-entity";
import { ContentSection } from "@/components/content-section";
import { ResourceConfigForm } from "../_components/resource-config-form";
import { updateOfficeConfig } from "../actions";

export default async function ConfiguracionOficinaPage() {
  await requireAdmin();
  const entityId = await getActiveEntityId();
  const config = await getAllResourceConfigs("office", entityId);

  return (
    <ContentSection
      title="Configuración de Oficinas"
      desc="Reglas de disponibilidad, franjas horarias, límites de reserva y cesiones para los puestos de oficina."
    >
      <ResourceConfigForm
        key={entityId ?? "global"}
        config={config}
        onSave={updateOfficeConfig}
        showTimeSlots={true}
        showVisitorBooking={false}
      />
    </ContentSection>
  );
}
