import React, {useEffect, useRef} from 'react';

export default function Resume(){
  const pdfPath = '/assets/Resume%206_2026.pdf';
  const projectsRef = useRef<HTMLSpanElement | null>(null);
  const clientsRef = useRef<HTMLSpanElement | null>(null);
  const yearsRef = useRef<HTMLSpanElement | null>(null);

  useEffect(()=>{
    // simple counter animation
    const animate = (el: HTMLSpanElement | null, to: number, duration=900)=>{
      if(!el) return;
      const start = 0; const startTime = performance.now();
      const step = (time: number)=>{
        const t = Math.min(1, (time - startTime)/duration);
        el.textContent = Math.floor(t * (to - start) + start).toString();
        if(t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    animate(projectsRef.current, 14);
    animate(clientsRef.current, 8);
    animate(yearsRef.current, 6);
  },[]);

  return (
    <main style={{padding:24,maxWidth:980,margin:'0 auto'}}>
      <h1 style={{marginTop:0}}>Resume</h1>
      <p style={{marginTop:6}}>View or download the resume below. Key highlights and metrics are shown for quick scanning.</p>

      <div style={{marginTop:12,marginBottom:16}}>
        {/* Single large section with title and buttons */}
        <div className="card" style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div>
              <h2 style={{margin:0}}>Resume — June 2026</h2>
              <p style={{margin:4,color:'var(--muted)'}}>Snapshot of resume as of June 2026. Use the buttons to download or open the full PDF.</p>
            </div>
            <div style={{display:'flex',gap:8}}>
              <a className="btn" href={pdfPath} target="_blank" rel="noopener" download="Eli_Resume_2026.pdf">Download PDF</a>
              <a className="btn" href={pdfPath} style={{background:'var(--muted)'}} target="_blank" rel="noopener">Open in new tab</a>
            </div>
          </div>
        </div>
      </div>

      <section style={{marginTop:28}}>
        <h2>Full resume</h2>
        <div className="card" style={{height:480,overflow:'hidden'}}>
          <iframe src={pdfPath} title="Resume PDF" style={{width:'100%',height:'100%',border:'none'}} />
        </div>
      </section>

    </main>
  );
}
