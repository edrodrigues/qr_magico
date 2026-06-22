# Momento Mágico — Design System

> Basado no código-fonte atual. Tokens definidos em `src/index.css` via Tailwind v4 `@theme`.

---

## 1. Cores

### 1.1 Paleta Principal

| Token | Valor | Uso |
|---|---|---|
| `bg` / `background` | `#F8F7F5` | Fundo principal |
| `fg` / `on-background` / `on-surface` | `#1D1D1C` | Texto principal |
| `muted` / `on-surface-variant` | `#565655` | Texto secundário |
| `border` / `outline` / `outline-variant` | `#CFCFCD` | Bordas |
| `accent` / `primary` | `#C96442` | Coral — cor de ação principal |
| `accent-light` / `primary-container` | `#F7EAE6` | Tom claro do coral |

### 1.2 Superfícies

| Token | Valor |
|---|---|
| `surface` | `#FFFFFF` |
| `surface-bright` | `#FFFFFF` |
| `surface-dim` | `#E8E7E5` |
| `surface-container` | `#F5F4F2` |
| `surface-container-low` | `#FAF9F7` |
| `surface-container-lowest` | `#FFFFFF` |
| `surface-container-high` | `#F0EFED` |
| `surface-container-highest` | `#EBEAE8` |
| `surface-variant` | `#F0EFED` |
| `surface-tint` | `#C96442` |

### 1.3 Primary / Accent

| Token | Valor |
|---|---|
| `on-primary` | `#FFFFFF` |
| `on-primary-container` | `#4A2517` |
| `primary-fixed` | `#F7EAE6` |
| `primary-fixed-dim` | `#E8D5CC` |
| `on-primary-fixed` | `#4A2517` |
| `on-primary-fixed-variant` | `#7C4229` |
| `inverse-primary` | `#E8A08A` |

### 1.4 Secondary

| Token | Valor |
|---|---|
| `secondary` | `#6C6B69` |
| `secondary-container` | `#F7EAE6` |
| `on-secondary` | `#FFFFFF` |
| `on-secondary-container` | `#4A4A49` |
| `secondary-fixed` | `#F7EAE6` |
| `secondary-fixed-dim` | `#E8D5CC` |
| `on-secondary-fixed` | `#2C2C2B` |
| `on-secondary-fixed-variant` | `#4A4A49` |

### 1.5 Terciário

| Token | Valor |
|---|---|
| `tertiary` | `#5A5A59` |
| `tertiary-container` | `#B0B0AE` |
| `on-tertiary` | `#FFFFFF` |
| `on-tertiary-container` | `#2C2C2B` |

### 1.6 Error

| Token | Valor |
|---|---|
| `error` | `#C94444` |
| `error-container` | `#FDE8E8` |
| `on-error` | `#FFFFFF` |
| `on-error-container` | `#8C2222` |

### 1.7 Inverse

| Token | Valor |
|---|---|
| `inverse-surface` | `#2C2C2B` |
| `inverse-on-surface` | `#F0EFED` |

### 1.8 Nomes Legados

| Token | Valor |
|---|---|
| `warm-gray` | `#F2EDE9` |
| `soft-cream` | `#F8F7F5` |
| `coral-light` | `#E8A08A` |
| `coral-deep` | `#B8553A` |
| `gold-glimmer` | `#F7EAE6` |

### 1.9 Temas por Ocasião (Remotion)

| Ocasião | Primary | Secondary | Dark Start | Dark End | Light Start | Light End |
|---|---|---|---|---|---|---|
| `amor` | `#e8495e` | `#f8a5b5` | `#2a1a1a` | `#4a2424` | `#fef5f5` | `#fce8ec` |
| `aniversario` | `#e8a849` | `#f5d08a` | `#2a241a` | `#4a3a24` | `#fefaf0` | `#fcf3dc` |
| `amizade` | `#49a8e8` | `#8ac8f5` | `#1a242a` | `#243a4a` | `#f0f7fe` | `#dcecfc` |
| `gratidao` | `#49e8a8` | `#8af5c8` | `#1a2a24` | `#244a3a` | `#f0fef7` | `#d8fce8` |
| `outro` | `#8a7a6a` | `#b8a898` | `#2a2a2a` | `#4a4a4a` | `#faf8f5` | `#f5f0ea` |

---

## 2. Tipografia

### 2.1 Font Families

| Token | Família | Uso |
|---|---|---|
| `display-lg`, `headline-md`, `title-lg` | `"Newsreader", Georgia, serif` | Títulos decorativos |
| `body-lg`, `body-md`, `label-md`, `label-sm` | `"Plus Jakarta Sans", sans-serif` | Corpo, labels, botões |
| `mono` | `"JetBrains Mono", monospace` | Monoespaçada |

