export const GENRE_PALETTES: Record<string, string[]> = {
  mpb: ['#1a6b4a', '#2d9b6e', '#c4e6d8'],
  pop: ['#a93539', '#f26b6b', '#ffdad8'],
  piano: ['#2c3e50', '#5d7a9a', '#d4e1f0'],
  lofi: ['#5c4a3a', '#b8a08a', '#efe6dc'],
  sertanejo: ['#8b5e3c', '#d4a76a', '#f5e6d3'],
  acoustic: ['#7a6b5d', '#c4a97d', '#ede0d4'],
  eletronica: ['#4a0e6b', '#8a2be2', '#e0b0ff'],
  rock: ['#2d2d2d', '#6b6b6b', '#d4d4d4'],
};

export const DEFAULT_PALETTE = ['#a93539', '#f26b6b', '#ffdad8'];

export function getPalette(genre: string): string[] {
  return GENRE_PALETTES[genre.toLowerCase()] ?? DEFAULT_PALETTE;
}
