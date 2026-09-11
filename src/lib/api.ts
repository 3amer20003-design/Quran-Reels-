import { Surah, Reciter, Verse } from '../types';

const QURAN_API = 'https://api.quran.com/api/v4';

export async function fetchSurahs(): Promise<Surah[]> {
  const res = await fetch(`${QURAN_API}/chapters?language=ar`);
  const data = await res.json();
  return data.chapters;
}

export async function fetchReciters(): Promise<Reciter[]> {
  const res = await fetch(`${QURAN_API}/resources/recitations?language=ar`);
  const data = await res.json();
  return data.recitations;
}

export async function fetchVerses(surahId: number, start: number, end: number, reciterId: number): Promise<Verse[]> {
  let allVerses: Verse[] = [];
  let page = 1;
  let totalPages = 1;
  
  while (page <= totalPages) {
    const res = await fetch(`${QURAN_API}/verses/by_chapter/${surahId}?words=true&word_fields=text_uthmani&audio=${reciterId}&translations=20&page=${page}&per_page=50`);
    const data = await res.json();
    allVerses = allVerses.concat(data.verses);
    totalPages = data.pagination.total_pages;
    if (allVerses.length >= end) break; // Optimization
    page++;
  }
  
  // Filter by range
  const filteredVerses = allVerses.filter(v => v.verse_number >= start && v.verse_number <= end);

  // Fetch Tafsir for each verse
  const tafsirPromises = filteredVerses.map(v => 
    fetch(`${QURAN_API}/tafsirs/16/by_ayah/${v.verse_key}`).then(r => r.json()).catch(() => ({ tafsir: { text: '' } }))
  );
  
  try {
    const tafsirs = await Promise.all(tafsirPromises);
    filteredVerses.forEach((v, i) => {
      v.tafsirText = tafsirs[i].tafsir?.text?.replace(/<[^>]+>/g, '') || '';
      v.translationText = v.translations?.[0]?.text?.replace(/<[^>]+>/g, '') || '';
    });
  } catch (error) {
    console.error("Failed to fetch tafsirs", error);
  }

  return filteredVerses;
}

export async function fetchPexelsVideo(query: string) {
  const res = await fetch(`/api/pexels/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Pexels Error');
  return await res.json();
}
