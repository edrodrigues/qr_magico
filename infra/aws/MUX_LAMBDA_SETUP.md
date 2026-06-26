# Setup da Mux Lambda (admin AWS)

A Mux Lambda combina o vídeo silencioso (Remotion) com o MP3 da música via FFmpeg. O usuário `remotion-user` **não pode criar** Lambdas — apenas atualizar e invocar após o setup inicial.

## Valores do projeto

| Variável | Exemplo |
|----------|---------|
| Região | `us-east-1` |
| Account ID | `399363133333` |
| Nome da função | `qr-magico-mux-video-audio` |
| Bucket S3 | `remotionlambda-useast1-gpi3r82b1m` |
| Role de execução | `arn:aws:iam::399363133333:role/remotion-lambda-role` |
| Handler | `index.handler` |
| Runtime | Node.js 20.x |
| Timeout | 120 s |
| Memória | 1024 MB |

## Managed vs Inline (por que o limite 2048 persiste)

No IAM, para **usuários**, o limite de **2048 caracteres (sem espaços)** vale para a **soma de todas as inline policies** do usuário.

| Tipo | Exemplos | Conta para cota 2048? |
|------|----------|------------------------|
| **Managed policy** (anexada ao usuário) | `CloudWatchLogsReadOnlyAccess`, Service Quotas | Não |
| **Inline policy** (aba Inline policies) | Policy Remotion Lambda (S3, `remotion-render-*`) | **Sim** |
| **Customer-managed policy** (criada por você) | `qr-magico-mux-lambda-access` | Não (limite 6144 por policy) |

Remover CloudWatch ou Service Quotas **não libera** cota inline — eram managed policies.

O erro abaixo aparece ao tentar **inline policy** quando a soma (Remotion + mux) passa de 2048:

> *The character limit includes the total character count of all inline policies for remotion-user.*

**Solução da mux:** usar **customer-managed policy** ([passo 4](#passo-4--policy-mux-no-remotion-user-managed)). **Não** usar "Create inline policy" no usuário.

**Importante:** o `remotion-user` precisa de **duas** permissões em paralelo:

1. Policy **Remotion** (render/S3) — inline ou managed; ver [`remotion-user-inline-policy.reference.json`](remotion-user-inline-policy.reference.json)
2. Policy **mux** — customer-managed; ver [`mux-lambda-user-policy.json`](mux-lambda-user-policy.json)

Se a policy Remotion foi removida, o render de vídeo para até restaurá-la.

### Checklist antes de aplicar a mux

IAM → Users → `remotion-user` → **Permissions**:

1. **Inline policies** — existe alguma com `remotion-render-*` / S3? (consome a cota)
2. **Permissions policies** — policy Remotion ainda anexada?
3. **Groups** — usuário em grupo com inline policy?
4. Para mux: IAM → **Policies** → Create (managed), **não** inline no usuário

Validar tamanho de um JSON localmente:

```bash
npm run iam:policy-size -- infra/aws/mux-lambda-user-policy.json
```

## Passo 1 — Gerar o zip (dev)

```bash
npm run remotion:deploy-mux:zip
```

Arquivo: `lambda/mux/mux-lambda.zip`

## Passo 2 — Criar a Lambda (admin, uma vez)

1. Lambda → **Create function** → Author from scratch
2. Function name: `qr-magico-mux-video-audio`
3. Runtime: **Node.js 20.x**, Architecture: **x86_64**
4. Execution role: **Use an existing role** → `remotion-lambda-role`
5. Configuration → Timeout **2 min**, Memory **1024 MB**
6. Code → Upload **mux-lambda.zip** | Handler: `index.handler`

CLI (admin):

```bash
aws lambda create-function \
  --function-name qr-magico-mux-video-audio \
  --runtime nodejs20.x \
  --handler index.handler \
  --role arn:aws:iam::399363133333:role/remotion-lambda-role \
  --timeout 120 \
  --memory-size 1024 \
  --zip-file fileb://lambda/mux/mux-lambda.zip \
  --region us-east-1
```

## Passo 3 — Permissões da role de execução

A role `remotion-lambda-role` precisa de S3 no bucket de renders (geralmente já existe):

- `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` em `arn:aws:s3:::remotionlambda-useast1-gpi3r82b1m` e `/*`

## Passo 4 — Policy mux no remotion-user (managed)

1. IAM → **Policies** → **Create policy**
2. Aba **JSON** → cole [`mux-lambda-user-policy.json`](mux-lambda-user-policy.json) ou a versão mínima [`mux-lambda-user-policy.min.json`](mux-lambda-user-policy.min.json)
3. **Next** → Nome: `qr-magico-mux-lambda-access` → **Create policy**
4. IAM → **Users** → `remotion-user` → **Add permissions** → **Attach policies directly**
5. Selecione `qr-magico-mux-lambda-access` → **Add permissions**

### Restaurar policy Remotion (se removida)

1. IAM → **Policies** → **Create policy** → JSON
2. Cole [`remotion-user-inline-policy.reference.json`](remotion-user-inline-policy.reference.json)
3. Nome sugerido: `remotion-lambda-user-access`
4. Anexe ao `remotion-user` via **Attach policies directly**

Ou recrie a inline original do Remotion se preferir manter o padrão do `npx remotion lambda policies`.

## Passo 5 — Deploy de atualizações (dev)

```bash
npm run remotion:deploy-mux
```

Secret Supabase: `MUX_LAMBDA_FUNCTION_NAME=qr-magico-mux-video-audio`

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| Limite 2048 ao salvar inline | Cota inline do usuário esgotada | Usar **managed policy** (passo 4); não inline |
| Removeu CloudWatch mas erro continua | Managed não conta na cota inline | Ver checklist; usar managed para mux |
| `AccessDenied` CreateFunction | `remotion-user` sem criar Lambda | Admin cria função (passo 2) |
| `AccessDenied` InvokeFunction | Mux managed não anexada | Passo 4 |
| Render parou após limpar policies | Policy Remotion removida | Restaurar referência Remotion |
| Vídeo sem áudio | Mux falhou | Logs `render-complete` no Supabase |

## O que não fazer

- Não criar **segunda inline policy** só para mux neste usuário.
- Não mesclar mux na inline Remotion sem medir total ≤ 2048 (`npm run iam:policy-size`).
- Não remover policy Remotion para “liberar espaço” — mux managed convive em paralelo.
