import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

async function hexSign(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, X-Remotion-Signature",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const webhookSecret = Deno.env.get("RENDER_WEBHOOK_SECRET")
  if (webhookSecret) {
    const signature = req.headers.get("X-Remotion-Signature")
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing X-Remotion-Signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }
    const rawBody = await req.clone().text()
    const expected = await hexSign(webhookSecret, rawBody)
    if (signature !== expected) {
      console.warn(`render-complete: invalid signature. Got ${signature.slice(0, 16)}..., expected ${expected.slice(0, 16)}...`)
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()

    // Compatível com formato do Remotion Lambda (customData.presente_id, type, output.url)
    // e com formato legado (presente_id, status, video_url na raiz)
    const presenteId = body.customData?.presente_id || body.presente_id
    const renderStatus = body.type || body.status
    const videoUrl = body.output?.url || body.video_url

    if (!presenteId) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (renderStatus === "completed" || renderStatus === "success" || renderStatus === "done") {
      const { data: presente } = await supabase
        .from("presentes")
        .select("render_request_id")
        .eq("id", presenteId)
        .single()

      if (presente?.render_request_id && body.renderId) {
        const receivedRenderId = String(body.renderId)
        if (presente.render_request_id !== receivedRenderId) {
          console.warn(`render-complete: renderId mismatch for ${presenteId}. Expected ${presente.render_request_id}, got ${receivedRenderId}`)
        }
      }

      const proxyUrl = `${supabaseUrl}/functions/v1/proxy-video?presente_id=${presenteId}`
      await supabase
        .from("presentes")
        .update({
          video_url: videoUrl || proxyUrl,
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", presenteId)
      console.log(`render-complete: ${presenteId} → ready`)
    } else {
      await supabase
        .from("presentes")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", presenteId)
      console.log(`render-complete: ${presenteId} → failed`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  } catch (err) {
    console.error("render-complete error:", err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
})
