# PRD: Momento Mágico

## 1. Visão Geral

Plataforma web para criação de presentes digitais personalizados com **vídeo de retrospectiva animada** + trilha sonora única gerada por IA, para qualquer data comemorativa. O presente é entregue via link único e QR Code. O vídeo é gerado programaticamente via **Remotion on AWS Lambda**.

**Motto:** *"Um presente que emociona, pronto em 5 minutos."*

---

## 2. Problema

Presentes físicos são genéricos, impessoais e exigem deslocamento/logística. Não existe um produto simples, rápido e acessível que una vídeo retrospectiva animado + música original gerada por IA para qualquer ocasião (aniversário, Dia das Mães, Dia dos Namorados, formatura, amizade, etc.).

---

## 3. Solução

Aplicação web SPA onde o usuário:

1. Cria conta (email/senha ou Google OAuth)
2. Passa por um **wizard** de 7 etapas preenchendo dados sobre a ocasião, relação, sentimentos, estilo musical
3. Faz **upload de até 6 fotos**
4. **Revisa** o presente antes de pagar
5. **Paga** (ou usa crédito de cupom) e o processamento assíncrono inicia:
   - Geração de música via ElevenLabs
   - Renderização de vídeo (47s) via Remotion Lambda
6. **Recebe o link** da retrospectiva na tela de compartilhamento (QR Code + link)
7. A pessoa presenteada **acessa o link** e vê o vídeo + apresentação interativa com a trilha sonora em background

---

## 4. Público-Alvo

- Brasileiros de 18-50 anos
- Buscam presentes emocionais e personalizados sem sair de casa
- Ocasiões: aniversário, amor, amizade, gratidão, Dia das Mães, Dia dos Namorados, formatura, etc.

---

## 5. Diferenciais Competitivos

| Característica | Lovepanda | Momento Mágico |
|---|---|---|
| Ocasiões | Foco em casais / Dia dos Namorados | Qualquer data comemorativa |
| Formato | Página web animada | **Vídeo cinematográfico (47s)** + página interativa |
| Trilha sonora | Música escolhida pelo usuário | **Gerada por IA** (única para a pessoa) |
| Cartão para imprimir | Apenas link + QR | Link + QR + **PDF para imprimir** |
| Processamento | Síncrono | Assíncrono (vídeo renderizado em background) |
| Modelo de dados | Provavelmente NoSQL | **PostgreSQL (Supabase)** |

---

## 6. Stack Tecnológica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | **Vite + React 19 + TypeScript** | Build rápido, SPA moderna |
| Roteamento | React Router DOM 7 | Navegação SPA |
| Estilização | **Tailwind CSS 4** | Utility-first, design system consistente |
| Animações | Framer Motion 12 | Transições de slides e micro-interações |
| Gestos | @use-gesture/react | Navegação por toque/clique no StoryViewer |
| Backend | **Supabase Edge Functions** (Deno/TypeScript) | Serverless, mesmo ecossistema do banco |
| Banco de Dados | **Supabase (PostgreSQL)** | Modelagem relacional, auth + storage integrados |
| Autenticação | Supabase Auth (email/senha + Google OAuth) | Nativo do ecossistema |
| Storage | Supabase Storage | Upload de fotos e armazenamento de áudio |
| Geração de Música | **ElevenLabs Music API** | Licença comercial limpa, SDK oficial JS/TS |
| Geração de Vídeo | **Remotion 4.0.481 on AWS Lambda** | Vídeo programático 1080p, 30fps, 47s |
| Infraestrutura AWS | S3 + Lambda (Remotion) | Renderização serverless escalável |
| Pagamento | **Em aberto** (recomendação: Mercado Pago) | Pix nativo, maior adoção no Brasil |
| Envio de Email | **Não implementado** (pendente) | |
| Geração de QR Code | `qrcode` (npm) | Client-side |
| Geração de PDF | `jspdf` | Cartão estilizado para impressão |
| Áudio/Waveform | wavesurfer.js | Visualização de áudio na retrospectiva |
| Confetes | canvas-confetti | Efeito celebratório ao gerar presente |
| SEO | react-helmet-async | Meta tags por rota |
| Deploy | **Vercel** | Hosting SPA |

---

## 7. Modelo de Dados (Implementado)

- Usuários gerenciados pelo Supabase Auth (`auth.users`), sem tabela `usuarios` própria
- Tabela `app_secrets` para chaves criptografadas (acesso service_role apenas)

