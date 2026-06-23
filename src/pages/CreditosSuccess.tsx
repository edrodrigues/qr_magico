import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function CreditosSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [status, setStatus] = useState<"checking" | "confirmed" | "pending">("checking");
  const [saldo, setSaldo] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;

    const orderNsu = searchParams.get("order_nsu");
    const transactionNsu = searchParams.get("transaction_nsu");
    const slug = searchParams.get("slug");

    const check = async () => {
      try {
        if (transactionNsu || slug) {
          const checkRes = await fetch(`${EDGE_URL}/check-infinitepay-payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              order_nsu: orderNsu,
              transaction_nsu: transactionNsu,
              slug,
            }),
          });

          if (checkRes.ok) {
            const data = await checkRes.json();
            if (data.paid) {
              const { data: novoSaldo } = await supabase.rpc("obter_saldo_creditos");
              if (typeof novoSaldo === "number") setSaldo(novoSaldo);
              setStatus("confirmed");
              return;
            }
          }
        }

        const { data: novoSaldo } = await supabase.rpc("obter_saldo_creditos");
        if (typeof novoSaldo === "number" && novoSaldo > 0) {
          setSaldo(novoSaldo);
          setStatus("confirmed");
          return;
        }

        setStatus("pending");
      } catch (err) {
        console.error("CreditosSuccess check error:", err);
        setStatus("pending");
      }
    };

    check();
  }, [session, searchParams]);

  useEffect(() => {
    if (status === "confirmed") {
      const timer = setTimeout(() => navigate("/dashboard/creditos"), 5000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="bg-soft-cream text-on-surface font-body-md min-h-screen">
      <Header showNav={false} />

      <main className="pt-32 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass-panel p-12 rounded-3xl border border-outline-variant/30 max-w-lg w-full text-center">
          {status === "checking" && (
            <>
              <span className="material-symbols-outlined text-primary text-[72px] mb-6 animate-pulse">
                hourglass_top
              </span>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">
                Verificando compra
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Aguarde enquanto confirmamos seu pagamento...
              </p>
            </>
          )}

          {status === "confirmed" && (
            <>
              <span className="material-symbols-outlined text-green-500 text-[72px] mb-6">
                check_circle
              </span>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">
                Créditos adicionados!
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">
                Seus créditos já estão disponíveis.
              </p>
              {saldo !== null && (
                <div className="bg-primary-fixed p-4 rounded-xl mb-6">
                  <p className="font-title-lg text-title-lg text-primary font-bold">
                    {saldo} crédito{saldo !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
              <p className="text-sm text-on-surface-variant mb-6">
                Redirecionando em 5 segundos...
              </p>
              <button
                onClick={() => navigate("/dashboard/creditos")}
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
              >
                Ver meus créditos
              </button>
            </>
          )}

          {status === "pending" && (
            <>
              <span className="material-symbols-outlined text-amber-500 text-[72px] mb-6">
                pending
              </span>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">
                Compra recebida!
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
                Recebemos sua solicitação de compra. Os créditos serão liberados em instantes.
              </p>
              <button
                onClick={() => navigate("/dashboard/creditos")}
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
              >
                Ver meus créditos
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
