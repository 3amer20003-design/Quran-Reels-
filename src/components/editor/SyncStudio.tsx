import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Play, Square, MousePointerClick, Check } from 'lucide-react';

export default function SyncStudio() {
  const store = useEditorStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncIndex, setSyncIndex] = useState(-1);
  const [recordedTimings, setRecordedTimings] = useState<any[]>([]);

  // Flat map all words from all verses
  const allWords = store.verses.flatMap((v, vIdx) => 
    v.words.map((w, wIdx) => ({ vIdx, wIdx, text: w.text_uthmani, word: w }))
  );

  const handleTap = () => {
    if (!audioRef.current) return;
    const timeMs = audioRef.current.currentTime * 1000;

    if (syncIndex === -1) {
       // Start first word
       setRecordedTimings([{ vIdx: allWords[0].vIdx, wIdx: allWords[0].wIdx, start: timeMs, end: 0 }]);
       setSyncIndex(0);
       audioRef.current.play();
       setIsPlaying(true);
    } else if (syncIndex < allWords.length) {
       // End previous word, start next
       setRecordedTimings(prev => {
          const next = [...prev];
          next[next.length - 1].end = timeMs;
          if (syncIndex + 1 < allWords.length) {
              next.push({ vIdx: allWords[syncIndex + 1].vIdx, wIdx: allWords[syncIndex + 1].wIdx, start: timeMs, end: 0 });
          }
          return next;
       });
       setSyncIndex(prev => prev + 1);
       
       if (syncIndex + 1 >= allWords.length) {
          setIsPlaying(false);
          audioRef.current.pause();
       }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // prevent scrolling
        if (store.customAudioUrl && store.verses.length > 0) {
            handleTap();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncIndex, store.verses.length, store.customAudioUrl]);

  const applyTimings = () => {
     const newVerses = JSON.parse(JSON.stringify(store.verses));
     
     recordedTimings.forEach(t => {
       const v = newVerses[t.vIdx];
       if (!v.audio) v.audio = { url: '', segments: [] };
       // Ensure end is > start, add 500ms default if missing
       const start = t.start;
       const end = t.end > t.start ? t.end : t.start + 500; 
       v.audio.segments.push([t.wIdx, t.wIdx + 1, start, end]);
     });

     store.setVerses(newVerses);
     alert('تم حفظ المزامنة! يمكنك الآن معاينة الفيديو وتصديره.');
  };

  const resetSync = () => {
      setSyncIndex(-1);
      setRecordedTimings([]);
      setIsPlaying(false);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
  };

  if (store.selectedReciter?.id !== -1 || !store.customAudioUrl || store.verses.length === 0) return null;

  return (
    <div className="bg-neutral-800 p-4 rounded-xl border border-emerald-900 relative overflow-hidden mt-4 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
      <h2 className="font-bold text-lg mb-2 text-emerald-400 flex items-center gap-2">
        <MousePointerClick className="w-5 h-5" />
        استوديو المزامنة (Karaoke Sync)
      </h2>
      <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
        قم بتشغيل الصوت، ثم اضغط على زر <kbd className="bg-neutral-700 px-1 py-0.5 rounded">المسطرة (Space)</kbd> 
        أو الزر بالأسفل مع <b>بداية نطق كل كلمة</b> لمزامنتها مع الصوت.
      </p>

      {/* Hidden audio element for syncing */}
      <audio ref={audioRef} src={store.customAudioUrl} crossOrigin="anonymous" onEnded={() => setIsPlaying(false)} />

      {/* Text Display */}
      <div className="bg-black/50 rounded-lg p-4 mb-4 min-h-[100px] flex flex-wrap gap-2 justify-center items-center rtl leading-loose" dir="rtl">
        {syncIndex >= allWords.length ? (
            <span className="text-emerald-400 font-bold text-xl">اكتملت المزامنة! 🎉</span>
        ) : (
            allWords.map((item, idx) => (
            <span 
                key={`${item.vIdx}-${item.wIdx}`}
                className={`text-xl font-amiri transition-colors ${
                    idx === syncIndex 
                    ? 'text-emerald-400 font-bold bg-emerald-900/40 rounded px-1 scale-110' 
                    : idx < syncIndex 
                    ? 'text-neutral-500' 
                    : 'text-white'
                }`}
            >
                {item.text}
            </span>
            ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        {syncIndex < allWords.length ? (
            <button 
                onClick={handleTap}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg shadow-lg active:scale-95 transition-all text-lg flex justify-center items-center gap-2"
            >
                {syncIndex === -1 ? (
                    <><Play className="w-5 h-5" /> ابدأ المزامنة (شغّل الصوت)</>
                ) : (
                    <><MousePointerClick className="w-5 h-5" /> الكلمة التالية (أو مسطرة)</>
                )}
            </button>
        ) : (
            <button 
                onClick={applyTimings}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2"
            >
                <Check className="w-5 h-5" /> اعتماد المزامنة
            </button>
        )}

        <button 
            onClick={resetSync}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg text-sm transition-colors"
        >
            إعادة تعيين (مسح المزامنة)
        </button>
      </div>
    </div>
  );
}