Importado do Google Fonts: Newsreader (300, 400, 600, 700), Plus Jakarta Sans (400, 500, 600, 700), JetBrains Mono (400, 500).

### 2.2 Escala Tipográfica

| Token | Size | Line Height | Weight | Letter-Spacing |
|---|---|---|---|---|
| `display-lg` | `48px` | `56px` | `400` | `-0.02em` |
| `display-lg-mobile` | `36px` | `44px` | `400` | — |
| `headline-md` | `32px` | `40px` | `400` | — |
| `headline-md-mobile` | `24px` | `32px` | `400` | — |
| `title-lg` | `20px` | `28px` | `500` | — |
| `body-lg` | `18px` | `28px` | `400` | — |
| `body-md` | `16px` | `24px` | `400` | — |
| `label-md` | `14px` | `20px` | `600` | `0.05em` |
| `label-sm` | `12px` | `16px` | `500` | — |

---

## 3. Espaçamento

| Token | Valor | Uso |
|---|---|---|
| `margin-desktop` | `40px` | Margem horizontal desktop |
| `margin-mobile` | `20px` | Margem horizontal mobile |
| `gutter-mobile` | `16px` | Gap entre itens mobile |
| `gutter-desktop` | `24px` | Gap entre itens desktop |
| `container-max` | `1200px` | Largura máxima do conteúdo |
| `base` | `8px` | Unidade base |

Padrões comuns: `p-8` (32px), `p-6` (24px), `gap-4` (16px), `gap-6` (24px), `py-12` (48px), `py-16` (64px), `py-20` (80px), `py-24` (96px), `py-32` (128px), `pt-24` (96px), `pt-28` (112px).

---

## 4. Border Radius

| Token | Valor | Uso |
|---|---|---|
| `default` | `0px` | — |
| `lg` | `0px` | — |
| `xl` | `0px` | — |
| `full` | `9999px` | Pills, avatares |

Raios usados em componentes (hardcoded): `rounded-full` (9999px) — botões; `rounded-2xl` (16px) — cards, modais; `rounded-xl` (12px) — inputs; `rounded-lg` (8px) — cards pequenos; `rounded-3xl` (24px) — glass cards; `rounded-[2rem]` (32px) — wizard cards; `rounded-[2.5rem]` (40px) — bento panels.

---

## 5. Sombras

| Classe / Utilitário | Valor |
|---|---|
| `shadow-sm` | Tailwind default |
| `shadow-md` | Tailwind default |
| `shadow-lg` | Tailwind default |
| `shadow-xl` | Tailwind default |
| `shadow-2xl` | Tailwind default |
| `pricing-glow` | `0 0 30px rgba(201,100,66,0.15), 0 0 60px rgba(247,234,230,0.1)` |
| `shadow-[0_10px_20px_-5px_rgba(169,53,57,0.1)]` | Card de ocasião selecionado |
| `shadow-[0_10px_25px_-5px_rgba(115,92,0,0.1)]` | Estilo musical selecionado |

---

## 6. Breakpoints

Tailwind v4 defaults, mobile-first:

| Breakpoint | Largura Mínima |
|---|---|
| `sm` | `640px` |
| `md` | `768px` |
| `lg` | `1024px` |
| `xl` | `1280px` |
| `2xl` | `1536px` |

---

## 7. Animação e Transição

### 7.1 Keyframes

| Nome | Duração | Easing |
|---|---|---|
| `floating` | `4s` | `ease-in-out infinite` |
| `pulse-glow` | `3s` | `ease-in-out infinite` |
| `shimmer-particle` | `2s` | `ease-in-out infinite` |
| `wave-animation` | `1s` | `ease-in-out infinite alternate` |
| `reveal-up` | `0.6s` | `ease-out both` |
| `gradient-shift` | `6s` | `ease infinite` |
| `slide-up` | `0.3s` | `ease-out both` |
| `pulse-dot` | `2s` | `ease-in-out infinite` |
| `skeleton-shimmer` | `1.5s` | `infinite` |
| `shimmer` | `2s` | `infinite` |

### 7.2 Transições Padrão

`transition-all duration-300` é o padrão mais comum. `duration-500` para progresso, `duration-200` para interações menores.

### 7.3 Reduced Motion

`@media (prefers-reduced-motion: reduce)` desativa `animate-floating`, `animate-gradient`, `waveform-bar`, `animate-slide-up`, `skeleton`, e `.reveal`.

---

## 8. Componentes

### 8.1 Botões

| Variante | Estilo |
|---|---|
| **Primary** | `bg-primary text-on-primary font-label-md rounded-full`, hover com `brightness-110`, active `scale-95`, disabled `opacity-50` |
| **Secondary** | `border-2 border-primary text-primary rounded-full`, hover `bg-primary/5` |
| **Ghost** | `font-label-md text-on-surface-variant`, hover `bg-primary-fixed` |
| **Danger** | `bg-error text-on-error rounded-lg` |

