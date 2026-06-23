import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

async function triggerWithRetry(
  url: string,
  headers: Record<string, string>,
  body: string,
  maxRetries = 3,
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers, body })
      if (res.ok) return true
      console.error(`triggerWithRetry: attempt ${attempt}/${maxRetries} returned ${res.status} for ${url}`)
    } catch (e) {
      console.error(`triggerWithRetry: attempt ${attempt}/${maxRetries} threw for ${url}:`, e)
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }
  return false
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()

    const invoiceSlug = body.invoice_slug
    const transactionNsu = body.transaction_nsu
    const orderNsu = body.order_nsu
    const captureMethod = body.capture_method
    const paidAmount = body.paid_amount

    if (!orderNsu) {
      return new Response(JSON.stringify({ error: "Missing order_nsu" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const { data: pagamento } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("infinitepay_order_nsu", orderNsu)
      .single()

    if (!pagamento) {
      console.error(`webhook: pagamento not found for order_nsu=${orderNsu}`)
      return new Response(JSON.stringify({ error: "Pagamento not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (pagamento.status === "paid") {
      return new Response(JSON.stringify({ success: true, already_paid: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    await supabase
      .from("pagamentos")
      .update({
        status: "paid",
        transaction_nsu: transactionNsu,
        capture_method: captureMethod,
        infinitepay_slug: invoiceSlug,
        paid_at: new Date().toISOString(),
      })
      .eq("id", pagamento.id)

    if (pagamento.tipo === "presente" && pagamento.presente_id) {
      await supabase
        .from("presentes")
        .update({ status: "generating", updated_at: new Date().toISOString() })
        .eq("id", pagamento.presente_id)

      const { data: saldoAtual } = await supabase
        .from("creditos_saldo")
        .select("saldo")
        .eq("usuario_id", pagamento.usuario_id)
        .single()

      const saldo = saldoAtual?.saldo ?? 0

      await supabase.from("creditos_transacoes").insert({
        usuario_id: pagamento.usuario_id,
        tipo: "bonus",
        quantidade: 1,
        descricao: "Cashback por pagamento de presente via InfinityPay",
      })

      await supabase.from("creditos_saldo").upsert(
        { usuario_id: pagamento.usuario_id, saldo: saldo + 1, updated_at: new Date().toISOString() },
        { onConflict: "usuario_id" },
      )

      const { data: userData } = await supabase.auth.admin.getUserById(pagamento.usuario_id)
      const user = userData?.user

      const edgeHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      }
      const body = JSON.stringify({ presente_id: pagamento.presente_id })

      const musicOk = await triggerWithRetry(
        `${supabaseUrl}/functions/v1/generate-music`,
        edgeHeaders,
        body,
      )
      if (!musicOk) {
        console.error("webhook: all generate-music retries exhausted")
        await supabase
          .from("presentes")
          .update({
            status: "failed",
            error_message: "Geração de música falhou após múltiplas tentativas",
            updated_at: new Date().toISOString(),
          })
          .eq("id", pagamento.presente_id)
      }

      const videoOk = await triggerWithRetry(
        `${supabaseUrl}/functions/v1/render-video`,
        edgeHeaders,
        body,
      )
      if (!videoOk && musicOk) {
        console.error("webhook: all render-video retries exhausted")
        await supabase
          .from("presentes")
          .update({
            status: "failed",
            error_message: "Renderização de vídeo falhou após múltiplas tentativas",
            updated_at: new Date().toISOString(),
          })
          .eq("id", pagamento.presente_id)
      }
    }

    if (pagamento.tipo === "creditos") {
      const qtd = pagamento.quantidade_creditos || 1

      const { data: saldoAtual } = await supabase
        .from("creditos_saldo")
        .select("saldo")
        .eq("usuario_id", pagamento.usuario_id)
        .single()

      const saldo = saldoAtual?.saldo ?? 0

      await supabase.from("creditos_transacoes").insert({
        usuario_id: pagamento.usuario_id,
        tipo: "compra",
        quantidade: qtd,
        descricao: `Compra de ${qtd} crédito(s) via InfinityPay`,
      })

      await supabase.from("creditos_saldo").upsert(
        { usuario_id: pagamento.usuario_id, saldo: saldo + qtd, updated_at: new Date().toISOString() },
        { onConflict: "usuario_id" },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  } catch (err) {
    console.error("infinitepay-webhook error:", err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
})
