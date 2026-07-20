import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './Project_Neon___Roguelite_Deckbuilder';

export function mountProjectNeon(elOrSelector: any, options: any = {}) {
  console.info('[ProjectNeon] mountProjectNeon called with', elOrSelector, options);
  const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;
  if (!el) { console.warn('[ProjectNeon] mount target not found', elOrSelector); return null; }
  try {
    const root = createRoot(el);
    root.render(React.createElement(App, { compact: !!options.compact }));
    // store root for potential unmount/debugging
    (window as any).__projectNeonRoot = root;
    console.info('[ProjectNeon] mounted into', el);
    return root;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ProjectNeon] Failed to mount ProjectNeon app', err);
    return null;
  }
}

// Auto-mount legacy container for backward compatibility
function autoMountDefault() {
  const el = document.getElementById('projectneon-root');
  console.info('[ProjectNeon] autoMountDefault: demo container', !!el);
  if (el) mountProjectNeon(el, {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    autoMountDefault();
    const widget = document.getElementById('projectneon-widget');
    if (widget) {
      console.info('[ProjectNeon] autoMountDefault: widget container found, attempting mount');
      mountProjectNeon(widget, { compact: true });
    } else {
      console.info('[ProjectNeon] autoMountDefault: no widget container');
    }
  });
} else {
  autoMountDefault();
  const widget = document.getElementById('projectneon-widget');
  if (widget) {
    console.info('[ProjectNeon] immediate: widget container found, attempting mount');
    mountProjectNeon(widget, { compact: true });
  } else {
    console.info('[ProjectNeon] immediate: no widget container');
  }
}

// Fallback: copy rendered demo into the widget if React multiple mounts fail (ensures compact preview)
setTimeout(() => {
  try {
    const demo = document.getElementById('projectneon-root');
    const widget = document.getElementById('projectneon-widget');
    if (demo && widget && widget.innerHTML.trim() === '' && demo.innerHTML.trim() !== '') {
      console.info('[ProjectNeon] copying demo HTML into widget fallback');
      widget.innerHTML = demo.innerHTML;
    }
  } catch (e) { }
}, 500);

// Expose a global helper to allow embedding in other pages
(window as any).mountProjectNeon = mountProjectNeon;

// If any mounts were requested before bundle loaded, flush them now
try {
  const pending = (window as any).__pendingMounts || [];
  if (pending && pending.length) {
    pending.forEach((p: any) => { try { mountProjectNeon(p[0], p[1] || {}); } catch (e) { } });
    (window as any).__pendingMounts = [];
  }
} catch (e) { }
