import React, { useEffect } from 'react';

export default function TrainTrack(){
  useEffect(()=>{
    (async ()=>{
      try{
        // dynamically import the entry which exports mountTrainTrack
        const mod = await import('../../assets/TrainTrack/entry.tsx');
        const mount = (mod as any).mountTrainTrack || (window as any).mountTrainTrack;
        if(mount) mount('#traintrack-root', { compact: false });
      }catch(e){
        console.error('[TrainTrack] failed to load entry module', e);
      }
    })();
  },[]);

  return (
    <main style={{padding:24}}>
      <nav style={{marginBottom:12}} aria-label="breadcrumb">
        <a className="btn" href="/" style={{background:'var(--muted)', color:'#fff'}}>← Back to site</a>
      </nav>
      <h1>TrainTrack</h1>
      <div id="traintrack-root" style={{minHeight:600,border:'1px solid rgba(0,0,0,0.06)',borderRadius:8,overflow:'hidden'}}></div>
    </main>
  );
}
