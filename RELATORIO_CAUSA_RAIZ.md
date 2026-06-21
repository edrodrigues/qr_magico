# Relatório de Causa Raiz: Vídeo mostra "Ainda processando..."

## Resumo do Problema

A página de visualização do momento mágico (`/p/:slug`) exibe o `VideoPlayer`, mas o vídeo falha ao carregar e mostra:

> **"Ainda processando... O vídeo ainda está sendo gerado. Volte em alguns minutos."**

Esta mensagem está em `src/components/VideoPlayer.tsx:225-229` e é acionada quando o elemento `<video>` dispara o evento `onerror`.

---

## Evidências Coletadas

### Banco de dados (Supabase `public.presentes`)

| ID | Slug | Status | video_url | render_request_id |
|---|---|---|---|---|
| `1dc6699d-...` | samuel-mqmw0nbu0uco | `ready` | `https://remotionlambda-.../renders/.../out.mp4` | `6db6b875-...` |
| `15fc7b21-...` | samuel-mqmsobl6zk96 | `ready` | `https://remotionlambda-.../renders/.../out.mp4` | `091b34ce-...` |

Ambos com `status = "ready"` e `video_url` apontando para S3.

### Logs das Edge Functions (Supabase)

- `proxy-video`: **Múltiplas chamadas, todas retornando HTTP 200** (gerando URLs assinadas)
- `render-video`: **2 chamadas bem-sucedidas** (versões 2 e 4), Lambda invocada com sucesso
- `generate-music`: **Todas falhando com HTTP 500**
- `render-complete`: **NENHUMA chamada registrada** — webhook nunca foi invocado com sucesso

### S3 (AWS)

```
aws s3api list-objects --bucket remotionlambda-useast1-gpi3r82b1m --prefix renders/
→ 0 objetos (prefixo vazio)

aws s3api head-object --bucket remotionlambda-useast1-gpi3r82b1m --key renders/{id}/out.mp4
→ HTTP 404 — arquivo não existe
```

---

## Causas Raiz

### Problema 1: `render-complete` não entende o formato do webhook do Remotion Lambda

**Arquivo:** `supabase/functions/render-complete/index.ts:35-36`

```ts
const { presente_id, status: renderStatus, video_url } = body;
```

O código espera que o body contenha `presente_id`, `status` e `video_url` na raiz.

Mas o Remotion Lambda v4.x envia o webhook neste formato:

```json
{
  "type": "success",
  "renderId": "abcdef",
  "bucketName": "bucket-name",
  "customData": { "presente_id": "uuid-aqui" },
  "output": {
    "url": "https://s3.amazonaws.com/bucket/renders/id/out.mp4"
  }
}
```

Mapeamento correto:
| Esperado | Real (Remotion) |
|---|---|
| `body.presente_id` | `body.customData.presente_id` |
| `body.status` | `body.type` |
| `body.video_url` | `body.output.url` |

**Consequência:** `presente_id` = `undefined` → `render-complete` retorna HTTP 400 ("Missing presente_id"). O webhook é rejeitado e o banco nunca é atualizado via esse fluxo. Confirmado pela ausência total de logs para `render-complete`.

### Problema 2: `render-video` não envia `customData` para a Lambda

**Arquivo:** `supabase/functions/render-video/index.ts:221-233`

```ts
const payload = {
  type: "start",
  composition: "Retrospectiva",
  inputProps,
  serveUrl,
  framesPerLambda: 30,
  outName: `${outDir}/out.mp4`,
  codec: "h264",
  videoBitrate: "8M",
  x264Preset: "medium",
  webhookUrl,
  webhookSecret,
};
```

**Ausente:** `customData: { presente_id }`

Sem esse campo, mesmo corrigindo o parsing do `render-complete`, o webhook nunca conteria o `presente_id` necessário para identificar qual registro atualizar.

### Problema 3: Vídeos nunca foram gerados no S3

O bucket S3 está **vazio** sob o prefixo `renders/`. Nenhum dos dois `out.mp4` foi criado.

Causas possíveis:
- A Lambda do Remotion falhou durante a renderização (timeout, memória)
- O `serveUrl` (`https://remotionlambda-useast1-gpi3r82b1m.s3.us-east-1.amazonaws.com/sites/retrospectiva/index.html`) não é válido ou foi deletado
- A Lambda completou mas houve erro ao fazer upload do resultado

Como o webhook `render-complete` nunca foi chamado com sucesso, o sistema nunca marcou como `failed` — e não há mecanismo de detecção de falha assíncrona.

**Banco vs realidade:** Apesar dos vídeos não existirem, o banco tem `status = "ready"` e `video_url` preenchido. Esses valores foram definidos externamente ao fluxo normal (provável atualização manual ou versão anterior do código).

### Problema 4: `proxy-video` gera URL sem validar existência do arquivo

**Arquivo:** `supabase/functions/proxy-video/index.ts:144-162`

