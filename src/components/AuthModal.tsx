import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!auth) {
      setError('نظام تسجيل الدخول غير جاهز بعد، الرجاء المحاولة مجدداً.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('الرجاء إدخال الاسم الكامل');
        }
        if (password.length < 6) {
          throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      // Translate common Firebase errors
      let errMsg = err.message || 'حدث خطأ ما';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'هذا البريد الإلكتروني مستخدم بالفعل.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'البريد الإلكتروني غير صالح.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'كلمة المرور ضعيفة جداً.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err.message.includes('الاسم الكامل')) {
        errMsg = 'الرجاء إدخال الاسم الكامل.';
      } else if (err.message.includes('كلمة المرور يجب')) {
        errMsg = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);

    if (!auth) {
      setError('نظام تسجيل الدخول غير جاهز بعد، الرجاء المحاولة مجدداً.');
      setIsLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('فشل تسجيل الدخول باستخدام Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        {/* Absolute Background Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl" />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-emerald-400 font-extrabold">#</span>
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-neutral-950 p-1 rounded-lg mb-6 border border-neutral-800">
          <button
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isSignUp ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isSignUp ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2.5 pr-10 pl-4 text-sm outline-none focus:border-emerald-500 transition-colors"
                />
                <UserIcon className="absolute right-3.5 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-neutral-400 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2.5 pr-10 pl-4 text-sm outline-none focus:border-emerald-500 transition-colors text-left"
                dir="ltr"
              />
              <Mail className="absolute right-3.5 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2.5 pr-10 pl-4 text-sm outline-none focus:border-emerald-500 transition-colors text-left"
                dir="ltr"
              />
              <Lock className="absolute right-3.5 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-55 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              'إنشاء الحساب'
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-neutral-800"></div>
          <span className="flex-shrink mx-4 text-neutral-500 text-xs">أو سجّل عبر</span>
          <div className="flex-grow border-t border-neutral-800"></div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full bg-white hover:bg-neutral-100 text-neutral-900 text-sm font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg border border-neutral-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

      </div>
    </div>
  );
}
