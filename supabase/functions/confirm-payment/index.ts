import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { runGenerationPipeline } from "../_shared/generation-pipeline.ts"

const INFINITEPAY_HANDLE = "edmilson-rodrigues-pa0"
const INFINITEPAY_CHECK_API = "https://api.checkout.infinitepay.io/payment_check"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  )
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }

  try {
    const { presente_id } = await req.json()

    if (!presente_id) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const { data: pagamento, error: pagErr } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("presente_id", presente_id)
      .eq("tipo", "presente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pagErr) {
      console.error("pagamento lookup error:", pagErr)
      return new Response(JSON.stringify({ error: "Erro ao buscar pagamento" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (!pagamento) {
      return new Response(JSON.stringify({ error: "Pagamento não encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (pagamento.usuario_id !== user.id) {
      return new Response(JSON.stringify({ error: "Pagamento não pertence ao usuário" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (pagamento.status === "paid") {
      return new Response(JSON.stringify({ success: true, already_paid: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const checkPayload: Record<string, string> = {
      handle: INFINITEPAY_HANDLE,
      order_nsu: pagamento.infinitepay_order_nsu,
    }

    const checkRes = await fetch(INFINITEPAY_CHECK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkPayload),
    })

    if (!checkRes.ok) {
      return new Response(JSON.stringify({ error: "Falha ao verificar pagamento no InfinityPay" }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const checkData = await checkRes.json()

    if (!checkData.paid) {
      return new Response(JSON.stringify({ paid: false, message: "Pagamento ainda não confirmado" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    await supabase
      .from("pagamentos")
      .update({
        status: "paid",
        transaction_nsu: checkData.transaction_nsu || pagamento.transaction_nsu,
        capture_method: checkData.capture_method || pagamento.capture_method,
        infinitepay_slug: checkData.slug || pagamento.infinitepay_slug,
        paid_at: new Date().toISOString(),
      })
      .eq("id", pagamento.id)

    await supabase
      .from("presentes")
      .update({
        status: "generating",
        generation_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", presente_id)

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

    await supabase.from("musicas").upsert({
      presente_id: presente_id,
      status: "generating",
      attempts: 0,
      last_attempt_at: null,
    }, { onConflict: "presente_id" }).catch((e) => {
      console.error("failed to create musicas row:", e)
    })

    runGenerationPipeline(supabaseUrl, supabaseServiceKey, presente_id, supabase)

    return new Response(JSON.stringify({ success: true, paid: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  } catch (err) {
    console.error("confirm-payment error:", err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
})
