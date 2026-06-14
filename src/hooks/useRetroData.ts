import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { PresenteData, FotoData, MusicaData, RetroData } from "../types/retro";

interface UseRetroDataResult {
  data: RetroData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRetroData(slug: string): UseRetroDataResult {
  const [data, setData] = useState<RetroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) {
      setError("Link inválido");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: presente, error: presenteErr } = await supabase
      .from("presentes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (presenteErr || !presente) {
      setError(presenteErr?.message === "No rows found" ? "Presente não encontrado" : "Erro ao carregar");
      setLoading(false);
      return;
    }

    const presenteData = presente as PresenteData;

    const [fotosRes, musicasRes] = await Promise.all([
      supabase
        .from("fotos")
        .select("*")
        .eq("presente_id", presenteData.id)
        .order("ordem", { ascending: true }),
      supabase
        .from("musicas")
        .select("*")
        .eq("presente_id", presenteData.id)
        .maybeSingle(),
    ]);

    setData({
      presente: presenteData,
      fotos: (fotosRes.data as FotoData[]) ?? [],
      musica: (musicasRes.data as MusicaData) ?? null,
    });
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
