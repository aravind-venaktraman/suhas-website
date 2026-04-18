import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import ContributePage from './pages/ContributePage.jsx';
import LinksPage from './pages/LinksPage.jsx';
import PressPage from './pages/PressPage.jsx';
import FractalsPage from './pages/FractalsPage.jsx';
import StudioApp from './pages/studio/StudioApp.jsx';
import LoginPage from './pages/studio/LoginPage.jsx';
import ReleasePage from './pages/studio/ReleasePage.jsx';
import RetrospectivePage from './pages/studio/RetrospectivePage.jsx';
import TemplatesPage from './pages/studio/TemplatesPage.jsx';
import SettingsPage from './pages/studio/SettingsPage.jsx';
import './index.css';

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

        {/* Studio (hidden, auth-gated) */}
        <Route path="/studio/login" element={<LoginPage />} />
        <Route path="/studio" element={<StudioApp />}>
          <Route index element={<ReleasePage />} />
          <Route path="release/:releaseId" element={<ReleasePage />} />
          <Route path="release/:releaseId/retro" element={<RetrospectivePage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);