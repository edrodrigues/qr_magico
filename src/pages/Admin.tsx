import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";

type TabId = "usuarios" | "cupons";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface CupomRow {
  id: string;
  codigo: string;
  uso_maximo: number;
  criado_em: string;
  total_usos: number;
}

export function Admin() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("cupons");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [cupons, setCupons] = useState<CupomRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCupons, setLoadingCupons] = useState(true);
  const [newCodigo, setNewCodigo] = useState("");
  const [newUsoMaximo, setNewUsoMaximo] = useState("5");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeTab !== "usuarios") return;
    setLoadingUsers(true);
    supabase
      .rpc("admin_list_users")
      .then(({ data, error }) => {
        if (error) {
          addToast("Erro ao carregar usuários", "error");
        } else {
          setUsers(data || []);
        }
        setLoadingUsers(false);
      });
  }, [activeTab, addToast]);

  useEffect(() => {
    setLoadingCupons(true);
    supabase
      .from("cupons")
      .select("id, codigo, uso_maximo, criado_em")
      .order("criado_em", { ascending: false })
      .then(async ({ data: cuponsData, error }) => {
        if (error) {
          addToast("Erro ao carregar cupons", "error");
          setLoadingCupons(false);
          return;
        }
        const rows: CupomRow[] = [];
        for (const c of cuponsData || []) {
          const { count } = await supabase
            .from("cupons_uso")
            .select("id", { count: "exact", head: true })
            .eq("cupom_id", c.id);
          rows.push({
            id: c.id,
            codigo: c.codigo,
            uso_maximo: c.uso_maximo,
            criado_em: c.criado_em,
            total_usos: count ?? 0,
          });
        }
        setCupons(rows);
        setLoadingCupons(false);
      });
  }, [addToast]);

  const handleCreateCupom = async () => {
    const codigo = newCodigo.trim().toUpperCase();
    if (!codigo) {
      addToast("Insira um código para o cupom.", "error");
      return;
    }
    const usoMaximo = parseInt(newUsoMaximo, 10);
    if (isNaN(usoMaximo) || usoMaximo < 1) {
      addToast("O número máximo de usos deve ser pelo menos 1.", "error");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("cupons").insert({
      codigo,
      uso_maximo: usoMaximo,
    });
    if (error) {
      if (error.code === "23505") {
        addToast("Já existe um cupom com este código.", "error");
      } else {
        addToast("Erro ao criar cupom.", "error");
      }
    } else {
      addToast(`Cupom "${codigo}" criado com sucesso!`, "success");
      setNewCodigo("");
      setNewUsoMaximo("5");
      // refresh list
      setLoadingCupons(true);
      const { data } = await supabase
        .from("cupons")
        .select("id, codigo, uso_maximo, criado_em")
        .order("criado_em", { ascending: false });
      const rows: CupomRow[] = [];
      for (const c of data || []) {
        const { count } = await supabase
          .from("cupons_uso")
          .select("id", { count: "exact", head: true })
          .eq("cupom_id", c.id);
        rows.push({
          id: c.id,
          codigo: c.codigo,
          uso_maximo: c.uso_maximo,
          criado_em: c.criado_em,
          total_usos: count ?? 0,
        });
      }
      setCupons(rows);
      setLoadingCupons(false);
    }
    setCreating(false);
  };

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
                <span className="text-primary font-bold">{user?.email}</span>
              </p>
              <h1 className="font-headline-md-mobile md:text-headline-md text-headline-md text-on-surface">
                Administração
              </h1>
            </div>
          </div>
        </header>

        <div className="flex gap-2 mb-8 animate-reveal" style={{ animationDelay: "0.1s" }}>
          {[
            { id: "cupons" as TabId, label: "Cupons" },
            { id: "usuarios" as TabId, label: "Usuários" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-all",
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-higher"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "cupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop animate-reveal">
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card p-6 rounded-xl">
                <h2 className="font-title-md text-title-md text-on-surface mb-4">
                  Criar Novo Cupom
                </h2>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                      Código
                    </label>
                    <input
                      type="text"
                      value={newCodigo}
                      onChange={(e) => setNewCodigo(e.target.value.toUpperCase())}
                      placeholder="Ex: PROMO50"
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-outline-variant/40 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all uppercase tracking-widest"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                      Usos máx.
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newUsoMaximo}
                      onChange={(e) => setNewUsoMaximo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-outline-variant/40 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleCreateCupom}
                    disabled={creating || !newCodigo.trim()}
                    className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        Criando...
                      </>
                    ) : (
                      "Criar Cupom"
                    )}
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-6 pb-0">
                  <h2 className="font-title-md text-title-md text-on-surface mb-1">
                    Cupons existentes
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                    {cupons.length} cupom{cupons.length !== 1 ? "s" : ""} cadastrado{cupons.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {loadingCupons ? (
                  <div className="p-6 space-y-3">
                    <div className="skeleton h-12 w-full rounded-lg" />
                    <div className="skeleton h-12 w-full rounded-lg" />
                    <div className="skeleton h-12 w-full rounded-lg" />
                  </div>
                ) : cupons.length === 0 ? (
                  <p className="p-6 text-center text-on-surface-variant font-body-md">
                    Nenhum cupom cadastrado.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-outline-variant/30">
                          <th className="text-left px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            Código
                          </th>
                          <th className="text-left px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            Usos
                          </th>
                          <th className="text-left px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden md:table-cell">
                            Criado em
                          </th>
                          <th className="text-right px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                            Disponível
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cupons.map((cp) => (
                          <tr
                            key={cp.id}
                            className="border-b border-outline-variant/10 hover:bg-surface-variant/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-label-md text-label-md text-on-surface font-bold tracking-wider">
                                {cp.codigo}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-body-md text-body-md text-on-surface">
                                {cp.total_usos} / {cp.uso_maximo}
                              </span>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="font-body-md text-body-md text-on-surface-variant">
                                {new Date(cp.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {cp.total_usos < cp.uso_maximo ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                  Sim
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-error">
                                  <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                                  Esgotado
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="glass-card p-6 rounded-xl sticky top-32 space-y-6">
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface mb-2">
                    Gerenciamento de Cupons
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Crie novos cupons de desconto e acompanhe quantos usos cada um já teve.
                    Cada cupom pode ser configurado com um limite máximo de usos.
                  </p>
                </div>
                <div className="border-t border-outline-variant/30 pt-6">
                  <p className="font-label-sm text-label-sm text-on-surface-variant mb-3">
                    Totais
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-variant">
                      <span className="font-label-md text-label-md text-on-surface">Total de cupons</span>
                      <span className="font-title-md text-title-md text-primary">{cupons.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-surface-variant">
                      <span className="font-label-md text-label-md text-on-surface">Usos realizados</span>
                      <span className="font-title-md text-title-md text-primary">
                        {cupons.reduce((s, c) => s + c.total_usos, 0)}
                      </span>
                    </div>
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

        {activeTab === "usuarios" && (
          <div className="animate-reveal">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-6 pb-0">
                <h2 className="font-title-md text-title-md text-on-surface mb-1">
                  Usuários cadastrados
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                  {users.length} usuário{users.length !== 1 ? "s" : ""}
                </p>
              </div>
              {loadingUsers ? (
                <div className="p-6 space-y-3">
                  <div className="skeleton h-12 w-full rounded-lg" />
                  <div className="skeleton h-12 w-full rounded-lg" />
                  <div className="skeleton h-12 w-full rounded-lg" />
                </div>
              ) : users.length === 0 ? (
                <p className="p-6 text-center text-on-surface-variant font-body-md">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        <th className="text-left px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden md:table-cell">
                          Cadastrado em
                        </th>
                        <th className="text-left px-6 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden md:table-cell">
                          Último acesso
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-variant/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-body-md text-body-md text-on-surface">
                              {u.email}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="font-body-md text-body-md text-on-surface-variant">
                              {new Date(u.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="font-body-md text-body-md text-on-surface-variant">
                              {u.last_sign_in_at
                                ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
