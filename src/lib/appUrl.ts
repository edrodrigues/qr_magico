/**
 * Resolução de URLs da aplicação.
 *
 * Dev local: OAuth e pagamentos usam window.location.origin automaticamente.
 * Supabase Dashboard → Authentication → URL Configuration deve incluir:
 *   http://localhost:5173/**
 *   https://www.momentomagico.xyz/**
 */
export function getAppOrigin(): string {
  return window.location.origin;
}

/** URL pública para links compartilháveis (presentes). Em dev, usa o host local. */
export function getPublicAppUrl(): string {
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  const configured = import.meta.env.VITE_APP_URL as string | undefined;
  return configured?.replace(/\/$/, "") || window.location.origin;
}
