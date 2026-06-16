import { useState, useEffect, useCallback, useRef } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "traintrack_v7";
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const GOALS = ["Strength","Weight loss","Hypertrophy","Endurance"];
const LEVELS = ["Beginner","Intermediate","Advanced"];
const MUSCLE_GROUPS = ["Lower Body Anterior","Lower Body Posterior","Lower Body Lower Leg","Core","Upper Body Anterior","Upper Body Posterior","Full Body"];
const SEVERITY = ["Minor","Moderate","Severe"];
const INJURY_STATUS = ["Active","Recovering","Recovered"];
const BLOCK_TYPES = ["Hypertrophy","Strength","Power","Deload","Endurance","Maintenance","Peak","Custom"];
const BLOCK_COLORS = {"Hypertrophy":"#534AB7","Strength":"#1D9E75","Power":"#D85A30","Deload":"#9E9E9E","Endurance":"#0C447C","Maintenance":"#633806","Peak":"#A32D2D","Custom":"#085041"};
const GOAL_PRESETS = {
  "Strength":["keyLifts","overload","strengthProgress","injuries","notes"],
  "Weight loss":["bodyWeight","cardioLog","bodyComp","injuries","notes"],
  "Hypertrophy":["keyLifts","volumeTracker","muscleGroupSplit","injuries","notes"],
  "Endurance":["cardioBenchmarks","distanceTrends","cardioLog","injuries","notes"],
};
const ALL_WIDGETS = [
  {id:"keyLifts",name:"Key lifts",icon:"🏋️",tag:"Strength"},
  {id:"overload",name:"Progressive overload",icon:"📈",tag:"Strength"},
  {id:"strengthProgress",name:"Strength progress",icon:"📊",tag:"Strength"},
  {id:"bodyWeight",name:"Body weight trend",icon:"⚖️",tag:"Weight loss"},
  {id:"cardioLog",name:"Cardio log",icon:"🏃",tag:"Weight loss / Endurance"},
  {id:"bodyComp",name:"Body composition",icon:"🧬",tag:"Weight loss"},
  {id:"volumeTracker",name:"Volume tracker",icon:"🔢",tag:"Hypertrophy"},
  {id:"muscleGroupSplit",name:"Muscle group split",icon:"💪",tag:"Hypertrophy"},
  {id:"cardioBenchmarks",name:"Cardio benchmarks",icon:"⏱️",tag:"Endurance"},
  {id:"distanceTrends",name:"Distance & time trends",icon:"🗺️",tag:"Endurance"},
  {id:"injuries",name:"Injuries & Medical",icon:"🩹",tag:"General"},
  {id:"notes",name:"Trainer notes",icon:"📝",tag:"General"},
];

const EXERCISE_TAGS = ["Eccentric focus","Pause at bottom","Tempo work","Unilateral","Explosive","Isometric","Compound","Isolation","Bodyweight","Cable","Barbell","Dumbbell","Machine","Band","Kettlebell","Plyometric","Mobility","Corrective"];

const DEFAULT_LIBRARY = [
  {id:uid(),name:"Squat",muscle:"Lower Body Anterior",equipment:"Barbell",defaultSets:4,defaultReps:6,defaultRest:180,tags:["Compound","Barbell"],cues:"Drive through heels, keep chest up, brace core."},
  {id:uid(),name:"Bench press",muscle:"Upper Body Anterior",equipment:"Barbell",defaultSets:3,defaultReps:8,defaultRest:120,tags:["Compound","Barbell"],cues:"Retract scapula, slight arch, control the descent."},
  {id:uid(),name:"Deadlift",muscle:"Lower Body Posterior",equipment:"Barbell",defaultSets:3,defaultReps:5,defaultRest:240,tags:["Compound","Barbell"],cues:"Hinge at hips, bar stays close, neutral spine."},
  {id:uid(),name:"OHP",muscle:"Upper Body Anterior",equipment:"Barbell",defaultSets:3,defaultReps:8,defaultRest:90,tags:["Compound","Barbell"],cues:"Brace core, press straight up, don't hyperextend lower back."},
  {id:uid(),name:"Romanian DL",muscle:"Lower Body Posterior",equipment:"Barbell",defaultSets:3,defaultReps:10,defaultRest:90,tags:["Eccentric focus","Barbell"],cues:"Hinge with soft knees, feel the hamstring stretch."},
  {id:uid(),name:"Hip thrust",muscle:"Lower Body Posterior",equipment:"Barbell",defaultSets:3,defaultReps:12,defaultRest:90,tags:["Isolation","Barbell","Pause at bottom"],cues:"Full hip extension at top, pause and squeeze glutes."},
  {id:uid(),name:"Pull-up",muscle:"Upper Body Posterior",equipment:"Bodyweight",defaultSets:3,defaultReps:8,defaultRest:90,tags:["Compound","Bodyweight"],cues:"Full dead hang, drive elbows down, chin over bar."},
  {id:uid(),name:"Plank",muscle:"Core",equipment:"Bodyweight",defaultSets:3,defaultReps:1,defaultRest:60,tags:["Isometric","Bodyweight","Corrective"],cues:"Neutral spine, squeeze glutes and abs, breathe."},
  {id:uid(),name:"Goblet squat",muscle:"Lower Body Anterior",equipment:"Dumbbell",defaultSets:3,defaultReps:12,defaultRest:60,tags:["Compound","Dumbbell","Mobility"],cues:"Keep elbows inside knees, upright torso."},
  {id:uid(),name:"Lat pulldown",muscle:"Upper Body Posterior",equipment:"Machine",defaultSets:3,defaultReps:12,defaultRest:90,tags:["Compound","Machine","Eccentric focus"],cues:"Pull to upper chest, control the eccentric."},
];

const AV_COLORS = ["#CECBF6:#3C3489","#9FE1CB:#085041","#F5C4B3:#712B13","#B5D4F4:#0C447C","#FAEEDA:#633806","#C0DD97:#3B6D11"];
const avColor = i => { const [bg,fg]=AV_COLORS[i%AV_COLORS.length].split(":"); return {bg,fg}; };
const initials = n => n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

