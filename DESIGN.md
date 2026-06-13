# QR Mágico - Prompt de Design para LLM

## 1. Objetivo
Crie uma web-app responsiva, mobile-first, premium e emocional chamada QR Mágico.
O produto gera presentes digitais personalizados com retrospectiva animada, trilha sonora original por IA e entrega por link único + QR Code + PDF para imprimir.

## 2. Público e tom
- Público: brasileiros de 18 a 50 anos.
- Tom: caloroso, emotivo, moderno, acessível e levemente premium.
- Idioma padrão: pt-BR.
- Prioridade de uso: mobile, com variações consistentes para tablet e desktop.

## 3. Entregável esperado
Crie um deliverable pronto para Figma/Artboard com:
- telas principais da experiência
- variações responsivas por breakpoint
- biblioteca de componentes
- tokens visuais e de interação
- anotações de comportamento e integração
- frames exportáveis para apresentação

## 4. Telas obrigatórias
### 4.1 Home / Splash
- Hero curto com proposta de valor.
- CTA principal: "Criar presente".
- Preview visual do resultado final.
- Blocos curtos de como funciona, benefícios e confiança.

### 4.2 Wizard de criação
Crie 6 telas separadas:
1. Ocasião e nome do homenageado
2. Relação em texto livre com hint emocional
3. Estilo musical em grid de cards
4. Upload de até 6 fotos com preview e reorder
5. Revisão completa com preço e edição
6. Pagamento com Pix e cartão

### 4.3 Processamento pós-pagamento
- Tela de geração assíncrona.
- Estados: gerando música, montando retrospectiva, gerando PDF e QR.
- Spinner, ETA e suporte.

### 4.4 Dashboard do comprador
- Editar presente.
- Reenviar email.
- Cancelar.
- Ver slug e link.
- Baixar PDF do cartão.

### 4.5 Página pública da retrospectiva
URL: /p/{slug}
- Carrossel ou timeline animada de fotos.
- Música em background com player claro e acessível.
- Controles: play/pause, volume, progresso e mute.
- Botões: compartilhar no WhatsApp e Instagram.
- Modal de QR Code.
- CTA para baixar PDF do cartão.
- Autoplay apenas mutado até interação do usuário.

### 4.6 QR Code e impressão
- Modal full screen do QR Code.
- Download em PNG.
- Preview do PDF com margens de impressão.

### 4.7 Emails
Crie preview de dois templates:
- Email do comprador: confirmação + link de gerenciamento.
- Email do presenteado: link + QR Code + thumbnail do PDF.

### 4.8 Estados de erro e edge cases
- Nenhuma foto enviada.
- Erro no upload.
- Geração de música falhou.
- Presente expirado.
- Aviso de privacidade.

## 5. Sistema visual
### 5.1 Cores
Use uma direção visual quente e sofisticada:
- coral / rosa como cor principal
- dourado como acento
- fundos neutros quentes e/ou charcoal no modo escuro

### 5.2 Tipografia
- Títulos: serif amigável e emocional.
- Corpo: sans limpa e altamente legível.
- Defina escala tipográfica clara.

### 5.3 Componentes
Inclua componentes reutilizáveis para:
- botões primary, secondary e ghost
- inputs e textareas
- uploader com drag and drop
- lista de reorder de fotos
- cards de música
- player de áudio com visualizador
- modal / sheet / toast
- resumo de pagamento
- QR Code generator
- preview de PDF

### 5.4 Motion e interação
- Crossfade suave entre fotos.
- Parallax discreto em scroll.
- Progresso animado para geração de música.
- Animação leve no reorder de fotos.
- Preferir CSS e GSAP leve.
- Incluir variante reduced motion.

### 5.5 Acessibilidade
- Estrutura semântica clara.
- Estados de foco visíveis.
- Alternativa de reorder via teclado.
- Alt placeholders para imagens.
- Contraste adequado em todos os estados.

## 6. Requisitos de responsividade
Estruture tudo como web-app responsiva com consistência entre breakpoints.
- mobile: 360x800 como referência principal
- tablet: layout intermediário com hierarquia ajustada
- desktop: layout expandido com preview e suporte paralelo

## 7. Integrações e anotações
Anote em cada frame:
- breakpoints
- interação principal
- estados hover / press / disabled
- integração com Supabase para fotos e dados
- integração com ElevenLabs para música
- integração com gateway de pagamento
- pontos de API, webhook e loading

## 8. Saída desejada
Quero que você gere:
- telas completas
- biblioteca de componentes
- tokens de design
- variações responsivas
- notas de interação
- frames prontos para apresentação

## 9. Prompt final para execução
Gere a experiência completa da QR Mágico como uma web-app responsiva, mobile-first, premium e emocional, pronta para Figma/Artboard, seguindo todos os requisitos acima e mantendo o conteúdo em pt-BR.
