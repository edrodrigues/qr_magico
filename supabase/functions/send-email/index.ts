import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const RESEND_API_URL = "https://api.resend.com/emails"
const SENDER_EMAIL = "Momento Mágico <noreply@momentomagico.xyz>"

type EmailTipo =
  | "welcome"
  | "draft_reminder_1"
  | "draft_reminder_2"
  | "payment_reminder_1"
  | "payment_reminder_2"
  | "completion"
  | "inactivity_7d"

interface SendEmailPayload {
  to: string
  tipo: EmailTipo
  usuario_id: string
  presente_id?: string
  data: Record<string, string>
}

const TEMPLATE_FILES: Record<EmailTipo, string> = {
  welcome: "templates/welcome.html",
  draft_reminder_1: "templates/draft-reminder.html",
  draft_reminder_2: "templates/draft-reminder.html",
  payment_reminder_1: "templates/payment-reminder.html",
  payment_reminder_2: "templates/payment-reminder.html",
  completion: "templates/completion.html",
  inactivity_7d: "templates/inactivity.html",
}

const SUBJECTS: Record<EmailTipo, string> = {
  welcome: "Bem-vindo ao Momento Mágico!",
  draft_reminder_1: "Seu rascunho está esperando!",
  draft_reminder_2: "Ultimo lembrete: seu presente esta quase pronto!",
  payment_reminder_1: "Pagamento pendente — finalize seu presente!",
  payment_reminder_2: "Ultimo aviso: pagamento pendente!",
  completion: "Seu Momento Magico ficou pronto!",
  inactivity_7d: "Que tal criar algo especial?",
}

function loadTemplate(tipo: EmailTipo): Promise<string> {
  const filePath = new URL(TEMPLATE_FILES[tipo], import.meta.url)
  return Deno.readTextFile(filePath)
}

function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] || "")
}

async function getResendApiKey(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data, error } = await supabase
    .from("app_secrets")
    .select("value")
    .eq("key", "RESEND_API_KEY")
    .single()

  if (error || !data) {
    throw new Error("RESEND_API_KEY not found in app_secrets")
  }
  return data.value as string
}

async function sendViaResend(apiKey: string, to: string, subject: string, html: string, attachments?: Array<{ filename: string; content: string; contentType: string }>) {
  const body: Record<string, unknown> = {
    from: SENDER_EMAIL,
    to: [to],
    subject,
    html,
  }

  if (attachments && attachments.length > 0) {
    body.attachments = attachments
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error ${res.status}: ${err}`)
  }

  return await res.json()
}

async function generatePdfAttachment(homenageado: string, link: string): Promise<{ filename: string; content: string; contentType: string }> {
  const jspdf = await import("https://esm.sh/jspdf@2.5.2")
  const qrcode = await import("https://esm.sh/qrcode@1.5.4")

  const doc = new jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  doc.setFontSize(24)
  doc.setTextColor(108, 99, 255)
  doc.text("Momento Magico", 105, 40, { align: "center" })

  doc.setFontSize(16)
  doc.setTextColor(51, 51, 51)
  doc.text(`Presente para: ${homenageado}`, 105, 60, { align: "center" })

  doc.setFontSize(12)
  doc.setTextColor(102, 102, 102)
  doc.text("Este presente foi criado com carinho especialmente para voce!", 105, 75, { align: "center", maxWidth: 160 })

  const qrDataUrl = await qrcode.toDataURL(link, { width: 300, margin: 2 })
  doc.addImage(qrDataUrl, "PNG", 105 - 30, 95, 60, 60)

  doc.setFontSize(10)
  doc.setTextColor(153, 153, 153)
  doc.text("Acesse o link para ver o video completo", 105, 165, { align: "center" })
  doc.text(link, 105, 175, { align: "center", maxWidth: 170 })

  const pdfBuffer = doc.output("arraybuffer")
  const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)))

  return {
    filename: `momento-magico-${homenageado.replace(/\s+/g, "-").toLowerCase()}.pdf`,
    content: base64,
    contentType: "application/pdf",
  }
}

async function logNotification(
  supabase: ReturnType<typeof createClient>,
  usuario_id: string,
  tipo: EmailTipo,
  email: string,
  presente_id?: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabase.from("email_notificacoes").insert({
    usuario_id,
    tipo,
    email,
    presente_id: presente_id || null,
    metadata: metadata || null,
  })

  if (error) {
    console.error(`Failed to log notification: ${error.message}`)
  }
}

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const auth = req.headers.get("Authorization") || ""
    const token = auth.replace("Bearer ", "")

    const isServiceRole = token === supabaseServiceKey
    if (!isServiceRole) {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
      }
    }

    const payload: SendEmailPayload = await req.json()
    const { to, tipo, usuario_id, presente_id, data } = payload

    const apiKey = await getResendApiKey(supabase)
    const rawTemplate = await loadTemplate(tipo)
    const html = interpolate(rawTemplate, data)
    const subject = SUBJECTS[tipo]

    let attachments

    if (tipo === "completion") {
      const homenageado = data["homenageado"] || "alguem especial"
      const link = data["link"] || ""
      const pdf = await generatePdfAttachment(homenageado, link)
      attachments = [pdf]
    }

    const result = await sendViaResend(apiKey, to, subject, html, attachments)

    await logNotification(supabase, usuario_id, tipo, to, presente_id, {
      resend_id: (result as Record<string, string>).id,
      subject,
    })

    return new Response(JSON.stringify({ success: true, id: (result as Record<string, string>).id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("send-email error:", err)
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
