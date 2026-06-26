import { supabase } from "./supabase";

export type CreditoTransacao = {
  id: string;
  tipo: "compra" | "consumo" | "bonus";
  quantidade: number;
  descricao: string;
  created_at: string;
};

export type CupomResgatado = {
  id: string;
  codigo: string;
  usado_em: string;
};

type RpcResult = { success?: boolean; error?: string };

type CupomUsoRow = {
  id: string;
  usado_em: string;
  cupom: { codigo: string };
};

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapCuponsResgatados(rows: CupomUsoRow[]): CupomResgatado[] {
  return rows.map((r) => ({
    id: r.id,
    codigo: r.cupom.codigo,
    usado_em: r.usado_em,
  }));
}

export async function obterSaldoCreditos(): Promise<number | null> {
  const { data, error } = await supabase.rpc("obter_saldo_creditos");
  if (error) return null;
  return typeof data === "number" ? data : null;
}

export async function fetchDadosCreditos(userId: string) {
  const [saldoRes, transacoesRes, cuponsRes] = await Promise.all([
    supabase.rpc("obter_saldo_creditos"),
    supabase
      .from("creditos_transacoes")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("cupons_uso")
      .select("id, usado_em, cupom:cupons(codigo)")
      .eq("usuario_id", userId)
      .order("usado_em", { ascending: false }),
  ]);

  return {
    saldo: saldoRes.error ? null : (saldoRes.data as number),
    transacoes: transacoesRes.error ? [] : (transacoesRes.data as CreditoTransacao[]),
    cuponsResgatados: cuponsRes.error
      ? []
      : mapCuponsResgatados(cuponsRes.data as unknown as CupomUsoRow[]),
  };
}

export async function resgatarCupom(codigo: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("resgatar_cupom", {
    codigo_cupom: codigo,
  });

  const result = data as RpcResult | null;

  if (error) {
    return { ok: false, error: error.message };
  }
  if (result?.error) {
    return { ok: false, error: result.error };
  }
  if (!result?.success) {
    return { ok: false, error: "Não foi possível resgatar o cupom." };
  }

  return { ok: true };
}

export function normalizarDescricao(descricao: string): string {
  return descricao.replace(/^B\?\?nus/g, "Bônus");
}

export function labelTransacao(t: CreditoTransacao): string {
  if (t.descricao) return normalizarDescricao(t.descricao);
  if (t.tipo === "compra") return "Compra de créditos";
  if (t.tipo === "consumo") return "Consumo";
  return "Bônus";
}
