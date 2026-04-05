import { requireManagerOrAbove } from "@/lib/auth/helpers";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";
import { getAnnouncementsForManagement } from "@/lib/queries/announcements";
import { ManageAnnouncementsClient } from "./_components/manage-announcements-client";

export default async function TablonGestionarPage() {
  const user = await requireManagerOrAbove();
  const entityId = await getEffectiveEntityId();

  const announcements = await getAnnouncementsForManagement(entityId);

  return (
    <ManageAnnouncementsClient
      announcements={announcements}
      currentUserId={user.id}
      currentUserRole={user.profile?.role ?? "manager"}
    />
  );
}
