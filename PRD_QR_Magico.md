# PRD: QR Mágico

## 1. Visão Geral

Plataforma web para criação de presentes digitais personalizados com retrospectiva animada + trilha sonora única gerada por IA, para **qualquer data comemorativa**. O presente é entregue via link único e QR Code enviados por email.

**Motto:** *"Um presente que emociona, pronto em 5 minutos."*

---

## 2. Problema

Presentes físicos são genéricos, impessoais e exigem deslocamento/logística. Não existe um produto simples, rápido e acessível que una retrospectiva visual animada + música original gerada por IA para qualquer ocasião (aniversário, Dia das Mães, Dia dos Namorados, formatura, amizade, etc.).

---

## 3. Solução

Uma aplicação web onde o usuário:

1. Passa por um **wizard** preenchendo dados sobre a ocasião, a relação e as pessoas envolvidas
2. Faz **upload de até 6 fotos**
3. Escolhe **estilo musical e descreve a relação** → IA gera uma música original
4. **Paga** (valor único) e **recebe no email**: link da retrospectiva + QR Code + PDF com cartão estilizado para imprimir
5. A pessoa presenteada **acessa o link** e vê a retrospectiva animada com a trilha sonora única em background
6. Caso o **pagamento não seja realizado**, o comprador recebe **lembretes por email**

---

## 4. Público-Alvo

- Brasileiros de 18-50 anos
- Buscam presentes emocionais e personalizados sem sair de casa
- Ocasiões: Dia dos Namorados, Dia das Mães, aniversários, formaturas, Dia da Amizade, Natal, etc.

---

## 5. Diferenciais Competitivos

| Característica | Lovepanda | QR Mágico |
|---|---|---|
| Ocasiões | Foco em casais / Dia dos Namorados | Qualquer data comemorativa |
| Trilha sonora | Música escolhida pelo usuário | **Gerada por IA** (única para a pessoa) |
| Cartão físico | Apenas link + QR | Link + QR + **PDF para imprimir** |
| Modelo de dados | Provavelmente NoSQL | **PostgreSQL (Supabase)** |

---

## 6. Stack Tecnológica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | **Next.js** (React, TypeScript) | SSR, SEO, performance, pages dinâmicas |
| Backend | Next.js API Routes / Supabase Edge Functions | Serverless, mesmo repositório |
| Banco de Dados | **Supabase (PostgreSQL)** | Modelagem relacional, open source, sem lock-in, auth + storage integrados |
| Autenticação | Supabase Auth | Nativo do ecossistema |
| Storage | Supabase Storage | Upload e entrega de fotos |
| Geração de Música | **ElevenLabs Music API** | Licença comercial limpa, SDK oficial JS/TS, treinada em dados licenciados |
| Pagamento | **Em aberto** (recomendação: Mercado Pago) | Pix nativo, maior adoção no Brasil |
| Envio de Email | Resend ou Nodemailer + SMTP | Link, QR Code e PDF do cartão |
| Geração de QR Code | `qrcode` (npm) | Server-side |
| Geração de PDF | `@react-pdf/renderer` | Cartão estilizado para impressão |

---

## 7. Modelo de Dados

```sql
-- Usuários gerenciados pelo Supabase Auth (auth.users)

CREATE TABLE public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.presentes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL REFERENCES public.usuarios(id),
  nome_homenageado  TEXT NOT NULL,
  ocasiao           TEXT NOT NULL CHECK (ocasiao IN (
    'aniversario', 'dia_das_maes', 'dia_dos_namorados',
    'formatura', 'amizade', 'natal', 'outro'
  )),
  descricao_relacao   TEXT NOT NULL,
  estilo_musical      TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'cancelled')),
  slug                TEXT NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ DEFAULT now(),
  expires_at          TIMESTAMPTZ -- NULL = indefinido
);

CREATE TABLE public.fotos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id  UUID NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  ordem        INT NOT NULL
);

CREATE TABLE public.musicas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id  UUID NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
  url_audio    TEXT,
  prompt       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'ready', 'failed')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.pagamentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id  UUID NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
  gateway      TEXT NOT NULL,
  gateway_id   TEXT,
  valor        DECIMAL(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'refused', 'cancelled')),
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Fluxo do Usuário

```
Home → Wizard (6 etapas) → Pagamento → Geração IA (música + página) →
   ┌─ Email comprador: confirmação + link p/ editar presente
   └─ Email presenteado: link + QR Code + PDF cartão
