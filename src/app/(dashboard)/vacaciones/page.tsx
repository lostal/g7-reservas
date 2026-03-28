import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { ROUTES } from "@/lib/constants";

export default async function VacacionesPage() {
  await requireAuth();
  redirect(ROUTES.LEAVE_MY_REQUESTS);
}
