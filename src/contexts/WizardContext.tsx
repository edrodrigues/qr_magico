import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface PhotoFile {
  file: File;
  preview: string;
}

interface WizardData {
  name: string;
  occasion: string;
  startDate: string;
  story: string;
  musicStyle: string;
  photos: PhotoFile[];
}

interface WizardContextType {
  data: WizardData;
  setName: (name: string) => void;
  setOccasion: (occasion: string) => void;
  setStartDate: (date: string) => void;
  setStory: (story: string) => void;
  setMusicStyle: (style: string) => void;
  setPhotos: (photosOrSetter: PhotoFile[] | ((prev: PhotoFile[]) => PhotoFile[])) => void;
  currentStep: number;
  totalSteps: number;
  draftId: string | null;
  setDraftId: (id: string | null) => void;
  saveDraft: (fields: Record<string, string>) => Promise<{ error: string | null; slug?: string }>;
  isSaving: boolean;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const EMPTY_DATA: WizardData = {
  name: "",
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

export function WizardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<WizardData>(EMPTY_DATA);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, name }));
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
        return { error: null };
      }
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
      if (error) return { error: error.message };
      if (inserted) setDraftId(inserted.id);
      return { error: null, slug };
    } finally {
      setIsSaving(false);
    }
  }, [user, draftId]);

  const resetWizard = useCallback(() => {
    setData(EMPTY_DATA);
    setDraftId(null);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        data,
        setName,
        setOccasion,
        setStartDate,
        setStory,
        setMusicStyle,
        setPhotos,
        currentStep: 1,
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
