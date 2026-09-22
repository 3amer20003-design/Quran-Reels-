import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initFirebase, auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useAuthStore } from './store/useAuthStore';
import EditorPage from './components/EditorPage';
import AuthModal from './components/AuthModal';
import SplashScreen from './components/SplashScreen';
import { User as UserIcon, LogOut, LogIn, Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initFirebase().then((success) => {
      if (success && auth) {
        setIsFirebaseReady(true);
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
        return unsubscribe;
      } else {
        setLoading(false);
      }
    });
  }, [setUser, setLoading]);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error", err);
      }
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-white font-sans" dir="rtl">
        
        {/* Header */}
        <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-40 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
            
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Quran Reels AI Builder
              </h1>
              <div className="text-xs sm:text-sm text-neutral-400 hidden sm:block">
                صانع المحتوى القرآني بالذكاء الاصطناعي
              </div>
            </div>

            {/* Authentication Control Area */}
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="flex items-center gap-1 bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700/50 text-neutral-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>جاري التحقق...</span>
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-emerald-400">مرحباً بك</span>
                    <span className="text-sm font-medium text-white max-w-[150px] truncate" title={user.displayName || user.email || ''}>
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "Avatar"} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border-2 border-emerald-500/30 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="p-2 bg-neutral-800 hover:bg-rose-950/40 hover:text-rose-400 border border-neutral-700 hover:border-rose-900/50 text-neutral-300 rounded-lg transition-all text-xs flex items-center gap-1.5"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">خروج</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>دخول / تسجيل</span>
                </button>
              )}
            </div>

          </div>
        </header>

        {/* Main Content */}
        <main className="p-4">
          <Routes>
            <Route path="/" element={<EditorPage />} />
          </Routes>
        </main>

        {/* 8-second Splash Screen */}
        {showSplash && (
          <SplashScreen 
            duration={8000} 
            onFinish={() => setShowSplash(false)} 
          />
        )}

        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />

      </div>
    </BrowserRouter>
  );
}
