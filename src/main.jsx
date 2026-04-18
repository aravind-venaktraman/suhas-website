import React, { useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import ContributePage from './pages/ContributePage.jsx';
import LinksPage from './pages/LinksPage.jsx';
import PressPage from './pages/PressPage.jsx';
import FractalsPage from './pages/FractalsPage.jsx';
import './index.css';

// Studio pages are lazy-loaded so they are never bundled with or executed
// alongside the public marketing site. This means missing Supabase env vars
// won't crash suhasmusic.com — the studio chunk only loads when someone
// actually navigates to /studio/*.
const StudioApp        = lazy(() => import('./pages/studio/StudioApp.jsx'));
const LoginPage        = lazy(() => import('./pages/studio/LoginPage.jsx'));
const ReleasePage      = lazy(() => import('./pages/studio/ReleasePage.jsx'));
const RetrospectivePage = lazy(() => import('./pages/studio/RetrospectivePage.jsx'));
const TemplatesPage    = lazy(() => import('./pages/studio/TemplatesPage.jsx'));
const SettingsPage     = lazy(() => import('./pages/studio/SettingsPage.jsx'));

function EpkRedirect() {
  useEffect(() => { window.location.replace('/epk.pdf'); }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public marketing site */}
        <Route path="/" element={<App />} />
        <Route path="/fractals" element={<FractalsPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/epk" element={<EpkRedirect />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="/contribute/success" element={<ContributePage success />} />
        <Route path="/contribute/cancel" element={<ContributePage cancelled />} />

        {/* Studio (hidden, auth-gated) — loaded lazily so the public site is
            never affected by missing Supabase env vars or studio errors */}
        <Route path="/studio/*" element={
          <Suspense fallback={null}>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route path="/*" element={<StudioApp />}>
                <Route index element={<ReleasePage />} />
                <Route path="release/:releaseId" element={<ReleasePage />} />
                <Route path="release/:releaseId/retro" element={<RetrospectivePage />} />
                <Route path="templates" element={<TemplatesPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);