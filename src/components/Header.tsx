import React, {useState, useEffect} from 'react';

export default function Header(){
  const [theme, setTheme] = useState<'light'|'dark'>(() => (document.documentElement.getAttribute('data-theme') as any) || 'light');
  const [open, setOpen] = useState(false);
  useEffect(()=>{ document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);
  useEffect(()=>{ if(!open) return; const onKey = (e: KeyboardEvent) => { if(e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [open]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="logo" href="/">Eli</a>
        <nav className={`site-nav ${open ? 'open' : ''}`} aria-label="Primary" id="primary-nav">
          <a href="/" className="nav-link" onClick={() => setOpen(false)}>Home</a>
          <a href="/traintrack" className="nav-link" onClick={() => setOpen(false)}>TrainTrack</a>
          <a href="/resume" className="nav-link" onClick={() => setOpen(false)}>Resume</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button className="mobile-toggle" aria-label="Toggle menu" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
        </div>
      </div>
    </header>
  );
}
