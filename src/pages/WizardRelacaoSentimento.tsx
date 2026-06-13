import { useState } from "react";
import { Header, Footer } from "../components/Header";
import { cn } from "../lib/utils";

export function WizardRelacaoSentimento() {
  const [story, setStory] = useState("");

  return (
    <div className="bg-soft-cream font-body-md text-on-surface min-h-screen flex flex-col">
      <Header showNav showCreateBtn />
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-margin-mobile md:px-margin-desktop relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10" />
        <div className="flex gap-2 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === 1 ? "w-6 bg-primary" : "w-2 bg-outline-variant"
              )}
            />
          ))}
        </div>
        <div className="w-full max-w-[640px] glass-panel p-8 md:p-12 rounded-[2rem] shadow-2xl relative">
          <div className="text-center mb-10">
            <h1 className="font-headline-md-mobile md:font-headline-md text-headline-md-mobile md:text-headline-md text-primary mb-4">
              Abra o seu coração
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Escreva um pouco sobre a relação de vocês. Nossa IA usará essas
              palavras para compor uma trilha sonora única.
            </p>
          </div>
          <div className="relative mb-6">
            <div className="absolute -top-4 -right-4 bg-gold-glimmer p-2 rounded-full shadow-sm animate-bounce">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <textarea
              className="w-full h-64 p-6 bg-warm-gray border-none rounded-2xl font-body-md text-body-md text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-secondary-fixed transition-all resize-none"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              maxLength={500}
              placeholder="Ex: Lembro com carinho de quando viajamos para aquela pequena pousada no interior e passamos a noite toda conversando sob as estrelas..."
            />
            <div className="flex justify-between items-center mt-3 px-1">
              <div className="flex items-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[18px]">
                  info
                </span>
                <span className="font-label-sm text-label-sm">
                  Não se preocupe com a perfeição, o que importa é o sentimento.
                </span>
              </div>
              <span
                className={cn(
                  "font-label-md text-label-md",
                  story.length >= 450 ? "text-primary" : "text-outline"
                )}
              >
                {story.length}/500
              </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-12">
            <button className="w-full md:w-1/3 py-4 border-2 border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 active:scale-95">
              <span className="material-symbols-outlined">arrow_back</span>
              Voltar
            </button>
            <button
              className="w-full md:w-2/3 py-4 text-on-primary rounded-full font-label-md text-label-md flex items-center justify-center gap-2 group"
              style={{
                background:
                  "linear-gradient(135deg, #a93539 0%, #D95353 50%, #e9c349 100%)",
                boxShadow: "0 4px 15px rgba(169, 53, 57, 0.2)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(169, 53, 57, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(169, 53, 57, 0.2)";
              }}
            >
              Continuar a Mágica
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
