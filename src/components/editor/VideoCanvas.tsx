import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Play, Square, Download, Loader2 } from 'lucide-react';
import { Verse } from '../../types';

export default function VideoCanvas() {
  const store = useEditorStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Canvas Dimensions for Reels (1080x1920)
  const WIDTH = 1080;
  const HEIGHT = 1920;
  
  // Audio playback queue
  const playNextVerse = () => {
    if (currentVerseIndex + 1 < store.verses.length) {
      setCurrentVerseIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const playPromiseRef = useRef<Promise<void> | void>();

  useEffect(() => {
    if (!audioRef.current || !store.verses[currentVerseIndex]) return;
    const verse = store.verses[currentVerseIndex];
    if (!verse.audio?.url) return;

    const newSrc = `https://audio.qurancdn.com/${verse.audio.url}`;
    if (audioRef.current.src !== newSrc) {
      audioRef.current.src = newSrc;
      audioRef.current.load();
    }
    
    if (isPlaying) {
      playPromiseRef.current = audioRef.current.play();
      if (playPromiseRef.current instanceof Promise) {
        playPromiseRef.current.catch(e => console.error("Audio play error", e));
      }
    }
  }, [currentVerseIndex, store.verses]); // isPlaying removed to prevent reloading on toggle

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // 1. Draw Background
      if (store.backgroundMediaType === 'video' && videoRef.current && videoRef.current.readyState >= 2) {
        // scale crop video to fill 9:16
        const vRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
        const cRatio = WIDTH / HEIGHT;
        let drawWidth, drawHeight, x, y;
        
        if (vRatio > cRatio) {
          drawHeight = HEIGHT;
          drawWidth = videoRef.current.videoWidth * (HEIGHT / videoRef.current.videoHeight);
          x = (WIDTH - drawWidth) / 2;
          y = 0;
        } else {
          drawWidth = WIDTH;
          drawHeight = videoRef.current.videoHeight * (WIDTH / videoRef.current.videoWidth);
          x = 0;
          y = (HEIGHT - drawHeight) / 2;
        }
        ctx.drawImage(videoRef.current, x, y, drawWidth, drawHeight);
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      } else if (store.backgroundMediaType === 'image' && imageRef.current && imageRef.current.complete) {
        const vRatio = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
        const cRatio = WIDTH / HEIGHT;
        let drawWidth, drawHeight, x, y;
        
        if (vRatio > cRatio) {
          drawHeight = HEIGHT;
          drawWidth = imageRef.current.naturalWidth * (HEIGHT / imageRef.current.naturalHeight);
          x = (WIDTH - drawWidth) / 2;
          y = 0;
        } else {
          drawWidth = WIDTH;
          drawHeight = imageRef.current.naturalHeight * (WIDTH / imageRef.current.naturalWidth);
          x = 0;
          y = (HEIGHT - drawHeight) / 2;
        }
        ctx.drawImage(imageRef.current, x, y, drawWidth, drawHeight);
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      // 2. Find current active word
      const currentVerse = store.verses[currentVerseIndex];
      let activeWordIndex = -1;
      
      if (currentVerse && audioRef.current && isPlaying) {
        const currentTimeMs = audioRef.current.currentTime * 1000;
        const segments = currentVerse.audio?.segments || [];
        
        for (const seg of segments) {
          // seg: [word_index, next_word, start_ms, end_ms]
          if (currentTimeMs >= seg[2] && currentTimeMs <= seg[3]) {
             activeWordIndex = seg[0];
             break;
          }
        }
      }

      let arabicBottomY = HEIGHT / 2;

      // 3. Draw Quranic Text
      if (currentVerse) {
         ctx.font = `bold ${store.fontSize}px ${store.fontFamily}`;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         
         const words = currentVerse.words;
         let fullTextWidth = 0;
         
         // Calculate total width approx
         const padding = 20;
         const wordWidths = words.map(w => ctx!.measureText(w.text_uthmani).width + padding);
         fullTextWidth = wordWidths.reduce((a,b)=>a+b, 0);
         
         const lines = [];
         let currentLine = [];
         let currentLineWidth = 0;
         const maxLineWidth = WIDTH - 100;
         
         // RTL order: we build lines logically.
         for (let i = 0; i < words.length; i++) {
            if (currentLineWidth + wordWidths[i] > maxLineWidth && currentLine.length > 0) {
               lines.push(currentLine);
               currentLine = [];
               currentLineWidth = 0;
            }
            currentLine.push({ word: words[i], index: i, width: wordWidths[i] });
            currentLineWidth += wordWidths[i];
         }
         if (currentLine.length > 0) lines.push(currentLine);
         
         const hasOverlay = store.overlayText && store.overlayTextType !== 'none';
         const startY = HEIGHT / 2 - ((lines.length - 1) * (store.fontSize * 1.5)) / 2 - (hasOverlay ? 100 : 0);
         
         lines.forEach((line, lineIdx) => {
             const lineWidth = line.reduce((sum, w) => sum + w.width, 0);
             let startX = WIDTH / 2 + lineWidth / 2; // Start from right
             
             line.forEach(item => {
                 const x = startX - item.width / 2;
                 const y = startY + lineIdx * store.fontSize * 1.5;
                 
                 const isActive = item.index === activeWordIndex;
                 
                 // Apply subtle shadow for Arabic text too
                 ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                 ctx.shadowBlur = 8;
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 4;

                 // Stroke
                 ctx.lineWidth = store.strokeWidth;
                 ctx.strokeStyle = store.strokeColor;
                 ctx.strokeText(item.word.text_uthmani, x, y);
                 
                 // Fill
                 ctx.fillStyle = isActive ? '#34d399' : store.textColor;
                 ctx.fillText(item.word.text_uthmani, x, y);
                 
                 // Reset shadow
                 ctx.shadowBlur = 0;
                 ctx.shadowColor = 'transparent';
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 0;

                 startX -= item.width;
             });
         });

         arabicBottomY = startY + (lines.length - 1) * store.fontSize * 1.5;
      }

      // 4. Draw Overlay Text (Tafsir/Translation) below Arabic text
      const overlayTextToDraw = store.overlayTextType === 'tafsir' && currentVerse?.tafsirText
                                ? `{ ${currentVerse.tafsirText} }`
                                : store.overlayTextType === 'translation' ? currentVerse?.translationText 
                                : null;

      if (overlayTextToDraw && store.overlayTextType !== 'none') {
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        const overlayY = arabicBottomY + store.fontSize + 40;
        
        wrapText(ctx, overlayTextToDraw, WIDTH / 2, overlayY, WIDTH - 100, 55, store.overlayTextType === 'translation' ? 'ltr' : 'rtl');
        
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [store.verses, currentVerseIndex, isPlaying, store.fontSize, store.fontFamily, store.textColor, store.strokeColor, store.strokeWidth, store.overlayTextType, store.backgroundMediaType, store.backgroundVideoUrl]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      setIsPlaying(false);
      try {
        if (playPromiseRef.current instanceof Promise) {
          await playPromiseRef.current;
        }
      } catch (e) {}
      audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
    } else {
      if (currentVerseIndex >= store.verses.length) setCurrentVerseIndex(0);
      playPromiseRef.current = audioRef.current.play();
      if (playPromiseRef.current instanceof Promise) {
          playPromiseRef.current.catch(e => console.error("Audio play error", e));
      }
      if (videoRef.current) {
        const vp = videoRef.current.play();
        if (vp instanceof Promise) vp.catch(e => console.error("Video play error", e));
      }
      setIsPlaying(true);
    }
  };

  const startRecording = () => {
    if (!canvasRef.current) return;
    
    // Reset to start
    setCurrentVerseIndex(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    if (videoRef.current) videoRef.current.currentTime = 0;
    
    const stream = canvasRef.current.captureStream(30); // 30 fps
    
    if (audioRef.current) {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtxRef.current.createMediaElementSource(audioRef.current);
            destRef.current = audioCtxRef.current.createMediaStreamDestination();
            source.connect(destRef.current);
            source.connect(audioCtxRef.current.destination); // also play to speakers
        }
        
        if (destRef.current) {
            destRef.current.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        }
    }

    const options = { mimeType: 'video/webm; codecs=vp8,opus' };
    const mediaRecorder = new MediaRecorder(stream, options);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quran_reels_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      chunksRef.current = [];
      setIsRecording(false);
    };

    chunksRef.current = [];
    mediaRecorder.start();
    setIsRecording(true);
    setIsPlaying(true);
    playPromiseRef.current = audioRef.current?.play();
    if (playPromiseRef.current instanceof Promise) {
        playPromiseRef.current.catch(e => console.error("Audio play error", e));
    }
    if (videoRef.current) {
        const vp = videoRef.current.play();
        if (vp instanceof Promise) vp.catch(e => console.error("Video play error", e));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {store.backgroundVideoUrl && store.backgroundMediaType === 'video' && (
        <video 
          ref={videoRef}
          src={store.backgroundVideoUrl}
          loop
          muted
          crossOrigin="anonymous"
          className="hidden" 
        />
      )}
      {store.backgroundVideoUrl && store.backgroundMediaType === 'image' && (
        <img 
          ref={imageRef}
          src={store.backgroundVideoUrl}
          crossOrigin="anonymous"
          className="hidden" 
        />
      )}
      
      <audio 
        ref={audioRef} 
        onEnded={playNextVerse}
        crossOrigin="anonymous"
      />

      <canvas 
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-[300px] h-[533px] bg-black rounded-lg border border-neutral-700"
      />

      <div className="flex gap-4 w-full justify-center">
        <button 
          onClick={togglePlayback}
          className="bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-full transition-colors flex items-center justify-center shadow-lg"
        >
          {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        
        <button 
          onClick={startRecording}
          disabled={isRecording || store.verses.length === 0}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 disabled:opacity-50 text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center gap-2 shadow-lg"
        >
          {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {isRecording ? 'جاري التسجيل...' : 'تصدير الفيديو'}
        </button>
      </div>
    </div>
  );
}

// Helper to wrap text on canvas
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, dir: 'ltr' | 'rtl') {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    ctx.direction = dir;

    // For RTL, ctx.textAlign = 'center' handles positioning, but line construction is tricky if mixing languages.
    // For pure Arabic, simple concatenation works fine.
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}
