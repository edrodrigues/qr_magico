import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import { supabase } from "../lib/supabase";

export function Creditos() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [hasCredit, setHasCredit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cupons_uso")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .then(({ count, error }) => {
        if (!error) setHasCredit(count !== null && count > 0);
        setLoading(false);
      });
  }, [user]);

  const handleRedeem = async () => {
    const trimmed = codigo.trim();
    if (!trimmed) {
      addToast("Insira um código de cupom.", "error");
      return;
    }
    setRedeeming(true);

    const { data, error } = await supabase.rpc("resgatar_cupom", {
      codigo_cupom: trimmed,
    });

    if (error || data?.error) {
      addToast(data?.error || "Erro ao resgatar cupom.", "error");
    } else {
      addToast("Cupom resgatado! Você tem acesso gratuito.", "success");
      setHasCredit(true);
      setCodigo("");
    }
    setRedeeming(false);
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Visitante";

  return (
    <div className="bg-background min-h-screen">
      <Header />

      <main className="pt-28 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <header className="mb-8 animate-reveal">
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Olá, <span className="text-primary font-bold">{userName}</span>
              </p>
              <h1 className="font-headline-md-mobile md:text-headline-md text-headline-md text-on-surface">
                Créditos
              </h1>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4 animate-reveal">
            <div className="skeleton h-48 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop animate-reveal">
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card p-8 rounded-xl">
                <h2 className="font-title-lg text-title-lg text-on-surface mb-2">
                  Resgatar Cupom
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  Insira um código de cupom para liberar a geração gratuita de Momentos Mágicos.
                </p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Digite o código do cupom"
                    disabled={hasCredit}
                    className="flex-1 px-4 py-3 rounded-lg bg-surface border border-outline-variant/40 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all uppercase tracking-widest disabled:opacity-50"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming || hasCredit || !codigo.trim()}
                    className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                  >
                    {redeeming ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        Validando...
                      </>
                    ) : (
                      "Resgatar"
                    )}
                  </button>
                </div>
              </div>

              {hasCredit && (
                <div className="bg-primary-fixed p-6 rounded-xl border border-primary/20">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      redeem
                    </span>
                    <div>
                      <h3 className="font-title-md text-title-md text-on-primary-fixed mb-1">
                        Crédito disponível!
                      </h3>
                      <p className="font-body-md text-body-md text-on-primary-fixed-variant mb-4">
                        Você tem acesso gratuito para gerar Momentos Mágicos. Crie agora mesmo!
                      </p>
                      <Link
                        to="/wizard/ocasiao-nome"
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Criar Momento Mágico Grátis
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:col-span-5">
              <div className="glass-card p-6 rounded-xl sticky top-32 space-y-6">
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-2">
                    Como funciona?
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { icon: "local_offer", text: "Insira um código de cupom válido." },
                      { icon: "check_circle", text: "Seu acesso gratuito é liberado na hora." },
                      { icon: "auto_awesome", text: "Crie quantos Momentos Mágicos quiser sem pagar." },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0">
                          {item.icon}
                        </span>
                        <span className="font-body-md text-body-md text-on-surface-variant">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-outline-variant/30 pt-6">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">
                    Status do seu acesso
                  </p>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-variant">
                    <span className={`material-symbols-outlined text-[24px] ${hasCredit ? "text-primary" : "text-outline"}`}>
                      {hasCredit ? "check_circle" : "hourglass_empty"}
                    </span>
                    <span className="font-label-md text-label-md text-on-surface">
                      {hasCredit ? "Acesso gratuito ativo" : "Nenhum cupom resgatado"}
                    </span>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  className="block w-full text-center py-3 rounded-lg bg-surface-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-highest transition-all"
                >
                  Voltar ao Dashboard
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
