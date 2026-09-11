import { create } from 'zustand';
import { EditorState, Surah, Reciter, Verse } from '../types';

interface EditorActions {
  setSelectedSurah: (surah: Surah | null) => void;
  setSelectedStartVerse: (num: number | '') => void;
  setSelectedEndVerse: (num: number | '') => void;
  setSelectedReciter: (reciter: Reciter | null) => void;
  setVerses: (verses: Verse[]) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setBackgroundVideo: (url: string | null) => void;
  setBackgroundMedia: (url: string | null, type: 'video' | 'image' | null) => void;
  setOverlayTextType: (type: 'tafsir' | 'translation' | 'none') => void;
}

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  selectedSurah: null,
  selectedStartVerse: '',
  selectedEndVerse: '',
  selectedReciter: null,
  verses: [],
  
  fontFamily: 'Amiri, serif',
  fontSize: 48,
  textColor: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 2,
  
  backgroundVideoUrl: null,
  backgroundMediaType: 'video',
  overlayTextType: 'none',
  
  setSelectedSurah: (surah) => set({ selectedSurah: surah, selectedStartVerse: '', selectedEndVerse: '' }),
  setSelectedStartVerse: (num) => set({ selectedStartVerse: num }),
  setSelectedEndVerse: (num) => set({ selectedEndVerse: num }),
  setSelectedReciter: (reciter) => set({ selectedReciter: reciter }),
  setVerses: (verses) => set({ verses }),
  setFontFamily: (font) => set({ fontFamily: font }),
  setFontSize: (size) => set({ fontSize: size }),
  setTextColor: (color) => set({ textColor: color }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setBackgroundVideo: (url) => set({ backgroundVideoUrl: url, backgroundMediaType: 'video' }),
  setBackgroundMedia: (url, type) => set({ backgroundVideoUrl: url, backgroundMediaType: type }),
  setOverlayTextType: (type) => set({ overlayTextType: type }),
}));
