import React from 'react';
import Hero from '../components/Hero';

export default function Home(){
  return (
    <main>
      <Hero />

      <section style={{marginTop:32}}>
        <h2 style={{marginBottom:12}}>Summary of strength</h2>
        <ul>
          <li>Translate customer problems into prioritized technical proposals and actionable roadmaps.</li>
          <li>Lead cross-functional discovery and prototype rapidly to validate assumptions with stakeholders.</li>
          <li>Proven sales record with strong client relationships, client retention, and consistent deal closure.</li>
        </ul>
      </section>

      <section style={{marginTop:28}}>
        <h2>Selected work</h2>
        <article style={{border:'1px solid rgba(0,0,0,0.06)',padding:16,borderRadius:8,marginBottom:12}}>
          <h3 style={{marginTop:0}}>TrainTrack — Coaching app</h3>
          <p style={{margin:'6px 0'}}>Built a trainer-focused React/TypeScript prototype demonstrating product flow, UX patterns, and a compact embeddable preview used for stakeholder demos.</p>
          <p style={{marginTop:8}}><a className="btn" href="/traintrack">Open full app</a></p>
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
