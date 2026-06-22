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

      <div style={{display:'flex',gap:12,marginTop:12,marginBottom:16,alignItems:'center'}}>
        <a className="btn" href={pdfPath} target="_blank" rel="noopener" download="Eli_Resume_2026.pdf">Download PDF</a>
        <a className="btn" href={pdfPath} style={{background:'var(--muted)'}} target="_blank" rel="noopener">Open in new tab</a>
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}} aria-hidden>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700}}><span ref={projectsRef}>0</span>+</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Projects</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700}}><span ref={clientsRef}>0</span>+</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Clients</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700}}><span ref={yearsRef}>0</span>+</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>Years</div>
          </div>
        </div>
      </div>

      <section style={{marginTop:20, display:'flex', justifyContent:'flex-end'}}>
        <aside style={{maxWidth:320}}>
          <div className="card" style={{padding:16}}>
            <h3 style={{marginTop:0}}>Contact</h3>
            <p style={{margin:6}}>Email: <a href="mailto:elibaaronson@gmail.com">elibaaronson@gmail.com</a></p>
            <p style={{margin:6}}>LinkedIn: <a href="https://www.linkedin.com/in/eli-aaronson" target="_blank" rel="noopener">Eli Aaronson</a></p>
            <div style={{marginTop:12}}>
              <a className="btn" href="mailto:elibaaronson@gmail.com">Email me</a>
            </div>
          </div>
        </aside>
      </section>

      <section style={{marginTop:28}}>
        <h2>Full resume</h2>
        <div className="card" style={{height:480,overflow:'hidden'}}>
          <iframe src={pdfPath} title="Resume PDF" style={{width:'100%',height:'100%',border:'none'}} />
        </div>
      </section>

    </main>
  );
}
