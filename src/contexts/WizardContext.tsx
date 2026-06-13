import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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
  setPhotos: (photos: PhotoFile[]) => void;
  currentStep: number;
  totalSteps: number;
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

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardData>(EMPTY_DATA);

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

  const setPhotos = useCallback((photos: PhotoFile[]) => {
    setData((prev) => ({ ...prev, photos }));
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
