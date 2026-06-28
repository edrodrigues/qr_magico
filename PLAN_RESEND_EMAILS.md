# Plano de Implementação: Resend para Emails Transacionais

## Stack

| Camada | Tecnologia |
|---|---|
| Envio | Resend (API REST) |
| Templates | HTML inline (no código) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Agendamento | pg_cron (a cada 1h) |
| Rastreamento | Tabela `email_notificacoes` no PostgreSQL |

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  pg_cron (a cada 1h)                                │
│  └─ process-email-queue (Edge Function)             │
│     ├─ Verifica drafts antigos → envia lembretes    │
│     ├─ Verifica pending_payment → envia lembretes   │
│     ├─ Verifica ready → envia email de conclusão    │
│     ├─ Verifica novos users → welcome email         │
│     └─ Verifica inativos 7d → reengagement          │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  send-email (Edge Function)                         │
│  ├─ Carrega template HTML                           │
│  ├─ Interpola variáveis                             │
│  ├─ Gera PDF + QR (server-side, conclusão apenas)   │
│  └─ Envia via Resend API                            │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Resend (API de envio)                              │
│  └─ Domínio: momentomagico.xyz                      │
└─────────────────────────────────────────────────────┘
```

## Pré-requisito

- [x] Conta em [resend.com](https://resend.com) (plano gratuito: 100 emails/dia)
- [ ] Verificar domínio `momentomagico.xyz` (DNS TXT record) — **pendente manual**
- [x] Gerar API Key no dashboard do Resend
- [x] Armazenar key em `app_secrets` (`RESEND_API_KEY`) + `supabase/.env` para dev

## 1. Database — Migration `00031_email_notifications.sql`

- [x] Tabela `email_notificacoes` criada
- [x] Índices criados
- [x] Função RPC `get_email_candidates(p_tipo)` criada
- [x] pg_cron agendado (requer `app.settings.service_role_key` configurado manualmente)
- [x] pg_net extension ativada
- [x] RESEND_API_KEY seeded em `app_secrets`

## 2. Edge Functions

### 2.1 `send-email` (`verify_jwt = false`) — ✅ Deployed

**Localização:** `supabase/functions/send-email/index.ts`

**Comportamento:**
- [x] Recebe `{ to, tipo, data }` via POST
- [x] Carrega template HTML do diretório `templates/`
- [x] Interpola variáveis (`{{nome}}`, `{{link}}`, etc.)
- [x] Caso `tipo = "completion"`:
  - Gera PDF do momento mágico com `jsPDF` (via esm.sh)
  - Gera QR code com `qrcode` (via esm.sh), converte para imagem PNG base64
  - Anexa PDF + QR ao email via `attachments` da Resend API
- [x] Envia via `fetch` para `https://api.resend.com/emails`
- [x] Registra envio em `email_notificacoes`
- [x] Autenticação: service_role OU JWT do usuário

**Templates HTML:** `supabase/functions/send-email/templates/`

| Arquivo | Conteúdo |
|---|---|
| `welcome.html` | Boas-vindas ao Momento Mágico, CTA "Criar seu primeiro presente" |
| `draft-reminder.html` | "Seu rascunho está esperando!", CTA para continuar |
| `payment-reminder.html` | "Pagamento pendente", CTA para finalizar |
| `completion.html` | "Seu Momento Mágico ficou pronto!" + links visualizar/download |
| `inactivity.html` | "O que você pode criar no Momento Mágico" + exemplos |

### 2.2 `process-email-queue` (`verify_jwt = false`) — ✅ Deployed

**Localização:** `supabase/functions/process-email-queue/index.ts`

**Lógica por cenário:**

| Cenário | Query | Condição |
|---|---|---|
| **welcome** | `get_email_candidates('welcome')` | user criado há >1h, sem welcome enviado |
| **draft_reminder_1** | `get_email_candidates('draft_reminder_1')` | draft há >24h, sem lembrete 1 |
| **draft_reminder_2** | `get_email_candidates('draft_reminder_2')` | draft há >36h, com lembrete 1, sem lembrete 2 |
| **payment_reminder_1** | `get_email_candidates('payment_reminder_1')` | pending_payment há >24h |
| **payment_reminder_2** | `get_email_candidates('payment_reminder_2')` | pending_payment há >36h |
| **completion** | `get_email_candidates('completion')` | ready há >5min |
| **inactivity_7d** | `get_email_candidates('inactivity_7d')` | user há >7d sem presentes |

Para cada cenário encontrado, chama `send-email` via fetch interno com service_role.

## 3. Config (`supabase/config.toml`) — ✅ Atualizado

```toml
[functions.send-email]
verify_jwt = false

[functions.process-email-queue]
verify_jwt = false
```

## 4. Arquivos Modificados (integrações) — ✅

| Arquivo | Mudança | Status |
|---|---|---|
| `src/contexts/AuthContext.tsx` | Após `signUp` bem-sucedido, fetch para `send-email` com `tipo=welcome` | ✅ Implementado |
| `supabase/functions/render-complete/index.ts` | (Opcional — o cron já cobre) Nenhuma mudança necessária por enquanto | ⏭️ Skip |

## 5. Fluxo por Cenário (visão ponta a ponta)

### 1. Signup → Welcome ✅
### 2. Draft >24h → Lembrete 1 ✅
### 3. Draft >36h → Lembrete 2 ✅
### 4. Pending Payment >24h → Lembrete 1 ✅
### 5. Pending Payment >36h → Lembrete 2 ✅
### 6. Pagamento → Conclusão ✅
### 7. 7 dias inativo → Re-engagement ✅

## 6. Ordem de Implementação — Status

| # | Tarefa | Status |
|---|---|---|
| 1 | Conta Resend + API key | ✅ Completo |
| 2 | Migration `email_notificacoes` | ✅ Aplicada (00031) |
| 3 | Templates HTML (x5) | ✅ Criados |
| 4 | Edge Function `send-email` | ✅ Deployed |
| 5 | Edge Function `process-email-queue` | ✅ Deployed |
| 6 | Atualizar `config.toml` | ✅ Atualizado |
| 7 | Hook welcome no frontend | ✅ Implementado |
| 8 | Deploy + testes | ✅ Deployed |

## Pós-deploy (ações manuais necessárias)

1. **Verificar domínio no Resend**: Adicionar registro DNS TXT para `momentomagico.xyz` no dashboard do Resend
2. **Configurar `app.settings.service_role_key`**: No Supabase SQL Editor, executar:
   ```sql
   ALTER DATABASE postgres SET app.settings.service_role_key TO '<service_role_key>';
   ```
   (Para que o pg_cron consiga autenticar ao chamar `process-email-queue`)
3. **Reiniciar o banco** ou recarregar config para o pg_cron pegar o novo setting
4. **Monitorar**: Verificar logs de edge function após o primeiro ciclo do cron
