export interface Surah {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  words: Word[];
  audio?: VerseAudio;
  translations?: { id: number; text: string }[];
  tafsirText?: string;
  translationText?: string;
}

export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  translation?: { text: string; language_name: string };
  audio_url: string | null;
}

export interface VerseAudio {
  url: string;
  segments: [number, number, number, number][]; // [word_index, next_word_index, start_ms, end_ms]
}

export interface Reciter {
  id: number;
  reciter_name: string;
  style: string;
}

export interface EditorState {
  selectedSurah: Surah | null;
  selectedStartVerse: number | '';
  selectedEndVerse: number | '';
  selectedReciter: Reciter | null;
  verses: Verse[];
  customAudioUrl: string | null;
  
  // Customization
  fontFamily: string;
  fontSize: number;
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
  
  // Text Overlay (Tafsir or Translation)
  backgroundVideoUrl: string | null;
  backgroundMediaType: 'video' | 'image' | null;
  overlayTextType: 'tafsir' | 'translation' | 'none';
}