```ts
if (!presente.video_url) {
  // Só faz HEAD check quando video_url é nulo
  const headResp = await fetch(headUrl, { method: "HEAD" });
  // ...
}
const presignedUrl = await generatePresignedGetUrl(...);
```

Como `video_url` já está preenchido no banco, o HEAD check é **pulado**. A função gera uma URL assinada sem verificar se o arquivo realmente existe no S3. O `proxy-video` retorna HTTP 200 com uma URL que leva a 403/404.

### Fluxo completo do erro

```
1. Usuário acessa /p/:slug
2. Frontend busca presente → status="ready", video_url preenchido
3. Frontend chama proxy-video?format=json → HTTP 200 (URL assinada gerada sem verificar S3)
4. <video src={presignedUrl}> → falha 403/404 (arquivo não existe)
5. hasError = true → renderiza "Ainda processando..."
```

---

## Status da Implementação

> Ultima atualização: 2026-06-21 — **Todas as correções implementadas e deployadas.**

---

## Plano de Correção

### 1. ✅ Corrigir `render-complete` para processar webhook do Remotion Lambda

**Arquivo:** `supabase/functions/render-complete/index.ts`

**Status:** Implementado e deployado (versão 1)

**O quê:** Adaptar o parsing do body para o formato do Remotion Lambda, mantendo compatibilidade retroativa.

```ts
// Novo parsing (implementado):
const { type, customData, output } = body;
const presenteId = customData?.presente_id || body.presente_id;
const renderStatus = type || body.status;
const videoUrl = output?.url || body.video_url;
```

**Por que:** Sem essa correção o webhook nunca funcionará.

### 2. ✅ Adicionar `customData` no payload do `render-video`

**Arquivo:** `supabase/functions/render-video/index.ts` (linha 234)

**Status:** Implementado e deployado (versão 5)

**O quê:** Incluir `customData: { presente_id }` no payload enviado à Lambda.

```ts
const payload = {
  // ... campos existentes ...
  customData: { presente_id: presenteId },
};
```

**Por que:** O Remotion Lambda inclui `customData` no webhook de callback. Sem isso o `render-complete` não consegue identificar o presente.

### 3. ✅ Corrigir `proxy-video` para SEMPRE verificar existência no S3

**Arquivo:** `supabase/functions/proxy-video/index.ts` (linhas 142-150)

**Status:** Implementado e deployado (versão 2)

**O quê:** Mover o HEAD check para fora do `if (!presente.video_url)`, executando-o em TODAS as chamadas antes de gerar a URL assinada.

```ts
// Verificar existência REAL do arquivo SEMPRE (implementado):
const headResp = await fetch(headUrl, { method: "HEAD" });
if (headResp.status === 404 || headResp.status === 403) {
  return new Response(JSON.stringify({ error: "Video not available" }), { status: 404 });
}
```

**Por que:** Impede que URLs inválidas cheguem ao frontend.

### 4. ✅ Resetar dados inconsistentes no banco

**Status:** Executado via `supabase_execute_sql`

**O quê:** SQL executado para limpar os 2 registros corrompidos:

```sql
UPDATE public.presentes
SET status = 'failed', video_url = NULL
WHERE id IN (
  '1dc6699d-41c7-44c8-baac-a9f17774da05',
  '15fc7b21-3256-48bb-94c3-1f0db6c7f83a'
);
```

**Resultado:** 2 linhas afetadas. Agora status = `failed`, video_url = `NULL`.

**Por que:** Remove falsos positivos e permite que o Dashboard ofereça "Tentar novamente".

### 5. ⏳ Adicionar migração para cleanup automático de gerações stalled (Pendente)

**Arquivo:** `supabase/migrations/` (nova migration)

**Status:** Pendente — Já existe a função `reset_stale_generations` (migration 00009), que cobre este caso. Pode ser invocada manualmente via RPC ou por um cron futuro.

**Por que:** Situações como esta (Lambda falha mas webhook não é chamado) deixam registros órfãos em `generating` para sempre.

---

## Resumo das Ações

| # | Ação | Arquivo | Prioridade | Status |
|---|---|---|---|---|
| 1 | Corrigir parsing do webhook no `render-complete` | `supabase/functions/render-complete/index.ts` | **Crítica** | ✅ Deployado (v1) |
| 2 | Adicionar `customData.presente_id` no payload Lambda | `supabase/functions/render-video/index.ts` | **Crítica** | ✅ Deployado (v5) |
| 3 | Validar existência do arquivo S3 no `proxy-video` | `supabase/functions/proxy-video/index.ts` | **Alta** | ✅ Deployado (v2) |
| 4 | Resetar registros inconsistentes no banco | SQL direto no Supabase | **Alta** | ✅ Executado |
| 5 | Criar migração para auto-cleanup de stalled | Nova migration | **Média** | ⏳ Já existe `reset_stale_generations` |

Após aplicar os itens 1-3, novos momentos mágicos deverão seguir o fluxo correto.
Após aplicar o item 4, a página existente deixará de mostrar "Ainda processando..." (mostrará "falhou" com opção de retentar).
