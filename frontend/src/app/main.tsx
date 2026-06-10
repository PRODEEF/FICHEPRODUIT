import '../styles/product-app.css';
import { capturePasswordRecoveryIntent } from '../features/auth/lib/passwordRecoveryGate';
import { StrictMode } from 'react';

capturePasswordRecoveryIntent();
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Élément #root introuvable : impossible de monter l’application.');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
