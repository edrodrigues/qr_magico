import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { cn } from "../lib/utils";

const occasions = [
  { key: "aniversario", label: "Aniversário", icon: "cake" },
  { key: "amor", label: "Amor", icon: "favorite" },
  { key: "amizade", label: "Amizade", icon: "group" },
  { key: "gratidao", label: "Gratidão", icon: "self_improvement" },
  { key: "outro", label: "Outro", icon: "auto_awesome" },
];

export function WizardOcasiaoNome() {
  const navigate = useNavigate();
  const { data, setName, setOccasion, saveDraft, isSaving } = useWizard();
  const { name, occasion } = data;

  const handleNext = async () => {
    if (!name.trim() || !occasion || isSaving) return;
    const result = await saveDraft({ nome_homenageado: name.trim(), ocasiao: occasion });
    if (!result.error) {
      navigate("/wizard/data-relacao");
    }
  };

  return (
    <div className="bg-soft-cream font-body-md text-on-surface min-h-screen flex flex-col">
      <Header showNav showClose />
      <main className="flex-grow flex items-center justify-center px-margin-mobile pt-24 pb-12">
        <div className="max-w-4xl w-full">
          <div className="mb-12 flex flex-col items-center">
            <div className="w-full max-w-xs h-1.5 bg-surface-container rounded-full overflow-hidden mb-4">
              <div className="h-full w-[14.28%] bg-primary transition-all duration-500 ease-out"></div>
            </div>
            <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase">
              Passo 1 de 7
            </span>
          </div>
          <div className="glass-card p-8 md:p-12 rounded-[2rem] text-center">
            <header className="mb-12">
              <h1 className="font-headline-md text-headline-md md:font-display-lg md:text-display-lg text-on-surface mb-4">
                Para quem é esse momento mágico?
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                Conte-nos o motivo da celebração e o nome de quem vai receber este carinho.
              </p>
            </header>
            <form className="space-y-12">
              <div className="max-w-md mx-auto">
                <label
                  className="block font-label-md text-label-md text-primary mb-3 uppercase tracking-wider"
                  htmlFor="recipient-name"
                >
                  Nome do Homenageado
                </label>
                <input
                  id="recipient-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maria Alice"
                  className="w-full bg-warm-gray border-transparent rounded-xl px-6 py-4 font-body-lg text-body-lg text-on-surface transition-all placeholder:text-outline/50 focus:ring-0 focus:border-secondary"
                />
              </div>
              <div className="space-y-6">
                <span className="block font-label-md text-label-md text-primary uppercase tracking-wider">
                  Qual a ocasião?
                </span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {occasions.map((occ) => (
                    <div
                      key={occ.key}
                      onClick={() => setOccasion(occ.key)}
                      className={cn(
                        "group cursor-pointer p-6 rounded-2xl bg-surface border flex flex-col items-center gap-3 transition-all duration-300 hover:border-primary/50",
                        occasion === occ.key
                          ? "border-primary bg-surface-container-low shadow-[0_10px_20px_-5px_rgba(169,53,57,0.1)]"
                          : "border-outline-variant/30"
                      )}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary">
                          {occ.icon}
                        </span>
                      </div>
                      <span className="font-label-md text-label-md text-on-surface">
                        {occ.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-8 flex justify-center">
                <button
                  type="button"
                  disabled={!name.trim() || !occasion || isSaving}
                  onClick={handleNext}
                  className={cn(
                    "group relative px-12 py-4 rounded-full font-label-md text-label-md transition-all duration-300 overflow-hidden",
                    name.trim() && occasion && !isSaving
                      ? "bg-primary text-on-primary hover:scale-105 active:scale-95 shadow-lg hover:shadow-primary/20"
                      : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSaving ? "Salvando..." : "Próximo"}
                    {!isSaving && (
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    )}
                  </span>
                  {name.trim() && occasion && !isSaving && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-coral-deep to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <div className="fixed top-[20%] -left-20 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[10%] -right-20 w-80 h-80 bg-secondary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <Footer />
    </div>
  );
}
