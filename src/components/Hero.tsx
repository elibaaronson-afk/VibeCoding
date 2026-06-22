import React from 'react';
const headshot = new URL('../../assets/SmilingHeadshot.jpg', import.meta.url).href;

export default function Hero(){
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <h1 className="hero-title">Eli Aaronson</h1>
          <p className="hero-sub">Solutions Consultant — turning customer needs into clear, testable product outcomes and measurable business value.</p>
          <div className="hero-ctas">
            <a className="btn" href="/traintrack">Open demo</a>
            <a className="btn" href="/resume" style={{background:'var(--accent-2)'}}>View resume</a>
          </div>
        </div>

        <div className="hero-accent" aria-hidden>
          <img src={headshot} alt="Eli Aaronson smiling headshot" className="hero-image" width="220" height="160" loading="eager" />
        </div>
      </div>
    </section>
  );
}
