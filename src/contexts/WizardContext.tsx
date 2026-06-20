import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface PhotoFile {
  file: File;
  preview: string;
  storageUrl?: string;
}

interface WizardData {
  name: string;
  remetente: string;
  occasion: string;
  startDate: string;
  story: string;
  musicStyle: string;
  photos: PhotoFile[];
}

interface WizardContextType {
  data: WizardData;
  setName: (name: string) => void;
  setRemetente: (remetente: string) => void;
  setOccasion: (occasion: string) => void;
  setStartDate: (date: string) => void;
  setStory: (story: string) => void;
  setMusicStyle: (style: string) => void;
  setPhotos: (photosOrSetter: PhotoFile[] | ((prev: PhotoFile[]) => PhotoFile[])) => void;
  currentStep: number;
  totalSteps: number;
  draftId: string | null;
  setDraftId: (id: string | null) => void;
  saveDraft: (fields: Record<string, string>) => Promise<{ error: string | null; slug?: string; id?: string }>;
  isSaving: boolean;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const EMPTY_DATA: WizardData = {
  name: "",
  remetente: "",
  occasion: "",
  startDate: "",
  story: "",
  musicStyle: "",
  photos: [],
};

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "presente";
  const suffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

const STEP_FROM_PATH: Record<string, number> = {
  "/wizard/ocasiao-nome": 1,
  "/wizard/data-relacao": 2,
  "/wizard/relacao-sentimento": 3,
  "/wizard/estilo-musical": 4,
  "/wizard/upload-fotos": 5,
  "/wizard/revisao-final": 6,
  "/wizard/pagamento": 7,
};

export function WizardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState<WizardData>(EMPTY_DATA);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const currentStep = useMemo(() => STEP_FROM_PATH[location.pathname] ?? 1, [location.pathname]);

  const setName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, name }));
  }, []);

  const setRemetente = useCallback((remetente: string) => {
    setData((prev) => ({ ...prev, remetente }));
  }, []);

  const setOccasion = useCallback((occasion: string) => {
    setData((prev) => ({ ...prev, occasion }));
  }, []);

  const setStartDate = useCallback((startDate: string) => {
    setData((prev) => ({ ...prev, startDate }));
  }, []);

  const setStory = useCallback((story: string) => {
    setData((prev) => ({ ...prev, story }));
  }, []);

  const setMusicStyle = useCallback((musicStyle: string) => {
    setData((prev) => ({ ...prev, musicStyle }));
  }, []);

  const setPhotos = useCallback(
    (photosOrSetter: PhotoFile[] | ((prev: PhotoFile[]) => PhotoFile[])) => {
      setData((prev) => {
        const photos =
          typeof photosOrSetter === "function"
            ? photosOrSetter(prev.photos)
            : photosOrSetter;
        return { ...prev, photos };
      });
    },
    []
  );

  const saveDraft = useCallback(async (fields: Record<string, string>) => {
    if (!user) return { error: "Usuário não autenticado" };
    setIsSaving(true);
    try {
      if (draftId) {
        const { error } = await supabase
          .from("presentes")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", draftId);
        if (error) return { error: error.message };
        return { error: null, id: draftId };
      }
      let lastError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const slug = generateSlug(fields.nome_homenageado || "presente");
        const { data: inserted, error } = await supabase
          .from("presentes")
          .insert({
            usuario_id: user.id,
            slug,
            status: "draft",
            ...fields,
          })
          .select("id")
          .single();
        if (!error) {
          if (inserted) {
            setDraftId(inserted.id);
            return { error: null, slug, id: inserted.id };
          }
        }
        if (error.code !== "23505") {
          return { error: error.message };
        }
        lastError = error.message;
      }
      return { error: lastError || "Erro ao criar presente" };
    } finally {
      setIsSaving(false);
    }
  }, [user, draftId]);

  const resetWizard = useCallback(() => {
    setData((prev) => {
      for (const photo of prev.photos) {
        URL.revokeObjectURL(photo.preview);
      }
      return EMPTY_DATA;
    });
    setDraftId(null);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        data,
        setName,
        setRemetente,
        setOccasion,
        setStartDate,
        setStory,
        setMusicStyle,
        setPhotos,
        currentStep,
        totalSteps: 7,
        draftId,
        setDraftId,
        saveDraft,
        isSaving,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
