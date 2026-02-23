import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import ContributePage from './pages/ContributePage.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/contribute" element={<ContributePage />} />
        <Route path="/contribute/success" element={<ContributePage success />} />
        <Route path="/contribute/cancel" element={<ContributePage cancelled />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);