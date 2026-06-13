import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Header, Footer } from "../components/Header";

interface PresenteData {
  nome_homenageado: string;
  ocasiao: string;
  descricao_relacao: string;
  estilo_musical: string;
  thumbnail_url: string;
  data_inicio: string;
}

export function RetrospectivaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [presente, setPresente] = useState<PresenteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError("Link inválido");
      setLoading(false);
      return;
    }
    supabase
      .from("presentes")
      .select("nome_homenageado, ocasiao, descricao_relacao, estilo_musical, thumbnail_url, data_inicio")
      .eq("slug", slug)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError(err?.message === "No rows found" ? "Presente não encontrado" : "Erro ao carregar presente");
        } else {
          setPresente(data as PresenteData);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-soft-cream min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto animate-pulse flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !presente) {
    return (
      <div className="bg-soft-cream min-h-screen flex items-center justify-center px-margin-mobile">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-surface-container-highest mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-outline text-4xl">search</span>
          </div>
          <h1 className="font-headline-md-mobile text-headline-md-mobile text-on-surface">
            {error || "Presente não encontrado"}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Este link pode estar expirado ou o presente foi removido.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
          >
            Criar meu QR Mágico
          </Link>
        </div>
      </div>
    );
  }

  const occasionLabel = presente.ocasiao || "Especial";

  return (
    <div className="bg-soft-cream min-h-screen">
      <Header
        showNav
        rightContent={
          <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform"
            onClick={() => setQrOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            <span>Ver QR Code</span>
          </button>
        }
      />

      <main className="pt-24 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
        <div className="text-center mb-12 animate-reveal">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-4 leading-tight">
            Para {presente.nome_homenageado}
          </h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-2">
            {occasionLabel}
          </p>
          {presente.data_inicio && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Desde {new Date(presente.data_inicio).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="relative group rounded-[2rem] overflow-hidden shadow-2xl bg-warm-gray aspect-[4/5] md:aspect-video">
              <div className="w-full h-full flex items-center justify-center">
                {presente.thumbnail_url ? (
                  <img className="w-full h-full object-cover" src={presente.thumbnail_url} alt="" />
                ) : (
                  <div className="text-center p-12">
                    <span className="material-symbols-outlined text-outline-variant text-6xl mb-4 block">
                      photo_library
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Fotos em breve
                    </p>
                  </div>
                )}
              </div>
            </div>

            {presente.estilo_musical && (
              <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-lg border border-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">music_note</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-title-lg text-title-lg text-primary">Trilha Sonora</h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      {presente.estilo_musical}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline">hourglass_empty</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Gerando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[32px] mb-4">auto_awesome</span>
              <h2 className="font-title-lg text-title-lg text-on-surface mb-4">Nossa História</h2>
              <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {presente.descricao_relacao ? (
                  <p>{presente.descricao_relacao}</p>
                ) : (
                  <p className="italic">Uma história especial está sendo escrita...</p>
                )}
              </div>
              <div className="mt-8 pt-8 border-t border-outline-variant/20">
                <p className="font-title-lg text-primary italic">
                  &mdash; Com todo meu afeto.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full bg-gradient-to-br from-coral-light to-gold-glimmer py-4 rounded-full font-label-md text-label-md text-on-primary-container shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined">picture_as_pdf</span>
                BAIXAR CARTÃO PARA IMPRESSÃO
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 p-4 bg-white border border-outline-variant/50 rounded-2xl hover:bg-warm-gray transition-colors">
                  <span className="material-symbols-outlined text-primary text-2xl">share</span>
                  <span className="font-label-md text-label-md">Compartilhar</span>
                </button>
                <button className="flex items-center justify-center gap-2 p-4 bg-white border border-outline-variant/50 rounded-2xl hover:bg-warm-gray transition-colors">
                  <span className="material-symbols-outlined text-secondary text-2xl">favorite</span>
                  <span className="font-label-md text-label-md">Favoritar</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl p-6 text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">VOCÊ TAMBÉM PODE CRIAR UM</p>
              <p className="font-body-md text-body-md font-semibold mb-4">Transforme suas fotos em memórias mágicas.</p>
              <Link
                to="/"
                className="text-primary font-label-md text-label-md underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </main>

      {qrOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm px-margin-mobile"
          onClick={() => setQrOpen(false)}
        >
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-warm-gray transition-colors"
              onClick={() => setQrOpen(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="w-full aspect-square bg-warm-gray rounded-3xl p-6 mb-6 flex items-center justify-center border-4 border-gold-glimmer">
              <div className="relative w-full h-full bg-white rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full opacity-80">
                  {[
                    [1,1,0,1,1],
                    [1,0,1,0,1],
                    [0,1,1,1,0],
                    [1,0,1,0,1],
                    [1,1,0,1,1],
                  ].flat().map((v, i) => (
                    <div key={i} className={v ? "bg-primary rounded-sm" : ""} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full p-1 shadow-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">favorite</span>
                  </div>
                </div>
              </div>
            </div>
            <h4 className="font-title-lg text-title-lg text-on-surface mb-2">Seu Portal Mágico</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Aponte a câmera para acessar esta retrospectiva em qualquer lugar.
            </p>
            <button
              className="w-full py-4 border-2 border-primary text-primary rounded-full font-label-md text-label-md hover:bg-primary hover:text-white transition-all"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
            >
              Compartilhar Link
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
