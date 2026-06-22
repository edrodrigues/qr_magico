export interface OccasionTheme {
  primary: string;
  secondary: string;
  darkBgStart: string;
  darkBgEnd: string;
  lightBgStart: string;
  lightBgEnd: string;
  surface: string;
  iconPath: string;
}

const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const GIFT =
  "M19 6h-2c0-2.21-1.79-4-4-4S9 3.79 9 6H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm-6 12V9h14v7H6z";
const PEOPLE =
  "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z";
const STAR =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
const SPARKLE =
  "M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z";

export const OCCASION_THEMES: Record<string, OccasionTheme> = {
  amor: {
    primary: "#e8495e",
    secondary: "#f8a5b5",
    darkBgStart: "#2a1a1a",
    darkBgEnd: "#4a2424",
    lightBgStart: "#fef5f5",
    lightBgEnd: "#fce8ec",
    surface: "rgba(232, 73, 94, 0.08)",
    iconPath: HEART,
  },
  aniversario: {
    primary: "#e8a849",
    secondary: "#f5d08a",
    darkBgStart: "#2a241a",
    darkBgEnd: "#4a3a24",
    lightBgStart: "#fefaf0",
    lightBgEnd: "#fcf3dc",
    surface: "rgba(232, 168, 73, 0.08)",
    iconPath: GIFT,
  },
  amizade: {
    primary: "#49a8e8",
    secondary: "#8ac8f5",
    darkBgStart: "#1a242a",
    darkBgEnd: "#243a4a",
    lightBgStart: "#f0f7fe",
    lightBgEnd: "#dcecfc",
    surface: "rgba(73, 168, 232, 0.08)",
    iconPath: PEOPLE,
  },
  gratidao: {
    primary: "#49e8a8",
    secondary: "#8af5c8",
    darkBgStart: "#1a2a24",
    darkBgEnd: "#244a3a",
    lightBgStart: "#f0fef7",
    lightBgEnd: "#d8fce8",
    surface: "rgba(73, 232, 168, 0.08)",
    iconPath: STAR,
  },
  outro: {
    primary: "#8a7a6a",
    secondary: "#b8a898",
    darkBgStart: "#2a2a2a",
    darkBgEnd: "#4a4a4a",
    lightBgStart: "#faf8f5",
    lightBgEnd: "#f5f0ea",
    surface: "rgba(138, 122, 106, 0.08)",
    iconPath: SPARKLE,
  },
};

function darkenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function lightenHex(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function getGenreTheme(palette: string[], ocasiao: string): OccasionTheme {
  const [c0, c1, c2] = palette;
  const occasionTheme = OCCASION_THEMES[ocasiao] || OCCASION_THEMES.outro;
  return {
    primary: c0,
    secondary: c1,
    darkBgStart: darkenHex(c0, 30),
    darkBgEnd: c0,
    lightBgStart: c2,
    lightBgEnd: lightenHex(c2, 8),
    surface: `${c0}14`,
    iconPath: occasionTheme.iconPath,
  };
}

export function getOccasionTheme(ocasiao: string): OccasionTheme {
  return OCCASION_THEMES[ocasiao] || OCCASION_THEMES.outro;
}