```

### 8.1 Wizard (etapas)

| Etapa | Conteúdo |
|---|---|
| 1. Ocasião | Selecionar data comemorativa + nome do homenageado |
| 2. Relação | Descrever a relação em texto livre (ex: "minha mãe sempre me apoiou, adora praia e café") |
| 3. Estilo musical | Escolher gênero/emoção (alegre, emotivo, clássico, pop, MPB, rock, eletrônica) |
| 4. Fotos | Upload de até 6 fotos com preview e reordenação |
| 5. Revisão | Prévia completa do presente antes de pagar |
| 6. Pagamento | Redirecionamento ao gateway (Pix/cartão) |

### 8.2 Pós-pagamento (processamento assíncrono)

1. Geração da música via ElevenLabs API (job polling)
2. Geração da página de retrospectiva (Next.js SSG com fallback ISR)
3. Geração do QR Code (link único)
4. Geração do PDF do cartão estilizado
5. Envio dos 2 emails:
   - **Comprador:** confirmação com link para editar/gerenciar
   - **Presenteado:** link da retrospectiva + QR Code + PDF anexado

### 8.3 Lembretes de pagamento

- 24h sem pagamento → email de lembrete
- 72h sem pagamento → re-lembrete
- 7 dias sem pagamento → presente expirado / cancelado

---

## 9. Tela da Retrospectiva (Página do Presente)

- Acessível via `qrmagico.com/p/abc123`
- Animação estilo "Spotify Wrapped": fotos em transição suave, linha do tempo, texto emocionante
- Música gerada por IA tocando em background (autoplay com controle pelo usuário)
- Responsiva com prioridade mobile-first
- Botões: compartilhar (WhatsApp, Instagram) e ver QR Code
- Sem senha — o link único é a proteção
- Indisponível apenas se o usuário excluir a conta

---

## 10. Monetização

- Pagamento **único por presente** (sem assinatura)
- Faixa de preço sugerida: **R$ 19,90 a R$ 39,90**
- Custo estimado por presente:
  - ElevenLabs: ~$0.80/min ≈ R$ 4-5
  - Supabase: armazenamento + banda ≈ R$ 0,50-1,00
  - Gateway: ~4-5% ≈ R$ 0,80-2,00
- **Margem estimada: 60-75%**

---

## 11. Cronograma Estimado

| Fase | Duração | Entregas |
|---|---|---|
| Setup | 1 semana | Projeto Next.js, Supabase (banco + auth + storage), CI/CD |
| Wizard + Upload | 1 semana | Formulário multi-etapas, upload e reordenação de fotos |
| Pagamento | 1 semana | Integração com gateway, webhooks, lembretes |
| Música IA | 1 semana | Integração ElevenLabs API, job queue, fallback |
| Retrospectiva | 2 semanas | Página animada do presente + player de música |
| Email + QR + PDF | 1 semana | Templates de email, geração QR, PDF cartão |
| Lembretes | 3 dias | Job de cobrança recorrente |
| Testes + Deploy | 4 dias | QA, ajustes, homologação, produção |
| **Total** | **~8 semanas** | |

---

## 12. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| ElevenLabs API indisponível | Baixa | Alto | Fallback para Mubert ou playlist genérica |
| Qualidade da música abaixo do esperado | Média | Médio | Oferecer regeração; permitir escolher outra música |
| Gateway rejeitar Pix | Baixa | Médio | Aceitar cartão também; múltiplos gateways |
| Abandono no checkout | Alta | Alto | Lembretes por email; salvar estado do wizard |
| Performance da retrospectiva (animação pesada) | Média | Médio | Animações CSS/GSAP leves, lazy loading |
| Privacidade (fotos e dados expostos) | Baixa | Alto | Links criptografados (slug UUID), sem indexação, HTTPS |
| Custo ElevenLabs escalar mal | Média | Médio | Negociar enterprise; limitar duração (30-60s) |

---

## 13. Métricas de Sucesso (OKRs)

| Objetivo | Key Result |
|---|---|
| Aquisição | 1.000 presentes criados no primeiro mês |
| Conversão | ≥ 15% de taxa de conversão (wizard → pagamento) |
| Qualidade | ≥ 4.5/5 de avaliação da música gerada |
| Engajamento | ≥ 70% dos presentes acessados em até 7 dias |
| Receita | R$ 30.000/mês até o mês 6 |

---

## 14. Próximos Passos

1. Validar gateway de pagamento (decisão Mercado Pago vs Stripe vs Asaas)
2. Criar repositório e configurar ambiente de desenvolvimento
3. Prototipar wizard no Figma
4. Implementar setup inicial (Next.js + Supabase)
5. Desenvolver wizard e fluxo de criação
6. Integrar ElevenLabs e gerar primeira música
7. Construir página de retrospectiva
8. Integrar gateway de pagamento
9. Testes e deploy
