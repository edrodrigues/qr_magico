# Plano: Remoção de Contadores, Transições e Título

## Objetivo

1. Remover contador "1/N" do slideshow Gallery
2. Remover contador de dias da cena Occasion
3. Substituir transições brancas por fade in / fade out
4. Remover título "A História de Vocês" da cena Story
5. Remover cena Music Style e estender Gallery (+120 frames) para manter o mesmo tempo total

---

## Timeline final (1530 frames)

| Frames | Duração | Cena | Componente |
|--------|---------|------|-----------|
| 0 | 150 | Cover | `Cover` |
| 145 | 5 | Fade 1 | `FadeTransition` |
| 150 | 150 | Occasion | `Occasion` |
| 295 | 5 | Fade 2 | `FadeTransition` |
| 300 | 300 | Story | `Story` |
| 595 | 5 | Fade 3 | `FadeTransition` |
| 600 | 720 │ Gallery (estendida) | `Gallery` |
| 1315 | 5 | Fade 4 | `FadeTransition` |
| 1320 | 120 | Credits | `Credits` |
| 1435 | 5 | Fade 6 | `FadeTransition` |
| 1440 | 90 | Logo End | `LogoEnd` |

Music Style (1200-1320) e Fade5 removidos. Gallery ganhou +120 frames.

---

## 1. Gallery — Remover contador de fotos

**Arquivo:** `src/remotion/slides/Gallery.tsx`

- Remover linhas `22-23`:
  ```ts
  const counterOpacity = interpolate(frame, [0, 20], [0, 1]);
  const counterY = interpolate(frame, [0, 20], [10, 0]);
  ```

- Remover bloco do contador (linhas `175-193`):
  ```tsx
  <div
    style={{
      position: "absolute",
      bottom: 40,
      left: "50%",
      transform: `translateX(-50%) translateY(${counterY}px)`,
      backgroundColor: `${theme.primary}99`,
      backdropFilter: "blur(8px)",
      padding: "8px 20px",
      borderRadius: 20,
      opacity: counterOpacity,
    }}
  >
    <span
      style={{ color: "rgba(255,255,255,0.9)", fontSize: 24, fontWeight: 500 }}
    >
      {photoIndex + 1}/{safeFotos.length}
    </span>
  </div>
  ```

**Efeito:** O contador no canto inferior desaparece. Nenhuma outra mudança visual.

---

## 2. Occasion — Remover contador de dias

**Arquivo:** `src/remotion/slides/Occasion.tsx`

- Remover `data_inicio` e `daysSince` da interface `OccasionProps` (linhas `7-8`)
- Remover `data_inicio` e `daysSince` do destructuring (linhas `15-16`)
- Remover `cardOpacity` e `cardY` (linhas `25-26`)
- Remover bloco `formattedDate` (linhas `33-39`)
- Remover bloco do card (linhas `98-126`):
  ```tsx
  {data_inicio && (
    <div
      style={{
        background: theme.surface,
        borderRadius: 20,
        padding: "28px 40px",
        textAlign: "center",
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
        backdropFilter: "blur(12px)",
        border: `1px solid ${theme.secondary}30`,
        boxShadow: `0 8px 32px ${theme.primary}10`,
      }}
    >
      <p style={{ color: "#555555", fontSize: 24, fontFamily: "var(--font-body)", marginBottom: 8 }}>
        Desde {formattedDate}
      </p>
      <p style={{ color: theme.primary, fontSize: 30, fontWeight: 700 }}>
        {daysSince} dias juntos
      </p>
    </div>
  )}
  ```

**Arquivo:** `src/remotion/RetrospectivaComposition.tsx`

- Remover `data_inicio` de `RetroInputProps` (linha `19`)
- Remover `data_inicio` do destructuring (linha `75`)
- Remover `safeDataInicio` (linha `91`)
- Remover função `computeDaysSince` (linhas `47-52`)
- Remover `daysSince` (linha `99`)
- Remover `data_inicio` e `daysSince` das props do `<Occasion>` (linhas `126-127`)

**Arquivo:** `src/remotion/Root.tsx`

- Remover `data_inicio: "2024-01-01"` das default props (linha `28`)

**Efeito:** O card "Desde {data}" + "{daysSince} dias juntos" desaparece. O layout centralizado mantém-se com o ícone, "de {remetente}" e o título da ocasião.

---

## 3. Transições — Branca para Fade In / Fade Out