### `public.presentes` — Presentes

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `usuario_id` | UUID FK | `REFERENCES auth.users(id)` |
| `nome_homenageado` | TEXT | Nome da pessoa presenteada |
| `nome_remetente` | TEXT | Nome de quem está presenteando |
| `ocasiao` | TEXT | Ocasião (aniversario, amor, amizade, gratidao, outro) |
| `descricao_relacao` | TEXT | Descrição livre da relação |
| `estilo_musical` | TEXT | Gênero/emoção musical |
| `data_inicio` | TEXT | Data de início do relacionamento |
| `data_ocasiao` | TEXT | Data da ocasião |
| `status` | TEXT | `draft`, `pending_payment`, `generating`, `ready`, `cancelled`, `failed` |
| `slug` | TEXT UNIQUE | Slug único para acesso público |
| `link` | TEXT | Link gerado |
| `thumbnail_url` | TEXT | URL do thumbnail do vídeo |
| `video_url` | TEXT | URL do vídeo renderizado |
| `render_request_id` | TEXT | ID do pedido de renderização Remotion |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Auto-atualizado via trigger |
| `expires_at` | TIMESTAMPTZ | Opcional |

RLS: Usuários podem CRUD próprios;任何人 pode SELECT com `status = 'ready'`.

### `public.fotos` — Fotos

| Coluna | Tipo |
|---|---|
| `id` | UUID PK |
| `presente_id` | UUID FK (CASCADE) |
| `url` | TEXT |
| `ordem` | INT |
| `created_at` | TIMESTAMPTZ |

RLS: Leitura para todos (presentes ready); CRUD para dono.

