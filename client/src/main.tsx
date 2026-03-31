import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LiveSessionPanel } from './session/LiveSessionPanel';
import { SessionConfigWizard } from './session/SessionConfigWizard';
import { StealthViewer } from './session/StealthViewer';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<SessionConfigWizard />} />
        <Route path="/session/:id" element={<LiveSessionPanel />} />
        <Route path="/viewer" element={<StealthViewer />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

