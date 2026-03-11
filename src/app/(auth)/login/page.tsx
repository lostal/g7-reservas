import { getAllEntities } from "@/lib/queries/entities";
import { LoginForm } from "./_components/login-form";

/**
 * Login Page - Development Mode
 *
 * Temporary login with email/password for local development.
 * Replace with Microsoft Teams OAuth when configured in production.
 */
export default async function LoginPage() {
  let entities = await getAllEntities().catch(() => []);
  // Filter only active entities for the signup selector
  entities = entities.filter((e) => e.is_active);

  return <LoginForm entities={entities} />;
}
