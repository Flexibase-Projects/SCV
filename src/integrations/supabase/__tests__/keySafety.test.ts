import { assertClientSafeSupabaseKey, getSupabaseJwtRole } from "@/integrations/supabase/keySafety";

function createJwtWithRole(role: string) {
  const header = globalThis.btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = globalThis.btoa(JSON.stringify({ role, iss: "supabase" }));
  return `${header}.${payload}.signature`;
}

describe("keySafety", () => {
  it("identifica o role de uma chave JWT do Supabase", () => {
    expect(getSupabaseJwtRole(createJwtWithRole("anon"))).toBe("anon");
  });

  it("permite o uso de chaves publicas anon no cliente", () => {
    expect(assertClientSafeSupabaseKey(createJwtWithRole("anon"))).toContain(".signature");
  });

  it("bloqueia o uso acidental de service role no frontend", () => {
    expect(() => assertClientSafeSupabaseKey(createJwtWithRole("service_role"))).toThrow(
      /service role key/i,
    );
  });
});
