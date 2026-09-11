import { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Download, Loader2 } from 'lucide-react';
import { useEditorStore } from '../store/useEditorStore';
import { fetchSurahs, fetchReciters, fetchVerses } from '../lib/api';
import { Surah, Reciter } from '../types';
import VideoCanvas from './editor/VideoCanvas';

export default function EditorPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  
  const store = useEditorStore();

  useEffect(() => {
    fetchSurahs().then(setSurahs).catch(console.error);
    fetchReciters().then(setReciters).catch(console.error);
  }, []);

  const handleApplySelection = async () => {
    if (!store.selectedSurah || !store.selectedReciter) return;
    setIsLoadingVerses(true);
    try {
      const verses = await fetchVerses(
        store.selectedSurah.id,
        store.selectedStartVerse,
        store.selectedEndVerse,
        store.selectedReciter.id
      );
      store.setVerses(verses);
    } catch (e) {
      console.error(e);
      alert('خطأ في جلب الآيات');
    } finally {
      setIsLoadingVerses(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
      
      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
          <h2 className="font-bold text-lg mb-4 text-emerald-400">١. اختيار النص والقارئ</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1 text-neutral-400">السورة</label>
              <select 
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 focus:border-emerald-500 outline-none text-sm"
                onChange={(e) => {
                  const surah = surahs.find(s => s.id === parseInt(e.target.value));
                  store.setSelectedSurah(surah || null);
                }}
                value={store.selectedSurah?.id || ""}
              >
                <option value="" disabled>اختر السورة...</option>
                {surahs.map(s => (
                  <option key={s.id} value={s.id}>{s.name_arabic}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm mb-1 text-neutral-400">من آية</label>
                <input 
                  type="number" min="1" max={store.selectedSurah?.verses_count || 1}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 outline-none text-sm"
                  value={store.selectedStartVerse}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) store.setSelectedStartVerse(val);
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm mb-1 text-neutral-400">إلى آية</label>
                <input 
                  type="number" min="1" max={store.selectedSurah?.verses_count || 1}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 outline-none text-sm"
                  value={store.selectedEndVerse}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) store.setSelectedEndVerse(val);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-neutral-400">القارئ (المصدر الصوتي)</label>
              <select 
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 outline-none text-sm"
                onChange={(e) => {
                  const r = reciters.find(x => x.id === parseInt(e.target.value));
                  store.setSelectedReciter(r || null);
                }}
                value={store.selectedReciter?.id || ""}
              >
                <option value="" disabled>اختر القارئ...</option>
                {reciters.map(r => (
                  <option key={r.id} value={r.id}>{r.reciter_name} ({r.style})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleApplySelection}
              disabled={!store.selectedSurah || !store.selectedReciter || isLoadingVerses}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {isLoadingVerses ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              تطبيق وجلب البيانات
            </button>
          </div>
        </div>

        {store.verses.length > 0 && (
          <div className="bg-neutral-800 p-4 rounded-xl border border-emerald-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
            <h2 className="font-bold text-lg mb-4 text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              ٢. النص الإضافي (تفسير أو ترجمة)
            </h2>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              اختر نوع النص الإضافي ليتم عرضه أسفل الآيات مباشرة.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => store.setOverlayTextType('none')}
                className={`flex-1 py-2 text-sm rounded-lg border ${store.overlayTextType === 'none' ? 'bg-neutral-700 border-neutral-500 text-white' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-750'}`}
              >
                بدون
              </button>
              <button 
                onClick={() => store.setOverlayTextType('tafsir')}
                className={`flex-1 py-2 text-sm rounded-lg border ${store.overlayTextType === 'tafsir' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-750'}`}
              >
                تفسير (عربي)
              </button>
              <button 
                onClick={() => store.setOverlayTextType('translation')}
                className={`flex-1 py-2 text-sm rounded-lg border ${store.overlayTextType === 'translation' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-750'}`}
              >
                ترجمة (English)
              </button>
            </div>
          </div>
        )}

        <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
          <h2 className="font-bold text-lg mb-4 text-emerald-400">٣. التخصيص</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1 text-neutral-400">الخط (Typography)</label>
              <select 
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 outline-none text-sm"
                value={store.fontFamily}
                onChange={(e) => store.setFontFamily(e.target.value)}
              >
                <option value="Amiri, serif">Amiri (كلاسيكي)</option>
                <option value="Aref Ruqaa, serif">Aref Ruqaa (رقعة)</option>
                <option value="Cairo, sans-serif">Cairo (حديث)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-neutral-400">حجم الخط</label>
              <input type="range" min="20" max="120" value={store.fontSize} onChange={e => store.setFontSize(parseInt(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-neutral-400">لون النص</label>
              <input type="color" value={store.textColor} onChange={e => store.setTextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-neutral-400">لون الحدود (الظل)</label>
              <input type="color" value={store.strokeColor} onChange={e => store.setStrokeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-neutral-400">رابط خلفية فيديو/صورة (اختياري)</label>
              <input 
                type="text" 
                placeholder="أدخل رابط .mp4 أو صورة مباشر"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 outline-none text-sm text-left mb-2" dir="ltr"
                value={store.backgroundVideoUrl || ""}
                onChange={(e) => {
                  const url = e.target.value;
                  const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                  store.setBackgroundMedia(url, isImg ? 'image' : 'video');
                }}
              />
              <label className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:bg-neutral-800 transition-colors text-sm">
                <span>أو رفع ملف من الجهاز</span>
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,image/png,image/jpeg,image/webp" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      const type = file.type.startsWith('image/') ? 'image' : 'video';
                      store.setBackgroundMedia(url, type);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center bg-neutral-950 rounded-xl border border-neutral-800 p-6">
        <h2 className="font-bold text-lg w-full text-right mb-4 text-emerald-400">المعاينة وتصدير الفيديو</h2>
        
        <div className="relative shadow-2xl overflow-hidden rounded-xl bg-black border border-neutral-800">
          {/* We will render a 9:16 aspect ratio canvas representing mobile reels (1080x1920 scaled down) */}
          <VideoCanvas />
        </div>
      </div>
      
    </div>
  );
}
