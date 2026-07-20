import React, { useEffect } from 'react';

export default function ProjectNeon() {
  useEffect(() => {
    (async () => {
      try {
        // dynamically import the entry which exports mountProjectNeon
        const mod = await import('../../assets/Project Neon/entry');
        const mount = (mod as any).mountProjectNeon || (window as any).mountProjectNeon;
        if (mount) mount('#projectneon-root', { compact: false });
      } catch (e) {
        console.error('[ProjectNeon] failed to load entry module', e);
      }
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <nav style={{ marginBottom: 12 }} aria-label="breadcrumb">
        <a className="btn" href="/" style={{ background: 'var(--muted)', color: '#fff' }}>← Back to site</a>
      </nav>
      <h1>Project_Neon - Roguelite Deckbuilder</h1>
      <p>Enter "DevHell" in order to access the developer sandbox.</p>
      <div id="projectneon-root" style={{ minHeight: 600, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, overflow: 'hidden' }}></div>
    </main>
  );
}
