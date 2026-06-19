# Plano de Integracao Remotion + Lambda

## Visao Geral

**Estado atual:** `/p/{slug}` renderiza slides interativos com Framer Motion. 7 slides (cover, occasion, story, gallery, music-style, music-reveal, share) navegados por tap/drag.

**Objetivo:** Gerar um MP4 de verdade via Remotion Lambda e reproduzi-lo na pagina publica, com o slideshow interativo mantido como alternativa ("Ver Historia").

---

## Fase 1: Setup AWS + Remotion Lambda (unico)

| Passo | Acao | Status |
|---|---|---|
| 1.1 | Criar conta AWS (se nao existir) | [ ] Manual — criar conta AWS |
| 1.2 | Instalar `@remotion/lambda` e `remotion` no projeto | [x] OK (v4.0.481) |
| 1.3 | Configurar credenciais AWS (IAM user com permissoes Lambda + S3) | [~] Placeholders em .env.local |
| 1.4 | `npx remotion lambda deploy` — cria Lambda function + layer Chromium + S3 bucket | [ ] Manual — requer AWS creds |
| 1.5 | `npx remotion lambda sites create ./src/remotion` — deploy do bundle das composicoes | [ ] Manual — requer AWS creds |

---

## Fase 2: Database

| Passo | Acao | Status |
|---|---|---|
| 2.1 | Migration `00012_add_video_url.sql`: `ALTER TABLE presentes ADD COLUMN video_url TEXT;` | [x] OK |
| 2.2 | Atualizar tipos em `src/types/retro.ts`: adicionar `video_url?: string` em `PresenteData` | [x] OK |

---

## Fase 3: Remotion Compositions

Diretorio novo: `src/remotion/` — separado do codigo atual para poder ser bundled pelo Remotion.

**Status: [x] COMPLETO** — todos os arquivos criados.

### Estrutura

```
src/remotion/
├── Root.tsx                    # Registra a composicao principal  [x]
├── remotion.config.ts          # Config (30fps, 1080x1920)        [x]
├── RetrospectivaComposition.tsx  # Composition principal (wrapper) [x]
├── slides/
│   ├── Cover.tsx               # "Uma surpresa para [nome]" + blob background [x]
│   ├── Occasion.tsx            # Ocasião + contador de dias + nome remetente [x]
│   ├── Story.tsx               # Texto da descricao com fade-in [x]
│   ├── Gallery.tsx             # Fotos com crossfade + Ken Burns [x]
│   ├── MusicStyle.tsx          # Estilo musical + barras equalizador [x]
│   ├── Credits.tsx             # "Feito com Momento Magico" + CTA [x]
│   └── LogoEnd.tsx             # Logo Momento Magico centralizada, fundo escuro [x]
└── assets/
    └── fonts.css               # Hanken Grotesk + Literata [x]
```

### Timing (47s, 1410 frames a 30fps)

| Slide | Duracao | Frames | Conteudo |
|---|---|---|---|
| Cover | 5s | 150 | "Uma surpresa para [nome]" + blob animado |
| Occasion | 5s | 150 | Ocasião + contador de dias + nome remetente |
| Story | 8s | 240 | Texto da relação com fade-in por parágrafo |
| Gallery | 18s | 540 | Até 6 fotos, 3s cada, crossfade + Ken Burns |
| MusicStyle | 4s | 120 | Estilo musical + barras equalizador animadas |
| Credits/CTA | 4s | 120 | "Feito com Momento Mágico" + CTA "Crie o seu" |
| Logo final | 3s | 90 | Logo Momento Mágico centralizada, fundo escuro |

Cada slide usa `interpolate()`, `spring()`, `useCurrentFrame()` e `<Sequence>` para timing deterministico.

---

## Fase 4: Pipeline de Renderizacao

```
Pagamento
  -> status = "generating"
  -> generate-music (Edge Function existente)
       |
       v  (musica.status = "ready")
       |
  -> render-video (NOVA Edge Function)
       -> chama renderMediaOnLambda() da AWS
            inputProps inclui: { ..., musicaUrl, fotos[] }
       -> Lambda paraleliza em ~47 renderers (47s / 1s por chunk)
       -> cada renderer processa ~30 frames
       -> main function concatena chunks + insere audio
       -> MP4 final no S3
       -> presentes.video_url = url do S3
       -> presentes.status = "ready"
       |
       v
  Dashboard: video pronto para visualizar/baixar
  /p/{slug}: video player carrega e reproduz
```

### Pipeline de Audio no Video

O audio do ElevenLabs e passado como input prop para a composicao Remotion como `musicaUrl`. Dentro do componente, `<Audio src={musicaUrl} />` faz parte da composition e e mixado no MP4 final pelo FFmpeg.

---

## Fase 4: Pipeline de Renderizacao

**Status: [x] Edge Function `render-video` criada em `supabase/functions/render-video/index.ts`**

A funcao:
- Valida autenticacao
- Busca dados do presente + fotos + musica
- Chama `renderMediaOnLambda()` da AWS via `@remotion/lambda/client`
- Atualiza `presentes.video_url` com o caminho S3
- Marca como `failed` em caso de erro

---

## Fase 5: Video Player na Pagina Publica

