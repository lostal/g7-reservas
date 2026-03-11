/**
 * Configuración del sistema — Parking
 */

export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/supabase/auth";
import { getAllResourceConfigs } from "@/lib/config";
import { getActiveEntityId } from "@/lib/queries/active-entity";
import { ContentSection } from "@/components/content-section";
import { ResourceConfigForm } from "../_components/resource-config-form";
import { updateParkingConfig } from "../actions";

export default async function ConfiguracionParkingPage() {
  await requireAdmin();
  const entityId = await getActiveEntityId();
  const config = await getAllResourceConfigs("parking", entityId);

  return (
    <ContentSection
      title="Configuración de Parking"
      desc="Reglas de disponibilidad, límites de reserva y cesiones para las plazas de aparcamiento."
    >
      <ResourceConfigForm
        key={entityId ?? "global"}
        config={config}
        onSave={updateParkingConfig}
        showTimeSlots={false}
      />
    </ContentSection>
  );
}
