import { assertClientSafeSupabaseKey } from "./keySafety";

const TEST_SUPABASE_URL = "http://127.0.0.1:54321";
const TEST_SUPABASE_ANON_KEY = "test-anon-key";

function normalizeEnvValue(value: string | boolean | undefined): string | undefined {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function requireEnvValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variavel de ambiente obrigatoria ausente: ${name}. ` +
        "Verifique o arquivo .env antes de iniciar a aplicacao.",
    );
  }

  return value;
}

function parseBooleanEnv(value: string | boolean | undefined): boolean {
  const normalizedValue = normalizeEnvValue(value);
  return normalizedValue?.toLowerCase() === "true";
}

const isTestEnv = import.meta.env.MODE === "test";

const supabaseUrl = requireEnvValue(
  "VITE_SUPABASE_URL",
  normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL) ?? (isTestEnv ? TEST_SUPABASE_URL : undefined),
);

const supabaseAnonKey = assertClientSafeSupabaseKey(
  requireEnvValue(
    "VITE_SUPABASE_ANON_KEY",
    normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY) ?? (isTestEnv ? TEST_SUPABASE_ANON_KEY : undefined),
  ),
);

export const appEnv = Object.freeze({
  importEnabled: parseBooleanEnv(import.meta.env.VITE_ENABLE_IMPORT),
  isTestEnv,
  supabaseAnonKey,
  supabaseUrl,
});
