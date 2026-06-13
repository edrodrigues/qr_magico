import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { cn } from "../lib/utils";

export function WizardDataRelacao() {
  const navigate = useNavigate();
  const { data, setStartDate, saveDraft, isSaving } = useWizard();
  const { startDate } = data;

  const handleNext = async () => {
    if (!startDate || isSaving) return;
    await saveDraft({ data_inicio: startDate });
    navigate("/wizard/relacao-sentimento");
  };

  return (
    <div className="bg-soft-cream min-h-screen flex flex-col font-body-md text-on-surface">
      <Header showNav />
      <main className="flex-grow flex flex-col items-center justify-center px-margin-mobile pt-24 pb-12">
        <div className="max-w-4xl w-full">
          <div className="mb-12 flex flex-col items-center">
            <div className="w-full max-w-xs h-1.5 bg-surface-container rounded-full overflow-hidden mb-4">
              <div className="h-full w-[28.57%] bg-primary transition-all duration-500 ease-out"></div>
            </div>
            <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase">
              Passo 2 de 7
            </span>
          </div>
          <div className="glass-card p-8 md:p-12 rounded-[2rem] text-center">
            <header className="mb-12">
              <h1 className="font-headline-md text-headline-md md:font-display-lg md:text-display-lg text-on-surface mb-4">
                Quando essa hist&oacute;ria come&ccedil;ou?
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Escolha uma data especial que marca o in&iacute;cio da hist&oacute;ria de voc&ecirc;s.
              </p>
            </header>
            <div className="max-w-sm mx-auto space-y-6">
              <label
                className="block font-label-md text-label-md text-primary mb-2 uppercase tracking-wider text-left"
                htmlFor="start-date"
              >
                Data de In&iacute;cio
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-warm-gray border-transparent rounded-xl px-6 py-4 font-body-lg text-body-lg text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:border-secondary"
              />
            </div>
            <div className="pt-12 flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/wizard/ocasiao-nome")}
                className="w-full md:w-auto px-8 py-3 rounded-full border-2 border-primary text-primary font-label-md text-label-md hover:bg-primary/5 transition-all active:scale-95"
              >
                Voltar
              </button>
              <button
                onClick={handleNext}
                className={cn(
                  "w-full md:w-auto px-12 py-3 rounded-full font-label-md text-label-md transition-all",
                  startDate && !isSaving
                    ? "bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-lg"
                    : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50"
                )}
                disabled={!startDate || isSaving}
              >
                {isSaving ? "Salvando..." : "Pr&oacute;ximo"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
