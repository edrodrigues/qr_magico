import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const ELEVENLABS_API_URL = Deno.env.get("ELEVENLABS_API_URL") || "https://api.elevenlabs.io/v1/music"
const FETCH_TIMEOUT_MS = parseInt(Deno.env.get("FETCH_TIMEOUT_MS") || "120000", 10)

interface PresenteRow {
  id: string
  usuario_id: string
  nome_homenageado: string
  nome_remetente: string
  ocasiao: string
  descricao_relacao: string
  estilo_musical: string
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  mpb: "MPB brasileira com violão, suave e aconchegante",
  pop: "pop animado e alegre",
  piano: "piano solo emocional e intimista",
  lofi: "lo-fi moderno, nostálgico e relaxante",
  sertanejo: "sertanejo raiz romântico",
}

const OCASIAO_LABELS: Record<string, string> = {
  aniversario: "aniversário",
  amor: "declaração de amor",
  amizade: "amizade",
  gratidao: "gratidão",
  outro: "momento especial",
}

let musicasBucketEnsured = false

function buildLyricsPrompt(p: PresenteRow): string {
  const style = STYLE_DESCRIPTIONS[p.estilo_musical] || "emocionante"
  const ocasiao = OCASIAO_LABELS[p.ocasiao] || p.ocasiao
  return [
    `Crie uma música de 60 segundos em português brasileiro no estilo ${style},`,
    `contando a história de ${p.nome_remetente || "alguém especial"} e ${p.nome_homenageado}.`,
    `Ocasião: ${ocasiao}.`,
    `A história deles: ${p.descricao_relacao}.`,
    `A letra deve ser emocionante e personalizada.`,
  ].join(" ")
}

function buildInstrumentalPrompt(p: PresenteRow): string {
  const style = STYLE_DESCRIPTIONS[p.estilo_musical] || "emocionante"
  const ocasiao = OCASIAO_LABELS[p.ocasiao] || p.ocasiao
  return [
    `Uma composição instrumental de 60 segundos no estilo ${style},`,
    `evocando a ocasião de ${ocasiao} entre ${p.nome_remetente || "alguém especial"} e ${p.nome_homenageado}.`,
    `A história deles: ${p.descricao_relacao}.`,
    `A música deve transmitir carinho, nostalgia e celebração.`,
  ].join(" ")
}

async function callElevenLabs(
  prompt: string,
  apiKey: string,
  instrumental: boolean,
): Promise<ArrayBuffer> {
  const body: Record<string, unknown> = {
    prompt,
    music_length_ms: 60000,
    model_id: Deno.env.get("ELEVENLABS_MODEL_ID") || "music_v1",
  }
  if (instrumental) {
    body.force_instrumental = true
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(ELEVENLABS_API_URL, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ElevenLabs error (${response.status}): ${errorText}`)
    }

    return await response.arrayBuffer()
  } finally {
    clearTimeout(timeoutId)
  }
}

serve(async (req) => {
  const startTime = Date.now()

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

  const token = authHeader.replace("Bearer ", "")
  const isServiceRole = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  let user: { id: string } | null = null
  if (!isServiceRole) {
    const { data: { user: u }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !u) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }
    user = u
  }

  let presenteId: string | undefined

  try {
    const body = await req.json()
    presenteId = body.presente_id
    if (!presenteId) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const { data: presente, error: presenteErr } = await supabase
      .from("presentes")
      .select("*")
      .eq("id", presenteId)
      .single()

    if (presenteErr || !presente) {
      return new Response(JSON.stringify({ error: "Presente not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (user && presente.usuario_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (presente.status === "ready") {
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    if (!["generating", "pending_payment"].includes(presente.status)) {
      return new Response(JSON.stringify({ error: "Presente is not in a processable state" }), {
        status: 409,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const { data: secretRow } = await supabase
      .from("app_secrets")
      .select("value")
      .eq("key", "ELEVENLABS_API_KEY")
      .single()

    const elevenLabsKey = secretRow?.value as string
    if (!elevenLabsKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    let audioData: ArrayBuffer
    let isInstrumental = false

    try {
      const prompt = buildLyricsPrompt(presente as PresenteRow)
      audioData = await callElevenLabs(prompt, elevenLabsKey, false)
    } catch {
      const prompt = buildInstrumentalPrompt(presente as PresenteRow)
      audioData = await callElevenLabs(prompt, elevenLabsKey, true)
      isInstrumental = true
    }

    if (!musicasBucketEnsured) {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.find((b) => b.name === "musicas")) {
        await supabase.storage.createBucket("musicas", { public: true })
      }
      musicasBucketEnsured = true
    }

    const filePath = `${presenteId}.mp3`
    const { error: uploadErr } = await supabase.storage
      .from("musicas")
      .upload(filePath, new Uint8Array(audioData), {
        contentType: "audio/mpeg",
        upsert: true,
      })

    if (uploadErr) {
      throw new Error(`Storage upload failed: ${uploadErr.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from("musicas")
      .getPublicUrl(filePath)

    await supabase
      .from("musicas")
      .upsert({
        presente_id: presenteId,
        url_audio: publicUrl,
        estilo: presente.estilo_musical,
        status: "ready",
      }, { onConflict: "presente_id" })

    const elapsed = Date.now() - startTime
    console.log(`generate-music OK ${presenteId} in ${elapsed}ms`)

    return new Response(JSON.stringify({ success: true, isInstrumental }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    const elapsed = Date.now() - startTime
    const errMsg = err instanceof Error ? err.message : "Unknown error"
    console.error(`generate-music error ${presenteId} at ${elapsed}ms:`, errMsg)

    if (presenteId) {
      const { data: musicasRow } = await supabase
        .from("musicas")
        .select("attempts")
        .eq("presente_id", presenteId)
        .maybeSingle()

      const attempts = (musicasRow?.attempts ?? 0) + 1
      const newStatus = attempts >= 3 ? "failed" : "generating"

      await supabase
        .from("musicas")
        .upsert({
          presente_id: presenteId,
          attempts,
          last_attempt_at: new Date().toISOString(),
          status: newStatus,
        }, { onConflict: "presente_id" })

      if (newStatus === "failed") {
        await supabase
          .from("presentes")
          .update({
            status: "failed",
            error_message: errMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", presenteId)
      }
    }

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
