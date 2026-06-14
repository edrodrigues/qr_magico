import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { cn } from "../lib/utils";

const musicStyles = [
  { key: "mpb", label: "MPB", mood: "Aconchegante", icon: "favorite" },
  { key: "pop", label: "Pop", mood: "Alegre", icon: "celebration" },
  { key: "piano", label: "Piano Solo", mood: "Emocional", icon: "piano" },
  { key: "lofi", label: "Lo-fi", mood: "Moderno", icon: "headphones" },
  { key: "sertanejo", label: "Sertanejo", mood: "Raiz", icon: "agriculture" },
];

export function WizardEstiloMusical() {
  const navigate = useNavigate();
  const { data, setMusicStyle, saveDraft, isSaving } = useWizard();
  const { musicStyle } = data;

  const handleNext = async () => {
    if (!musicStyle || isSaving) return;
    const result = await saveDraft({ estilo_musical: musicStyle });
    if (!result.error) {
      navigate("/wizard/upload-fotos");
    }
  };

  return (
    <div className="bg-soft-cream min-h-screen flex flex-col font-body-md text-on-surface">
      <Header
        rightContent={
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Passo 4 de 7
            </span>
            <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[57%] transition-all duration-500" />
            </div>
          </div>
        }
      />
      <main className="flex-grow pt-32 pb-20 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="font-headline-md-mobile md:font-headline-md text-headline-md-mobile md:text-headline-md text-on-surface mb-4">
            Qual o ritmo dessa história?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Escolha o estilo musical que melhor combina com vocês.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {musicStyles.map((style) => (
            <button
              key={style.key}
              onClick={() => setMusicStyle(style.key)}
              className={cn(
                "group flex flex-col items-start p-6 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] border-2 active:scale-95",
                musicStyle === style.key
                  ? "border-secondary bg-gold-glimmer shadow-[0_10px_25px_-5px_rgba(115,92,0,0.1)]"
                  : "glass-card border-transparent"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors",
                  musicStyle === style.key
                    ? "bg-gold-glimmer"
                    : "bg-surface-container-high group-hover:bg-gold-glimmer"
                )}
              >
                <span className="material-symbols-outlined text-primary">
                  {style.icon}
                </span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface mb-1">
                {style.label}
              </h3>
              <p className="font-label-md text-label-md text-on-surface-variant mb-4">
                {style.mood}
              </p>
              {musicStyle === style.key && (
                <div className="flex gap-1 items-end h-4">
                  <div
                    className="w-1 bg-secondary rounded-full waveform-bar"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1 bg-secondary rounded-full waveform-bar"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <div
                    className="w-1 bg-secondary rounded-full waveform-bar"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            onClick={() => navigate("/wizard/relacao-sentimento")}
            className="w-full md:w-auto px-8 py-3 rounded-full border-[1.5px] border-primary text-primary font-label-md text-label-md transition-all duration-200 hover:bg-primary/5 active:scale-95"
          >
            Voltar
          </button>
          <button
            disabled={!musicStyle || isSaving}
            onClick={handleNext}
            className={cn(
              "w-full md:w-auto px-10 py-3 rounded-full font-label-md text-label-md shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group",
              musicStyle && !isSaving
                ? "bg-primary text-on-primary hover:shadow-xl active:scale-[0.98]"
                : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50"
            )}
          >
            {isSaving ? "Salvando..." : "Próximo"}
            {!isSaving && (
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            )}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
