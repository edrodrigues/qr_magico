import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const RESEND_API_URL = "https://api.resend.com"
const AUDIENCE_ID = "023ea2da-4a8b-4445-9d75-199928f2af6d"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email, first_name, last_name } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 })
    }

    const { data: secret, error } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("key", "RESEND_API_KEY")
      .single()

    if (error || !secret) {
      throw new Error("RESEND_API_KEY not found in app_secrets")
    }

    const body: Record<string, string> = { email }
    if (first_name) body.first_name = first_name
    if (last_name) body.last_name = last_name

    const res = await fetch(`${RESEND_API_URL}/audiences/${AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Resend API error:", res.status, err)
      return new Response(JSON.stringify({ success: false, error: `Resend API error: ${err}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = await res.json()

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("add-resend-contact error:", err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
