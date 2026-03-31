type SupabaseJwtPayload = {
  role?: string;
};

function decodeBase64UrlSegment(segment: string): string | null {
  if (typeof globalThis.atob !== "function") {
    return null;
  }

  const normalizedSegment = segment.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalizedSegment.length % 4)) % 4;
  const paddedSegment = normalizedSegment.padEnd(normalizedSegment.length + paddingLength, "=");

  try {
    return globalThis.atob(paddedSegment);
  } catch {
    return null;
  }
}

export function getSupabaseJwtRole(token: string): string | undefined {
  const [, payloadSegment] = token.split(".");

  if (!payloadSegment) {
    return undefined;
  }

  const decodedPayload = decodeBase64UrlSegment(payloadSegment);

  if (!decodedPayload) {
    return undefined;
  }

  try {
    const parsedPayload = JSON.parse(decodedPayload) as SupabaseJwtPayload;
    return typeof parsedPayload.role === "string" ? parsedPayload.role : undefined;
  } catch {
    return undefined;
  }
}

export function assertClientSafeSupabaseKey(token: string): string {
  const role = getSupabaseJwtRole(token);

  if (role === "service_role") {
    throw new Error(
      "A chave configurada em VITE_SUPABASE_ANON_KEY parece ser uma service role key. " +
        "Use apenas a chave publica anon no frontend.",
    );
  }

  return token;
}
