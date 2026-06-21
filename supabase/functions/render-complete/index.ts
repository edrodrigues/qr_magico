import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

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

  const webhookSecret = Deno.env.get("RENDER_WEBHOOK_SECRET")
  if (webhookSecret) {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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

    if (renderStatus === "completed" || renderStatus === "success") {
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
