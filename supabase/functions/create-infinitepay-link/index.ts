import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const INFINITEPAY_HANDLE = "edmilson-rodrigues-pa0"
const INFINITEPAY_API = "https://api.checkout.infinitepay.io/links"
const APP_URL = Deno.env.get("APP_URL") || "https://www.momentomagico.xyz"

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
    const body = await req.json()
    const { tipo, presente_id, quantidade_creditos, valor_centavos, customer } = body

    if (!tipo || !["presente", "creditos"].includes(tipo)) {
      return new Response(JSON.stringify({ error: "tipo must be 'presente' or 'creditos'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (!valor_centavos || valor_centavos < 1) {
      return new Response(JSON.stringify({ error: "Invalid valor_centavos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const orderNsu = tipo === "presente"
      ? `presente_${presente_id}`
      : `creditos_${user.id}_${quantidade_creditos || 1}_${Date.now()}`

    const webhookUrl = `${supabaseUrl}/functions/v1/infinitepay-webhook`
    const redirectUrl = tipo === "presente"
      ? `${APP_URL}/payment-success?presente_id=${presente_id}`
      : `${APP_URL}/creditos-success`

    const description = tipo === "presente"
      ? "QR Mágico - Presente Personalizado"
      : `${quantidade_creditos || 1} crédito(s) QR Mágico`

    const payload: Record<string, unknown> = {
      handle: INFINITEPAY_HANDLE,
      items: [
        {
          quantity: 1,
          price: valor_centavos,
          description,
        },
      ],
      order_nsu: orderNsu,
      redirect_url: redirectUrl,
      webhook_url: webhookUrl,
    }

    let customerName = customer?.name?.trim()
    if (!customerName || customerName.length < 3) {
      customerName = customer?.email?.split("@")[0]?.trim() || ""
    }
    if (customerName.length < 3) {
      return new Response(JSON.stringify({ error: "Customer name must be at least 3 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }
    if (customerName) {
      payload.customer = {
        name: customerName,
        email: customer?.email || "",
      }
      if (customer?.phone_number) {
        (payload.customer as Record<string, string>).phone_number = customer.phone_number
      }
    }

    const infinitepayRes = await fetch(INFINITEPAY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!infinitepayRes.ok) {
      const errorText = await infinitepayRes.text()
      console.error("InfinityPay error:", infinitepayRes.status, errorText)
      return new Response(JSON.stringify({ error: "InfinityPay API error", details: errorText }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const infinitepayData = await infinitepayRes.json()
    const checkoutUrl = infinitepayData.url || infinitepayData.checkout_url
    const slug = infinitepayData.slug || null

    const { error: insertErr } = await supabase.from("pagamentos").insert({
      usuario_id: user.id,
      presente_id: tipo === "presente" ? presente_id : null,
      tipo,
      quantidade_creditos: quantidade_creditos || 0,
      valor_centavos,
      infinitepay_slug: slug,
      infinitepay_order_nsu: orderNsu,
      status: "pending",
    })

    if (insertErr) {
      console.error("Failed to insert pagamento:", insertErr)
    }

    if (tipo === "presente" && presente_id) {
      await supabase
        .from("presentes")
        .update({ status: "pending_payment", updated_at: new Date().toISOString() })
        .eq("id", presente_id)
    }

    return new Response(JSON.stringify({ checkout_url: checkoutUrl, slug, order_nsu: orderNsu }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    console.error("create-infinitepay-link error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
})
