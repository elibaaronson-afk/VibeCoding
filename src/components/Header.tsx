import React, {useState, useEffect, useRef} from 'react';

export default function Header(){
  const [theme, setTheme] = useState<'light'|'dark'>(() => (document.documentElement.getAttribute('data-theme') as any) || 'light');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(()=>{ document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);

  // Close menu on Esc and focus first link when opening
  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => { if(e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(()=>{
    if(open){
      // focus first nav link for accessibility
      setTimeout(()=> firstLinkRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  // Add a light shadow when scrolled
  useEffect(()=>{
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-inner">
        <a className="logo" href="/">Eli</a>
        <nav className={`site-nav ${open ? 'open' : ''}`} aria-label="Primary" id="primary-nav">
          <a href="/" className="nav-link" onClick={() => setOpen(false)} ref={firstLinkRef}>Home</a>
          <a href="/traintrack" className="nav-link" onClick={() => setOpen(false)}>TrainTrack</a>
          <a href="/resume" className="nav-link" onClick={() => setOpen(false)}>Resume</a>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '🌙' : '☀️'}</button>
          <button className="mobile-toggle" aria-label="Toggle menu" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen(!open)}>
            <span className="hamburger" aria-hidden>{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