### `public.musicas` — Músicas geradas por IA

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `presente_id` | UUID FK UNIQUE | 1:1 com presentes |
| `url_audio` | TEXT | URL pública no Storage |
| `estilo` | TEXT | Estilo musical |
| `lyrics` | JSONB | Letras com timestamps `[{time, text}]` |
| `status` | TEXT | `generating`, `ready`, `failed` |
| `attempts` | INT | Tentativas de geração |
| `last_attempt_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

### Cupons

- `public.cupons` (`id`, `codigo` UNIQUE, `uso_maximo`, `criado_em`)
- `public.cupons_uso` (`id`, `cupom_id` FK, `usuario_id` FK, `usado_em`, UNIQUE `(cupom_id, usuario_id)`)
- Função `resgatar_cupom(codigo_cupom TEXT)` retorna JSONB

### Storage Buckets

- `fotos` (público) — Upload de fotos
- `musicas` (público) — Áudio gerado

### Funções

- `reset_stale_generations(max_age_minutes)` — Reseta gerações de música travadas
- `resgatar_cupom(codigo_cupom TEXT)` — Resgata cupom
- `admin_list_users()` — Lista auth.users para admin

---

## 8. Fluxo do Usuário

```
Home → Auth (cadastro/login) → Wizard (7 etapas) → Pagamento → Processamento assíncrono → Tela de compartilhamento
```

### 8.1 Wizard (7 etapas)

| Etapa | Rota | Conteúdo |
|---|---|---|
| 1. Ocasião + Nome | `/wizard/ocasiao-nome` | Selecionar ocasião + nome do homenageado + nome do remetente |
| 2. Data + Relação | `/wizard/data-relacao` | Datas (início e ocasião) + descrição da relação |
| 3. Relação + Sentimento | `/wizard/relacao-sentimento` | Sentimentos/emoções sobre a relação |
| 4. Estilo Musical | `/wizard/estilo-musical` | Escolher gênero/emoção musical |
| 5. Upload de Fotos | `/wizard/upload-fotos` | Upload de até 6 fotos com preview |
| 6. Revisão Final | `/wizard/revisao-final` | Prévia completa antes de pagar |
| 7. Pagamento | `/wizard/pagamento` | Pagamento via Pix/cartão **ou** resgate de cupom de crédito |

O wizard salva **rascunhos** (`status = draft`) no Supabase conforme o usuário avança.

### 8.2 Pós-pagamento (processamento assíncrono)

1. `status` atualizado para `generating`
2. Edge Function **`generate-music`**: chama ElevenLabs Music API, faz polling até conclusão, salva áudio no Storage e registros em `musicas`
3. Edge Function **`render-video`**: aguarda música ficar pronta (até 60s), invoca Remotion Lambda com todos os dados (fotos, texto, música)
4. Remotion Lambda renderiza vídeo de 47s (7 slides) e salva no S3
5. Webhook **`render-complete`**: atualiza `presentes.video_url` e `presentes.status = 'ready'`
6. Usuário vê tela de compartilhamento com link, QR Code e opção de gerar PDF

### 8.3 Tela de Compartilhamento

- Link único: `qrmagico.com/p/{slug}`
- QR Code para download/impressão
- Botão de gerar PDF do cartão
- Botão de download do vídeo (via presigned URL)
- Efeito de confete ao concluir

---

## 9. Página Pública da Retrospectiva

- Acessível via `qrmagico.com/p/{slug}`
- 2 modos:
  - **Vídeo pronto**: exibe `VideoPlayer` com o vídeo Remotion renderizado
  - **Processando**: mostra `StoryViewer` — apresentação interativa com slides (Cover, Occasion, Story, Gallery, MusicStyle, MusicReveal, Share) com música tocando em background
- StoryViewer: navegação por toque/clique/teclado, auto-advance, barra de progresso, pausa ao interagir
- Autoplay de música com controle pelo usuário (wavesurfer.js)
- Responsivo mobile-first
- Botões: compartilhar (WhatsApp), ver QR Code, download
- Sem senha — o link único (slug UUID) é a proteção

---

## 10. Vídeo Remotion (47s)

- Resolução: 1920x1080, 30fps, 1410 frames
- Codec: H.264, YUV420P, JPEG
- 7 slides sequenciados:

| Slide | Duração | Conteúdo |
|---|---|---|
| Cover | 5s | Nome do homenageado + ocasião |
| Occasion | 5s | Datas e ocasião |
| Story | 8s | Descrição da relação com animação |
| Gallery | 18s | Fotos em transição |
| MusicStyle | 4s | Estilo musical escolhido |
| Credits | 4s | Créditos e agradecimento |
| Logo End | 3s | Logo Momento Mágico |

---

## 11. Administração

- Rota `/admin` protegida por `AdminRoute`
- Abas:
  - **Usuários**: lista de auth.users (email, data de criação, último login)
  - **Cupons**: gerenciar códigos de cupom e limites de uso

---

## 12. Monetização

- Pagamento **único por presente** (sem assinatura)
- Faixa de preço sugerida: **R$ 19,90 a R$ 39,90**
- Cupons de crédito gratuito para teste/parcerias
- Custo estimado por presente:
  - ElevenLabs: ~$0.80/min ≈ R$ 4-5
  - Remotion Lambda (AWS): ~$0.10-0.30 por renderização
  - Supabase: armazenamento + banda ≈ R$ 0,50-1,00
  - Gateway: ~4-5% ≈ R$ 0,80-2,00
- **Margem estimada: 55-75%**

---

## 13. Edge Functions (Supabase)

| Função | Descrição | JWT |
|---|---|---|
| `generate-music` | Gera música via ElevenLabs, salva no Storage | Desabilitado |
| `render-video` | Invoca Remotion Lambda com dados do presente | Desabilitado |
| `render-complete` | Webhook de conclusão da renderização | Desabilitado |
| `proxy-video` | Gera presigned URL S3 para o vídeo (1h) | Desabilitado |
| `get-download-url` | Gera URL de download autenticada | Desabilitado |

---

## 14. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| ElevenLabs API indisponível | Baixa | Alto | Retry com backoff; fallback para Mubert |
| Qualidade da música abaixo do esperado | Média | Médio | Oferecer regeração (campo `attempts`) |
| Remotion Lambda falhar | Média | Alto | Logs detalhados; `render_request_id` para debug |
| Gateway de pagamento não implementado | Alta | Alto | MVP usa cupons de crédito; integrar gateway em v2 |
| Abandono no wizard | Alta | Alto | Salvamento automático de rascunhos; retomada via `draftId` |
| Performance da retrospectiva (animações pesadas) | Média | Médio | Framer Motion + CSS, lazy loading |
| Privacidade (fotos expostas) | Baixa | Alto | Links com slug UUID, sem indexação, HTTPS |
| Custo ElevenLabs escalar mal | Média | Médio | Negociar enterprise; limite de 30-60s de música |

---

## 15. Métricas de Sucesso (OKRs)

| Objetivo | Key Result |
|---|---|
| Aquisição | 1.000 presentes criados no primeiro mês |
| Conversão | ≥ 15% de taxa de conversão (wizard → pagamento) |
| Qualidade | ≥ 4.5/5 de avaliação da música gerada |
| Engajamento | ≥ 70% dos presentes acessados em até 7 dias |
| Receita | R$ 30.000/mês até o mês 6 |

---

## 16. Status do Projeto e Próximos Passos

### Implementado ✅
- [x] Setup do projeto (Vite + React + TypeScript + Tailwind)
- [x] Supabase: banco, auth, storage, RLS, migrations
- [x] Autenticação (email/senha + Google OAuth)
- [x] Wizard completo de 7 etapas com salvamento de rascunho
- [x] Upload de fotos com preview
- [x] Geração de música via ElevenLabs (Edge Function)
- [x] Renderização de vídeo via Remotion Lambda
- [x] Webhook de conclusão de renderização
- [x] Página pública da retrospectiva (vídeo + StoryViewer interativo)
- [x] Tela de compartilhamento com QR Code e PDF
- [x] Dashboard do usuário (lista de presentes)
- [x] Painel admin (usuários + cupons)
- [x] Sistema de cupons de crédito
- [x] Animated blob background
- [x] Video player com presigned URL
- [x] Remoção de fundo de fotos

### Pendente 🔲
- [ ] Integração com gateway de pagamento (Mercado Pago recomendado)
- [ ] Envio de email (confirmação, link, lembretes)
- [ ] Lembretes automáticos para carrinhos abandonados
- [ ] Página de edição do presente pós-pagamento
- [ ] Testes automatizados
- [ ] Landing page com SEO
- [ ] Suporte a mais ocasiões e estilos musicais
- [ ] App Android/iOS (PWA ou nativo)
