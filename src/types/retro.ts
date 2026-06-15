export interface PresenteData {
  id: string;
  slug: string;
  usuario_id: string;
  nome_homenageado: string;
  nome_remetente: string;
  ocasiao: string;
  data_inicio: string;
  data_ocasiao: string;
  descricao_relacao: string;
  estilo_musical: string;
  thumbnail_url: string;
  status: 'draft' | 'pending_payment' | 'generating' | 'ready' | 'cancelled' | 'failed';
}

export interface FotoData {
  id: string;
  presente_id: string;
  url: string;
  ordem: number;
}

export interface MusicaData {
  id: string;
  presente_id: string;
  url_audio: string | null;
  estilo: string;
  lyrics: Array<{ time: number; text: string }>;
  status: 'generating' | 'ready' | 'failed';
}

export interface RetroData {
  presente: PresenteData;
  fotos: FotoData[];
  musica: MusicaData | null;
}

export type SlideId =
  | 'cover'
  | 'occasion'
  | 'story'
  | 'gallery'
  | 'music-style'
  | 'music-reveal'
  | 'share';

export interface SlideConfig {
  id: SlideId;
  duration: number;
  isManual?: boolean;
}