**Arquivo:** `src/remotion/RetrospectivaComposition.tsx`

- Substituir o componente `FadeTransition` (linhas `54-69`):

**Atual (transição branca):**
```tsx
function FadeTransition({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#faf8f5",
        opacity: 1 - opacity,
        zIndex: 999,
      }}
    />
  );
}
```

**Novo (fade out + fade in):**
```tsx
function FadeTransition({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const half = Math.floor(durationInFrames / 2);
  const opacity = interpolate(frame, [0, half, durationInFrames], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        opacity,
        zIndex: 999,
      }}
    />
  );
}
```

**Efeito:** Cada transição de 5 frames agora faz um fade to black (fade out da cena anterior) seguido de fade from black (fade in da cena seguinte), em vez de um flash branco.

---

## 4. Story — Remover título

**Arquivo:** `src/remotion/slides/Story.tsx`

- Remover linhas `21-22` (animações do título):
  ```ts
  const titleOpacity = interpolate(frame, [0, 15], [0, 1]);
  const titleY = interpolate(frame, [0, 15], [10, 0]);
  ```

- Remover bloco do divisor decorativo (linhas `35-47`):
  ```tsx
  <div
    style={{
      position: "absolute",
      top: 40,
      left: "50%",
      transform: `translateX(-50%) translateY(${titleY}px)`,
      width: 60,
      height: 2,
      borderRadius: 1,
      background: `linear-gradient(90deg, transparent, ${theme.secondary}, transparent)`,
      opacity: titleOpacity,
    }}
  />
  ```

- Remover bloco do título (linhas `49-62`):
  ```tsx
  <h3
    style={{
      color: "#2c2c2c",
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: 3,
      textTransform: "uppercase",
      opacity: titleOpacity,
      transform: `translateY(${titleY}px)`,
      marginBottom: 40,
    }}
  >
    A História de Vocês
  </h3>
  ```

**Efeito:** Remove o título "A História de Vocês" e a barra decorativa superior. As frases animadas palavra-por-palavra permanecem centralizadas verticalmente.

---

## 5. Music Style — Remover cena + Estender Gallery

**Arquivo:** `src/remotion/RetrospectivaComposition.tsx`

- Remover import de `MusicStyle` (linha `7`)
- Remover as sequences do MusicStyle e Fade5 (linhas `148-162`):
  ```tsx
  <Sequence from={1195} durationInFrames={5} name="Fade4">
    <FadeTransition durationInFrames={5} />
  </Sequence>

  <Sequence from={1200} durationInFrames={120} name="MusicStyle">
    <MusicStyle
      styleLabel={styleLabel}
      estilo_musical={safeEstilo}
      theme={theme}
    />
  </Sequence>

  <Sequence from={1315} durationInFrames={5} name="Fade5">
    <FadeTransition durationInFrames={5} />
  </Sequence>
  ```
  Manter o `Fade4` (que agora transiciona Gallery → Credits), ajustando seu `from` para `1315` (final da Gallery estendida).

- Alterar `durationInFrames` da Gallery de `600` para `720` (linha `144`):
  ```tsx
  <Sequence from={600} durationInFrames={720} name="Gallery">
  ```

- Ajustar `from` do Fade4 para `1315` (nova posição após Gallery estendida):
  ```tsx
  <Sequence from={1315} durationInFrames={5} name="Fade4">
  ```

As demais sequences (Credits, Fade6, LogoEnd) permanecem com os mesmos valores pois a Gallery estendida ocupa exatamente o espaço do MusicStyle removido.

**Arquivo:** `src/remotion/slides/MusicStyle.tsx`

- Arquivo pode ser removido (não será mais importado).

**Efeito:** A cena de barras animadas + rótulo do gênero musical é removida. O slideshow Gallery ganha +4s (120 frames) de duração, mantendo o vídeo com os mesmos 1530 frames totais.

---

## Ordem de execução

1. `src/remotion/slides/Gallery.tsx` — remover contador
2. `src/remotion/slides/Occasion.tsx` — remover card de dias
3. `src/remotion/slides/Story.tsx` — remover título
4. `src/remotion/RetrospectivaComposition.tsx` — limpar props de `data_inicio` + substituir `FadeTransition` + remover MusicStyle + estender Gallery
5. `src/remotion/Root.tsx` — remover `data_inicio` default

Cada passo é independente e pode ser verificado individualmente.
