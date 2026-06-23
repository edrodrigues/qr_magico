import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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
    const body = await req.json()
    const { order_nsu, transaction_nsu, slug } = body

    if (!order_nsu && !slug) {
      return new Response(JSON.stringify({ error: "Provide order_nsu or slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const checkPayload: Record<string, string> = {
      handle: INFINITEPAY_HANDLE,
    }
    if (order_nsu) checkPayload.order_nsu = order_nsu
    if (transaction_nsu) checkPayload.transaction_nsu = transaction_nsu
    if (slug) checkPayload.slug = slug

    const checkRes = await fetch(INFINITEPAY_CHECK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkPayload),
    })

    if (!checkRes.ok) {
      const errorText = await checkRes.text()
      return new Response(JSON.stringify({ error: "Payment check failed", details: errorText }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const checkData = await checkRes.json()

    return new Response(JSON.stringify(checkData), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    console.error("check-infinitepay-payment error:", err)
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
