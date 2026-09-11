/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initFirebase } from './lib/firebase';
import EditorPage from './components/EditorPage';

export default function App() {
  useEffect(() => {
    initFirebase();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-900 text-white font-sans" dir="rtl">
        <header className="border-b border-neutral-800 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Quran Reels AI Builder
            </h1>
            <div className="text-sm text-neutral-400">
              صانع المحتوى القرآني بالذكاء الاصطناعي
            </div>
          </div>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<EditorPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