**Status: [x] COMPLETO** — `VideoPlayer.tsx` criado em `src/components/`.

### Experiencia

```
1. Abre a pagina -> mostra poster (thumbnail) com botao "Assistir"
2. Toca no botao -> video reproduz em fullscreen com musica de fundo
   - Autoplay com muted inicial (politica do browser)
   - Unmute na primeira interacao (tap)
   - Controles: play/pause, progress bar, mute, fullscreen
3. Video termina -> overlay:
   - "Assistir Novamente"
   - "Compartilhar" (WhatsApp, link, copiar)
   - "Ver História" (abre slideshow interativo antigo como alternativa)
4. Botao "Ver História" -> StoryViewer original (Framer Motion)
```

### Fluxo de Coexistencia

```
/p/{slug}
  |
  ├── presentes.video_url existe?
  |     SIM -> VideoPlayer (experiencia principal) [x]
  |              |
  |              +-- "Ver História" -> StoryViewer (slideshow interativo) [x]
  |
  |     NAO -> StoryViewer (fallback para presentes antigos sem video) [x]
```

### Componentes

**`VideoPlayer.tsx`** (novo em `src/components/`):

| Funcionalidade | Implementacao |
|---|---|
| Player principal | HTML5 `<video>` com `playsInline`, `preload="auto"` |
| Autoplay + muted | Comeca muted, botao de unmute na primeira interacao |
| Controles | Play/pause, progress bar, mute, fullscreen |
| Cover / Poster | `thumbnail_url` do presente como poster |
| Apos video terminar | Overlay com "Assistir Novamente" + "Compartilhar" + "Ver História" |
| Background | Blur da thumbnail |
| Loading state | Spinner enquanto video carrega |

---

## Fase 6: Dashboard

| Mudanca | Detalhe | Status |
|---|---|---|
| Botao de download | Em gifts `ready` com `video_url`, botao "Baixar Video" (link direto pro S3) | [x] OK |
| Status display | Status continua "Pronto" | [x] Inalterado |
| Polling | Manter polling de 15s, agora aguardando `video_url` nao-nulo | [x] OK |

---

## Fase 7: Componentes Legacy

Os componentes de slideshow em `src/components/retro/` (11 arquivos + `StoryViewer` + `StoryViewerContext`) sao mantidos como fallback. Presentes antigos sem `video_url` continuam funcionando com o slideshow interativo.

**Status: [x] Inalterado — mantido como fallback.**

---

## Estrutura Final de Diretorios

```
qr_magico/
├── src/
│   ├── remotion/                        # NOVO
│   │   ├── Root.tsx
│   │   ├── remotion.config.ts
│   │   ├── RetrospectivaComposition.tsx
│   │   └── slides/
│   │       ├── Cover.tsx
│   │       ├── Occasion.tsx
│   │       ├── Story.tsx
│   │       ├── Gallery.tsx
│   │       ├── MusicStyle.tsx
│   │       ├── Credits.tsx
│   │       └── LogoEnd.tsx
│   │
│   ├── components/
│   │   ├── VideoPlayer.tsx               # NOVO
│   │   └── retro/                        # INALTERADO (fallback)
│   │
│   ├── pages/
│   │   └── RetrospectivaPage.tsx         # MODIFICADO
│   │
│   └── types/
│       └── retro.ts                      # MODIFICADO (+ video_url)
│
├── supabase/
│   ├── migrations/
│   │   └── 00012_add_video_url.sql       # NOVO
│   └── functions/
│       └── render-video/                 # NOVO
│           └── index.ts
│
├── package.json                          # MODIFICADO (+ remotion, @remotion/lambda)
└── .env.local                            # MODIFICADO (+ AWS creds)
```

---

## Dependencias

```bash
npm install remotion @remotion/lambda @remotion/bundler @remotion/renderer --save-exact
```

Todas na mesma versao (ex: `4.0.473`).

---

## Setup AWS (unico)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar credenciais AWS (via .env.local ou AWS CLI)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# 3. Deploy da Lambda function + S3 bucket
npx remotion lambda deploy

# 4. Deploy das composicoes como site
npx remotion lambda sites create ./src/remotion

# 5. Salvar serveUrl e functionName no .env.local
REMOTION_SERVE_URL=sites://bucket-name/...
REMOTION_FUNCTION_NAME=remotion-render-4-0-473
REMOTION_BUCKET_NAME=remotion-bucket-name
```

---

## Custos Operacionais (por presente)

| Componente | Custo |
|---|---|
| ElevenLabs Music (60s) | $0.04 |
| Remotion Lambda (47s, ~47 renderers) | ~$0.05-0.08 |
| S3 storage + transfer | ~$0.01 |
| **Total por presente** | **~$0.10-0.13** |

---

## Ordem de Implementacao

1. [x] Setup AWS + dependencias Remotion
2. [x] Migration do banco (`video_url`)
3. [x] Composicoes Remotion (7 slides em `src/remotion/`)
4. [x] Edge Function `render-video`
5. [x] Componente `VideoPlayer`
6. [x] Modificacao da `RetrospectivaPage` (coexistencia video + slideshow)
7. [x] Modificacao do `WizardPagamento` (trigger automatico de renderizacao)
8. [x] Modificacao do `Dashboard` (botao download + polling)
