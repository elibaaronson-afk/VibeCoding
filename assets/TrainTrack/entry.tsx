import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './trainer_app';

export function mountTrainTrack(elOrSelector:any, options:any = {}) {
  console.info('[TrainTrack] mountTrainTrack called with', elOrSelector, options);
  const el = typeof elOrSelector === 'string' ? document.querySelector(elOrSelector) : elOrSelector;
  if (!el) { console.warn('[TrainTrack] mount target not found', elOrSelector); return null; }
  try {
    const root = createRoot(el);
    root.render(React.createElement(App, { compact: !!options.compact }));
    // store root for potential unmount/debugging
    (window as any).__trainTrackRoot = root;
    console.info('[TrainTrack] mounted into', el);
    return root;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[TrainTrack] Failed to mount TrainTrack app', err);
    return null;
  }
}

// Auto-mount legacy container for backward compatibility
function autoMountDefault(){
  const el = document.getElementById('traintrack-root');
  console.info('[TrainTrack] autoMountDefault: demo container', !!el);
  if (el) mountTrainTrack(el, {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ()=>{
    autoMountDefault();
    // If a compact widget container is present, mount it too
    const widget = document.getElementById('traintrack-widget');
    if(widget){ console.info('[TrainTrack] autoMountDefault: widget container found, attempting mount'); mountTrainTrack(widget,{compact:true}); } else { console.info('[TrainTrack] autoMountDefault: no widget container'); }
  });
} else {
  autoMountDefault();
  const widget = document.getElementById('traintrack-widget');
    if(widget){ console.info('[TrainTrack] immediate: widget container found, attempting mount'); mountTrainTrack(widget,{compact:true}); } else { console.info('[TrainTrack] immediate: no widget container'); }
}

// Fallback: copy rendered demo into the widget if React multiple mounts fail (ensures compact preview)
setTimeout(()=>{
  try{
    const demo = document.getElementById('traintrack-root');
    const widget = document.getElementById('traintrack-widget');
    if(demo && widget && widget.innerHTML.trim() === '' && demo.innerHTML.trim() !== ''){
          console.info('[TrainTrack] copying demo HTML into widget fallback');
          widget.innerHTML = demo.innerHTML;
        }
  }catch(e){}
}, 500);

// Expose a global helper to allow embedding in other pages
(window as any).mountTrainTrack = mountTrainTrack;

// If any mounts were requested before bundle loaded, flush them now
try{
  const pending = (window as any).__pendingMounts || [];
  if(pending && pending.length){
    pending.forEach((p:any)=>{ try{ mountTrainTrack(p[0], p[1]||{}); }catch(e){} });
    (window as any).__pendingMounts = [];
  }
}catch(e){}
