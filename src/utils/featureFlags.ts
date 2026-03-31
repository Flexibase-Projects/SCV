import { appEnv } from "@/integrations/supabase/env";

/**
 * Feature flags para controlar funcionalidades do sistema.
 */
export function isImportEnabled(): boolean {
  return appEnv.importEnabled;
}
