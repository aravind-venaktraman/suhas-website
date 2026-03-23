import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import ContributePage from './pages/ContributePage.jsx';
import LinksPage from './pages/LinksPage.jsx';
import PressPage from './pages/PressPage.jsx';
import './index.css';

function EpkRedirect() {
  useEffect(() => { window.location.replace('/epk.pdf'); }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/epk" element={<EpkRedirect />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="/contribute/success" element={<ContributePage success />} />
        <Route path="/contribute/cancel" element={<ContributePage cancelled />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);