import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number; // duration in ms (8000ms = 8 seconds)
}

export default function SplashScreen({ onFinish, duration = 8000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsVisible(false);
        if (onFinish) onFinish();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [duration, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="splash-screen-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none px-4 overflow-hidden"
        >
          {/* Subtle Ambient Backlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15)_0%,rgba(0,0,0,0.98)_75%)] pointer-events-none" />

          {/* Centered Logo Hero - The logo itself is the splash screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center justify-center max-w-sm sm:max-w-md md:max-w-lg w-full"
          >
            {/* Ambient Glow behind the logo */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

            {/* Logo Image Showcase Container */}
            <div className="relative w-full aspect-square max-w-[360px] sm:max-w-[420px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 bg-neutral-950 flex items-center justify-center">
              <img
                id="splash-logo-image"
                src="https://i.ibb.co/xqZZ3Whd/FB-IMG-1790090963311.jpg"
                alt="Logo"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('ebda3-pro-logo')) {
                    target.src = '/ebda3-pro-logo.jpg';
                  }
                }}
                className="w-full h-full object-contain object-center"
              />
            </div>
          </motion.div>

          {/* Minimalist Progress Bar at the bottom (No text) */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-8 z-10">
            <div className="w-full max-w-xs h-1 bg-neutral-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
