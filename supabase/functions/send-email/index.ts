import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const RESEND_API_URL = "https://api.resend.com/emails"
const SENDER_EMAIL = "Momento M\u00e1gico <noreply@momentomagico.xyz>"

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

function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => data[key] || "")
}

const TEMPLATES: Record<EmailTipo, string> = {
  welcome: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bem-vindo ao Momento M&aacute;gico</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">Bem-vindo ao Momento M&aacute;gico!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">Ficamos muito felizes em ter voc&ecirc; conosco! O Momento M&aacute;gico &eacute; o lugar perfeito para criar presentes personalizados e emocionantes para quem voc&ecirc; ama.</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">Que tal criar seu primeiro presente agora? &Eacute; r&aacute;pido, f&aacute;cil e m&aacute;gico!</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="https://www.momentomagico.xyz/wizard/ocasiao-nome" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Criar meu primeiro presente</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email por ter se cadastrado no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  draft_reminder_1: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Seu rascunho est&aacute; esperando!</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">Seu rascunho est&aacute; esperando!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">Voc&ecirc; come&ccedil;ou a criar um presente para <strong>{{homenageado}}</strong> mas ainda n&atilde;o finalizou. Seu rascunho est&aacute; guardado e pronto para ser continuado!</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">N&atilde;o deixe essa surpresa pela metade &mdash; continue de onde parou e encante quem voc&ecirc; ama.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="https://www.momentomagico.xyz/" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Continuar meu presente</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email por ter um rascunho no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  draft_reminder_2: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>&Uacute;ltimo lembrete: seu presente est&aacute; quase pronto!</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">&Uacute;ltimo lembrete: seu presente est&aacute; quase pronto!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">Este &eacute; o &uacute;ltimo lembrete sobre o presente para <strong>{{homenageado}}</strong>. N&atilde;o deixe essa oportunidade passar!</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">Finalize agora e surpreenda algu&eacute;m especial.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="https://www.momentomagico.xyz/" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Continuar meu presente</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email por ter um rascunho no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  payment_reminder_1: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pagamento pendente</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">Pagamento pendente</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">O presente para <strong>{{homenageado}}</strong> est&aacute; quase pronto! S&oacute; falta confirmar o pagamento para que a m&aacute;gica aconte&ccedil;a.</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">Finalize o pagamento e em poucos minutos seu presente especial ser&aacute; gerado.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="{{link}}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Finalizar pagamento</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email por ter um pagamento pendente no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  payment_reminder_2: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>&Uacute;ltimo aviso: pagamento pendente!</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">&Uacute;ltimo aviso: pagamento pendente!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">Este &eacute; o &uacute;ltimo aviso sobre o pagamento do presente para <strong>{{homenageado}}</strong>. Ap&oacute;s a confirma&ccedil;&atilde;o, seu presente ser&aacute; gerado e disponibilizado.</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">N&atilde;o perca essa oportunidade!</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="{{link}}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Finalizar pagamento</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email por ter um pagamento pendente no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  completion: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Seu Momento M&aacute;gico ficou pronto!</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">Seu Momento M&aacute;gico ficou pronto!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">O presente para <strong>{{homenageado}}</strong> est&aacute; pronto e incr&iacute;vel! J&aacute; imaginamos o sorriso no rosto de quem vai receber essa surpresa.</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">Voc&ecirc; pode baixar o PDF e o QR code diretamente do seu dashboard. Acesse agora para compartilhar esse momento especial.</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="https://www.momentomagico.xyz/dashboard" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Ir para o Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email porque seu presente ficou pronto no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  inactivity_7d: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Que tal criar algo especial?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F5;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F8F7F5">
    <tr>
      <td align="center" style="padding:40px 0">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color:#FFFFFF;border-radius:0;overflow:hidden;border:1px solid #EBEAE8">
          <tr>
            <td align="center" style="background-color:#C96442;padding:40px 20px">
              <h1 style="color:#FFFFFF;font-size:28px;margin:0;line-height:1.3;font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400">Que tal criar algo especial?</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px">
              <p style="color:#1D1D1C;font-size:16px;line-height:1.6;margin:0 0 20px">Ol&aacute; <strong>{{nome}}</strong>,</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 20px">Sabia que voc&ecirc; pode criar presentes personalizados e emocionantes para qualquer ocasi&atilde;o? Anivers&aacute;rio, declara&ccedil;&atilde;o de amor, amizade, gratid&atilde;o &mdash; o Momento M&aacute;gico transforma seus sentimentos em um v&iacute;deo &uacute;nico com m&uacute;sica original!</p>
              <p style="color:#565655;font-size:16px;line-height:1.6;margin:0 0 30px">Que tal criar agora e surpreender algu&eacute;m especial?</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center" bgcolor="#C96442" style="border-radius:0">
                    <a href="{{link}}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;line-height:1;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif">Criar meu primeiro presente</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F4F2;padding:20px 30px;text-align:center">
              <p style="color:#565655;font-size:12px;line-height:1.4;margin:0">Voc&ecirc; est&aacute; recebendo este email por ser cadastrado no Momento M&aacute;gico.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
}

const SUBJECTS: Record<EmailTipo, string> = {
  welcome: "Bem-vindo ao Momento M\u00e1gico!",
  draft_reminder_1: "Seu rascunho est\u00e1 esperando!",
  draft_reminder_2: "\u00daltimo lembrete: seu presente est\u00e1 quase pronto!",
  payment_reminder_1: "Pagamento pendente \u2014 finalize seu presente!",
  payment_reminder_2: "\u00daltimo aviso: pagamento pendente!",
  completion: "Seu Momento M\u00e1gico ficou pronto!",
  inactivity_7d: "Que tal criar algo especial?",
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
  const { error } = await supabase.rpc("insert_email_notificacao", {
    p_usuario_id: usuario_id,
    p_tipo: tipo,
    p_email: email,
    p_presente_id: presente_id || null,
    p_metadata: metadata || null,
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
    const rawTemplate = TEMPLATES[tipo]
    const html = interpolate(rawTemplate, data)
    const subject = SUBJECTS[tipo]

    let attachments

    if (tipo === "completion") {
      const homenageado = data["homenageado"] || "alguem especial"
      const link = data["link"] || ""
      try {
        const pdf = await generatePdfAttachment(homenageado, link)
        attachments = [pdf]
      } catch (pdfErr) {
        console.error("PDF generation failed, sending without attachment:", pdfErr)
      }
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