### 8.2 Inputs

| Elemento | Estilo |
|---|---|
| Texto | `bg-surface border-outline-variant/40 rounded-xl px-6 py-4`, focus `ring-2 ring-primary` |
| Textarea | `bg-warm-gray rounded-2xl font-body-md p-6`, focus `ring-2 ring-secondary-fixed` |
| Select | `bg-surface border rounded-lg px-4 py-2.5` |
| Checkbox | `w-5 h-5 border-2 border-outline rounded`, checked `bg-primary` |

### 8.3 Cards

| Variante | Estilo |
|---|---|
| **Glass card** | `glass-card`: `rgba(255,255,255,0.7) + backdrop-blur(12px) + border` |
| **Glass panel** | `glass-panel`: `rgba(255,252,250,0.7) + backdrop-blur(12px) + border` |
| **Gradient border** | `gradient-border-card`: pseudo-element com `linear-gradient(135deg, accent, accent-light, muted)` |
| **Surface card** | `bg-surface rounded-2xl shadow-md` |

### 8.4 Modais

| Elemento | Estilo |
|---|---|
| Overlay | `fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]` |
| Container | Bottom sheet mobile (`rounded-t-2xl`), centered desktop (`rounded-2xl shadow-2xl`) |

### 8.5 Toast

| Tipo | Estilo |
|---|---|
| Container | `fixed bottom-24 md:bottom-20 right-4 md:right-8 z-[100]` |
| Card | `animate-slide-up px-5 py-3 rounded-xl shadow-xl border backdrop-blur-md` |
| Success | `bg-green-600 text-white` |
| Error | `bg-red-600 text-white` |

### 8.6 Badges / Chips

| Estado | Estilo |
|---|---|
| Pronto | `bg-secondary-container text-on-secondary-container rounded-full px-3 py-1 font-label-sm` |
| Gerando | `bg-gold-glimmer text-secondary rounded-full` |
| Falhou | `bg-error-container text-on-error-container rounded-full` |
| Rascunho | `bg-warm-gray text-on-surface-variant rounded-full` |

### 8.7 Skeleton

`linear-gradient(90deg, surface-container-high 25%, surface-bright 50%, surface-container-high 75%)` com `background-size: 200% 100%` e `animation: skeleton-shimmer 1.5s infinite`.

### 8.8 Progress Bar

Track: `h-1.5 bg-surface-container rounded-full`. Fill: `bg-primary rounded-full transition-all duration-500`. Variante com gradiente: `linear-gradient(90deg, accent, accent-light)`.

---

## 9. Ícones

**Material Symbols Outlined** — variável weight 100-700, fill 0-1.

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

Uso: `<span className="material-symbols-outlined">icon_name</span>`. Fill ativo com `style={{ fontVariationSettings: "'FILL' 1" }}`.

Ícones comuns: `auto_awesome`, `favorite`, `calendar_month`, `photo_library`, `music_note`, `play_arrow`, `pause`, `arrow_forward`, `arrow_back`, `check_circle`, `check`, `close`, `menu`, `share`, `content_copy`, `download`, `picture_as_pdf`, `refresh`, `volume_off`, `volume_up`, `qr_code`, `qr_code_2`, `credit_card`, `shopping_cart`, `error`, `delete`, `edit`, `edit_note`, `add_photo_alternate`, `link`, `celebration`, `cake`, `group`, `auto_stories`, `spark`, `magic_button`, `piano`, `headphones`, `self_improvement`.

---

## 10. Utilitários Customizados

| Utilitário | CSS |
|---|---|
| `glass-card` | `background: rgba(255,255,255,0.7); backdrop-filter: blur(12px);` |
| `glass-panel` | `background: rgba(255,252,250,0.7); backdrop-filter: blur(12px);` |
| `pricing-glow` | `box-shadow: 0 0 30px rgba(201,100,66,0.15), 0 0 60px rgba(247,234,230,0.1)` |
| `gradient-border-card` | Pseudo-element com 1px borda gradiente |
| `snap-y-mandatory` | `scroll-snap-type: y mandatory` |
| `carousel-snap` | `scroll-snap-type: x mandatory` |
| `content-visibility-auto` | `content-visibility: auto; contain-intrinsic-size: 500px` |
| `skeleton` | Linear-gradient shimmer |
| `progress-bar` | `h-4px rounded-full bg-surface-variant overflow-hidden` |

---

> Fonte: `src/index.css`, componentes em `src/components/`, `src/remotion/theme.ts`, `src/lib/genrePalettes.ts`.
