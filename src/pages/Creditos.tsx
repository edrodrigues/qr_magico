import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";

type PaymentMethod = "pix" | "card";

type Transacao = {
  id: string;
  tipo: "compra" | "consumo" | "bonus";
  quantidade: number;
  descricao: string;
  created_at: string;
};

const PRECO_UNITARIO = 19.9;

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Creditos() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [hasCouponCredit, setHasCouponCredit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const [quantidade, setQuantidade] = useState(1);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cupons_uso")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .then(({ count, error }) => {
        if (!error) setHasCouponCredit(count !== null && count > 0);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.rpc("obter_saldo_creditos"),
      supabase
        .from("creditos_transacoes")
        .select("*")
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([saldoRes, transacoesRes]) => {
      if (!saldoRes.error) setSaldo(saldoRes.data as number);
      if (!transacoesRes.error) setTransacoes(transacoesRes.data as Transacao[]);
      setLoadingSaldo(false);
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
      setHasCouponCredit(true);
      setCodigo("");
    }
    setRedeeming(false);
  };

  const handleComprar = async () => {
    setBuying(true);
    const valorEsperado = PRECO_UNITARIO * quantidade;

    const { data, error } = await supabase.rpc("comprar_creditos", {
      p_quantidade: quantidade,
      p_valor_pago: valorEsperado,
    });

    if (error || data?.error) {
      addToast(data?.error || "Erro ao processar compra.", "error");
    } else {
      addToast(`Compra realizada! ${quantidade} crédito(s) adicionado(s).`, "success");
      setShowModal(false);
      setQuantidade(1);
      const [saldoRes, transacoesRes] = await Promise.all([
        supabase.rpc("obter_saldo_creditos"),
        supabase
          .from("creditos_transacoes")
          .select("*")
          .eq("usuario_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (!saldoRes.error) setSaldo(saldoRes.data as number);
      if (!transacoesRes.error) setTransacoes(transacoesRes.data as Transacao[]);
    }
    setBuying(false);
  };

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Visitante";

  const total = PRECO_UNITARIO * quantidade;
  const podeCriarPresente = hasCouponCredit || (saldo !== null && saldo > 0);

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

        {loading && loadingSaldo ? (
          <div className="space-y-4 animate-reveal">
            <div className="skeleton h-48 w-full rounded-xl" />
            <div className="skeleton h-32 w-full rounded-xl" />
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
                    disabled={hasCouponCredit}
                    className="flex-1 px-4 py-3 rounded-lg bg-surface border border-outline-variant/40 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all uppercase tracking-widest disabled:opacity-50"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming || hasCouponCredit || !codigo.trim()}
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

              <div className="glass-card p-8 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary text-[28px]">shopping_cart</span>
                  <h2 className="font-title-lg text-title-lg text-on-surface">
                    Comprar Créditos
                  </h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                  Adquira créditos para gerar quantos Momentos Mágicos quiser. Cada crédito equivale a
                  um presente completo.
                </p>

                <div className="flex items-end gap-4 flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
                      Quantidade de créditos
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                        disabled={quantidade <= 1}
                        className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-[20px]">remove</span>
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={quantidade}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) setQuantidade(Math.max(1, Math.min(50, val)));
                        }}
                        className="w-20 text-center px-4 py-3 rounded-lg bg-surface border border-outline-variant/40 font-headline-md-mobile text-headline-md-mobile text-primary font-bold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      <button
                        onClick={() => setQuantidade(Math.min(50, quantidade + 1))}
                        disabled={quantidade >= 50}
                        className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-all disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-right min-w-[140px]">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Preço unitário
                    </p>
                    <p className="font-body-md text-body-md text-on-surface">
                      {formatarMoeda(PRECO_UNITARIO)}
                    </p>
                  </div>

                  <div className="text-right min-w-[140px]">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Total
                    </p>
                    <p className="font-headline-md-mobile text-headline-md-mobile text-primary font-bold">
                      {formatarMoeda(total)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2 flex-wrap">
                  {[1, 3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuantidade(n)}
                      className={cn(
                        "px-4 py-2 rounded-lg border font-label-md text-label-md transition-all",
                        quantidade === n
                          ? "border-primary bg-primary-fixed text-primary"
                          : "border-outline-variant/40 text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      {n} crédito{n > 1 ? "s" : ""}
                      {n > 1 && (
                        <span className="ml-1 text-xs opacity-70">
                          ({Math.round((1 - PRECO_UNITARIO * n / (PRECO_UNITARIO * n)) * 100)}% off)
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  disabled={quantidade < 1}
                  className="mt-6 bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">credit_card</span>
                  Comprar {quantidade} crédito{quantidade > 1 ? "s" : ""} — {formatarMoeda(total)}
                </button>
              </div>

              {podeCriarPresente && (
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
                        {hasCouponCredit
                          ? "Você tem acesso gratuito via cupom. Crie seu Momento Mágico agora!"
                          : `Você tem ${saldo} crédito${saldo !== 1 ? "s" : ""} disponível. Crie seu Momento Mágico agora!`}
                      </p>
                      <Link
                        to="/wizard/ocasiao-nome"
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        Criar Momento Mágico
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:col-span-5">
              <div className="glass-card p-6 rounded-xl sticky top-32 space-y-6">
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-3">
                    Seu saldo
                  </h3>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-variant">
                    <span className={cn(
                      "material-symbols-outlined text-[28px]",
                      (saldo !== null && saldo > 0) || hasCouponCredit ? "text-primary" : "text-outline"
                    )}>
                      {(saldo !== null && saldo > 0) || hasCouponCredit
                        ? "check_circle"
                        : "hourglass_empty"}
                    </span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">
                        {loadingSaldo
                          ? "Carregando..."
                          : hasCouponCredit
                            ? "Acesso gratuito ativo"
                            : saldo !== null && saldo > 0
                              ? `${saldo} crédito${saldo !== 1 ? "s" : ""} disponível`
                              : "Nenhum crédito disponível"}
                      </p>
                      {!hasCouponCredit && saldo !== null && (
                        <p className="text-xs text-on-surface-variant">
                          {saldo > 0
                            ? "Pronto para criar"
                            : "Compre créditos ou use um cupom"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-3">
                    Como funciona?
                  </h3>
                  <ul className="space-y-3">
                    {[
                      { icon: "shopping_cart", text: "Escolha a quantidade e compre créditos." },
                      { icon: "check_circle", text: "Os créditos são liberados na hora." },
                      { icon: "auto_awesome", text: "Crie Momentos Mágicos usando seus créditos." },
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

                {transacoes.length > 0 && (
                  <div className="border-t border-outline-variant/30 pt-6">
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">
                      Últimas transações
                    </p>
                    <div className="space-y-2">
                      {transacoes.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-variant/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "material-symbols-outlined text-[18px] flex-shrink-0",
                              t.tipo === "compra"
                                ? "text-green-600"
                                : t.tipo === "consumo"
                                  ? "text-primary"
                                  : "text-amber-600"
                            )}>
                              {t.tipo === "compra"
                                ? "add_circle"
                                : t.tipo === "consumo"
                                  ? "arrow_outward"
                                  : "card_giftcard"}
                            </span>
                            <span className="font-body-md text-body-md text-on-surface truncate">
                              {t.descricao || (t.tipo === "compra" ? "Compra de créditos" : t.tipo === "consumo" ? "Consumo" : "Bônus")}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <span className={cn(
                              "font-label-md text-label-md",
                              t.quantidade > 0 ? "text-green-700" : "text-primary"
                            )}>
                              {t.quantidade > 0 ? `+${t.quantidade}` : t.quantidade}
                            </span>
                            <p className="text-[10px] text-on-surface-variant">
                              {formatarData(t.created_at)} {formatarHora(t.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !buying && setShowModal(false)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-0">
              <h2 className="font-title-lg text-title-lg text-on-surface">
                Finalizar compra
              </h2>
              <button
                onClick={() => !buying && setShowModal(false)}
                className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setMethod("pix")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    method === "pix"
                      ? "border-primary bg-surface-container-low"
                      : "border-outline-variant"
                  )}
                >
                  <span className="material-symbols-outlined text-primary">qr_code_2</span>
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-on-surface">PIX</p>
                    <p className="text-[11px] text-secondary font-semibold">Rápido e seguro</p>
                  </div>
                </button>
                <button
                  onClick={() => setMethod("card")}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    method === "card"
                      ? "border-primary bg-surface-container-low"
                      : "border-outline-variant"
                  )}
                >
                  <span className="material-symbols-outlined text-on-surface-variant">credit_card</span>
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-on-surface">Cartão</p>
                    <p className="text-[11px] text-on-surface-variant">Débito ou crédito</p>
                  </div>
                </button>
              </div>

              {method === "pix" && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                  <div className="bg-white p-4 rounded-xl shadow-inner mb-4 relative">
                    <img
                      alt="QR Code PIX"
                      className="w-40 h-40 opacity-90"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuADlRrD1BjMp04tGDLv2wzGQQVV_X5RyUcz_D6rWkE9r_PhhXzuulp8nWXTblztro8gHTg1LqCCn7qwmCET350gOe1nqurCPth9cHatFddpBcdy9ztWp8WQ8gAIWizN860fYRtB20m-Il3Q_UyH6qyqKjClg5mRO1Ou_ZZFBZ_0B3oC1VOsrR-QWiTk6Fh7UJD0cWUmFnLOMnMftNDGxVe99Dps0Gw1_I8VdDOhcJf_9neyqeAhXZKgqlFb_l5Ui0OvBCMcvjSSjJc"
                    />
                  </div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-1">
                    Escaneie para pagar
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Acesse o app do seu banco e escolha pagar via PIX.
                  </p>
                  <button className="flex items-center gap-2 text-primary font-label-md text-label-md hover:underline">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Copiar código PIX
                  </button>
                </div>
              )}

              {method === "card" && (
                <div className="glass-panel p-6 rounded-xl border border-outline-variant/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className="w-full bg-surface border border-outline-variant/40 rounded-lg p-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/10 font-body-md text-body-md"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                        Nome Impresso
                      </label>
                      <input
                        type="text"
                        placeholder="Como no cartão"
                        className="w-full bg-surface border border-outline-variant/40 rounded-lg p-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/10 font-body-md text-body-md"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                        Validade
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full bg-surface border border-outline-variant/40 rounded-lg p-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/10 font-body-md text-body-md"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full bg-surface border border-outline-variant/40 rounded-lg p-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/10 font-body-md text-body-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl bg-surface-variant">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    {quantidade} crédito{quantidade > 1 ? "s" : ""}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {formatarMoeda(total)}
                  </span>
                </div>
                <div className="border-t border-outline-variant/30 pt-2 flex justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Total a pagar
                  </span>
                  <span className="font-headline-md-mobile text-headline-md-mobile text-primary font-bold">
                    {formatarMoeda(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleComprar}
                disabled={buying}
                className="w-full mt-4 bg-primary text-on-primary py-4 rounded-full font-headline-md-mobile text-headline-md-mobile shadow-lg shadow-primary/20 hover:brightness-110 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {buying ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check</span>
                    Confirmar Compra
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
