import React from 'react';

export default function Resume(){
  const pdfPath = '/assets/Resume%206_2026.pdf';
  return (
    <main style={{padding:24}}>
      <h1 style={{marginTop:0}}>Resume</h1>
      <p style={{marginTop:6}}>View or download the resume below.</p>
      <div style={{display:'flex',gap:8,marginTop:12,marginBottom:16}}>
        <a className="btn" href={pdfPath} target="_blank" rel="noopener" download="Eli_Resume_2026.pdf">Download PDF</a>
        <a className="btn" href={pdfPath} style={{background:'var(--muted)'}} target="_blank" rel="noopener">Open in new tab</a>
      </div>

      <div className="card" style={{height:'80vh',overflow:'hidden'}}>
        <iframe src={pdfPath} title="Resume PDF" style={{width:'100%',height:'100%',border:'none'}} />
      </div>

    </main>
  );
}
