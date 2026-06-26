export const GENRE_PALETTES: Record<string, string[]> = {
  mpb: ['#3d5a4a', '#7a9a82', '#dce8e0'],
  pop: ['#8a5a5a', '#b88a8a', '#ede0e0'],
  piano: ['#4a5a70', '#7a8aa0', '#e0e4ec'],
  lofi: ['#6a5a4a', '#a09080', '#e8e5e0'],
  sertanejo: ['#7a6a50', '#b0a088', '#ece6e0'],
  acoustic: ['#5a5548', '#958a7a', '#e6e4e0'],
  eletronica: ['#4a3a60', '#7a6a90', '#e6e0ee'],
  rock: ['#3a3a3a', '#7a7a7a', '#e0e0e0'],
};

export const DEFAULT_PALETTE = ['#8a7a6a', '#b8a898', '#e8e4e0'];

export function getPalette(genre?: string | null): string[] {
  if (!genre || typeof genre !== "string") return DEFAULT_PALETTE;
  return GENRE_PALETTES[genre.toLowerCase()] ?? DEFAULT_PALETTE;
}
