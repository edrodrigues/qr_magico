const ALLOWED_ORIGINS = [
  "https://www.momentomagico.xyz",
  "https://momentomagico.xyz",
  "http://localhost:5173",
]

export function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
  }
}
