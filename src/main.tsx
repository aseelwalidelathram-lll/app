import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';
import { StoreProvider } from './state/store';
import { registerServiceWorker, watchInstallability } from './pwa';

watchInstallability();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
