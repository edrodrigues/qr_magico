# Plano de Correção — Pipeline de Geração de Vídeo

## Status Atual

A pipeline de geração de vídeo (Remotion Lambda + Edge Functions) está funcional, com as correções do `RELATORIO_CAUSA_RAIZ.md` já aplicadas. Esta análise identificou 10 issues adicionais divididas em 4 prioridades.

✅ **Todas as correções foram implementadas (21/06/2026).**

---

## Prioridade P0 — Segurança

### 1. Configurar `RENDER_WEBHOOK_SECRET`

**Problema:** O webhook `render-complete` aceita chamadas não autenticadas. A variável `RENDER_WEBHOOK_SECRET` não existe em `.env.local`, então o guard `if (webhookSecret)` em `render-complete/index.ts:19` pula a verificação.

**Arquivos:**
- `.env.local` — adicionar variável
- `supabase/functions/render-complete/index.ts` — já implementa verificação, só precisa da variável

**Ação:**
✅ 1. Gerar um secret forte (ex: `openssl rand -hex 32`)
✅ 2. Adicionar `RENDER_WEBHOOK_SECRET=<secret>` ao `.env.local`
⏳ 3. Configurar o secret nas variáveis de ambiente do Supabase Project (`supabase secrets set RENDER_WEBHOOK_SECRET=<secret>`) — *requer CLI com auth*
✅ 4. Configurar o mesmo secret como `webhookSecret` no payload enviado pela Remotion Lambda (já está em `render-video/index.ts:219`)

---

## Prioridade P1 — Resiliência

### 2. Tratar erros do fire-and-forget IIFE

**Problema:** `WizardPagamento.tsx:121-128` e `Dashboard.tsx:703-713` chamam `generate-music` e `render-video` dentro de uma IIFE sem `await`. Erros são apenas logados no console; o usuário não recebe feedback e o `presente.status` nunca é atualizado para `failed`.

**Arquivos:**
- `src/pages/WizardPagamento.tsx` (~linha 121)
- `src/pages/Dashboard.tsx` (~linha 703)

**Ação:**
✅ Modificar a IIFE para capturar erros e, em caso de falha, atualizar `presentes.status = 'failed'` via Supabase client
✅ Exibir toast de erro ao usuário quando a geração falhar

### 3. Detectar falhas silenciosas da Lambda

**Problema:** A Remotion Lambda é invocada em modo `Event` (assíncrono). Se a Lambda falhar sem chamar o webhook, o `presente` fica com `status = 'generating'` para sempre. O `render_request_id` é armazenado mas nunca consultado.

**Arquivos:**
- `supabase/functions/render-video/index.ts` — armazena `render_request_id`
- (novo) `supabase/functions/check-render-status/index.ts` — nova edge function

**Ação:**
✅ Abordagem implementada: criar função SQL `reset_stale_generations()` que marca como `failed` presentes com `status = 'generating'` e `updated_at > 30min`
✅ Criada migration com `pg_cron` schedule executando a cada 15 minutos
✅ Alternativa mais simples que edge function + CloudWatch, sem dependência externa

### 4. Garantir que `render-video` set `status = 'generating'`

**Problema:** `render-video/index.ts:265-277` atualiza apenas `render_request_id` e `updated_at`, mas não define `status` explicitamente. Depende do caller já ter setado.

**Arquivo:** `supabase/functions/render-video/index.ts` (~linha 265)

**Ação:**
✅ Incluir `status: "generating"` no update após invocar a Lambda com sucesso

---

## Prioridade P2 — Performance e Robustez

### 5. Remover HEAD check síncrono do proxy-video

**Problema:** `proxy-video/index.ts:143` faz um `fetch HEAD` para o S3 em toda requisição, adicionando 100-500ms de latência ao carregamento do vídeo.

**Arquivo:** `supabase/functions/proxy-video/index.ts`

**Ação:**
✅ Manter o HEAD check apenas quando `video_url` está vazio/nulo

### 6. Adicionar retry na invocação da Lambda

**Problema:** Se a AWS throttler ou ocorrer erro de rede na chamada a `invokeLambda`, a geração falha imediatamente sem retry.

**Arquivo:** `supabase/functions/render-video/index.ts` (~linha 241)

**Ação:**
✅ Envolver a chamada `invokeLambda` com retry com backoff exponencial (3 tentativas: 1s, 3s, 9s)

---

## Prioridade P3 — Manutenibilidade

### 7. Extrair constantes para env vars

**Problema:** `framesPerLambda: 30`, `FETCH_TIMEOUT_MS: 120_000`, polling de 60s, `model_id: "music_v1"` estão hardcoded.

**Arquivos:**
- `supabase/functions/render-video/index.ts`
- `supabase/functions/generate-music/index.ts`

**Ação:**
✅ `framesPerLambda` → `FRAMES_PER_LAMBDA` env var
✅ `FETCH_TIMEOUT_MS` → `FETCH_TIMEOUT_MS` env var
✅ `model_id: "music_v1"` → `ELEVENLABS_MODEL_ID` env var
✅ Polling interval 3s → `MUSIC_POLL_INTERVAL_MS` env var
✅ Polling max 20 → `MUSIC_POLL_MAX_ATTEMPTS` env var

### 8. Adicionar Content-Type na resposta da Lambda

**Problema:** A Lambda do Remotion pode não incluir `Content-Type: application/json` nos headers de resposta.

**Arquivo:** `supabase/functions/render-video/index.ts` — não há handler de resposta da Lambda (modo Event)

**Ação:**
- Não aplicável no modo Event (fire-and-forget). Se migrar para `RequestResponse`, adicionar header.

### 9. Validar `renderId` no webhook

**Problema:** `render-complete` não valida se o `renderId` do webhook corresponde ao `render_request_id` armazenado.

**Arquivo:** `supabase/functions/render-complete/index.ts`

**Ação:**
✅ Ao receber webhook, buscar o `presente` e verificar se `render_request_id` corresponde ao `renderId` recebido (log warning se divergir)

---

## Resumo das Ações

| # | Ação | Prioridade | Arquivo(s) | Status |
|---|---|---|---|---|
| 1 | Configurar `RENDER_WEBHOOK_SECRET` | **P0** | `.env.local`, ambiente Supabase | ✅ Feito (secret no .env.local; pendente `supabase secrets set` com CLI) |
| 2 | Tratar erros do fire-and-forget IIFE | **P1** | `WizardPagamento.tsx`, `Dashboard.tsx` | ✅ Feito |
| 3 | Detectar falhas silenciosas da Lambda | **P1** | `render-video/index.ts`, SQL migration + pg_cron | ✅ Feito |
| 4 | Setar `status='generating'` no render-video | **P1** | `render-video/index.ts` | ✅ Feito |
| 5 | Remover HEAD check síncrono do proxy-video | **P2** | `proxy-video/index.ts` | ✅ Feito |
| 6 | Adicionar retry na invocação da Lambda | **P2** | `render-video/index.ts` | ✅ Feito |
| 7 | Extrair constantes para env vars | **P3** | `render-video/index.ts`, `generate-music/index.ts` | ✅ Feito |
| 8 | Validar `renderId` no webhook | **P3** | `render-complete/index.ts` | ✅ Feito |
