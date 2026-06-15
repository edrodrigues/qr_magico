import { cn } from "../lib/utils";

export function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-soft-cream">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <main className="relative flex flex-col items-center justify-center px-margin-mobile text-center z-10">
        <div className="relative mb-12">
          <span className="material-symbols-outlined absolute -top-8 -left-8 text-secondary/30 shimmer-particle" style={{ fontSize: 24 }}>
            auto_awesome
          </span>
          <span
            className="material-symbols-outlined absolute -bottom-4 -right-10 text-primary/30 shimmer-particle"
            style={{ fontSize: 32, animationDelay: "0.5s" }}
          >
            star
          </span>
          <span
            className="material-symbols-outlined absolute top-4 -right-12 text-secondary/40 shimmer-particle"
            style={{ fontSize: 20, animationDelay: "1.2s" }}
          >
            spark
          </span>

          <div className="animate-floating">
            <div
              className={cn(
                "w-48 h-48 md:w-56 md:h-56",
                "bg-surface-container-lowest rounded-[32px] p-6",
                "shadow-xl animate-glow",
                "flex items-center justify-center relative overflow-hidden",
                "glass-panel"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              <div className="w-full h-full border-4 border-dashed border-outline-variant/40 rounded-2xl flex items-center justify-center flex-col gap-4">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: 64, fontVariationSettings: "'FILL' 1" }}
                >
                  qr_code_2
                </span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <div className="w-2 h-2 bg-secondary/60 rounded-full" />
                  <div className="w-2 h-2 bg-secondary/30 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-16">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
            Momento <span className="text-on-surface">Mágico</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xs mx-auto">
            Transformando momentos técnicos em memórias físicas.
          </p>
        </div>

        <div className="w-full max-w-xs mx-auto mb-8 p-3 rounded-2xl bg-surface-container-lowest/80 border border-outline-variant/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: 20 }}>
              link
            </span>
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm text-on-surface-variant/60 text-left">
                Sua URL única
              </p>
              <p className="font-body-sm text-body-sm text-primary truncate text-left">
                qrmagico.app/p/sua-memoria-unica
              </p>
            </div>
            <span className="material-symbols-outlined text-tertiary shrink-0 ml-auto" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
          </div>
          <p className="font-label-md text-label-md text-primary tracking-widest uppercase opacity-80">
            Preparando a sua magia...
          </p>
        </div>
      </main>

      <footer className="fixed bottom-12 w-full text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant/40">
          &copy; 2024 Momento Mágico. Tecnologia com Alma.
        </p>
      </footer>
    </div>
  );
}
