import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type PaymentStatus = "checking" | "paid" | "pending" | "failed";

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("checking");

  useEffect(() => {
    if (!session) return;

    const orderNsu = searchParams.get("order_nsu");
    const slug = searchParams.get("slug");
    const transactionNsu = searchParams.get("transaction_nsu");

    const presenteId = searchParams.get("presente_id");

    const checkPayment = async () => {
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
              setStatus("paid");
              return;
            }
          }
        }

        if (presenteId) {
          const { data: presente } = await supabase
            .from("presentes")
            .select("status")
            .eq("id", presenteId)
            .single();

          if (presente?.status === "generating" || presente?.status === "ready") {
            setStatus("paid");
            return;
          }

          if (presente?.status === "failed") {
            setStatus("failed");
            return;
          }
        }

        setStatus("pending");
      } catch (err) {
        console.error("checkPayment error:", err);
        setStatus("pending");
      }
    };

    checkPayment();
  }, [session, searchParams]);

  const redirectCountdown = () => {
    setTimeout(() => navigate("/dashboard"), 5000);
  };

  useEffect(() => {
    if (status === "paid") {
      redirectCountdown();
    }
  }, [status]);

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
                Verificando pagamento
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Aguarde enquanto confirmamos seu pagamento...
              </p>
            </>
          )}

          {status === "paid" && (
            <>
              <span className="material-symbols-outlined text-green-500 text-[72px] mb-6">
                check_circle
              </span>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">
                Pagamento confirmado!
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
                Seu Momento Mágico está sendo gerado e ficará pronto em instantes.
              </p>
              <p className="text-sm text-on-surface-variant">
                Redirecionando para o dashboard em 5 segundos...
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-6 bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
              >
                Ir para Dashboard
              </button>
            </>
          )}

          {status === "pending" && (
            <>
              <span className="material-symbols-outlined text-amber-500 text-[72px] mb-6">
                pending
              </span>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">
                Pagamento recebido!
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-4">
                Seu pagamento foi recebido e estamos processando. Em instantes seu Momento Mágico
                estará disponível.
              </p>
              <p className="text-sm text-on-surface-variant mb-6">
                O status será atualizado automaticamente.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
              >
                Ir para Dashboard
              </button>
            </>
          )}

          {status === "failed" && (
            <>
              <span className="material-symbols-outlined text-red-500 text-[72px] mb-6">
                error
              </span>
              <h1 className="font-headline-md text-headline-md text-primary mb-3">
                Algo deu errado
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
                Não foi possível processar seu pedido. Entre em contato com o suporte.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:brightness-110 transition-all"
              >
                Voltar ao Dashboard
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
