import React from 'react';

export default function Home(){
  return (
    <main style={{padding:24,maxWidth:980,margin:'0 auto'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:24}}>
        <div>
          <h1 style={{margin:0,fontSize:28}}>Eli Aaronson</h1>
          <p style={{margin:'8px 0 0',lineHeight:1.4}}><strong>Solutions Consultant</strong> — I help product and engineering teams turn customer needs into clear, achievable technical solutions that drive adoption and measurable business value.</p>
          <div style={{marginTop:12,display:'flex',gap:8}}>
            <a className="btn" href="/resume">View resume</a>
                        <a className="btn" href="mailto:elibaaronson@gmail.com" style={{background:'var(--accent-2)'}}>Contact</a>
          </div>
        </div>
        <aside style={{minWidth:180,textAlign:'right'}}>
          <div style={{fontWeight:700}}>Availability</div>
          <div style={{marginTop:6}}>Open to full-time roles — Solutions Consultant</div>
        </aside>
      </header>

      <section style={{marginTop:32}}>
        <h2 style={{marginBottom:12}}>Summary of strength</h2>
        <ul>
          <li>Translate customer problems into prioritized technical proposals and actionable roadmaps.</li>
          <li>Lead cross-functional discovery and prototype rapidly to validate assumptions with stakeholders.</li>
          <li>Scope and ship production-ready features with engineering teams, emphasizing clarity, testability, and observability.</li>
        </ul>
      </section>

      <section style={{marginTop:28}}>
        <h2>Selected work</h2>
        <article style={{border:'1px solid rgba(0,0,0,0.06)',padding:16,borderRadius:8,marginBottom:12}}>
          <h3 style={{marginTop:0}}>TrainTrack — Coaching app</h3>
          <p style={{margin:'6px 0'}}>Built a trainer-focused React/TypeScript prototype demonstrating product flow, UX patterns, and a compact embeddable preview used for stakeholder demos.</p>
          <p style={{marginTop:8}}><a className="btn" href="/traintrack">Open full app</a></p>
        </article>

        <article style={{border:'1px solid rgba(0,0,0,0.06)',padding:16,borderRadius:8}}>
          <h3 style={{marginTop:0}}>Portfolio & Resume</h3>
          <p style={{margin:'6px 0'}}>See the downloadable resume for recent roles, certifications, and measurable outcomes from past projects.</p>
        </article>
      </section>

      <section style={{marginTop:28}}>
        <h2>Core skills</h2>
        <p style={{margin:'6px 0'}}>Customer discovery · Requirements & scoping · Solution architecture · Prototyping (React/TypeScript) · Testing & CI/CD · Technical writing & stakeholder communication</p>
      </section>

      <section style={{marginTop:32,marginBottom:48}}>
        <h2>Contact</h2>
        <p style={{margin:6}}>Email: <a href="mailto:elibaaronson@gmail.com">elibaaronson@gmail.com</a> · <a href="https://www.linkedin.com/in/eli-aaronson" target="_blank" rel="noopener">LinkedIn</a></p>
      </section>
    </main>
  );
}