const getWeekStart = (offset=0) => {
  const now=new Date(); const day=now.getDay();
  const diff=(day===0?-6:1-day)+offset*7;
  const s=new Date(now); s.setDate(now.getDate()+diff); s.setHours(0,0,0,0); return s;
};
const getWeekDates = (offset=0) => { const s=getWeekStart(offset); return DAYS.map((_,i)=>{ const d=new Date(s); d.setDate(s.getDate()+i); return d; }); };
const fmtDate = d => `${d.getMonth()+1}/${d.getDate()}`;
const fmtFull = d => d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const fmtLong = d => d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
const weekKey = (offset=0) => { const s=getWeekStart(offset); return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`; };
const addDays = (date,n) => { const d=new Date(date); d.setDate(d.getDate()+n); return d; };
const fmtShort = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const dateToKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const jsDateDayName = d => DAYS[d.getDay()===0?6:d.getDay()-1];

function loadData(){ try{ const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):null; }catch{ return null; } }
function saveData(d){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); }catch{} }
const mkDay = (label,tags,status,exercises) => ({label,tags,status,exercises,warmup:[],cooldown:[]});

// ── Progressive overload calculator ──────────────────────────────────────────
function calcNextLoad(ex, blockType="Strength"){
  if(!ex.weight) return null;
  const increments = {"Strength":5,"Power":5,"Hypertrophy":2.5,"Deload":-0.1,"Endurance":0,"Maintenance":0,"Peak":2.5,"Custom":2.5};
  const inc = increments[blockType]??2.5;
  const rpeOk = !ex.rpe || ex.rpe <= 8;
  if(!rpeOk) return {weight: ex.weight, reps: ex.reps, sets: ex.sets, note:"Hold — RPE too high"};
  if(inc < 0) return {weight: Math.round(ex.weight * 0.9 / 2.5)*2.5, reps: ex.reps, sets: Math.max(1,ex.sets-1), note:"Deload week"};
  return {weight: ex.weight + inc, reps: ex.reps, sets: ex.sets, note:`+${inc} lb`};
}

// ── Deload detector ───────────────────────────────────────────────────────────
function checkDeloadNeeded(client){
  const logs = client.sessionLogs || [];
  if(logs.length < 3) return null;
  const recent = logs.slice(-4);
  const avgRpe = recent.reduce((a,log)=>{
    const exs = log.actual || [];
    const rpes = exs.map(e=>e.rpe||0).filter(Boolean);
    return a + (rpes.length ? rpes.reduce((x,y)=>x+y,0)/rpes.length : 0);
  },0)/recent.length;
  if(avgRpe > 8.5) return {reason:"Average RPE over 8.5 across last 4 sessions — fatigue may be accumulating.",score:avgRpe.toFixed(1)};
  const consecutiveDays = recent.length >= 4;
  if(consecutiveDays && avgRpe > 7.5) return {reason:"High session frequency combined with elevated RPE detected.",score:avgRpe.toFixed(1)};
  return null;
}

const DEFAULT_CLIENTS = [
  {id:"c1",name:"Jordan Mills",goal:"Strength",level:"Intermediate",age:28,
    availability:["Mon","Wed","Fri"],workEthic:"Very coachable.",
    notes:"Slight hip shift on squat — cue left glute. Prefers morning sessions.",
    widgets:["keyLifts","overload","strengthProgress","injuries","notes"],
    keyLifts:[{name:"Bench press",current:185,start:165,goal:225},{name:"Squat",current:265,start:230,goal:315},{name:"Deadlift",current:295,start:270,goal:365}],
    injuries:[{id:uid(),location:"Lower back",description:"Mild lumbar tightness",severity:"Minor",status:"Recovering",date:"2025-03-10"}],
    periodization:[
      {id:uid(),type:"Hypertrophy",label:"Hypertrophy Block",startDate:addDays(getWeekStart(-8),0).toISOString(),weeks:4,notes:"Focus on volume."},
      {id:uid(),type:"Strength",label:"Strength Block",startDate:addDays(getWeekStart(-4),0).toISOString(),weeks:4,notes:"Increase intensity."},
      {id:uid(),type:"Deload",label:"Deload Week",startDate:addDays(getWeekStart(0),0).toISOString(),weeks:1,notes:"Active recovery."},
    ],
    sessionLogs:[],
    weekPlans:{"default":{
      Mon:mkDay("Upper",["Strength"],"published",[
        {id:uid(),name:"Squat",muscle:"Lower Body Anterior",sets:4,reps:6,weight:265,prevWeight:260,rest:180,rpe:8,notes:"Drive through heels.",setDetail:[{w:245,r:6,p:240},{w:265,r:6,p:260}],groupId:null,groupType:null,tags:["Compound","Barbell"]},
        {id:uid(),name:"Bench press",muscle:"Upper Body Anterior",sets:3,reps:8,weight:185,prevWeight:180,rest:120,rpe:7,notes:"",setDetail:[],groupId:null,groupType:null,tags:["Compound","Barbell"]},
        {id:uid(),name:"OHP",muscle:"Upper Body Anterior",sets:3,reps:10,weight:105,prevWeight:100,rest:90,rpe:7,notes:"",setDetail:[],groupId:null,groupType:null,tags:[]},
      ]),
      Tue:mkDay("Rest",[],"draft",[]),
      Wed:mkDay("Lower",["Strength"],"published",[
        {id:uid(),name:"Deadlift",muscle:"Lower Body Posterior",sets:3,reps:5,weight:295,prevWeight:285,rest:240,rpe:9,notes:"",setDetail:[],groupId:null,groupType:null,tags:["Compound","Barbell"]},
        {id:uid(),name:"Romanian DL",muscle:"Lower Body Posterior",sets:3,reps:8,weight:185,prevWeight:180,rest:120,rpe:7,notes:"",setDetail:[],groupId:null,groupType:null,tags:["Eccentric focus"]},
      ]),
      Thu:mkDay("Rest",[],"draft",[]),
      Fri:mkDay("Power",["Strength"],"published",[
        {id:uid(),name:"Squat",muscle:"Lower Body Anterior",sets:4,reps:4,weight:280,prevWeight:270,rest:240,rpe:9,notes:"",setDetail:[],groupId:null,groupType:null,tags:[]},
        {id:uid(),name:"Incline press",muscle:"Upper Body Anterior",sets:3,reps:8,weight:155,prevWeight:150,rest:120,rpe:7,notes:"",setDetail:[],groupId:null,groupType:null,tags:[]},
      ]),
      Sat:mkDay("Rest",[],"draft",[]),Sun:mkDay("Rest",[],"draft",[]),
    }},
  },
  {id:"c2",name:"Sara Reyes",goal:"Weight loss",level:"Beginner",age:34,
    availability:["Tue","Thu","Sat"],workEthic:"Motivated but needs encouragement.",
    notes:"Knee sensitivity — avoid heavy impact.",
    widgets:["bodyWeight","cardioLog","bodyComp","injuries","notes"],
    keyLifts:[{name:"Squat",current:95,start:65,goal:135},{name:"Hip thrust",current:115,start:80,goal:150}],
    injuries:[{id:uid(),location:"Right knee",description:"Patellofemoral syndrome",severity:"Moderate",status:"Active",date:"2024-09-20"}],
    periodization:[{id:uid(),type:"Endurance",label:"Cardio Foundation",startDate:addDays(getWeekStart(-6),0).toISOString(),weeks:4,notes:""}],
    sessionLogs:[],
    weekPlans:{"default":{
      Mon:mkDay("Rest",[],"draft",[]),
      Tue:mkDay("Full body",["Cardio","Strength"],"published",[
        {id:uid(),name:"Goblet squat",muscle:"Lower Body Anterior",sets:3,reps:12,weight:35,prevWeight:30,rest:60,rpe:6,notes:"",setDetail:[],groupId:null,groupType:null,tags:["Dumbbell","Mobility"]},
        {id:uid(),name:"Treadmill",muscle:"Full Body",sets:1,reps:1,weight:null,prevWeight:null,rest:0,rpe:5,notes:"30 min zone 2.",setDetail:[],groupId:null,groupType:null,tags:[]},
      ]),
      Wed:mkDay("Rest",[],"draft",[]),
      Thu:mkDay("Cardio + Core",["Cardio"],"draft",[
        {id:uid(),name:"Bike",muscle:"Full Body",sets:1,reps:1,weight:null,prevWeight:null,rest:0,rpe:5,notes:"20 min.",setDetail:[],groupId:null,groupType:null,tags:[]},
      ]),
      Fri:mkDay("Rest",[],"draft",[]),
      Sat:mkDay("Full body",["Strength"],"published",[
        {id:uid(),name:"Hip thrust",muscle:"Lower Body Posterior",sets:3,reps:12,weight:115,prevWeight:105,rest:90,rpe:7,notes:"",setDetail:[],groupId:null,groupType:null,tags:["Pause at bottom"]},
        {id:uid(),name:"Lat pulldown",muscle:"Upper Body Posterior",sets:3,reps:12,weight:70,prevWeight:65,rest:90,rpe:6,notes:"",setDetail:[],groupId:null,groupType:null,tags:["Eccentric focus"]},
      ]),
      Sun:mkDay("Rest",[],"draft",[]),
    }},
  },
];

function deriveProgress(client){
  const lifts={};const cardio=[];const volume={};
  Object.values(client.weekPlans||{}).forEach(week=>{
    DAYS.forEach(d=>{
      const day=week[d];if(!day||day.status!=="published")return;
      (day.exercises||[]).forEach(ex=>{
        if(ex.weight){
          if(!lifts[ex.name]||ex.weight>lifts[ex.name].weight)lifts[ex.name]={weight:ex.weight,sets:ex.sets,reps:ex.reps};
          const mg=ex.muscle||"Full Body";volume[mg]=(volume[mg]||0)+ex.sets;
        }else if(ex.notes&&ex.name.toLowerCase().match(/cardio|treadmill|bike|run|row/))cardio.push({name:ex.name,notes:ex.notes});
      });
    });
  });
  return {lifts,cardio,volume};
}

function getExHistory(client){
  const hist={};
  Object.entries(client.weekPlans||{}).forEach(([wk,plan])=>{
    DAYS.forEach(d=>{
      const day=plan[d];if(!day)return;
      (day.exercises||[]).forEach(ex=>{
        if(!ex.name)return;
        const k=ex.name.toLowerCase();
        if(!hist[k])hist[k]=[];
        hist[k].push({weekKey:wk,day:d,sets:ex.sets,reps:ex.reps,weight:ex.weight});
      });
    });
  });
  return hist;
}

function getLastSessionDate(client){
  let latest=null;
  (client.sessionLogs||[]).forEach(log=>{
    if(!log.date)return;const d=new Date(log.date);
    if(!latest||d>latest)latest=d;
  });
  return latest;
}

function estimateDuration(dayData){
  const exs=dayData.exercises||[];const warmup=dayData.warmup||[];const cooldown=dayData.cooldown||[];
  let secs=0;
  exs.forEach(ex=>{secs+=(ex.sets||3)*((ex.reps||8)*4+(ex.rest||90));});
  warmup.forEach(()=>secs+=300);cooldown.forEach(()=>secs+=300);
  return Math.max(15,Math.round(secs/60));
}

function useWidth(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:800);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return w;
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function Avatar({name,idx,size=32}){
  const {bg,fg}=avColor(idx);
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.35,fontWeight:500,flexShrink:0}}>{initials(name)}</div>;
}
function Tag({label}){
  const map={"Strength":{bg:"#EEEDFE",fg:"#3C3489"},"Cardio":{bg:"#E1F5EE",fg:"#085041"},"Mobility":{bg:"#FAEEDA",fg:"#633806"},"Weight loss":{bg:"#E1F5EE",fg:"#085041"},"Hypertrophy":{bg:"#EEEDFE",fg:"#3C3489"},"Endurance":{bg:"#EAF3DE",fg:"#3B6D11"},"Power":{bg:"#EEEDFE",fg:"#3C3489"}};
  const s=map[label]||{bg:"#F1EFE8",fg:"#5F5E5A"};
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:s.bg,color:s.fg}}>{label}</span>;
}
function Pill({label,active,onClick}){
  return <button onClick={onClick} style={{padding:"4px 10px",borderRadius:10,fontSize:11,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${active?"#534AB7":"var(--color-border-tertiary)"}`,background:active?"#EEEDFE":"var(--color-background-secondary)",color:active?"#3C3489":"var(--color-text-secondary)",minHeight:28}}>{label}</button>;
}
function Btn({children,onClick,primary,small,danger,ghost,style={}}){
  const base={display:"inline-flex",alignItems:"center",gap:5,fontSize:small?11:12,padding:small?"5px 11px":"7px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",border:"0.5px solid",minHeight:small?28:34,...style};
  const t=primary?{background:"#534AB7",color:"#EEEDFE",borderColor:"#534AB7"}:danger?{background:"#FCEBEB",color:"#A32D2D",borderColor:"#F09595"}:ghost?{background:"transparent",color:"#534AB7",borderColor:"#AFA9EC"}:{background:"var(--color-background-primary)",color:"var(--color-text-secondary)",borderColor:"var(--color-border-secondary)"};
  return <button style={{...base,...t}} onClick={onClick}>{children}</button>;
}
function Modal({title,onClose,children,width=380}){
  const w=useWidth();const isMobile=w<600;
  return (
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:16,borderRadius:12}} onClick={onClose}>
      <div style={{background:"#FFFFFF",borderRadius:isMobile?"14px 14px 0 0":14,border:"2px solid #D0CCED",padding:22,width:"100%",maxWidth:isMobile?"100%":width,maxHeight:isMobile?"90vh":"80vh",overflowY:"auto",boxShadow:"0 16px 48px rgba(0,0,0,.35)",color:"#1A1A2E"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1A1A2E"}}>{title}</div>
          <button onClick={onClose} style={{background:"#F0EFF8",border:"1px solid #D0CCED",borderRadius:"50%",cursor:"pointer",fontSize:16,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",color:"#534AB7",fontWeight:700}}>×</button>
        </div>
        <div style={{color:"#2D2D44"}}>{children}</div>
      </div>
    </div>
  );
}
function Field({label,children}){return <div style={{marginBottom:11}}><label style={{display:"block",fontSize:11,color:"#534AB7",marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:".04em"}}>{label}</label>{children}</div>;}
function Inp({value,onChange,type="text",placeholder="",min,max,style={}}){return <input type={type} value={value??""} onChange={onChange} placeholder={placeholder} min={min} max={max} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF",color:"#1A1A2E",fontFamily:"inherit",boxSizing:"border-box",...style}}/>;}
function Sel({value,onChange,options}){return <select value={value} onChange={onChange} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF",color:"#1A1A2E",fontFamily:"inherit"}}>{options.map(o=><option key={o}>{o}</option>)}</select>;}

// ── EXERCISE LIBRARY ──────────────────────────────────────────────────────────
function ExerciseLibraryTab({library,onUpdateLibrary}){
  const w=useWidth();const isMobile=w<600;
  const [search,setSearch]=useState("");
  const [filterMuscle,setFilterMuscle]=useState("All");
  const [filterTag,setFilterTag]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [editId,setEditId]=useState(null);
  const blank={name:"",muscle:"Lower Body Anterior",equipment:"Barbell",defaultSets:3,defaultReps:8,defaultRest:90,tags:[],cues:""};
  const [form,setForm]=useState(blank);

  const filtered=library.filter(e=>{
    const matchSearch=e.name.toLowerCase().includes(search.toLowerCase())||e.cues?.toLowerCase().includes(search.toLowerCase());
    const matchMuscle=filterMuscle==="All"||e.muscle===filterMuscle;
    const matchTag=filterTag==="All"||(e.tags||[]).includes(filterTag);
    return matchSearch&&matchMuscle&&matchTag;
  });

  const saveNew=()=>{if(!form.name.trim())return;onUpdateLibrary([...library,{...form,id:uid()}]);setForm(blank);setShowAdd(false);};
  const saveEdit=()=>{onUpdateLibrary(library.map(e=>e.id===editId?{...e,...form}:e));setEditId(null);};
  const deleteEx=id=>onUpdateLibrary(library.filter(e=>e.id!==id));
  const startEdit=e=>{setForm({name:e.name,muscle:e.muscle,equipment:e.equipment||"",defaultSets:e.defaultSets,defaultReps:e.defaultReps,defaultRest:e.defaultRest,tags:e.tags||[],cues:e.cues||""});setEditId(e.id);};
  const toggleTag=t=>{const has=form.tags.includes(t);setForm(f=>({...f,tags:has?f.tags.filter(x=>x!==t):[...f.tags,t]}));};

  const LibForm=({onSave,onCancel})=>(
    <div style={{background:"#F8F7FF",borderRadius:10,padding:16,border:"1px solid #D0CCED",marginBottom:12}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
        <Field label="Exercise name"><Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Bulgarian split squat"/></Field>
        <Field label="Muscle group"><Sel value={form.muscle} onChange={e=>setForm(f=>({...f,muscle:e.target.value}))} options={MUSCLE_GROUPS}/></Field>
        <Field label="Equipment"><Inp value={form.equipment} onChange={e=>setForm(f=>({...f,equipment:e.target.value}))} placeholder="e.g. Barbell, Dumbbell"/></Field>
        <Field label="Default sets"><Inp type="number" value={form.defaultSets} onChange={e=>setForm(f=>({...f,defaultSets:+e.target.value}))} min="1"/></Field>
        <Field label="Default reps"><Inp type="number" value={form.defaultReps} onChange={e=>setForm(f=>({...f,defaultReps:+e.target.value}))} min="1"/></Field>
        <Field label="Default rest (sec)"><Inp type="number" value={form.defaultRest} onChange={e=>setForm(f=>({...f,defaultRest:+e.target.value}))} min="0"/></Field>
      </div>
      <Field label="Tags">
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
          {EXERCISE_TAGS.map(t=><Pill key={t} label={t} active={form.tags.includes(t)} onClick={()=>toggleTag(t)}/>)}
        </div>
      </Field>
      <Field label="Coaching cues">
        <textarea value={form.cues} onChange={e=>setForm(f=>({...f,cues:e.target.value}))} placeholder="Key cues and technique notes…" style={{width:"100%",fontSize:12,padding:"7px 9px",borderRadius:8,border:"1px solid #D0CCED",background:"#FFFFFF",color:"#1A1A2E",fontFamily:"inherit",resize:"vertical",minHeight:60,boxSizing:"border-box"}}/>
      </Field>
      <div style={{display:"flex",gap:8}}><Btn primary small onClick={onSave}>Save exercise</Btn><Btn small onClick={onCancel}>Cancel</Btn></div>
    </div>
  );

  return (
    <div style={{padding:isMobile?"12px":"16px",display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:isMobile?15:16,fontWeight:700,color:"var(--color-text-primary)"}}>Exercise library</div>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{library.length} exercises</div>
        </div>
        <Btn primary small onClick={()=>setShowAdd(true)}>+ Add exercise</Btn>
      </div>

      {/* search + filters */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exercises or cues…" style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:10,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          {["All",...MUSCLE_GROUPS].map(m=><button key={m} onClick={()=>setFilterMuscle(m)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${filterMuscle===m?"#534AB7":"var(--color-border-tertiary)"}`,background:filterMuscle===m?"#534AB7":"var(--color-background-secondary)",color:filterMuscle===m?"#EEEDFE":"var(--color-text-secondary)",whiteSpace:"nowrap",minHeight:28}}>{m==="All"?"All muscles":m}</button>)}
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["All",...EXERCISE_TAGS].map(t=><Pill key={t} label={t==="All"?"All tags":t} active={filterTag===t} onClick={()=>setFilterTag(t)}/>)}
        </div>
      </div>

      {showAdd&&<LibForm onSave={saveNew} onCancel={()=>setShowAdd(false)}/>}

      {/* exercise list */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:"var(--color-text-tertiary)",fontSize:13}}>No exercises found.</div>}
        {filtered.map(e=>(
          <div key={e.id} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,overflow:"hidden"}}>
            {editId===e.id?(
              <div style={{padding:14}}><LibForm onSave={saveEdit} onCancel={()=>setEditId(null)}/></div>
            ):(
              <div style={{padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:6}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)",marginBottom:2}}>{e.name}</div>
                    <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{e.muscle}{e.equipment?` · ${e.equipment}`:""}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <Btn small onClick={()=>startEdit(e)}>Edit</Btn>
                    <Btn small danger onClick={()=>deleteEx(e.id)}>×</Btn>
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                  {[["Sets",e.defaultSets],["Reps",e.defaultReps],["Rest",`${e.defaultRest}s`]].map(([l,v])=>(
                    <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:6,padding:"3px 8px",fontSize:11}}><span style={{color:"var(--color-text-tertiary)"}}>{l}: </span><span style={{fontWeight:500,color:"var(--color-text-primary)"}}>{v}</span></div>
                  ))}
                </div>
                {(e.tags||[]).length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>{(e.tags||[]).map(t=><span key={t} style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#EEEDFE",color:"#3C3489"}}>{t}</span>)}</div>}
                {e.cues&&<div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5,background:"var(--color-background-secondary)",borderRadius:7,padding:"6px 9px"}}>📝 {e.cues}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOME / DAILY SCHEDULE ─────────────────────────────────────────────────────
function HomeTab({clients,onStartWorkout,onGoToPlan,onGoToClient}){
  const w=useWidth();const isMobile=w<600;
  const [selectedDate,setSelectedDate]=useState(()=>{const d=new Date();d.setHours(0,0,0,0);return d;});
  const [order,setOrder]=useState(null);
  const [completed,setCompleted]=useState({});
  const [expandedClient,setExpandedClient]=useState(null);
  const dayName=jsDateDayName(selectedDate);
  const dateStr=dateToKey(selectedDate);
  const isToday=selectedDate.toDateString()===new Date().toDateString();
  const clientsForDay=clients.map((client,idx)=>{
    const plan=client.weekPlans?.[dateStr]||client.weekPlans?.["default"]||{};
    const dayData=plan[dayName]||mkDay("Rest",[],"draft",[]);
    const hasSession=(dayData.exercises||[]).length>0||(dayData.warmup||[]).length>0||(dayData.cooldown||[]).length>0;
    return {client,idx,dayData,hasSession};
  }).filter(x=>x.hasSession);
  const orderedClients=order?order.map(id=>clientsForDay.find(x=>x.client.id===id)).filter(Boolean):clientsForDay;
  const moveUp=id=>{const ids=orderedClients.map(x=>x.client.id);const i=ids.indexOf(id);if(i<=0)return;[ids[i-1],ids[i]]=[ids[i],ids[i-1]];setOrder(ids);};
  const moveDown=id=>{const ids=orderedClients.map(x=>x.client.id);const i=ids.indexOf(id);if(i<0||i>=ids.length-1)return;[ids[i+1],ids[i]]=[ids[i],ids[i+1]];setOrder(ids);};
  const toggleComplete=id=>setCompleted(c=>({...c,[id]:!c[id]}));
  const shiftDate=n=>{const d=new Date(selectedDate);d.setDate(d.getDate()+n);setSelectedDate(d);};
  const completedCount=orderedClients.filter(x=>completed[x.client.id]).length;
  const totalVol=orderedClients.reduce((a,{dayData})=>a+(dayData.exercises||[]).reduce((b,e)=>b+(e.weight?(e.sets*e.reps*e.weight):0),0),0);
  return (
    <div style={{padding:isMobile?"12px":"16px",display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:isMobile?16:18,fontWeight:700,color:"var(--color-text-primary)"}}>{isToday?"Today's sessions":"Schedule"}</div>
          <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:2}}>{fmtLong(selectedDate)}</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {!isToday&&<Btn small onClick={()=>{const d=new Date();d.setHours(0,0,0,0);setSelectedDate(d);}}>Today</Btn>}
          <button onClick={()=>shiftDate(-1)} style={{width:32,height:32,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",cursor:"pointer",fontSize:16,color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <input type="date" value={dateStr} onChange={e=>{const d=new Date(e.target.value+"T00:00:00");setSelectedDate(d);}} style={{fontSize:12,padding:"5px 8px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit",cursor:"pointer"}}/>
          <button onClick={()=>shiftDate(1)} style={{width:32,height:32,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",cursor:"pointer",fontSize:16,color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>
      {orderedClients.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:8}}>
          {[["Clients",orderedClients.length],["Done",`${completedCount}/${orderedClients.length}`],["Volume",totalVol>0?`${Math.round(totalVol/1000)}k lb`:"—"],["Remaining",orderedClients.length-completedCount]].map(([l,v])=>(
            <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:2}}>{l}</div>
              <div style={{fontSize:isMobile?16:18,fontWeight:600,color:"var(--color-text-primary)"}}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {orderedClients.length===0?(
        <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:14,padding:36,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>📅</div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)",marginBottom:4}}>No sessions scheduled</div>
          <div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>No clients have a workout planned for this day.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {orderedClients.map(({client,idx,dayData},pos)=>{
            const isCompleted=!!completed[client.id];
            const isExpanded=expandedClient===client.id;
            const lastDate=getLastSessionDate(client);
            const activeInjuries=(client.injuries||[]).filter(i=>i.status==="Active");
            const isDraft=dayData.status!=="published";
            const estMins=estimateDuration(dayData);
            const vol=(dayData.exercises||[]).reduce((a,e)=>a+(e.weight?(e.sets*e.reps*e.weight):0),0);
            return (
              <div key={client.id} style={{background:"var(--color-background-primary)",border:`1.5px solid ${isCompleted?"#1D9E75":isDraft?"#F0A500":"var(--color-border-tertiary)"}`,borderRadius:14,overflow:"hidden",opacity:isCompleted?0.8:1}}>
                <div style={{padding:isMobile?"12px":"14px 16px",display:"flex",alignItems:"flex-start",gap:12}}>
                  <div onClick={()=>onGoToClient(client.id)} style={{cursor:"pointer"}}><Avatar name={client.name} idx={idx} size={isMobile?40:44}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <span onClick={()=>onGoToClient(client.id)} style={{fontSize:15,fontWeight:700,color:"var(--color-text-primary)",cursor:"pointer"}}>{client.name}</span>
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:isDraft?"#FAEEDA":"#E1F5EE",color:isDraft?"#633806":"#085041",fontWeight:500}}>{isDraft?"⚙ Draft":"✓ Published"}</span>
                      {isCompleted&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#E1F5EE",color:"#085041",fontWeight:600}}>✓ Done</span>}
                    </div>
                    {activeInjuries.length>0&&<div style={{fontSize:11,color:"#A32D2D",marginBottom:4}}>🩹 {activeInjuries.map(i=>i.location).join(", ")}</div>}
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>{dayData.label}</span>
                      <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>~{estMins} min</span>
                      {vol>0&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{Math.round(vol/1000)}k lb</span>}
                      {lastDate&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Last: {fmtShort(lastDate)}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
                    <button onClick={()=>moveUp(client.id)} disabled={pos===0} style={{width:24,height:24,borderRadius:5,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",cursor:pos===0?"default":"pointer",color:pos===0?"var(--color-text-tertiary)":"var(--color-text-secondary)",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>▲</button>
                    <button onClick={()=>moveDown(client.id)} disabled={pos===orderedClients.length-1} style={{width:24,height:24,borderRadius:5,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",cursor:pos===orderedClients.length-1?"default":"pointer",color:pos===orderedClients.length-1?"var(--color-text-tertiary)":"var(--color-text-secondary)",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>▼</button>
                  </div>
                </div>
                {client.notes&&<div style={{margin:"0 14px 10px",padding:"7px 10px",background:"#FAFAFE",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5}}>📝 {client.notes.length>100?client.notes.slice(0,100)+"…":client.notes}</div>}
                <div onClick={()=>setExpandedClient(isExpanded?null:client.id)} style={{padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,borderTop:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)"}}>
                  <span style={{fontSize:11,color:"#534AB7",fontWeight:500}}>{isExpanded?"▲ Hide":"▼ Preview workout"}</span>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{(dayData.tags||[]).map(t=><Tag key={t} label={t}/>)}</div>
                </div>
                {isExpanded&&(
                  <div style={{padding:"10px 14px 4px"}}>
                    {(dayData.warmup||[]).length>0&&<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:"#F0A500",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>🔥 Warm-up</div>{(dayData.warmup||[]).map((wm,i)=><div key={i} style={{fontSize:12,color:"var(--color-text-secondary)",padding:"2px 0"}}>· {wm.name}</div>)}</div>}
                    <div style={{marginBottom:8}}>
                      <div style={{fontSize:10,fontWeight:600,color:"#534AB7",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>💪 Main workout</div>
                      {(dayData.exercises||[]).map((ex,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                          <span style={{fontWeight:500}}>{ex.name}</span>
                          <span style={{color:"var(--color-text-secondary)"}}>{ex.sets}×{ex.reps}{ex.weight?` @ ${ex.weight}lb`:""}</span>
                        </div>
                      ))}
                    </div>
                    {(dayData.cooldown||[]).length>0&&<div style={{marginBottom:8}}><div style={{fontSize:10,fontWeight:600,color:"#1D9E75",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>🧊 Cool-down</div>{(dayData.cooldown||[]).map((cd,i)=><div key={i} style={{fontSize:12,color:"var(--color-text-secondary)",padding:"2px 0"}}>· {cd.name}</div>)}</div>}
                  </div>
                )}
                <div style={{padding:"10px 14px",borderTop:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",background:"var(--color-background-secondary)"}}>
                  {!isDraft&&!isCompleted&&<Btn primary small onClick={()=>onStartWorkout(client,dayData,dayName,selectedDate)}>▶ Start workout</Btn>}
                  {isDraft&&<span style={{fontSize:11,color:"#633806"}}>⚙ Publish to enable workout mode</span>}
                  <Btn small ghost onClick={()=>onGoToPlan(client.id,dayName,selectedDate)}>Open in plan</Btn>
                  <button onClick={()=>toggleComplete(client.id)} style={{marginLeft:"auto",fontSize:11,padding:"5px 11px",borderRadius:8,border:`0.5px solid ${isCompleted?"#1D9E75":"var(--color-border-tertiary)"}`,background:isCompleted?"#E1F5EE":"var(--color-background-primary)",color:isCompleted?"#085041":"var(--color-text-secondary)",cursor:"pointer",fontFamily:"inherit"}}>
                    {isCompleted?"✓ Completed":"Mark complete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {orderedClients.length>0&&completedCount===orderedClients.length&&(
        <div style={{background:"#E1F5EE",border:"1px solid #9FE1CB",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:4}}>🎉</div>
          <div style={{fontSize:14,fontWeight:600,color:"#085041"}}>All sessions complete!</div>
          <div style={{fontSize:12,color:"#2D8A5E",marginTop:2}}>{completedCount} client{completedCount!==1?"s":""} trained today.</div>
        </div>
      )}
    </div>
  );
}

// ── CLIENT TRACKER TAB ────────────────────────────────────────────────────────
function ClientTrackerTab({client,onUpdate}){
  const w=useWidth();const isMobile=w<600;
  const [showCustomize,setShowCustomize]=useState(false);
  const [pending,setPending]=useState(new Set(client.widgets));
  const [showAI,setShowAI]=useState(false);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiText,setAiText]=useState("");
  const derived=deriveProgress(client);
  const liveLifts=(client.keyLifts||[]).map(l=>({...l,current:derived.lifts[l.name]?.weight||l.current}));
  const deloadAlert=checkDeloadNeeded(client);
  const currentBlock=(client.periodization||[]).find(b=>{const s=new Date(b.startDate);const e=addDays(s,b.weeks*7-1);const t=new Date();return t>=s&&t<=e;});

  const toggleDay=d=>{const avail=client.availability||[];onUpdate({...client,availability:avail.includes(d)?avail.filter(x=>x!==d):[...avail,d]});};
  const openCustomize=()=>{setPending(new Set(client.widgets));setShowCustomize(true);};
  const applyWidgets=()=>{onUpdate({...client,widgets:[...pending]});setShowCustomize(false);};
  const removeWidget=id=>onUpdate({...client,widgets:client.widgets.filter(w=>w!==id)});
  const askAI=async()=>{
    setAiLoading(true);setAiText("");setShowAI(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Personal trainer AI. Client: ${client.name}, Goal: ${client.goal}, Level: ${client.level}. Notes: ${client.notes}. Injuries: ${JSON.stringify(client.injuries||[])}. Give 4-5 bullet practical weekly recommendations.`}]})});
      const d=await res.json();setAiText(d.content?.map(b=>b.text||"").join("\n")||"No response.");
    }catch{setAiText("Could not connect.");}
    setAiLoading(false);
  };
  const generateDeload=()=>{
    const updated={...client,weekPlans:{...client.weekPlans}};
    const defaultPlan=updated.weekPlans["default"]||{};
    const deloadPlan={};
    DAYS.forEach(d=>{
      const day=defaultPlan[d];
      if(!day||(day.exercises||[]).length===0){deloadPlan[d]=mkDay("Rest",[],"draft",[]);return;}
      const reducedExs=(day.exercises||[]).map(ex=>({...ex,sets:Math.max(1,Math.round(ex.sets*0.6)),weight:ex.weight?Math.round(ex.weight*0.8/2.5)*2.5:null,rpe:null}));
      deloadPlan[d]={...day,label:`Deload — ${day.label}`,status:"draft",exercises:reducedExs};
    });
    const deloadKey=weekKey(1);
    updated.weekPlans[deloadKey]=deloadPlan;
    onUpdate(updated);
  };
  const activeDays=Object.values(client.weekPlans?.default||{}).filter(d=>d.exercises?.length>0).length;
  const totalEx=Object.values(client.weekPlans?.default||{}).reduce((a,d)=>a+(d.exercises?.length||0),0);
  const lastSession=getLastSessionDate(client);
  return (
    <div style={{padding:isMobile?"12px":"16px",display:"flex",flexDirection:"column",gap:14,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:isMobile?15:16,fontWeight:700,color:"var(--color-text-primary)"}}>{client.name}</div>
          <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:2}}>{client.goal} · {client.level} · Age {client.age}</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Btn small onClick={()=>{setShowAI(true);askAI();}}>✨ AI insights</Btn>
          <Btn small primary onClick={openCustomize}>⊞ Customize</Btn>
        </div>
      </div>

      {/* deload alert */}
      {deloadAlert&&(
        <div style={{background:"#FAEEDA",border:"1px solid #E8B87D",borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#633806",marginBottom:3}}>⚠️ Deload recommended</div>
            <div style={{fontSize:11,color:"#633806"}}>{deloadAlert.reason}</div>
            <div style={{fontSize:10,color:"#8B5A1A",marginTop:2}}>Average RPE: {deloadAlert.score}</div>
          </div>
          <Btn small onClick={generateDeload} style={{background:"#633806",color:"#FAEEDA",borderColor:"#633806",flexShrink:0}}>Auto-generate deload</Btn>
        </div>
      )}

      {/* current block */}
      {currentBlock&&(
        <div style={{background:"#EEEDFE",border:"1px solid #AFA9EC",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:BLOCK_COLORS[currentBlock.type]||"#534AB7",flexShrink:0}}/>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:"#3C3489"}}>{currentBlock.label}</div>
            <div style={{fontSize:10,color:"#6B68A8"}}>{currentBlock.type} block · {currentBlock.weeks} week{currentBlock.weeks!==1?"s":""}</div>
          </div>
        </div>
      )}

      {/* schedule overview */}
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:12,fontWeight:600,color:"var(--color-text-primary)",marginBottom:4}}>📆 Training schedule</div>
        <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:10}}>Toggle days to update when you train with {client.name.split(" ")[0]}.</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {DAYS.map(d=>{const active=(client.availability||[]).includes(d);return <button key={d} onClick={()=>toggleDay(d)} style={{padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${active?"#534AB7":"var(--color-border-tertiary)"}`,background:active?"#534AB7":"var(--color-background-secondary)",color:active?"#EEEDFE":"var(--color-text-secondary)",minWidth:44,minHeight:36}}>{d}</button>;})}
        </div>
        <div style={{marginTop:10,display:"flex",gap:14,flexWrap:"wrap"}}>
          {[["Days/week",(client.availability||[]).length],["Active days",activeDays],["Exercises",totalEx],lastSession?["Last session",fmtShort(lastSession)]:null].filter(Boolean).map(([l,v])=>(
            <div key={l}><div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* progressive overload preview */}
      {liveLifts.some(l=>l.current>0)&&(
        <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontSize:12,fontWeight:600,color:"var(--color-text-primary)",marginBottom:3}}>📈 Progressive overload — next session</div>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:10}}>Based on current block: <strong>{currentBlock?.type||"Strength"}</strong></div>
          {liveLifts.filter(l=>l.current>0).map((l,i)=>{
            const next=calcNextLoad({weight:l.current,reps:l.reps||8,sets:l.sets||3},currentBlock?.type||"Strength");
            if(!next)return null;
            return (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,padding:"6px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                <span style={{fontWeight:500,color:"var(--color-text-primary)"}}>{l.name}</span>
                <span style={{color:"var(--color-text-secondary)"}}>{l.current} lb</span>
                <span style={{color:"#0F6E56",fontWeight:600}}>→ {next.weight} lb <span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>({next.note})</span></span>
              </div>
            );
          })}
        </div>
      )}

      {/* widgets */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
        {client.widgets.map(wid=>(
          <WidgetCard key={wid} id={wid} client={client} liveLifts={liveLifts} derived={derived} onUpdate={onUpdate} onRemove={removeWidget} customizing={showCustomize}/>
        ))}
      </div>

      {showCustomize&&(
        <Modal title="⊞ Customize widgets" onClose={()=>setShowCustomize(false)} width={420}>
          <p style={{fontSize:12,color:"#534AB7",marginBottom:14}}>Toggle widgets or load a goal preset.</p>
          <div style={{fontSize:11,fontWeight:700,color:"#3C3489",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Goal presets</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{GOALS.map(g=><span key={g} onClick={()=>setPending(new Set(GOAL_PRESETS[g]||[]))} style={{fontSize:11,padding:"5px 12px",borderRadius:8,border:"1px solid #D0CCED",background:client.goal===g?"#EEEDFE":"#F8F7FF",color:client.goal===g?"#3C3489":"#534AB7",cursor:"pointer",fontWeight:500}}>{g}</span>)}</div>
          <div style={{fontSize:11,fontWeight:700,color:"#3C3489",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Widgets</div>
          {ALL_WIDGETS.map(w=>(
            <div key={w.id} onClick={()=>{const s=new Set(pending);s.has(w.id)?s.delete(w.id):s.add(w.id);setPending(s);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:8,marginBottom:4,border:`1px solid ${pending.has(w.id)?"#534AB7":"#D0CCED"}`,background:pending.has(w.id)?"#EEEDFE":"#F8F7FF",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{w.icon}</span><div><div style={{fontSize:12,color:"#1A1A2E",fontWeight:500}}>{w.name}</div><div style={{fontSize:10,color:"#666"}}>{w.tag}</div></div></div>
              {pending.has(w.id)&&<span style={{color:"#534AB7",fontWeight:700}}>✓</span>}
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:14}}><Btn onClick={()=>setShowCustomize(false)}>Cancel</Btn><Btn primary onClick={applyWidgets}>Apply</Btn></div>
        </Modal>
      )}
      {showAI&&(
        <Modal title="✨ AI insights" onClose={()=>setShowAI(false)}>
          {aiLoading?<div style={{fontSize:13,color:"#534AB7",padding:"20px 0",textAlign:"center"}}>Generating…</div>:<div style={{fontSize:13,color:"#1A1A2E",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{aiText}</div>}
          {!aiLoading&&<div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}><Btn primary onClick={()=>setShowAI(false)}>Done</Btn></div>}
        </Modal>
      )}
    </div>
  );
}

// ── WIDGET COMPONENTS ─────────────────────────────────────────────────────────
function OverloadRows({liveLifts,blockType}){return <div>{liveLifts.filter(l=>l.current>0).map((l,i)=>{const next=calcNextLoad({weight:l.current,reps:l.reps||8,sets:l.sets||3,rpe:null},blockType);if(!next)return null;return <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span>{l.name}</span><span style={{color:"var(--color-text-secondary)"}}>{l.current} lb</span><span style={{color:"#0F6E56",fontWeight:500}}>→ {next.weight} lb</span></div>;})}</div>;}
function StrengthProgressRows({liveLifts}){return <div>{liveLifts.filter(l=>l.current>0&&l.goal>0).map((l,i)=>{const pct=Math.min(100,Math.round(((l.current-l.start)/(l.goal-l.start))*100));return <div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:"var(--color-text-secondary)"}}>{l.name}</span><span style={{color:"var(--color-text-tertiary)"}}>{pct}%</span></div><div style={{height:5,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"#534AB7",borderRadius:3}}/></div></div>;})}</div>;}
function CardioLogRows({cardio}){return <div>{cardio.slice(0,3).map((c,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span>{c.name}</span><span style={{color:"var(--color-text-secondary)"}}>{c.notes}</span></div>)}</div>;}
function VolumeTrackerRows({volume}){return <div>{Object.entries(volume).map(([mg,sets])=><div key={mg} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span style={{fontSize:10}}>{mg}</span><span style={{fontWeight:500}}>{sets} sets</span></div>)}</div>;}
function MuscleGroupSplitRows({volume}){const total=Object.values(volume).reduce((a,b)=>a+b,0);return <div>{Object.entries(volume).map(([mg,sets])=>{const pct=Math.round((sets/total)*100);return <div key={mg} style={{marginBottom:7}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}><span style={{color:"var(--color-text-secondary)"}}>{mg}</span><span style={{color:"var(--color-text-tertiary)"}}>{pct}%</span></div><div style={{height:5,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:"#534AB7",borderRadius:3}}/></div></div>;})}</div>;}

function WidgetCard({id,client,liveLifts,derived,onUpdate,onRemove,customizing}){
  const w=ALL_WIDGETS.find(x=>x.id===id);
  const currentBlock=(client.periodization||[]).find(b=>{const s=new Date(b.startDate);const e=addDays(s,b.weeks*7-1);const t=new Date();return t>=s&&t<=e;});
  const wrap=(content,full=false)=>(
    <div style={{gridColumn:full?"1/-1":"auto",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"12px 14px",position:"relative"}}>
      {customizing&&<button onClick={()=>onRemove(id)} style={{position:"absolute",top:7,right:7,width:22,height:22,borderRadius:"50%",background:"#FCEBEB",border:"1px solid #F09595",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",color:"#A32D2D",fontWeight:700}}>×</button>}
      <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)",marginBottom:9,display:"flex",alignItems:"center",gap:5,paddingRight:customizing?26:0}}>{w?.icon} {w?.name}</div>
      {content}
    </div>
  );
  const empty=msg=><div style={{fontSize:11,color:"var(--color-text-tertiary)",padding:"12px 0",textAlign:"center"}}>{msg}</div>;
  const hasLifts=liveLifts.length>0&&liveLifts.some(l=>l.current>0);
  const hasVol=Object.keys(derived.volume||{}).length>0;
  if(id==="keyLifts")return wrap(<KeyLiftsWidget client={client} liveLifts={liveLifts} onUpdate={onUpdate}/>,true);
  if(id==="overload")return wrap(hasLifts?<OverloadRows liveLifts={liveLifts} blockType={currentBlock?.type||"Strength"}/>:empty("No published workouts yet."));
  if(id==="strengthProgress")return wrap(hasLifts?<StrengthProgressRows liveLifts={liveLifts}/>:empty("No published workouts yet."));
  if(id==="notes")return wrap(<NotesWidget client={client} onUpdate={onUpdate}/>,true);
  if(id==="injuries")return wrap(<InjuriesWidget client={client} onUpdate={onUpdate}/>,true);
  if(id==="bodyWeight")return wrap(empty("Log body weight in sessions to see data here."),true);
  if(id==="cardioLog")return wrap(derived.cardio&&derived.cardio.length>0?<CardioLogRows cardio={derived.cardio}/>:empty("No cardio sessions published yet."));
  if(id==="bodyComp")return wrap(empty("Log body composition data to see trends here."),true);
  if(id==="volumeTracker")return wrap(hasVol?<VolumeTrackerRows volume={derived.volume}/>:empty("No published workouts yet."));
  if(id==="muscleGroupSplit")return wrap(hasVol?<MuscleGroupSplitRows volume={derived.volume}/>:empty("No published workouts yet."));
  if(id==="cardioBenchmarks")return wrap(empty("No cardio benchmark data yet."));
  if(id==="distanceTrends")return wrap(empty("No distance data yet."));
  return wrap(empty("No data yet."));
}

function KeyLiftsWidget({client,liveLifts,onUpdate}){
  const [editing,setEditing]=useState(false);
  const [lifts,setLifts]=useState(liveLifts);
  useEffect(()=>setLifts(liveLifts),[JSON.stringify(liveLifts)]);
  const save=()=>{onUpdate({...client,keyLifts:lifts});setEditing(false);};
  return (
    <div>
      {lifts.length===0?<div style={{fontSize:11,color:"var(--color-text-tertiary)",padding:"10px 0",textAlign:"center"}}>No key lifts set yet.</div>
      :<div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(lifts.length,3)},1fr)`,gap:8,marginBottom:8}}>
        {lifts.map((l,i)=>(
          <div key={i} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 10px"}}>
            {editing?<input value={l.name} onChange={e=>{const n=[...lifts];n[i]={...n[i],name:e.target.value};setLifts(n);}} style={{width:"100%",fontSize:10,marginBottom:3,padding:"2px 4px",borderRadius:4,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit"}}/>:<div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:2}}>{l.name}</div>}
            {editing?<input type="number" value={l.current} onChange={e=>{const n=[...lifts];n[i]={...n[i],current:+e.target.value};setLifts(n);}} style={{width:"100%",fontSize:15,fontWeight:500,padding:"2px 4px",borderRadius:4,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit"}}/>:<div style={{fontSize:17,fontWeight:500,color:"var(--color-text-primary)"}}>{l.current>0?`${l.current} lb`:"—"}</div>}
            {l.current>0&&l.start>0&&<div style={{fontSize:10,color:"#0F6E56",marginTop:2}}>↑ +{Math.max(0,l.current-l.start)} lb</div>}
          </div>
        ))}
      </div>}
      <div style={{display:"flex",gap:6}}>
        {editing&&<Btn small onClick={()=>setLifts([...lifts,{name:"New lift",current:0,start:0,goal:0}])}>+ Add</Btn>}
        {editing&&lifts.length>0&&<Btn small danger onClick={()=>setLifts(lifts.slice(0,-1))}>− Remove</Btn>}
        <Btn small onClick={editing?save:()=>setEditing(true)}>{editing?"Save":"Edit lifts"}</Btn>
        {editing&&<Btn small onClick={()=>{setLifts(liveLifts);setEditing(false);}}>Cancel</Btn>}
      </div>
    </div>
  );
}

function NotesWidget({client,onUpdate}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(client.notes||"");
  return (
    <div>
      {editing?<textarea value={val} onChange={e=>setVal(e.target.value)} style={{width:"100%",fontSize:12,padding:"7px 9px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit",resize:"vertical",minHeight:64,boxSizing:"border-box"}}/>
        :<div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 10px",fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.6,minHeight:48}}>{val||"No notes yet."}</div>}
      <div style={{marginTop:7,display:"flex",gap:6}}>
        <Btn small onClick={()=>{if(editing)onUpdate({...client,notes:val});setEditing(e=>!e);}}>{editing?"Save":"Edit"}</Btn>
        {editing&&<Btn small onClick={()=>{setVal(client.notes||"");setEditing(false);}}>Cancel</Btn>}
      </div>
    </div>
  );
}

function InjuriesWidget({client,onUpdate}){
  const [adding,setAdding]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [form,setForm]=useState({location:"",description:"",severity:"Minor",status:"Active",date:""});
  const injuries=client.injuries||[];
  const statusColor={"Active":"#A32D2D","Recovering":"#633806","Recovered":"#085041"};
  const statusBg={"Active":"#FCEBEB","Recovering":"#FAEEDA","Recovered":"#E1F5EE"};
  const saveNew=()=>{if(!form.location.trim())return;onUpdate({...client,injuries:[...injuries,{...form,id:uid()}]});setForm({location:"",description:"",severity:"Minor",status:"Active",date:""});setAdding(false);};
  const saveEdit=()=>{onUpdate({...client,injuries:injuries.map(inj=>inj.id===editingId?{...inj,...form}:inj)});setEditingId(null);};
  const remove=id=>onUpdate({...client,injuries:injuries.filter(i=>i.id!==id)});
  const startEdit=inj=>{setForm({location:inj.location,description:inj.description,severity:inj.severity,status:inj.status,date:inj.date||""});setEditingId(inj.id);};
  const InjuryForm=({onSave,onCancel})=>(
    <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:10,marginTop:8,border:"0.5px solid var(--color-border-tertiary)"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <Field label="Body location"><Inp value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Left knee"/></Field>
        <Field label="Date noted"><Inp type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
        <Field label="Severity"><Sel value={form.severity} onChange={e=>setForm(f=>({...f,severity:e.target.value}))} options={SEVERITY}/></Field>
        <Field label="Status"><Sel value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} options={INJURY_STATUS}/></Field>
      </div>
      <Field label="Description"><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Details…" style={{width:"100%",fontSize:12,padding:"6px 8px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit",resize:"none",height:52,boxSizing:"border-box"}}/></Field>
      <div style={{display:"flex",gap:6}}><Btn small primary onClick={onSave}>Save</Btn><Btn small onClick={onCancel}>Cancel</Btn></div>
    </div>
  );
  return (
    <div>
      {injuries.length===0&&!adding&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",textAlign:"center",padding:"8px 0"}}>No injuries on file.</div>}
      {injuries.map(inj=>(
        <div key={inj.id} style={{marginBottom:8}}>
          {editingId===inj.id?<InjuryForm onSave={saveEdit} onCancel={()=>setEditingId(null)}/>
          :<div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"9px 11px",border:"0.5px solid var(--color-border-tertiary)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontSize:12,fontWeight:500}}>🩹 {inj.location}</span><span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:statusBg[inj.status],color:statusColor[inj.status]}}>{inj.status}</span><span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"var(--color-background-primary)",color:"var(--color-text-tertiary)",border:"0.5px solid var(--color-border-tertiary)"}}>{inj.severity}</span></div>
              <div style={{display:"flex",gap:5}}><button onClick={()=>startEdit(inj)} style={{fontSize:11,background:"none",border:"none",cursor:"pointer",color:"#534AB7",padding:"2px 6px"}}>Edit</button><button onClick={()=>remove(inj.id)} style={{fontSize:11,background:"none",border:"none",cursor:"pointer",color:"#A32D2D",padding:"2px 6px"}}>×</button></div>
            </div>
            {inj.description&&<div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5}}>{inj.description}</div>}
            {inj.date&&<div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:3}}>Noted: {inj.date}</div>}
          </div>}
        </div>
      ))}
      {adding&&<InjuryForm onSave={saveNew} onCancel={()=>setAdding(false)}/>}
      {!adding&&!editingId&&<Btn small onClick={()=>setAdding(true)}>+ Add injury / note</Btn>}
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function OnboardingTab({clients,onAdd}){
  const w=useWidth();const isMobile=w<600;
  const blank={name:"",age:"",goal:"Strength",level:"Beginner",availability:[],workEthic:"",notes:""};
  const [form,setForm]=useState(blank);const [saved,setSaved]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleDay=d=>set("availability",form.availability.includes(d)?form.availability.filter(x=>x!==d):[...form.availability,d]);
  const submit=()=>{
    if(!form.name.trim())return;
    const c={id:uid(),...form,age:+form.age||0,widgets:GOAL_PRESETS[form.goal]||["notes"],keyLifts:[{name:"Squat",current:0,start:0,goal:0},{name:"Bench press",current:0,start:0,goal:0}],injuries:[],periodization:[],sessionLogs:[],weekPlans:{"default":Object.fromEntries(DAYS.map(d=>[d,mkDay("Rest",[],"draft",[])]))}};
    onAdd(c);setForm(blank);setSaved(true);setTimeout(()=>setSaved(false),2500);
  };
  return (
    <div style={{padding:isMobile?"12px":"16px",maxWidth:560}}>
      <div style={{fontSize:15,fontWeight:600,color:"var(--color-text-primary)",marginBottom:3}}>Onboard new client</div>
      <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:14}}>Fill in the details below to get started.</div>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <Field label="Full name"><Inp value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Alex Johnson"/></Field>
          <Field label="Age"><Inp type="number" value={form.age} onChange={e=>set("age",e.target.value)} placeholder="30" min="10" max="99"/></Field>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
          <Field label="Primary goal"><Sel value={form.goal} onChange={e=>set("goal",e.target.value)} options={GOALS}/></Field>
          <Field label="Fitness level"><Sel value={form.level} onChange={e=>set("level",e.target.value)} options={LEVELS}/></Field>
        </div>
        <Field label="Availability"><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{DAYS.map(d=><button key={d} onClick={()=>toggleDay(d)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${form.availability.includes(d)?"#534AB7":"var(--color-border-tertiary)"}`,background:form.availability.includes(d)?"#534AB7":"var(--color-background-secondary)",color:form.availability.includes(d)?"#EEEDFE":"var(--color-text-secondary)",minHeight:36}}>{d}</button>)}</div></Field>
        <Field label="Work ethic & personality"><textarea value={form.workEthic} onChange={e=>set("workEthic",e.target.value)} placeholder="e.g. Very motivated…" style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF",color:"#1A1A2E",fontFamily:"inherit",resize:"vertical",minHeight:52,boxSizing:"border-box"}}/></Field>
        <Field label="Additional notes"><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Injuries, preferences…" style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF",color:"#1A1A2E",fontFamily:"inherit",resize:"vertical",minHeight:52,boxSizing:"border-box"}}/></Field>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8}}><Btn primary onClick={submit}>Add client</Btn>{saved&&<span style={{fontSize:12,color:"#0F6E56"}}>✓ Client added!</span>}</div>
      </div>
      <div style={{marginTop:18}}>
        <div style={{fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>Current clients ({clients.length})</div>
        {clients.map((c,i)=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:6,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)"}}>
            <Avatar name={c.name} idx={i}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)"}}>{c.name}</div><div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{c.goal} · {c.level} · Age {c.age}</div></div>
            <Tag label={c.goal}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EXERCISE CARD & ADD MODAL ─────────────────────────────────────────────────
function ExerciseSection({title,color,icon,exercises,onAdd,onUpdate,onRemove,onUpdateSetDetail,isDraft,exHistory,collapsed=false,library=[]}){
  const [open,setOpen]=useState(!collapsed);
  const [openEx,setOpenEx]=useState(null);
  return (
    <div style={{border:`0.5px solid ${color}44`,borderRadius:12,overflow:"hidden",marginBottom:8}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:`${color}11`,cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><span style={{fontSize:14}}>{icon}</span><span style={{fontSize:12,fontWeight:600,color:"var(--color-text-primary)"}}>{title}</span><span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>({exercises.length})</span></div>
        <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
          {exercises.length===0&&<div style={{fontSize:11,color:"var(--color-text-tertiary)",textAlign:"center",padding:"8px 0"}}>No exercises added yet.</div>}
          {exercises.map((ex,i)=><ExerciseCard key={ex.id||i} ex={ex} idx={i} open={openEx===i} onToggle={()=>setOpenEx(openEx===i?null:i)} onUpdate={(f,v)=>onUpdate(i,f,v)} onRemove={()=>onRemove(i)} onUpdateSetDetail={(si,field,val)=>onUpdateSetDetail(i,si,field,val)} exHistory={exHistory}/>)}
          {isDraft&&<button onClick={onAdd} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:12,color,background:"none",border:`0.5px dashed ${color}`,borderRadius:8,padding:9,cursor:"pointer",fontFamily:"inherit",minHeight:36}}>+ Add exercise</button>}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ex,idx,open,onToggle,onUpdate,onRemove,onUpdateSetDetail,exHistory={}}){
  const hasWeight=ex.weight!=null;
  const olDiff=hasWeight&&ex.prevWeight?ex.weight-ex.prevWeight:null;
  const hist=exHistory[ex.name?.toLowerCase()];
  const lastSession=hist&&hist.length>0?hist[hist.length-1]:null;
  return (
    <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,overflow:"hidden"}}>
      <div onClick={onToggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 13px",cursor:"pointer",minHeight:48}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"#EEEDFE",color:"#3C3489",fontSize:10,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{idx+1}</div>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{ex.name}</div>
            <div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{ex.muscle}{(ex.tags||[]).length>0?` · ${(ex.tags||[]).slice(0,2).join(", ")}`:""}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {hasWeight&&<span style={{background:"var(--color-background-secondary)",borderRadius:6,padding:"3px 8px",fontSize:11}}>{ex.sets}×{ex.reps}</span>}
          {hasWeight&&<span style={{background:"var(--color-background-secondary)",borderRadius:6,padding:"3px 8px",fontSize:11}}>{ex.weight} lb</span>}
          {ex.rpe&&<span style={{background:"var(--color-background-secondary)",borderRadius:6,padding:"3px 8px",fontSize:11}}>RPE {ex.rpe}</span>}
          <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&(
        <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",padding:"12px 13px",background:"var(--color-background-secondary)"}}>
          {lastSession&&<div style={{fontSize:11,padding:"7px 10px",borderRadius:8,background:"#E1F5EE",color:"#085041",marginBottom:10,border:"0.5px solid #9FE1CB"}}>📅 Last: {lastSession.sets}×{lastSession.reps}{lastSession.weight?` @ ${lastSession.weight} lb`:""} ({lastSession.day})</div>}
          {olDiff!==null&&olDiff>0&&<div style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,padding:"3px 9px",borderRadius:10,background:"#E1F5EE",color:"#085041",marginBottom:10}}>📈 +{olDiff} lb</div>}
          {hasWeight&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:11}}>{[["Sets","sets"],["Reps","reps"],["Weight (lb)","weight"],["Rest (sec)","rest"]].map(([l,k])=><div key={k} style={{background:"var(--color-background-primary)",borderRadius:8,padding:"8px 8px",border:"0.5px solid var(--color-border-tertiary)"}}><div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:2}}>{l}</div><input type="number" value={ex[k]||""} onChange={e=>onUpdate(k,+e.target.value)} style={{width:"100%",fontSize:15,fontWeight:500,padding:0,border:"none",background:"none",color:"var(--color-text-primary)",fontFamily:"inherit"}}/></div>)}</div>}
          {(ex.tags||[]).length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>{(ex.tags||[]).map(t=><span key={t} style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#EEEDFE",color:"#3C3489"}}>{t}</span>)}</div>}
          <div style={{marginBottom:9}}><div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:4}}>Muscle group</div><Sel value={ex.muscle||""} onChange={e=>onUpdate("muscle",e.target.value)} options={["",...MUSCLE_GROUPS]}/></div>
          <div style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:9}}><span style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:8}}>📝</span><textarea value={ex.notes||""} onChange={e=>onUpdate("notes",e.target.value)} placeholder="Coaching notes…" style={{flex:1,fontSize:12,padding:"7px 8px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontFamily:"inherit",resize:"none",height:38}}/></div>
          <Btn small danger onClick={onRemove}>Remove exercise</Btn>
        </div>
      )}
    </div>
  );
}

function AddExerciseModal({onClose,onAdd,exHistory,library=[]}){
  const [tab,setTab]=useState("library"); // library | custom
  const [search,setSearch]=useState("");
  const [form,setForm]=useState({name:"",muscle:"",sets:3,reps:8,weight:"",rest:90,rpe:7,notes:"",tags:[]});
  const [aiMuscle,setAiMuscle]=useState(false);
  const [prevSession,setPrevSession]=useState(null);
  const nameTimer=useRef(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const filteredLib=library.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())||(e.muscle||"").toLowerCase().includes(search.toLowerCase()));

  const onNameChange=async val=>{
    set("name",val);
    const hist=exHistory[val.toLowerCase()];
    setPrevSession(hist&&hist.length>0?hist[hist.length-1]:null);
    if(nameTimer.current)clearTimeout(nameTimer.current);
    if(val.trim().length>2){
      setAiMuscle(true);
      nameTimer.current=setTimeout(async()=>{
        try{
          const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:60,messages:[{role:"user",content:`For the exercise "${val}", which single muscle group from this list applies: ${MUSCLE_GROUPS.join(", ")}? Reply with ONLY the exact name.`}]})});
          const d=await res.json();const suggested=(d.content?.[0]?.text||"").trim();
          if(MUSCLE_GROUPS.includes(suggested))set("muscle",suggested);
        }catch{}
        setAiMuscle(false);
      },700);
    }
  };

  const addFromLibrary=e=>{
    onAdd({name:e.name,muscle:e.muscle,sets:e.defaultSets,reps:e.defaultReps,weight:"",rest:e.defaultRest,rpe:7,notes:e.cues||"",tags:e.tags||[],prevWeight:null,setDetail:[],groupId:null,groupType:null});
  };

  const submitCustom=()=>{
    if(!form.name.trim())return;
    onAdd({...form,sets:+form.sets,reps:+form.reps,weight:form.weight?+form.weight:null,prevWeight:null,rest:+form.rest,rpe:+form.rpe,setDetail:[],groupId:null,groupType:null});
  };

  return (
    <Modal title="Add exercise" onClose={onClose} width={440}>
      <div style={{display:"flex",gap:0,borderBottom:"1px solid #D0CCED",marginBottom:14}}>
        {[["library","📚 From library"],["custom","✏️ Custom"]].map(([t,l])=>(
          <div key={t} onClick={()=>setTab(t)} style={{padding:"7px 14px",fontSize:12,cursor:"pointer",borderBottom:`2px solid ${tab===t?"#534AB7":"transparent"}`,color:tab===t?"#1A1A2E":"#666",fontWeight:tab===t?600:400,marginBottom:-1}}>{l}</div>
        ))}
      </div>

      {tab==="library"&&(
        <>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search library…" style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF",color:"#1A1A2E",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:320,overflowY:"auto"}}>
            {filteredLib.map(e=>(
              <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#1A1A2E"}}>{e.name}</div>
                  <div style={{fontSize:11,color:"#666"}}>{e.muscle} · {e.defaultSets}×{e.defaultReps}</div>
                  {(e.tags||[]).length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:3}}>{(e.tags||[]).slice(0,3).map(t=><span key={t} style={{fontSize:9,padding:"1px 6px",borderRadius:8,background:"#EEEDFE",color:"#3C3489"}}>{t}</span>)}</div>}
                </div>
                <Btn primary small onClick={()=>addFromLibrary(e)}>Add</Btn>
              </div>
            ))}
            {filteredLib.length===0&&<div style={{textAlign:"center",color:"#666",fontSize:12,padding:"20px 0"}}>No exercises found.</div>}
          </div>
        </>
      )}

      {tab==="custom"&&(
        <>
          <Field label="Exercise name"><Inp value={form.name} onChange={e=>onNameChange(e.target.value)} placeholder="e.g. Barbell row"/></Field>
          {prevSession&&<div style={{background:"#E1F5EE",border:"1px solid #9FE1CB",borderRadius:8,padding:"8px 11px",marginBottom:11,fontSize:12,color:"#085041",fontWeight:500}}>📅 Last: {prevSession.sets}×{prevSession.reps}{prevSession.weight?` @ ${prevSession.weight} lb`:""} ({prevSession.day})</div>}
          <Field label={`Muscle group${aiMuscle?" (detecting…)":""}`}><Sel value={form.muscle} onChange={e=>set("muscle",e.target.value)} options={["",...MUSCLE_GROUPS]}/></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Sets"><Inp type="number" value={form.sets} onChange={e=>set("sets",e.target.value)} min="1"/></Field>
            <Field label="Reps"><Inp type="number" value={form.reps} onChange={e=>set("reps",e.target.value)} min="1"/></Field>
            <Field label="Weight (lb)"><Inp type="number" value={form.weight} onChange={e=>set("weight",e.target.value)} placeholder="blank = bodyweight"/></Field>
            <Field label="Rest (sec)"><Inp type="number" value={form.rest} onChange={e=>set("rest",e.target.value)} min="0"/></Field>
            <Field label="RPE (1–10)"><Inp type="number" value={form.rpe} onChange={e=>set("rpe",e.target.value)} min="1" max="10"/></Field>
          </div>
          <Field label="Coaching notes"><Inp value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Cues, reminders…"/></Field>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}><Btn onClick={onClose}>Cancel</Btn><Btn primary onClick={submitCustom}>Add exercise</Btn></div>
        </>
      )}
    </Modal>
  );
}

// ── FITNESS PLANS ─────────────────────────────────────────────────────────────
function FitnessPlansTab({client,onUpdate,onStartWorkout,onGoToHome,library}){
  const w=useWidth();const isMobile=w<600;
  const [weekOffset,setWeekOffset]=useState(0);
  const [activeDay,setActiveDay]=useState(0);
  const [subTab,setSubTab]=useState("day");
  const [showAddEx,setShowAddEx]=useState(null);
  const [showAI,setShowAI]=useState(false);
  const [aiPrompt,setAiPrompt]=useState("");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState("");
  const [view,setView]=useState("week");

  const weekDates=getWeekDates(weekOffset);
  const wk=weekKey(weekOffset);
  const weekPlan=client.weekPlans?.[wk]||client.weekPlans?.["default"]||{};
  const dayName=DAYS[activeDay];
  const dayData=weekPlan[dayName]||mkDay("Rest",[],"draft",[]);
  const isRest=(dayData.exercises||[]).length===0&&(dayData.warmup||[]).length===0&&(dayData.cooldown||[]).length===0;
  const isDraft=dayData.status!=="published";
  const exHistory=getExHistory(client);

  const currentBlock=(client.periodization||[]).find(b=>{const s=new Date(b.startDate);const e=addDays(s,b.weeks*7-1);const t=new Date();return t>=s&&t<=e;});

  const updateDay=newDay=>{
    const wp={...client.weekPlans};
    if(!wp[wk])wp[wk]={...client.weekPlans?.["default"]};
    wp[wk]={...wp[wk],[dayName]:newDay};
    onUpdate({...client,weekPlans:wp});
  };
  const toggleStatus=()=>updateDay({...dayData,status:dayData.status==="published"?"draft":"published"});
  const makeUpdater=section=>(i,field,val)=>{const arr=[...(dayData[section]||[])];arr[i]={...arr[i],[field]:val};updateDay({...dayData,[section]:arr});};
  const makeRemover=section=>i=>{const arr=(dayData[section]||[]).filter((_,j)=>j!==i);const allEmpty=arr.length===0&&(section==="exercises"?(dayData.warmup||[]).length===0&&(dayData.cooldown||[]).length===0:dayData.exercises.length===0);updateDay({...dayData,[section]:arr,label:allEmpty?"Rest":dayData.label,status:allEmpty?"draft":dayData.status});};
  const makeSetDetailUpdater=section=>(i,si,field,val)=>{const arr=[...(dayData[section]||[])];const sd=[...(arr[i].setDetail||[])];sd[si]={...sd[si],[field]:val};arr[i]={...arr[i],setDetail:sd};updateDay({...dayData,[section]:arr});};
  const addExercise=(section,ex)=>{const wasEmpty=isRest;const arr=[...(dayData[section]||[]),{...ex,id:uid()}];updateDay({...dayData,[section]:arr,label:wasEmpty?ex.name:dayData.label});setShowAddEx(null);};

  const totalSets=(dayData.exercises||[]).reduce((a,e)=>a+e.sets,0);
  const totalVol=(dayData.exercises||[]).reduce((a,e)=>a+(e.weight?(e.sets*e.reps*e.weight):0),0);

  const askAI=async()=>{
    setAiLoading(true);setAiResult("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:`Trainer AI. Client: ${client.name}, Goal: ${client.goal}. Block: ${currentBlock?.type||"Strength"}. Injuries: ${JSON.stringify(client.injuries||[])}. Plan for ${dayName}: ${JSON.stringify((dayData.exercises||[]).map(e=>({name:e.name,sets:e.sets,reps:e.reps,weight:e.weight})))}. Request: "${aiPrompt||"Suggestions"}". Give 3-5 practical tips.`}]})});
      const d=await res.json();setAiResult(d.content?.map(b=>b.text||"").join("\n")||"No response.");
    }catch{setAiResult("Could not connect.");}
    setAiLoading(false);
  };

  if(view==="calendar")return <CalendarView client={client} onClose={()=>setView("week")} onSelectDay={(d,offset)=>{setActiveDay(DAYS.indexOf(d));setWeekOffset(offset);setView("week");}}/>;
  if(view==="periodization")return <PeriodizationView client={client} onUpdate={onUpdate} onClose={()=>setView("week")}/>;

  return (
    <div style={{padding:isMobile?"12px":"16px",display:"flex",flexDirection:"column",gap:12,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:isMobile?15:16,fontWeight:700,color:"var(--color-text-primary)"}}>{client.name} — fitness plan</div>
          <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Week of {weekDates[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {client.goal}{currentBlock?` · ${currentBlock.label}`:""}</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Btn small onClick={()=>setView("periodization")}>📆 Periodization</Btn>
          <Btn small onClick={()=>setView("calendar")}>📅 Calendar</Btn>
          <Btn small primary onClick={()=>setShowAI(true)}>✨ AI</Btn>
        </div>
      </div>

      <div style={{display:"flex",gap:0,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
        {["day","week"].map(t=>(
          <div key={t} onClick={()=>setSubTab(t)} style={{padding:"8px 16px",fontSize:12,cursor:"pointer",borderBottom:`2px solid ${subTab===t?"#534AB7":"transparent"}`,color:subTab===t?"var(--color-text-primary)":"var(--color-text-secondary)",fontWeight:subTab===t?500:400,marginBottom:-0.5}}>
            {t==="day"?"Day view":"Week overview"}
          </div>
        ))}
      </div>

      {subTab==="week"?(
        <WeekOverview weekPlan={weekPlan} weekDates={weekDates} weekOffset={weekOffset} setWeekOffset={setWeekOffset} onSelectDay={i=>{setActiveDay(i);setSubTab("day");}} activeDay={activeDay} isMobile={isMobile}/>
      ):(
        <>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <button onClick={()=>setWeekOffset(o=>o-1)} style={{width:32,height:32,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",cursor:"pointer",color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>‹</button>
            <div style={{display:"flex",gap:4,flex:1,overflowX:"auto"}}>
              {DAYS.map((d,i)=>{
                const dd=weekPlan[d]||{exercises:[]};
                const rest=(dd.exercises||[]).length===0&&(dd.warmup||[]).length===0&&(dd.cooldown||[]).length===0;
                const pub=dd.status==="published";
                return (
                  <div key={d} onClick={()=>setActiveDay(i)} style={{flex:isMobile?"0 0 42px":1,textAlign:"center",padding:"6px 2px",borderRadius:8,border:`0.5px solid ${i===activeDay?"#534AB7":"var(--color-border-tertiary)"}`,cursor:"pointer",background:i===activeDay?"#534AB7":rest?"var(--color-background-secondary)":"var(--color-background-primary)",position:"relative",minHeight:52}}>
                    <div style={{fontSize:11,fontWeight:500,color:i===activeDay?"#EEEDFE":rest?"var(--color-text-tertiary)":"var(--color-text-primary)"}}>{d}</div>
                    <div style={{fontSize:9,color:i===activeDay?"#CECBF6":"var(--color-text-tertiary)"}}>{fmtDate(weekDates[i])}</div>
                    <div style={{fontSize:9,color:i===activeDay?"#CECBF6":rest?"var(--color-text-tertiary)":"var(--color-text-secondary)",fontStyle:rest?"italic":"normal",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",padding:"0 2px"}}>{dd.label||"Rest"}</div>
                    {!rest&&<div style={{width:5,height:5,borderRadius:"50%",background:pub?"#1D9E75":"#F0A500",position:"absolute",top:3,right:3}}/>}
                  </div>
                );
              })}
            </div>
            <button onClick={()=>setWeekOffset(o=>o+1)} style={{width:32,height:32,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",cursor:"pointer",color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>›</button>
          </div>

          {/* overload suggestions for today */}
          {!isRest&&(dayData.exercises||[]).some(e=>e.weight)&&(
            <div style={{background:"#E1F5EE",border:"0.5px solid #9FE1CB",borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#085041",marginBottom:6}}>📈 Overload suggestions for this session ({currentBlock?.type||"Strength"} block)</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {(dayData.exercises||[]).filter(e=>e.weight).map((ex,i)=>{
                  const next=calcNextLoad(ex,currentBlock?.type||"Strength");
                  if(!next||next.weight===ex.weight)return null;
                  return <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:"#085041",fontWeight:500}}>{ex.name}</span><span style={{color:"#2D8A5E"}}>{ex.weight} lb → <strong>{next.weight} lb</strong> <span style={{fontSize:10,color:"#3D9970"}}>({next.note})</span></span></div>;
                }).filter(Boolean)}
              </div>
            </div>
          )}

          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:2}}>{dayName}, {fmtFull(weekDates[activeDay])}</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:5}}>{dayData.label||"Rest"} · {(dayData.exercises||[]).length} exercises</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {(dayData.tags||[]).map(t=><Tag key={t} label={t}/>)}
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:dayData.status==="published"?"#E1F5EE":"#FAEEDA",color:dayData.status==="published"?"#085041":"#633806",fontWeight:500}}>{dayData.status==="published"?"✓ Published":"⚙ Draft"}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              {!isRest&&<div style={{display:"flex",gap:8}}>{[["Sets",totalSets],["Vol",totalVol>0?`${Math.round(totalVol/1000)}k`:"—"],["Exs",(dayData.exercises||[]).length]].map(([l,v])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:600,color:"var(--color-text-primary)"}}>{v}</div><div style={{fontSize:9,color:"var(--color-text-tertiary)"}}>{l}</div></div>)}</div>}
              {!isRest&&<Btn small primary={isDraft} onClick={toggleStatus}>{dayData.status==="published"?"Unpublish":"Publish"}</Btn>}
              {!isRest&&dayData.status==="published"&&<Btn small ghost onClick={()=>onStartWorkout(client,dayData,dayName,weekDates[activeDay])}>▶ Workout</Btn>}
              {!isRest&&<Btn small onClick={()=>onGoToHome(weekDates[activeDay])} style={{fontSize:10}}>📋 Daily</Btn>}
            </div>
          </div>

          {(client.injuries||[]).filter(inj=>inj.status==="Active").length>0&&(
            <div style={{background:"#FCEBEB",border:"0.5px solid #F09595",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#A32D2D"}}>
              🩹 <strong>Active injury:</strong> {client.injuries.filter(i=>i.status==="Active").map(i=>i.location).join(", ")}
            </div>
          )}

          {isRest?(
            <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:28,textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:8}}>🌙</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:4}}>Rest day</div>
              <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginBottom:12}}>Recovery is part of the program.</div>
              {isDraft&&<Btn small onClick={()=>setShowAddEx("exercises")}>+ Add exercise</Btn>}
            </div>
          ):(
            <>
              <ExerciseSection title="Warm-up" color="#F0A500" icon="🔥" exercises={dayData.warmup||[]} onAdd={()=>setShowAddEx("warmup")} onUpdate={makeUpdater("warmup")} onRemove={makeRemover("warmup")} onUpdateSetDetail={makeSetDetailUpdater("warmup")} isDraft={isDraft} exHistory={exHistory} collapsed library={library}/>
              <ExerciseSection title="Main workout" color="#534AB7" icon="💪" exercises={dayData.exercises||[]} onAdd={()=>setShowAddEx("exercises")} onUpdate={makeUpdater("exercises")} onRemove={makeRemover("exercises")} onUpdateSetDetail={makeSetDetailUpdater("exercises")} isDraft={isDraft} exHistory={exHistory} library={library}/>
              <ExerciseSection title="Cool-down" color="#1D9E75" icon="🧊" exercises={dayData.cooldown||[]} onAdd={()=>setShowAddEx("cooldown")} onUpdate={makeUpdater("cooldown")} onRemove={makeRemover("cooldown")} onUpdateSetDetail={makeSetDetailUpdater("cooldown")} isDraft={isDraft} exHistory={exHistory} collapsed library={library}/>
            </>
          )}
        </>
      )}

      {showAddEx&&<AddExerciseModal onClose={()=>setShowAddEx(null)} onAdd={ex=>addExercise(showAddEx,ex)} exHistory={exHistory} library={library}/>}

      {showAI&&(
        <Modal title="✨ Adjust plan with AI" onClose={()=>{setShowAI(false);setAiResult("");setAiPrompt("");}}>
          {!aiResult&&!aiLoading&&(
            <><Field label="Describe what you'd like to change"><textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="e.g. Swap deadlifts — lower back is sore" style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"1px solid #D0CCED",background:"#F8F7FF",color:"#1A1A2E",fontFamily:"inherit",resize:"none",height:72,boxSizing:"border-box"}}/></Field>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{["Add deload","Increase intensity","More volume","Reduce to 3 sessions"].map(s=><span key={s} onClick={()=>setAiPrompt(s)} style={{fontSize:11,padding:"4px 10px",borderRadius:10,background:"#F8F7FF",color:"#534AB7",border:"1px solid #D0CCED",cursor:"pointer",fontWeight:500}}>{s}</span>)}</div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn onClick={()=>setShowAI(false)}>Cancel</Btn><Btn primary onClick={askAI}>✨ Generate</Btn></div></>
          )}
          {aiLoading&&<div style={{fontSize:13,color:"#534AB7",padding:"20px 0",textAlign:"center"}}>Generating…</div>}
          {aiResult&&!aiLoading&&<><div style={{fontSize:13,color:"#1A1A2E",lineHeight:1.75,whiteSpace:"pre-wrap",marginBottom:14}}>{aiResult}</div><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn onClick={()=>{setAiResult("");setAiPrompt("");}}>Back</Btn><Btn primary onClick={()=>{setShowAI(false);setAiResult("");setAiPrompt("");}}>Done</Btn></div></>}
        </Modal>
      )}
    </div>
  );
}

