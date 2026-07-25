// Polyfill/safety fix for environments where window.fetch has only a getter
(function() {
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      let _fetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        get() { return _fetch; },
        set(v) { _fetch = v; },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    // ignore
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
