import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './trainer_app';

function mount() {
  const el = document.getElementById('traintrack-root');
  if (!el) return;
  // hydrate/mount
  try {
    const root = createRoot(el);
    root.render(React.createElement(App));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to mount TrainTrack app', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