function WeekOverview({weekPlan,weekDates,weekOffset,setWeekOffset,onSelectDay,activeDay,isMobile}){
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>Week of {weekDates[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} – {weekDates[6].toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setWeekOffset(o=>o-1)} style={{width:28,height:28,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button onClick={()=>setWeekOffset(o=>o+1)} style={{width:28,height:28,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(4,1fr)":"repeat(7,1fr)",gap:6}}>
        {DAYS.map((d,i)=>{
          const dd=weekPlan[d]||{exercises:[],warmup:[],cooldown:[]};
          const exs=dd.exercises||[];const warmup=dd.warmup||[];const cooldown=dd.cooldown||[];
          const isRest=exs.length===0&&warmup.length===0&&cooldown.length===0;
          const pub=dd.status==="published";const isActive=i===activeDay;
          if(isMobile&&i>=4)return null;
          return (
            <div key={d} onClick={()=>onSelectDay(i)} style={{borderRadius:10,border:`1.5px solid ${isActive?"#534AB7":"var(--color-border-tertiary)"}`,background:isRest?"var(--color-background-secondary)":"var(--color-background-primary)",cursor:"pointer",overflow:"hidden",minHeight:100}}>
              <div style={{padding:"6px 8px",background:isActive?"#534AB7":"transparent",borderBottom:isRest?"none":"0.5px solid var(--color-border-tertiary)"}}>
                <div style={{fontSize:11,fontWeight:600,color:isActive?"#EEEDFE":isRest?"var(--color-text-tertiary)":"var(--color-text-primary)"}}>{d}</div>
                <div style={{fontSize:9,color:isActive?"#CECBF6":"var(--color-text-tertiary)"}}>{fmtDate(weekDates[i])}</div>
              </div>
              {isRest?<div style={{padding:"10px 6px",textAlign:"center",fontSize:10,color:"var(--color-text-tertiary)",fontStyle:"italic"}}>Rest</div>:(
                <div style={{padding:"6px 8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:3}}><span style={{fontSize:9,padding:"1px 5px",borderRadius:8,background:pub?"#E1F5EE":"#FAEEDA",color:pub?"#085041":"#633806",fontWeight:500}}>{pub?"✓":"⚙"}</span><span style={{fontSize:9,color:"var(--color-text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dd.label}</span></div>
                  {warmup.length>0&&<div style={{fontSize:9,color:"#F0A500",marginBottom:1}}>🔥 {warmup.length}</div>}
                  {exs.slice(0,3).map((ex,ei)=><div key={ei} style={{fontSize:9,color:"var(--color-text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>· {ex.name}</div>)}
                  {exs.length>3&&<div style={{fontSize:9,color:"var(--color-text-tertiary)"}}>+{exs.length-3} more</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WORKOUT MODE ──────────────────────────────────────────────────────────────
function WorkoutMode({client,dayData,dayName,date,onClose,onSaveLog,exHistory,library}){
  const w=useWidth();const isMobile=w<700;
  const planned=dayData.exercises||[];
  const [live,setLive]=useState(planned.map(ex=>({...ex,actualSets:ex.sets,actualReps:ex.reps,actualWeight:ex.weight,done:false})));
  const [activeIdx,setActiveIdx]=useState(0);
  const [sessionNotes,setSessionNotes]=useState("");
  const [elapsed,setElapsed]=useState(0);
  const [showList,setShowList]=useState(!isMobile);
  const [showSwap,setShowSwap]=useState(false);
  const [swapSearch,setSwapSearch]=useState("");
  const timerRef=useRef(null);
  useEffect(()=>{timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000);return()=>clearInterval(timerRef.current);},[]);
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const upd=(i,k,v)=>setLive(l=>{const n=[...l];n[i]={...n[i],[k]:v};return n;});
  const markDone=i=>upd(i,"done",!live[i].done);

  const swapExercise=(libEx)=>{
    setLive(l=>{const n=[...l];n[activeIdx]={...n[activeIdx],name:libEx.name,muscle:libEx.muscle,actualSets:libEx.defaultSets,actualReps:libEx.defaultReps,actualWeight:null,swappedFrom:n[activeIdx].name};return n;});
    setShowSwap(false);setSwapSearch("");
  };

  const finishSession=()=>{
    const log={date:date?.toISOString(),dayName,planned:planned.map(e=>({name:e.name,sets:e.sets,reps:e.reps,weight:e.weight})),actual:live.map(e=>({name:e.name,sets:e.actualSets,reps:e.actualReps,weight:e.actualWeight,done:e.done,swappedFrom:e.swappedFrom||null})),notes:sessionNotes,duration:elapsed};
    onSaveLog(log);onClose();
  };

  const warmup=dayData.warmup||[];const cooldown=dayData.cooldown||[];
  const ex=live[activeIdx];
  const hist=ex?exHistory[ex.name?.toLowerCase()]:null;
  const lastSession=hist&&hist.length>0?hist[hist.length-1]:null;
  const filteredSwap=library.filter(e=>e.name.toLowerCase().includes(swapSearch.toLowerCase())||(e.muscle||"").toLowerCase().includes(swapSearch.toLowerCase()));

  return (
    <div style={{position:"fixed",inset:0,background:"#0F0F1A",zIndex:1000,display:"flex",flexDirection:"column",color:"#EEEDFE",fontFamily:"var(--font-sans)"}}>
      <div style={{padding:isMobile?"10px 14px":"12px 20px",borderBottom:"1px solid #2A2A3E",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#16162A",flexShrink:0}}>
        <div>
          <div style={{fontSize:isMobile?13:15,fontWeight:700,color:"#EEEDFE"}}>{client.name} — {dayData.label||dayName}</div>
          <div style={{fontSize:11,color:"#AFA9EC",marginTop:1}}>{date?fmtFull(date):""} · ⏱ {fmt(elapsed)}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {isMobile&&<button onClick={()=>setShowList(l=>!l)} style={{fontSize:12,padding:"6px 10px",borderRadius:8,border:"1px solid #3A3A5C",background:"transparent",color:"#AFA9EC",cursor:"pointer",fontFamily:"inherit"}}>☰</button>}
          <button onClick={onClose} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:"1px solid #3A3A5C",background:"transparent",color:"#AFA9EC",cursor:"pointer",fontFamily:"inherit"}}>Exit</button>
          <button onClick={finishSession} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:"none",background:"#534AB7",color:"#EEEDFE",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✓ Finish</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?(showList?"200px 1fr":"0 1fr"):"220px 1fr",flex:1,minHeight:0,overflow:"hidden"}}>
        {(!isMobile||showList)&&(
          <div style={{borderRight:"1px solid #2A2A3E",overflowY:"auto",background:"#16162A",padding:"10px 8px"}}>
            {warmup.length>0&&<><div style={{fontSize:10,fontWeight:700,color:"#F0A500",textTransform:"uppercase",letterSpacing:".08em",padding:"4px 8px",marginBottom:3}}>🔥 Warm-up</div>{warmup.map((wm,i)=><div key={i} style={{fontSize:11,color:"#AFA9EC",padding:"4px 10px",borderRadius:6,marginBottom:2}}>· {wm.name}</div>)}</>}
            <div style={{fontSize:10,fontWeight:700,color:"#AFA9EC",textTransform:"uppercase",letterSpacing:".08em",padding:"4px 8px",marginBottom:3}}>💪 Main</div>
            {live.map((ex,i)=>(
              <div key={i} onClick={()=>{setActiveIdx(i);if(isMobile)setShowList(false);}} style={{padding:"9px 12px",borderRadius:8,marginBottom:3,cursor:"pointer",background:i===activeIdx?"#534AB7":ex.done?"#1A2E1A":"transparent",border:`1px solid ${i===activeIdx?"#7B74D4":ex.done?"#1D9E75":"#2A2A3E"}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:12,fontWeight:500,color:i===activeIdx?"#EEEDFE":ex.done?"#9FE1CB":"#CECBF6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{ex.name}{ex.swappedFrom?<span style={{fontSize:9,color:"#F0A500",marginLeft:4}}>⇄</span>:null}</div>
                  {ex.done&&<span style={{fontSize:10,color:"#1D9E75"}}>✓</span>}
                </div>
                <div style={{fontSize:10,color:i===activeIdx?"#CECBF6":"#6B68A8",marginTop:1}}>{ex.actualSets}×{ex.actualReps}{ex.actualWeight?` @ ${ex.actualWeight}lb`:""}</div>
              </div>
            ))}
            {cooldown.length>0&&<><div style={{fontSize:10,fontWeight:700,color:"#1D9E75",textTransform:"uppercase",letterSpacing:".08em",padding:"4px 8px",marginTop:6,marginBottom:3}}>🧊 Cool-down</div>{cooldown.map((cd,i)=><div key={i} style={{fontSize:11,color:"#AFA9EC",padding:"4px 10px",borderRadius:6,marginBottom:2}}>· {cd.name}</div>)}</>}
          </div>
        )}

        <div style={{overflowY:"auto",padding:isMobile?16:24,position:"relative"}}>
          {showSwap&&(
            <div style={{position:"absolute",inset:0,background:"#0F0F1A",zIndex:10,padding:20,overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontSize:15,fontWeight:700,color:"#EEEDFE"}}>⇄ Quick swap</div>
                <button onClick={()=>setShowSwap(false)} style={{background:"#2A2A3E",border:"none",color:"#AFA9EC",cursor:"pointer",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"inherit"}}>Cancel</button>
              </div>
              {ex.swappedFrom&&<div style={{fontSize:11,color:"#F0A500",marginBottom:10}}>Swapping: <strong>{ex.name}</strong> (originally: {ex.swappedFrom})</div>}
              <input value={swapSearch} onChange={e=>setSwapSearch(e.target.value)} placeholder="Search exercises…" style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #3A3A5C",background:"#1E1E30",color:"#EEEDFE",fontFamily:"inherit",boxSizing:"border-box",marginBottom:12}}/>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {filteredSwap.map(le=>(
                  <div key={le.id} onClick={()=>swapExercise(le)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:8,background:"#1E1E30",border:"1px solid #2A2A3E",cursor:"pointer"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#EEEDFE"}}>{le.name}</div>
                      <div style={{fontSize:11,color:"#6B68A8"}}>{le.muscle} · {le.defaultSets}×{le.defaultReps}</div>
                      {(le.tags||[]).length>0&&<div style={{display:"flex",gap:4,marginTop:3}}>{(le.tags||[]).slice(0,2).map(t=><span key={t} style={{fontSize:9,padding:"1px 6px",borderRadius:6,background:"#534AB7",color:"#EEEDFE"}}>{t}</span>)}</div>}
                    </div>
                    <span style={{fontSize:12,color:"#534AB7",fontWeight:600}}>⇄ Swap</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ex?(
            <>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18,gap:10}}>
                <div>
                  <div style={{fontSize:isMobile?18:22,fontWeight:700,color:"#EEEDFE"}}>{ex.name}{ex.swappedFrom&&<span style={{fontSize:12,color:"#F0A500",marginLeft:8}}>⇄ swapped</span>}</div>
                  <div style={{fontSize:12,color:"#AFA9EC",marginTop:2}}>{ex.muscle}</div>
                  {ex.swappedFrom&&<div style={{fontSize:11,color:"#6B68A8",marginTop:2}}>Originally: {ex.swappedFrom}</div>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <button onClick={()=>setShowSwap(true)} style={{fontSize:11,padding:"6px 12px",borderRadius:8,border:"1px solid #3A3A5C",background:"#1E1E30",color:"#AFA9EC",cursor:"pointer",fontFamily:"inherit"}}>⇄ Swap</button>
                  <button onClick={()=>markDone(activeIdx)} style={{fontSize:12,padding:"8px 14px",borderRadius:10,border:"none",background:ex.done?"#1D9E75":"#2A2A3E",color:"#EEEDFE",cursor:"pointer",fontFamily:"inherit",fontWeight:600,minHeight:36}}>{ex.done?"✓ Done":"Mark done"}</button>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
                <div style={{background:"#1E1E30",borderRadius:12,padding:14,border:"1px solid #2A2A3E"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#6B68A8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Planned</div>
                  {[["Sets",planned[activeIdx]?.sets],["Reps",planned[activeIdx]?.reps],["Weight",planned[activeIdx]?.weight?`${planned[activeIdx].weight} lb`:"BW"]].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:7}}><span style={{color:"#6B68A8"}}>{l}</span><span style={{color:"#CECBF6",fontWeight:500}}>{v??"-"}</span></div>
                  ))}
                </div>
                <div style={{background:"#1A2535",borderRadius:12,padding:14,border:"1px solid #1D9E75"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#1D9E75",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Actual</div>
                  {[["Sets","actualSets"],["Reps","actualReps"],["Weight","actualWeight"]].map(([l,k])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,marginBottom:7}}>
                      <span style={{color:"#6B68A8"}}>{l}</span>
                      <input type="number" value={live[activeIdx][k]||""} onChange={e=>upd(activeIdx,k,+e.target.value)} style={{width:72,fontSize:14,fontWeight:500,padding:"4px 7px",borderRadius:6,border:"1px solid #1D9E75",background:"#0F1E1A",color:"#9FE1CB",fontFamily:"inherit",textAlign:"right"}}/>
                    </div>
                  ))}
                </div>
              </div>

              {lastSession&&(
                <div style={{background:"#1A1A2E",border:"1px solid #3A3A5C",borderRadius:10,padding:"12px 14px",marginBottom:18}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#AFA9EC",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>📅 Previous session</div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {[["Sets",lastSession.sets],["Reps",lastSession.reps],["Weight",lastSession.weight?`${lastSession.weight} lb`:"BW"],["Day",lastSession.day]].map(([l,v])=>(
                      <div key={l}><div style={{fontSize:10,color:"#6B68A8",marginBottom:2}}>{l}</div><div style={{fontSize:15,fontWeight:600,color:"#CECBF6"}}>{v??"-"}</div></div>
                    ))}
                  </div>
                </div>
              )}

              {ex.notes&&<div style={{background:"#1E1E30",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#AFA9EC",border:"1px solid #2A2A3E"}}>📝 {ex.notes}</div>}

              <div style={{display:"flex",gap:10,marginBottom:18}}>
                <button onClick={()=>setActiveIdx(i=>Math.max(0,i-1))} disabled={activeIdx===0} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #2A2A3E",background:"transparent",color:activeIdx===0?"#3A3A5C":"#AFA9EC",cursor:activeIdx===0?"default":"pointer",fontFamily:"inherit",fontSize:12,minHeight:40}}>← Prev</button>
                <button onClick={()=>setActiveIdx(i=>Math.min(live.length-1,i+1))} disabled={activeIdx===live.length-1} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #2A2A3E",background:"transparent",color:activeIdx===live.length-1?"#3A3A5C":"#AFA9EC",cursor:activeIdx===live.length-1?"default":"pointer",fontFamily:"inherit",fontSize:12,minHeight:40}}>Next →</button>
              </div>

              <div style={{marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6B68A8",marginBottom:5}}><span>Progress</span><span>{live.filter(e=>e.done).length}/{live.length} done</span></div>
                <div style={{height:6,background:"#2A2A3E",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${(live.filter(e=>e.done).length/live.length)*100}%`,background:"#1D9E75",borderRadius:3,transition:"width .3s"}}/></div>
              </div>
            </>
          ):<div style={{color:"#6B68A8",fontSize:13,textAlign:"center",marginTop:40}}>Select an exercise.</div>}

          <div>
            <div style={{fontSize:11,fontWeight:600,color:"#6B68A8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Session notes</div>
            <textarea value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="How did the session go?" style={{width:"100%",fontSize:12,padding:"10px 12px",borderRadius:8,border:"1px solid #2A2A3E",background:"#1E1E30",color:"#EEEDFE",fontFamily:"inherit",resize:"none",height:72,boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CALENDAR & PERIODIZATION ──────────────────────────────────────────────────
function CalendarView({client,onClose,onSelectDay}){
  const [baseOffset,setBaseOffset]=useState(-2);const numWeeks=6;const weeks=Array.from({length:numWeeks},(_,i)=>baseOffset+i);
  return (
    <div style={{padding:16,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div><div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>{client.name} — calendar</div><div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>Click any day to open it</div></div>
        <div style={{display:"flex",gap:6}}><Btn small onClick={()=>setBaseOffset(o=>o-numWeeks)}>‹ Earlier</Btn><Btn small onClick={()=>setBaseOffset(o=>o+numWeeks)}>Later ›</Btn><Btn small primary onClick={onClose}>✕ Close</Btn></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"44px repeat(7,1fr)",gap:3,marginBottom:4}}><div/>{DAYS.map(d=><div key={d} style={{fontSize:10,fontWeight:500,color:"var(--color-text-tertiary)",textAlign:"center",padding:"3px 0"}}>{d}</div>)}</div>
      {weeks.map(offset=>{
        const dates=getWeekDates(offset);const wk=weekKey(offset);const plan=client.weekPlans?.[wk]||client.weekPlans?.["default"]||{};const isCurrent=offset===0;
        return (
          <div key={offset} style={{display:"grid",gridTemplateColumns:"44px repeat(7,1fr)",gap:3,marginBottom:3}}>
            <div style={{fontSize:9,color:isCurrent?"#534AB7":"var(--color-text-tertiary)",display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:4,fontWeight:isCurrent?600:400,whiteSpace:"nowrap"}}>{isCurrent?"Now":dates[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
            {DAYS.map((d,di)=>{const dd=plan[d]||{exercises:[],status:"draft"};const hasEx=dd.exercises.length>0;const pub=dd.status==="published";const isToday=new Date().toDateString()===dates[di].toDateString();return <div key={d} onClick={()=>onSelectDay(d,offset)} style={{borderRadius:7,padding:"5px 4px",minHeight:44,cursor:"pointer",background:isToday?"#EEEDFE":hasEx?"var(--color-background-primary)":"var(--color-background-secondary)",border:`0.5px solid ${isToday?"#AFA9EC":hasEx?"var(--color-border-tertiary)":"transparent"}`,position:"relative"}}><div style={{fontSize:9,color:isToday?"#3C3489":"var(--color-text-tertiary)",fontWeight:isToday?600:400,marginBottom:2}}>{dates[di].getDate()}</div>{hasEx&&<><div style={{fontSize:9,color:"var(--color-text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dd.label}</div><div style={{width:5,height:5,borderRadius:"50%",background:pub?"#1D9E75":"#F0A500",position:"absolute",top:4,right:4}}/></>}</div>;})}
          </div>
        );
      })}
    </div>
  );
}

function PeriodizationView({client,onUpdate,onClose}){
  const [blocks,setBlocks]=useState(()=>(client.periodization||[]).map(b=>({...b,startDate:b.startDate||getWeekStart(0).toISOString()})));
  const [showAdd,setShowAdd]=useState(false);const [editId,setEditId]=useState(null);
  const [form,setForm]=useState({type:"Strength",label:"",startDate:"",weeks:4,notes:""});
  const today=new Date();today.setHours(0,0,0,0);
  const save=()=>onUpdate({...client,periodization:blocks});
  const updateBlock=(id,changes)=>setBlocks(blocks.map(bl=>bl.id===id?{...bl,...changes}:bl));
  const removeBlock=id=>setBlocks(blocks.filter(b=>b.id!==id));
  const addBlock=()=>{if(!form.label.trim()||!form.startDate)return;setBlocks([...blocks,{...form,id:uid(),weeks:+form.weeks}]);setForm({type:"Strength",label:"",startDate:"",weeks:4,notes:""});setShowAdd(false);};
  const sorted=[...blocks].sort((a,b)=>new Date(a.startDate)-new Date(b.startDate));
  const firstDate=sorted.length>0?new Date(sorted[0].startDate):getWeekStart(-4);
  const lastBlock=sorted[sorted.length-1];const lastDate=lastBlock?addDays(new Date(lastBlock.startDate),lastBlock.weeks*7):addDays(firstDate,16*7);
  const totalDays=Math.max(1,(lastDate-firstDate)/(1000*60*60*24));
  const blockPos=b=>{const start=Math.max(0,(new Date(b.startDate)-firstDate)/(1000*60*60*24));const width=b.weeks*7;return{left:`${(start/totalDays)*100}%`,width:`${(width/totalDays)*100}%`};};
  const todayPct=((today-firstDate)/(1000*60*60*24))/totalDays*100;
  return (
    <div style={{padding:16,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div><div style={{fontSize:14,fontWeight:600,color:"var(--color-text-primary)"}}>{client.name} — periodization</div></div>
        <div style={{display:"flex",gap:6}}><Btn small onClick={()=>setShowAdd(true)}>+ Add block</Btn><Btn small primary onClick={()=>{save();onClose();}}>Save & close</Btn></div>
      </div>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{position:"relative",height:52,background:"var(--color-background-secondary)",borderRadius:8,overflow:"hidden"}}>
          {sorted.map(b=>{const pos=blockPos(b);const col=BLOCK_COLORS[b.type]||"#534AB7";return <div key={b.id} style={{position:"absolute",top:6,height:40,left:pos.left,width:pos.width,background:col,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",minWidth:4}} onClick={()=>setEditId(b.id)}><span style={{fontSize:9,color:"#fff",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",padding:"0 4px"}}>{b.label}</span></div>;})}
          {todayPct>=0&&todayPct<=100&&<div style={{position:"absolute",top:0,bottom:0,left:`${todayPct}%`,width:2,background:"#FF4444",borderRadius:2,zIndex:10}}><div style={{position:"absolute",top:-1,left:-12,fontSize:8,color:"#FF4444",fontWeight:700,whiteSpace:"nowrap",background:"var(--color-background-primary)",padding:"1px 3px",borderRadius:3}}>Today</div></div>}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"var(--color-text-tertiary)",marginTop:4}}><span>{firstDate.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span><span>{lastDate.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sorted.map(b=>{
          const col=BLOCK_COLORS[b.type]||"#534AB7";const startD=new Date(b.startDate);const endD=addDays(startD,b.weeks*7-1);const isCurrent=today>=startD&&today<=endD;const isPast=today>endD;
          return (
            <div key={b.id} style={{background:"var(--color-background-primary)",border:`0.5px solid ${isCurrent?"#AFA9EC":"var(--color-border-tertiary)"}`,borderRadius:12,padding:"11px 14px",borderLeft:`4px solid ${col}`}}>
              {editId===b.id?(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <Field label="Block name"><Inp value={b.label} onChange={e=>updateBlock(b.id,{label:e.target.value})}/></Field>
                    <Field label="Type"><Sel value={b.type} onChange={e=>updateBlock(b.id,{type:e.target.value})} options={BLOCK_TYPES}/></Field>
                    <Field label="Start date"><Inp type="date" value={b.startDate?b.startDate.split("T")[0]:""} onChange={e=>updateBlock(b.id,{startDate:new Date(e.target.value).toISOString()})}/></Field>
                    <Field label="Weeks"><Inp type="number" value={b.weeks} onChange={e=>updateBlock(b.id,{weeks:Math.max(1,+e.target.value)})} min="1"/></Field>
                  </div>
                  <Field label="Notes"><Inp value={b.notes||""} onChange={e=>updateBlock(b.id,{notes:e.target.value})}/></Field>
                  <div style={{display:"flex",gap:6,marginTop:6}}><Btn small primary onClick={()=>setEditId(null)}>Done</Btn><Btn small danger onClick={()=>{removeBlock(b.id);setEditId(null);}}>Delete</Btn></div>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)"}}>{b.label}</span><span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:col+"22",color:col,fontWeight:500}}>{b.type}</span>{isCurrent&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#EEEDFE",color:"#3C3489",fontWeight:500}}>▶ Current</span>}{isPast&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"var(--color-background-secondary)",color:"var(--color-text-tertiary)"}}>Done</span>}</div>
                    <div style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{fmtShort(startD)} → {fmtShort(endD)} · {b.weeks} wk{b.weeks!==1?"s":""}</div>
                    {b.notes&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:3}}>{b.notes}</div>}
                  </div>
                  <Btn small onClick={()=>setEditId(b.id)}>Edit</Btn>
                </div>
              )}
            </div>
          );
        })}
        {blocks.length===0&&<div style={{fontSize:12,color:"var(--color-text-tertiary)",textAlign:"center",padding:"20px 0"}}>No training blocks yet.</div>}
      </div>
      {showAdd&&(
        <Modal title="Add training block" onClose={()=>setShowAdd(false)} width={380}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Field label="Block name"><Inp value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="e.g. Strength Phase 1"/></Field>
            <Field label="Type"><Sel value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} options={BLOCK_TYPES}/></Field>
            <Field label="Start date"><Inp type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></Field>
            <Field label="Weeks"><Inp type="number" value={form.weeks} onChange={e=>setForm(f=>({...f,weeks:Math.max(1,+e.target.value)}))}/></Field>
          </div>
          <Field label="Notes"><Inp value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Goals, focus…"/></Field>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}><Btn onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn primary onClick={addBlock}>Add block</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [clients,setClients]=useState(()=>{ const d=loadData(); return d?.clients||DEFAULT_CLIENTS; });
  const [library,setLibrary]=useState(()=>{ const d=loadData(); return d?.library||DEFAULT_LIBRARY; });
  const [activeClient,setActiveClient]=useState(0);
  const [tab,setTab]=useState(0);
  const [showDelete,setShowDelete]=useState(false);
  const [workoutSession,setWorkoutSession]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const w=useWidth();const isMobile=w<640;

  useEffect(()=>saveData({clients,library}),[clients,library]);

  const client=clients[activeClient]||clients[0];
  const updateClient=useCallback(updated=>setClients(cs=>cs.map(c=>c.id===updated.id?updated:c)),[]);
  const addClient=c=>{setClients(cs=>{const n=[...cs,c];setActiveClient(n.length-1);return n;});setTab(1);};
  const deleteClient=()=>{if(clients.length<=1)return;setClients(cs=>{const n=cs.filter((_,i)=>i!==activeClient);setActiveClient(0);return n;});setShowDelete(false);};
  const startWorkout=(cl,dayData,dayName,date)=>setWorkoutSession({client:cl,dayData,dayName,date});
  const saveLog=log=>{const updated={...client,sessionLogs:[...(client.sessionLogs||[]),log]};updateClient(updated);};
  const goToHome=()=>setTab(0);
  const goToPlan=(clientId)=>{const idx=clients.findIndex(c=>c.id===clientId);if(idx>=0)setActiveClient(idx);setTab(3);};
  const goToClient=clientId=>{const idx=clients.findIndex(c=>c.id===clientId);if(idx>=0)setActiveClient(idx);setTab(1);};

  const TABS=[
    {id:0,label:"Home",icon:"🏠"},
    {id:1,label:"Tracker",icon:"📊"},
    {id:2,label:"Onboard",icon:"👤"},
    {id:3,label:"Plans",icon:"📋"},
    {id:4,label:"Library",icon:"📚"},
  ];

  const isFullWidth=tab===0;

  return (
    <div style={{fontFamily:"var(--font-sans)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:isMobile?0:12,overflow:"hidden",display:"flex",flexDirection:"column",height:"100%",minHeight:600,position:"relative",maxWidth:"100%"}}>
      {workoutSession&&(
        <WorkoutMode client={workoutSession.client} dayData={workoutSession.dayData} dayName={workoutSession.dayName} date={workoutSession.date} onClose={()=>setWorkoutSession(null)} onSaveLog={saveLog} exHistory={getExHistory(workoutSession.client)} library={library}/>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"10px 14px":"10px 18px",background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {isMobile&&tab!==0&&<button onClick={()=>setSidebarOpen(o=>!o)} style={{width:32,height:32,borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",cursor:"pointer",fontSize:16,color:"var(--color-text-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>☰</button>}
          <div style={{fontSize:15,fontWeight:700,color:"var(--color-text-primary)",display:"flex",alignItems:"center",gap:7}}>🏋️ TrainTrack</div>
        </div>
        {!isMobile&&<div style={{fontSize:11,color:"var(--color-text-secondary)"}}>Week of {getWeekStart().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>}
      </div>

      {!isMobile&&(
        <div style={{display:"flex",padding:"0 18px",background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",flexShrink:0}}>
          {TABS.map(t=>(
            <div key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 16px",fontSize:12,cursor:"pointer",borderBottom:`2px solid ${tab===t.id?"#534AB7":"transparent"}`,color:tab===t.id?"var(--color-text-primary)":"var(--color-text-secondary)",fontWeight:tab===t.id?500:400,marginBottom:-0.5,display:"flex",alignItems:"center",gap:6}}>
              <span>{t.icon}</span>{t.label}
            </div>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:isFullWidth||tab===4?"1fr":(isMobile?`${sidebarOpen?"200px":0} 1fr`:"190px 1fr"),flex:1,minHeight:0,background:"var(--color-background-tertiary)",overflow:"hidden"}}>
        {!isFullWidth&&tab!==4&&(
          <div style={{background:"var(--color-background-primary)",borderRight:"0.5px solid var(--color-border-tertiary)",padding:isMobile?"12px 10px":12,display:"flex",flexDirection:"column",gap:5,overflowY:"auto",width:sidebarOpen||!isMobile?(isMobile?200:190):0,minWidth:0,overflow:sidebarOpen||!isMobile?"auto":"hidden",position:isMobile?"absolute":"relative",zIndex:isMobile?50:1,height:isMobile?"100%":"auto",boxShadow:isMobile&&sidebarOpen?"4px 0 16px rgba(0,0,0,.15)":"none"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:10,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:".06em"}}>Clients</div>
              {isMobile&&<button onClick={()=>setSidebarOpen(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"var(--color-text-tertiary)",lineHeight:1}}>×</button>}
            </div>
            {clients.map((c,i)=>(
              <div key={c.id} onClick={()=>{setActiveClient(i);if(isMobile)setSidebarOpen(false);}} style={{padding:"8px 9px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:7,background:i===activeClient?"#EEEDFE":"transparent",minHeight:44}}>
                <Avatar name={c.name} idx={i} size={28}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,color:i===activeClient?"#3C3489":"var(--color-text-primary)",fontWeight:i===activeClient?500:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                  <div style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{c.goal}</div>
                </div>
              </div>
            ))}
            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:5,paddingTop:8}}>
              {clients.length>1&&<button onClick={()=>setShowDelete(true)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#A32D2D",background:"none",border:"0.5px dashed #F09595",borderRadius:8,padding:"6px 8px",width:"100%",justifyContent:"center",cursor:"pointer",fontFamily:"inherit",minHeight:36}}>🗑 Remove</button>}
              <button onClick={()=>{setTab(2);if(isMobile)setSidebarOpen(false);}} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#534AB7",background:"none",border:"0.5px dashed #AFA9EC",borderRadius:8,padding:"6px 8px",width:"100%",justifyContent:"center",cursor:"pointer",fontFamily:"inherit",minHeight:36}}>+ Add client</button>
            </div>
          </div>
        )}

        {isMobile&&sidebarOpen&&!isFullWidth&&tab!==4&&<div onClick={()=>setSidebarOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.3)",zIndex:40}}/>}

        <div style={{overflowY:"auto",position:"relative",flex:1}}>
          {tab===0&&<HomeTab clients={clients} onStartWorkout={startWorkout} onGoToPlan={goToPlan} onGoToClient={goToClient}/>}
          {tab===1&&<ClientTrackerTab client={client} onUpdate={updateClient}/>}
          {tab===2&&<OnboardingTab clients={clients} onAdd={addClient}/>}
          {tab===3&&<FitnessPlansTab client={client} onUpdate={updateClient} onStartWorkout={startWorkout} onGoToHome={goToHome} library={library}/>}
          {tab===4&&<ExerciseLibraryTab library={library} onUpdateLibrary={setLibrary}/>}
        </div>
      </div>

      {isMobile&&(
        <div style={{display:"flex",borderTop:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSidebarOpen(false);}} style={{flex:1,padding:"10px 4px 6px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",borderTop:`2px solid ${tab===t.id?"#534AB7":"transparent"}`}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <span style={{fontSize:9,fontWeight:tab===t.id?600:400,color:tab===t.id?"#534AB7":"var(--color-text-tertiary)"}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {showDelete&&(
        <Modal title="Remove client" onClose={()=>setShowDelete(false)} width={300}>
          <div style={{fontSize:13,color:"#1A1A2E",marginBottom:16}}>Remove <strong>{client.name}</strong>? This cannot be undone.</div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Btn onClick={()=>setShowDelete(false)}>Cancel</Btn><Btn danger onClick={deleteClient}>Remove</Btn></div>
        </Modal>
      )}
    </div>
  );
}
