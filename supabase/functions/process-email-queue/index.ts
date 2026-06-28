import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const APP_URL = Deno.env.get("APP_URL") || "https://www.momentomagico.xyz"
const SERVICE_URL = Deno.env.get("SUPABASE_URL")!

const SCENARIOS = [
  "welcome",
  "draft_reminder_1",
  "draft_reminder_2",
  "payment_reminder_1",
  "payment_reminder_2",
  "completion",
  "inactivity_7d",
] as const

interface Candidate {
  usuario_id: string
  email: string
  nome: string
  presente_id: string | null
  homenageado: string | null
}

function buildLink(tipo: string, presente_id: string | null): string {
  if (!presente_id) return `${APP_URL}/wizard/ocasiao-nome`
  if (tipo.startsWith("payment")) return `${APP_URL}/presentes/${presente_id}/pagamento`
  return `${APP_URL}/presentes/${presente_id}`
}

async function processScenario(
  supabase: ReturnType<typeof createClient>,
  tipo: string,
): Promise<{ tipo: string; sent: number; errors: number }> {
  const { data: candidates, error } = await supabase
    .rpc("get_email_candidates", { p_tipo: tipo })

  if (error) {
    console.error(`Error querying candidates for ${tipo}:`, error)
    return { tipo, sent: 0, errors: 0 }
  }

  let sent = 0
  let errors = 0

  for (const c of (candidates as Candidate[] || [])) {
    const data: Record<string, string> = { nome: c.nome }
    if (c.homenageado) data["homenageado"] = c.homenageado
    data["link"] = buildLink(tipo, c.presente_id)

    try {
      const res = await fetch(`${SERVICE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          to: c.email,
          tipo,
          usuario_id: c.usuario_id,
          presente_id: c.presente_id || undefined,
          data,
        }),
      })

      if (res.ok) {
        sent++
      } else {
        console.error(`send-email failed for ${c.email} (${tipo}): ${await res.text()}`)
        errors++
      }
    } catch (err) {
      console.error(`send-email error for ${c.email} (${tipo}): ${err}`)
      errors++
    }
  }

  return { tipo, sent, errors }
}

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const results = await Promise.all(
      SCENARIOS.map((tipo) => processScenario(supabase, tipo)),
    )

    const totalSent = results.reduce((s, r) => s + r.sent, 0)
    const totalErrors = results.reduce((s, r) => s + r.errors, 0)

    return new Response(
      JSON.stringify({ success: true, results, total_sent: totalSent, total_errors: totalErrors }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("process-email-queue error:", err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
