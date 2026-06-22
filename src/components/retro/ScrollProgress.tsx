interface ScrollProgressProps {
  total: number;
  active: number;
  onDotClick: (index: number) => void;
}

const DOT_NAMES = [
  "Capa",
  "Ocasião",
  "História",
  "Fotos",
  "Estilo",
  "Música",
  "Vídeo",
  "Compartilhar",
];

export function ScrollProgress({ total, active, onDotClick }: ScrollProgressProps) {
  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="group relative flex items-center justify-center"
          aria-label={`Slide ${i + 1}: ${DOT_NAMES[i] || ""}`}
        >
          <div
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? "w-3 h-3 shadow-lg"
                : "w-2 h-2 opacity-40 hover:opacity-70"
            }`}
            style={{
              backgroundColor: i === active ? "#C96442" : "rgba(255,255,255,0.6)",
              boxShadow: i === active ? "0 0 8px rgba(201,100,66,0.6)" : "none",
            }}
          />
          <span className="absolute right-full mr-3 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
            }}
          >
            {DOT_NAMES[i] || `Slide ${i + 1}`}
          </span>
        </button>
      ))}
    </div>
  );
}
