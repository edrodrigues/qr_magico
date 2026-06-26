import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import {
  type CreditoTransacao,
  type CupomResgatado,
  fetchDadosCreditos,
  formatarData,
  formatarHora,
  formatarMoeda,
  labelTransacao,
  resgatarCupom,
} from "../lib/creditos";
import { cn } from "../lib/utils";
import { getAppOrigin } from "../lib/appUrl";

const PRECO_UNITARIO = 19.9;
const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function Creditos() {
  const { user, session } = useAuth();
  const { addToast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const [quantidade, setQuantidade] = useState(1);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [transacoes, setTransacoes] = useState<CreditoTransacao[]>([]);
  const [cuponsResgatados, setCuponsResgatados] = useState<CupomResgatado[]>([]);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [buying, setBuying] = useState(false);

  const carregarDados = async () => {
    if (!user) return;
    const dados = await fetchDadosCreditos(user.id);
    setSaldo(dados.saldo);
    setTransacoes(dados.transacoes);
    setCuponsResgatados(dados.cuponsResgatados);
    setLoadingSaldo(false);
  };

  useEffect(() => {
    carregarDados();
  }, [user]);

  const handleRedeem = async () => {
    const trimmed = codigo.trim();
    if (!trimmed) {
      addToast("Insira um código de cupom.", "error");
      return;
    }
    setRedeeming(true);

    const { ok, error } = await resgatarCupom(trimmed);

    if (!ok) {
      addToast(error || "Erro ao resgatar cupom.", "error");
    } else {
      addToast("Cupom resgatado! 1 crédito concedido.", "success");
      setCodigo("");
      await carregarDados();
    }
    setRedeeming(false);
  };

  const handleComprar = async () => {
    if (!user || !session) {
      addToast("Usuário não autenticado.", "error");
      return;
    }
    setBuying(true);
    try {
      const totalCentavos = Math.round(PRECO_UNITARIO * quantidade * 100);

      const linkRes = await fetch(`${EDGE_URL}/create-infinitepay-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tipo: "creditos",
          quantidade_creditos: quantidade,
          valor_centavos: totalCentavos,
          redirect_base_url: getAppOrigin(),
          customer: {
            name: user?.user_metadata?.full_name || "",
            email: user?.email || "",
          },
        }),
      });

      if (!linkRes.ok) {
        const errBody = await linkRes.text();
        console.error("create-infinitepay-link error:", errBody);
        addToast("Erro ao criar link de pagamento. Tente novamente.", "error");
        return;
      }

      const { checkout_url } = await linkRes.json();
      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        addToast("Erro: link de pagamento não recebido", "error");
      }
    } catch (err) {
      console.error("handleComprar error:", err);
      addToast("Erro ao processar compra", "error");
    } finally {
      setBuying(false);
    }
  };

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Visitante";

  const total = PRECO_UNITARIO * quantidade;
  const podeCriarPresente = saldo !== null && saldo > 0;

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

        {loadingSaldo ? (
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
                    Insira um código de cupom para ganhar 1 crédito e criar seu Momento Mágico.
                </p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="Digite o código do cupom"
                    className="flex-1 px-4 py-3 rounded-lg bg-surface border border-outline-variant/40 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all uppercase tracking-widest"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming || !codigo.trim()}
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
                        Você tem {saldo} crédito{saldo !== 1 ? "s" : ""} disponível. Crie seu Momento Mágico agora!
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
                      saldo !== null && saldo > 0 ? "text-primary" : "text-outline"
                    )}>
                      {saldo !== null && saldo > 0
                        ? "check_circle"
                        : "hourglass_empty"}
                    </span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">
                        {loadingSaldo
                          ? "Carregando..."
                          : saldo !== null && saldo > 0
                            ? `${saldo} crédito${saldo !== 1 ? "s" : ""} disponível`
                            : "Nenhum crédito disponível"}
                      </p>
                      {saldo !== null && (
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
                        { icon: "shopping_cart", text: "Compre créditos ou resgate um cupom." },
                        { icon: "check_circle", text: "Os créditos são liberados na hora." },
                        { icon: "auto_awesome", text: "Cada crédito gera 1 Momento Mágico." },
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

                {cuponsResgatados.length > 0 && (
                  <div className="border-t border-outline-variant/30 pt-6">
                    <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">
                      Cupons resgatados
                    </p>
                    <div className="space-y-2">
                      {cuponsResgatados.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-variant/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0">
                              card_giftcard
                            </span>
                            <span className="font-label-md text-label-md text-on-surface font-bold tracking-wider">
                              {c.codigo}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <span className="font-label-md text-label-md text-green-700">
                              Resgatado
                            </span>
                            <p className="text-[10px] text-on-surface-variant">
                              {formatarData(c.usado_em)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                              {labelTransacao(t)}
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
              <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-primary text-[48px] mb-4">
                  qr_code_2
                </span>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-2">
                  Pagamento via InfinityPay
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 max-w-sm">
                  Você será redirecionado para o checkout seguro da InfinityPay para finalizar
                  a compra de {quantidade} crédito{quantidade > 1 ? "s" : ""}.
                </p>
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">pix</span>
                    <span className="font-label-md text-label-md text-on-surface">PIX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">credit_card</span>
                    <span className="font-label-md text-label-md text-on-surface">Cartão</span>
                  </div>
                </div>
              </div>

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
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">check</span>
                    Ir para Pagamento
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
