import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/Header";
import { useWizard } from "../contexts/WizardContext";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { useVideoCompressor } from "../hooks/useVideoCompressor";
import { useVideoDuration } from "../hooks/useVideoDuration";

const MAX_ITEMS = 6;
const MAX_VIDEO_SECONDS = 20;

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function WizardUploadFotos() {
  const navigate = useNavigate();
  const { data, setPhotos, draftId } = useWizard();
  const { photos } = data;
  const [uploading, setUploading] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { compressVideo, loaded: ffmpegLoaded, load: loadFfmpeg } = useVideoCompressor();
  const { getDuration } = useVideoDuration();

  const uploadToStorage = useCallback(async (files: File[]) => {
    setUploading(true);
    setProgress(0);
    setStatusMsg("Carregando memorias...");
    const uploaded: typeof photos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = isVideoFile(file);

      if (isVideo) {
        const duration = await getDuration(file);
        if (duration > MAX_VIDEO_SECONDS) {
          setStatusMsg(`Video muito longo (${Math.round(duration)}s). Maximo ${MAX_VIDEO_SECONDS}s.`);
          setProgress(Math.round(((i + 1) / files.length) * 100));
          continue;
        }
        setStatusMsg(`Comprimindo video ${i + 1}/${files.length}...`);
        setProgress(Math.round(((i + 1) / files.length) * 30));
        const compressed = await compressVideo(file);
        setStatusMsg(`Enviando video ${i + 1}/${files.length}...`);
        setProgress(Math.round(((i + 1) / files.length) * 70));

        const uniqueId = crypto.randomUUID();
        const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `uploads/${Date.now()}_${uniqueId}_${safeName}`;
        const { error } = await supabase.storage.from("videos").upload(path, compressed);
        if (error) {
          console.error("Upload error:", error.message);
          setProgress(Math.round(((i + 1) / files.length) * 100));
          continue;
        }
        const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);
        uploaded.push({
          file: compressed,
          preview: URL.createObjectURL(compressed),
          storageUrl: urlData?.publicUrl || "",
          type: "video",
        });
      } else {
        setStatusMsg(`Enviando foto ${i + 1}/${files.length}...`);
        setProgress(Math.round(((i + 1) / files.length) * 70));

        const uniqueId = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `uploads/${Date.now()}_${uniqueId}_${safeName}`;
        const { error } = await supabase.storage.from("fotos").upload(path, file);
        if (error) {
          console.error("Upload error:", error.message);
          setProgress(Math.round(((i + 1) / files.length) * 100));
          continue;
        }
        const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(path);
        uploaded.push({
          file,
          preview: URL.createObjectURL(file),
          storageUrl: urlData?.publicUrl || "",
          type: "image",
        });
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setPhotos((current) => [...current, ...uploaded]);
    setUploading(false);
    setProgress(0);
    setStatusMsg("");
  }, [setPhotos, compressVideo, getDuration]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => isImageFile(f) || isVideoFile(f)
      );
      if (files.length) uploadToStorage(files);
    },
    [uploadToStorage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter(
        (f) => isImageFile(f) || isVideoFile(f)
      );
      if (files.length) uploadToStorage(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadToStorage]
  );

  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).classList.add("opacity-50");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleReorderDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      const sourceIndex = dragIndexRef.current;
      if (sourceIndex === null || sourceIndex === targetIndex) return;
      setPhotos((current) => {
        const updated = [...current];
        const [moved] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, moved);
        return updated;
      });
      dragIndexRef.current = null;
    },
    [setPhotos]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("opacity-50");
    dragIndexRef.current = null;
  }, []);

  const removePhoto = useCallback((index: number) => {
    const updated = [...photos];
    if (updated[index].file) {
      URL.revokeObjectURL(updated[index].preview);
    }
    updated.splice(index, 1);
    setPhotos(updated);
  }, [photos, setPhotos]);

  const handleClickUpload = useCallback(() => {
    if (!uploading && photos.length < MAX_ITEMS) {
      fileInputRef.current?.click();
    }
  }, [uploading, photos.length]);

  useEffect(() => {
    if (typeof SharedArrayBuffer !== "undefined" && !ffmpegLoaded) {
      loadFfmpeg();
    }
  }, []);

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        if (photo.file) {
          URL.revokeObjectURL(photo.preview);
        }
      }
    };
  }, []);

  const handleNext = useCallback(async () => {
    if (photos.length === 0) return;
    const photosWithUrl = photos.filter((p) => p.storageUrl);
    if (draftId && photosWithUrl.length > 0) {
      setSavingPhotos(true);
      await supabase.from("fotos").delete().eq("presente_id", draftId);
      const inserts = photosWithUrl.map((photo, index) => ({
        presente_id: draftId,
        url: photo.storageUrl!,
        ordem: index,
        type: photo.type,
      }));
      const { error } = await supabase.from("fotos").insert(inserts);
      if (error) console.error("Erro ao salvar fotos:", error.message);
      setSavingPhotos(false);
    }
    navigate("/wizard/revisao-final");
  }, [photos, draftId, navigate]);

  const enabled = photos.length > 0;
  const slotsLeft = MAX_ITEMS - photos.length;

  return (
    <div className="bg-soft-cream min-h-screen flex flex-col font-body-md text-on-surface">
      <Header showNav />

      <main className="flex-grow pt-24 pb-12 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto w-full">
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-sm font-bold">
                  {n}
                </div>
                <div className="h-1 w-8 bg-primary-container rounded-full" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold ring-4 ring-primary-fixed shadow-[0_0_15px_rgba(217,83,83,0.3)]">
              5
            </div>
            <div className="h-1 w-8 bg-surface-container-highest rounded-full" />
            <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-label-sm font-bold">
              6
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-headline-md md:text-display-lg text-headline-md-mobile md:font-display-lg text-primary mb-2">
            Suas mem&oacute;rias
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Selecione at&eacute; 6 fotos ou v&iacute;deos (at&eacute; 20s) que
            marcaram a trajet&oacute;ria de voc&ecirc;s.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div
            className={cn(
              "relative p-10 mb-8 cursor-pointer text-center rounded-2xl border-2 border-dashed border-secondary transition-all duration-300",
              dragOver && "bg-gold-glimmer/40",
              !dragOver && "hover:bg-gold-glimmer/30"
            )}
            onClick={handleClickUpload}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center">
              <span
                className="material-symbols-outlined text-secondary text-5xl mb-4 group-hover:scale-110 transition-transform"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                auto_awesome
              </span>
              <h3 className="font-title-lg text-title-lg text-secondary mb-2">
                Arraste suas fotos ou v&iacute;deos aqui
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                ou clique para selecionar do seu dispositivo
              </p>
              <p className="text-label-sm text-on-surface-variant mt-2 opacity-70">
                {slotsLeft > 0
                  ? `${slotsLeft} slot${slotsLeft > 1 ? "s" : ""} dispon${slotsLeft > 1 ? "iveis" : "ivel"}`
                  : "Limite atingido"}
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-label-md text-primary font-semibold">
                  {statusMsg || "Carregando memorias..."}
                </span>
                <span className="text-label-md text-on-surface-variant">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: MAX_ITEMS }).map((_, i) => {
              const photo = photos[i];
              if (photo) {
                const isVideo = photo.type === "video";
                return (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleReorderDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className="relative group aspect-square rounded-2xl overflow-hidden shadow-md bg-white border border-outline-variant/30 transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing"
                  >
                    {isVideo ? (
                      <video
                        src={photo.preview}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        loop
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => {
                          const v = e.target as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                    ) : (
                      <img
                        src={photo.preview}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-white text-[18px] drop-shadow-md">
                          drag_indicator
                        </span>
                        <button
                          onClick={() => removePhoto(i)}
                          className="p-1.5 bg-error/80 backdrop-blur rounded-lg text-white hover:bg-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                      <div className="bg-white/20 backdrop-blur px-2 py-1 rounded text-white text-[10px] font-bold self-center">
                        {isVideo ? `VIDEO ${i + 1}` : `FOTO ${i + 1}`}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  className="relative border-2 border-dashed border-outline-variant/20 aspect-square rounded-2xl flex flex-col items-center justify-center text-outline-variant bg-surface-container-lowest/30"
                >
                  <span className="material-symbols-outlined opacity-30 mb-1">
                    add_photo_alternate
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                    Slot {i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant mb-10 bg-warm-gray/50 p-4 rounded-xl">
            <span className="material-symbols-outlined text-[20px]">info</span>
            <p className="text-label-md">
              Dica: Arraste para mudar a ordem. Videos de ate 20 segundos sao
              comprimidos automaticamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => navigate("/wizard/estilo-musical")}
              className="w-full sm:w-auto px-8 py-3 rounded-full border-[1.5px] border-primary text-primary font-label-md text-label-md hover:bg-primary-fixed/30 transition-all"
            >
              Voltar
            </button>
            <button
              disabled={!enabled || savingPhotos}
              onClick={handleNext}
              className={cn(
                "w-full sm:w-auto px-12 py-3 rounded-full font-label-md text-label-md transition-all",
                enabled && !savingPhotos
                  ? "bg-primary text-on-primary hover:opacity-90 scale-95 active:scale-90"
                  : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50"
              )}
            >
              {savingPhotos ? "Salvando..." : "Proximo"}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
