import { useState, useEffect } from "react";

// Increment GAME_VERSION (patch/minor/major as appropriate) on every change made to this file.
// This is the single source of truth — the title screen reads it directly.
var GAME_VERSION = "0.6.1";

// ─── Constants ────────────────────────────────────────────────────────────────
var TYPE_COLOR   = { attack:'#cc4444', skill:'#4488cc', power:'#8844cc' };
var RARITY_COLOR = { common:'#888', uncommon:'#4488cc', rare:'#cc44ff' };
var HAND_LIMIT   = 8;
var SLOTS        = ['arms','legs','heart','lungs','core','head'];
var SLOT_ICON    = { arms:'💪', legs:'🦵', heart:'❤️', lungs:'🫁', core:'⚙️', head:'🧠' };
var SLOT_LABEL   = { arms:'Arms', legs:'Legs', heart:'Heart', lungs:'Lungs', core:'Core', head:'Head' };

// ─── Cards ────────────────────────────────────────────────────────────────────
var CARDS = {
  neural_spike:    { id:'neural_spike',    name:'Neural Spike',    type:'attack', cost:1, rarity:'common',   desc:'Deal 6 damage.',                                       fn:function(s){return dealDmg(s,6);} },
  quickhack:       { id:'quickhack',       name:'Quickhack',       type:'attack', cost:0, rarity:'common',   desc:'Deal 3 damage.',                                       fn:function(s){return dealDmg(s,3);} },
  railgun:         { id:'railgun',         name:'Railgun',         type:'attack', cost:2, rarity:'uncommon', desc:'Deal 14 damage.',                                      fn:function(s){return dealDmg(s,14);} },
  frag_grenade:    { id:'frag_grenade',    name:'Frag Grenade',    type:'attack', cost:2, rarity:'uncommon', desc:'Deal 8 damage. Apply 2 Bleed.',                        fn:function(s){return applyBleed(dealDmg(s,8),2);} },
  overload:        { id:'overload',        name:'Overload',        type:'attack', cost:1, rarity:'common',   desc:'Deal 4 damage. Generate 1 Heat.',                      fn:function(s){return addHeat(dealDmg(s,4),1);} },
  drone_strike:    { id:'drone_strike',    name:'Drone Strike',    type:'attack', cost:1, rarity:'uncommon', desc:'Deal 5 damage twice.',                                 fn:function(s){return dealDmg(dealDmg(s,5),5);} },
  poison_dart:     { id:'poison_dart',     name:'Poison Dart',     type:'attack', cost:1, rarity:'common',   desc:'Deal 3 damage. Apply 3 Poison.',                       fn:function(s){return applyPoison(dealDmg(s,3),3);} },
  viral_payload:   { id:'viral_payload',   name:'Viral Payload',   type:'attack', cost:2, rarity:'uncommon', desc:'Deal damage equal to 1.5x the enemy\'s current Poison.', fn:function(s){return dealDmg(s,Math.floor((s.enemy.poison||0)*1.5));} },
  reckless_injector:{ id:'reckless_injector',name:'Reckless Injector',type:'attack',cost:2, rarity:'uncommon', desc:'Deal 10 damage. Apply 4 Poison to yourself.',          fn:function(s){return applyPoisonToPlayer(dealDmg(s,10),4);} },
  necrotic_volley: { id:'necrotic_volley', name:'Necrotic Volley', type:'attack', cost:2, rarity:'rare',     desc:'Deal 3 damage twice. Apply 3 Poison to the enemy for each time it has been hit this turn.', fn:function(s){
    var hit=dealDmg(dealDmg(s,3),3);
    var hits=hit.enemy.hitsThisTurn||0;
    return applyPoison(hit,3*hits);
  } },
  critical_shot:   { id:'critical_shot',   name:'Critical Shot',   type:'attack', cost:2, rarity:'rare',     desc:'Deal 18 damage.',                                      fn:function(s){return dealDmg(s,18);} },
  firewall:        { id:'firewall',        name:'Firewall',        type:'skill',  cost:1, rarity:'common',   desc:'Gain 8 Block.',                                        fn:function(s){return gainBlock(s,8);} },
  overclock:       { id:'overclock',       name:'Overclock',       type:'skill',  cost:1, rarity:'uncommon', desc:'Gain 2 Energy.',                                       fn:function(s){return gainEnergy(s,2);} },
  adrenaline:      { id:'adrenaline',      name:'Adrenaline',      type:'skill',  cost:0, rarity:'common',   desc:'Draw 2 cards.',                                        fn:function(s){return drawCards(s,2);} },
  data_leech:      { id:'data_leech',      name:'Data Leech',      type:'skill',  cost:1, rarity:'uncommon', desc:'Gain 5 Block. Draw 1 card.',                           fn:function(s){return drawCards(gainBlock(s,5),1);} },
  combat_stims:    { id:'combat_stims',    name:'Combat Stims',    type:'skill',  cost:2, rarity:'common',   desc:'Gain 12 Block.',                                       fn:function(s){return gainBlock(s,12);} },
  neural_link:     { id:'neural_link',     name:'Neural Link',     type:'skill',  cost:1, rarity:'uncommon', desc:'Draw 3 cards.',                                        fn:function(s){return drawCards(s,3);} },
  neurotoxin_spray:{ id:'neurotoxin_spray',name:'Neurotoxin Spray',type:'skill',  cost:1, rarity:'uncommon', desc:'Apply 8 Poison to the enemy. Apply 2 Poison to yourself.', fn:function(s){return applyPoisonToPlayer(applyPoison(s,8),2);} },
  poison_coating:  { id:'poison_coating',  name:'Poison Coating',  type:'skill',  cost:1, rarity:'common',   desc:'Apply 5 Poison to the enemy.',                         fn:function(s){return applyPoison(s,5);} },
  compound_fracture:{ id:'compound_fracture',name:'Compound Fracture',type:'skill',cost:3, rarity:'rare', exhausts:true, desc:'Double the enemy\'s current Poison stacks. Exhausts.', fn:function(s){return doublePoison(s);} },
  antivenom_reflex:{ id:'antivenom_reflex',name:'Antivenom Reflex',type:'skill',  cost:1, rarity:'common',   desc:'Remove all Poison from yourself. Gain Block equal to Poison removed.', fn:function(s){
    var amt=s.player.poison||0;
    if(amt<=0) return clog(s,'No Poison to cleanse');
    var cleansed=clog(s,'Cleansed '+amt+' Poison',{player:Object.assign({},s.player,{poison:0})});
    return gainBlock(cleansed,amt);
  } },
  toxin_bond:      { id:'toxin_bond',      name:'Toxin Bond',      type:'skill',  cost:0, rarity:'uncommon', desc:'While you have Poison, gain 1 Energy.',                fn:function(s){
    if((s.player.poison||0)<=0) return clog(s,'No Poison — Toxin Bond has no effect');
    return gainEnergy(s,1);
  } },
  corrosive_ward:  { id:'corrosive_ward',  name:'Corrosive Ward',  type:'skill',  cost:1, rarity:'rare',     desc:'Gain 6 Block. If the enemy has Poison, gain 6 more.',  fn:function(s){
    var blocked=gainBlock(s,6);
    return (s.enemy.poison||0)>0?gainBlock(blocked,6):blocked;
  } },
  poison_cloud:    { id:'poison_cloud',    name:'Poison Cloud',    type:'power',  cost:2, rarity:'rare',     desc:'Apply 2 Poison to enemy at start of each turn. Exhausts. Stacks.', fn:function(s){return addPower(s,'poison_cloud');} },
  kinetic_battery: { id:'kinetic_battery', name:'Kinetic Battery', type:'power',  cost:2, rarity:'rare',     desc:'Gain 1 extra Energy each turn. Exhausts.',             fn:function(s){return addPower(s,'kinetic_battery');} },
  bioaccumulation: { id:'bioaccumulation', name:'Bioaccumulation', type:'power',  cost:3, rarity:'rare',     desc:'Poison you apply to the enemy no longer decreases each turn. Exhausts.', fn:function(s){return addPower(s,'bioaccumulation');} },
  symbiotic_toxin: { id:'symbiotic_toxin', name:'Symbiotic Toxin', type:'power',  cost:1, rarity:'uncommon', desc:'Whenever the enemy takes Poison damage, heal 1 HP. Exhausts.', fn:function(s){return addPower(s,'symbiotic_toxin');} },
  self_inoculation:{ id:'self_inoculation',name:'Self-Inoculation',type:'power',  cost:2, rarity:'uncommon', desc:'Whenever you would gain Poison, gain 50% less (rounded down) instead. Exhausts.', fn:function(s){return addPower(s,'self_inoculation');} },
};

var STARTING_DECK = [
  'neural_spike','neural_spike','neural_spike',
  'quickhack','quickhack',
  'firewall','firewall',
  'adrenaline',
];

// ─── Pure Helpers ─────────────────────────────────────────────────────────────
function shuffle(arr){ return arr.slice().sort(function(){return Math.random()-0.5;}); }

function clog(s,msg,patch){
  return Object.assign({},s,patch||{},{combatLog:[msg].concat((s.combatLog||[]).slice(0,6))});
}

// Is this cyberware id currently equipped in any slot?
function isEquipped(s,id){
  return SLOTS.some(function(slot){ return s.cyberEquipped[slot]===id; });
}
function equippedIds(s){
  return SLOTS.map(function(slot){ return s.cyberEquipped[slot]; }).filter(Boolean);
}

function dealDmg(s,amt){
  var bonus=isEquipped(s,'military_exo')?3:0;
  var total=amt+bonus;
  var en=Object.assign({},s.enemy);
  var absorbed=Math.min(en.block||0,total);
  var pen=total-absorbed;
  en.block=(en.block||0)-absorbed;
  en.hp=Math.max(0,en.hp-pen);
  en.hitsThisTurn=(en.hitsThisTurn||0)+1;
  var msg=absorbed>0&&pen>0?'Dealt '+pen+' dmg ('+absorbed+' blocked)':pen===0?'Attack fully blocked':'Dealt '+pen+' damage';
  var stats=Object.assign({},s.stats,{damageDealt:((s.stats&&s.stats.damageDealt)||0)+pen});
  return clog(s,msg,{enemy:en,stats:stats});
}

function gainBlock(s,amt){ return clog(s,'Gained '+amt+' Block',{player:Object.assign({},s.player,{block:(s.player.block||0)+amt})}); }
function gainEnergy(s,amt){ return clog(s,'Gained '+amt+' Energy',{energy:s.energy+amt}); }
function applyBleed(s,n){ return clog(s,'Applied '+n+' Bleed',{enemy:Object.assign({},s.enemy,{bleed:(s.enemy.bleed||0)+n})}); }
function applyPoison(s,n){ return clog(s,'Applied '+n+' Poison',{enemy:Object.assign({},s.enemy,{poison:(s.enemy.poison||0)+n})}); }
// Self-Inoculation halves (rounds down) ANY Poison the player is about to gain, from any source.
function applyPoisonToPlayer(s,n){
  var hasSelfInoc=(s.powers||[]).includes('self_inoculation');
  var amt=hasSelfInoc?Math.floor(n/2):n;
  if(amt<=0) return clog(s,'Self-Inoculation reduces incoming Poison to 0');
  var msg=hasSelfInoc?'Applied '+amt+' Poison to self (halved by Self-Inoculation)':'Applied '+amt+' Poison to self';
  return clog(s,msg,{player:Object.assign({},s.player,{poison:(s.player.poison||0)+amt})});
}
// Compound Fracture: doubles the enemy's current Poison stack.
function doublePoison(s){
  var cur=s.enemy.poison||0;
  var next=cur*2;
  return clog(s,cur>0?'Poison doubled to '+next:'No Poison to double',{enemy:Object.assign({},s.enemy,{poison:next})});
}
function addHeat(s,n){ return clog(s,'Generated '+n+' Heat',{heat:(s.heat||0)+n}); }
function addPower(s,p){ return clog(s,'Power active: '+(CARDS[p]?CARDS[p].name:p),{powers:(s.powers||[]).concat([p])}); }

function drawCards(s,n){
  var deck=s.deck.slice(),discard=s.discard.slice(),hand=s.hand.slice();
  for(var i=0;i<n;i++){
    if(hand.length>=HAND_LIMIT) break;
    if(deck.length===0){ if(!discard.length) break; deck=shuffle(discard); discard=[]; }
    hand.push(deck.pop());
  }
  return Object.assign({},s,{deck:deck,discard:discard,hand:hand});
}

// ─── Intent System ────────────────────────────────────────────────────────────
var INTENT_META={
  attack:        {icon:'⚔',  label:'Attack',        color:'#e34948'},
  heavy_attack:  {icon:'💥', label:'Heavy Attack',  color:'#ff2222'},
  double_attack: {icon:'⚔⚔',label:'Double Strike', color:'#ff5533'},
  block:         {icon:'🛡', label:'Defending',     color:'#4488cc'},
  buff:          {icon:'⬆',  label:'Buffing',       color:'#eda100'},
  debuff:        {icon:'☣',  label:'Debuffing',     color:'#44cc88'},
};

function resolveIntent(enemy){
  var key=enemy.defKey,turn=enemy.intentTurn||0;
  if(key==='corp_grunt')   {var p1=['attack','attack','block'];  return {type:p1[turn%3],value:enemy.atk};}
  if(key==='security_bot') {var p2=['attack','block','block'];   return {type:p2[turn%3],value:enemy.atk};}
  if(key==='netrunner')    {var p3=['attack','attack','debuff']; return {type:p3[turn%3],value:enemy.atk};}
  if(key==='elite_enforcer'){
    var h1=enemy.hp/enemy.maxHp;
    if(h1>0.5) return Math.random()<0.7?{type:'attack',value:enemy.atk}:{type:'buff',value:6};
    return Math.random()<0.6?{type:'heavy_attack',value:Math.round(enemy.atk*1.5)}:{type:'double_attack',value:enemy.atk};
  }
  if(key==='arasaka_boss'){
    var h2=enemy.hp/enemy.maxHp,t3=turn%3;
    if(h2>0.66){var p4=['attack','attack','block']; return {type:p4[t3],value:enemy.atk};}
    if(h2>0.33){var p5=['heavy_attack','buff','attack']; return {type:p5[t3],value:Math.round(enemy.atk*1.4)};}
    return Math.random()<0.5?{type:'heavy_attack',value:Math.round(enemy.atk*1.6)}:{type:'double_attack',value:enemy.atk};
  }
  return {type:'attack',value:enemy.atk};
}

function executeIntent(s){
  var intent=s.enemy.currentIntent; if(!intent) return s;
  var p=Object.assign({},s.player),en=Object.assign({},s.enemy),log=[],dmgTaken=0;
  if(intent.type==='attack'||intent.type==='heavy_attack'){
    var ab1=Math.min(p.block||0,intent.value),d1=intent.value-ab1;
    p.block=Math.max(0,(p.block||0)-intent.value); p.hp=Math.max(0,p.hp-d1); dmgTaken+=d1;
    var lbl=intent.type==='heavy_attack'?'Heavy Attack!':'Enemy attacked';
    log.push(d1>0&&ab1>0?lbl+': '+d1+' dmg ('+ab1+' blocked)':d1>0?lbl+': '+d1+' dmg':lbl+': fully blocked!');
  } else if(intent.type==='double_attack'){
    for(var i=0;i<2;i++){
      var ab2=Math.min(p.block||0,intent.value),d2=intent.value-ab2;
      p.block=Math.max(0,(p.block||0)-intent.value); p.hp=Math.max(0,p.hp-d2); dmgTaken+=d2;
      log.push('Strike '+(i+1)+': '+(d2>0?d2+' dmg':'blocked'));
    }
  } else if(intent.type==='block'){en.block=(en.block||0)+8; log.push(en.name+' braces — +8 Block');}
    else if(intent.type==='buff'){en.atk+=4; en.strength=(en.strength||0)+4; log.push(en.name+' surges — Strength +4!');}
    else if(intent.type==='debuff'){
      var poisonGain=2;
      var hasSelfInoc=(s.powers||[]).includes('self_inoculation');
      if(hasSelfInoc) poisonGain=Math.floor(poisonGain/2);
      p.poison=(p.poison||0)+poisonGain;
      log.push(poisonGain>0?en.name+' injects toxin — you gain '+poisonGain+' Poison':en.name+' injects toxin — Self-Inoculation blocks it entirely');
    }
  var stats=Object.assign({},s.stats,{damageTaken:((s.stats&&s.stats.damageTaken)||0)+dmgTaken});
  return Object.assign({},s,{player:p,enemy:en,combatLog:log,stats:stats});
}

// ─── Enemies ─────────────────────────────────────────────────────────────────
var ENEMY_DEFS={
  corp_grunt:     {name:'Corp Grunt',        hp:28,atk:8, block:0,defKey:'corp_grunt'},
  security_bot:   {name:'Security Bot',      hp:35,atk:6, block:0,defKey:'security_bot'},
  netrunner:      {name:'Netrunner',          hp:22,atk:10,block:0,defKey:'netrunner'},
  elite_enforcer: {name:'CyberPsycho',       hp:55,atk:14,block:0,defKey:'elite_enforcer',isElite:true},
  arasaka_boss:   {name:'Arasaka Commander', hp:90,atk:18,block:0,defKey:'arasaka_boss',  isBoss:true},
};
function makeEnemy(key){
  var d=ENEMY_DEFS[key];
  var base=Object.assign({},d,{maxHp:d.hp,poison:0,bleed:0,strength:0,intentTurn:0,hitsThisTurn:0});
  base.currentIntent=resolveIntent(base);
  return base;
}

// ─── Cybernetics ──────────────────────────────────────────────────────────────
// Each piece is permanently assigned to exactly one body slot.
// `sources` declares which acquisition channels can offer this piece as a pool option:
//   'shop'      — purchasable at the Black Market
//   'elite'     — offered as a CyberPsycho (elite) kill reward
//   'eventPool' — eligible for the *generic* random-pick event (Rogue Courier)
// A piece with sources:[] is never offered through any pool — it can only be granted by a
// specific event calling acquireCyber() directly with its exact id (Overwatch Chip Cache,
// Ghost Merge). Dev Mode's force-equip list ignores this entirely by design — it bypasses
// every acquisition rule on purpose.
var CYBERNETICS=[
  {id:'reflex_booster',   name:'Reflex Booster',    slot:'legs',  cost:80,  icon:'⚡',desc:'Start each combat with 1 extra Energy.',sources:['elite','eventPool']},
  {id:'subdermal_armor',  name:'Subdermal Armor',   slot:'heart', cost:100, icon:'🛡',desc:'Start each combat with 6 Block.',sources:['shop','elite','eventPool']},
  {id:'toxin_filter',     name:'Toxin Filter',      slot:'lungs', cost:90,  icon:'☣',desc:'Convert your Poison to Healing each turn.',sources:['shop','elite','eventPool']},
  {id:'neural_overclock', name:'Neural Overclock',  slot:'head',  cost:120, icon:'🧠',desc:'Draw 1 extra card per turn. -5 max HP.',hpCost:5,sources:['shop','elite','eventPool']},
  {id:'military_exo',     name:'Military Exo-Frame',slot:'arms',  cost:150, icon:'🦾',desc:'All attacks deal 3 bonus damage.',sources:['elite','eventPool']},
  {id:'drone_chassis',    name:'Drone Chassis',     slot:'core',  cost:110, icon:'🤖',desc:'Start each combat with a free Drone Strike.',sources:['shop','elite','eventPool']},
  {id:'overwatch_chip',   name:'Overwatch Chip',    slot:'legs',  cost:100, icon:'📡',desc:'At the start of each turn, gain 1 Block.',sources:[]},
  {id:'ghost_core',       name:'Ghost Core',        slot:'core',  cost:150, icon:'👻',desc:'+50 max HP. Start each combat with 1 less Energy (min. 1).',hpCost:-50,sources:[]},
  {id:'muscle_memory',    name:'Muscle Memory Implant',slot:'arms',cost:140, icon:'🔁',desc:'At the start of each turn, replay the last Attack you played last turn for free.',sources:[]},
];
function findCyber(id){ return CYBERNETICS.filter(function(c){return c.id===id;})[0]; }

// Shared eligibility filter for any pool-based cyberware source. Checks ownership, slot room,
// AND whether this piece is tagged for the requested channel — this is what actually keeps
// event-exclusive pieces (empty sources[]) out of the shop/elite/other-event pools.
function getEligibleCyber(s, sourceTag){
  return CYBERNETICS.filter(function(c){
    var owned=isEquipped(s,c.id)||Object.values(s.cyberStorage).includes(c.id);
    var slotRoom=!s.cyberEquipped[c.slot]||!s.cyberStorage[c.slot];
    var sourceOk=(c.sources||[]).indexOf(sourceTag)!==-1;
    return !owned && slotRoom && sourceOk;
  });
}

// Equip into the slot if open; otherwise store if storage is open; otherwise blocked.
// Applies/reverses HP cost as appropriate. Returns { gs, result: 'equipped'|'stored'|'blocked' }.
function acquireCyber(gs, cyberId){
  var c=findCyber(cyberId); if(!c) return {gs:gs,result:'blocked'};
  var slot=c.slot;
  if(!gs.cyberEquipped[slot]){
    var eq=Object.assign({},gs.cyberEquipped); eq[slot]=cyberId;
    var hp=c.hpCost||0;
    var player=Object.assign({},gs.player,{maxHp:gs.player.maxHp-hp,hp:Math.min(gs.player.hp,gs.player.maxHp-hp)});
    return {gs:Object.assign({},gs,{cyberEquipped:eq,player:player}), result:'equipped'};
  }
  if(!gs.cyberStorage[slot]){
    var st=Object.assign({},gs.cyberStorage); st[slot]=cyberId;
    return {gs:Object.assign({},gs,{cyberStorage:st}), result:'stored'};
  }
  return {gs:gs, result:'blocked'};
}

// Move equipped item in a slot down to storage (only if storage empty). Reverses HP cost.
function unequipToStorage(gs, slot){
  var equippedId=gs.cyberEquipped[slot];
  if(!equippedId || gs.cyberStorage[slot]) return gs;
  var c=findCyber(equippedId);
  var eq=Object.assign({},gs.cyberEquipped); eq[slot]=null;
  var st=Object.assign({},gs.cyberStorage); st[slot]=equippedId;
  var hp=(c&&c.hpCost)||0;
  // Reverse: restore max HP, but do NOT heal the reclaimed capacity (60/65 -> 60/70)
  var player=Object.assign({},gs.player,{maxHp:gs.player.maxHp+hp});
  return Object.assign({},gs,{cyberEquipped:eq,cyberStorage:st,player:player});
}

// Move stored item in a slot up to equipped (only if equipped empty). Applies HP cost.
function equipFromStorage(gs, slot){
  var storedId=gs.cyberStorage[slot];
  if(!storedId || gs.cyberEquipped[slot]) return gs;
  var c=findCyber(storedId);
  var eq=Object.assign({},gs.cyberEquipped); eq[slot]=storedId;
  var st=Object.assign({},gs.cyberStorage); st[slot]=null;
  var hp=(c&&c.hpCost)||0;
  var player=Object.assign({},gs.player,{maxHp:gs.player.maxHp-hp,hp:Math.min(gs.player.hp,gs.player.maxHp-hp)});
  return Object.assign({},gs,{cyberEquipped:eq,cyberStorage:st,player:player});
}

// Exchange equipped <-> stored within a slot (only if both present).
function swapSlot(gs, slot){
  var equippedId=gs.cyberEquipped[slot], storedId=gs.cyberStorage[slot];
  if(!equippedId||!storedId) return gs;
  var oldC=findCyber(equippedId), newC=findCyber(storedId);
  var oldHp=(oldC&&oldC.hpCost)||0, newHp=(newC&&newC.hpCost)||0;
  var eq=Object.assign({},gs.cyberEquipped); eq[slot]=storedId;
  var st=Object.assign({},gs.cyberStorage); st[slot]=equippedId;
  // Reverse old hp cost, then apply new hp cost
  var maxHp=gs.player.maxHp+oldHp-newHp;
  var player=Object.assign({},gs.player,{maxHp:maxHp,hp:Math.min(gs.player.hp,maxHp)});
  return Object.assign({},gs,{cyberEquipped:eq,cyberStorage:st,player:player});
}

// Sell a stored item for 50% of its purchase cost.
function sellStored(gs, slot){
  var storedId=gs.cyberStorage[slot];
  if(!storedId) return gs;
  var c=findCyber(storedId);
  var refund=Math.floor((c?c.cost:0)*0.5);
  var st=Object.assign({},gs.cyberStorage); st[slot]=null;
  return Object.assign({},gs,{cyberStorage:st,credits:gs.credits+refund});
}

// ─── Dev Mode: raw state helpers (bypass cost/slot/storage rules — instant & free) ─────────
// Force-equips a piece of cyberware into its designated slot, overwriting whatever's there.
// Mirrors acquireCyber's HP-cost bookkeeping but skips storage entirely, per Dev Mode's design.
function devForceEquip(prev, cyberId){
  var c=findCyber(cyberId); if(!c) return prev;
  var slot=c.slot;
  var oldId=prev.cyberEquipped[slot];
  var oldC=oldId?findCyber(oldId):null;
  var oldHp=(oldC&&oldC.hpCost)||0, newHp=c.hpCost||0;
  var eq=Object.assign({},prev.cyberEquipped); eq[slot]=cyberId;
  var maxHp=prev.player.maxHp+oldHp-newHp;
  var player=Object.assign({},prev.player,{maxHp:maxHp,hp:Math.min(prev.player.hp,maxHp)});
  return Object.assign({},prev,{cyberEquipped:eq,player:player});
}
function devForceClear(prev, slot){
  var oldId=prev.cyberEquipped[slot];
  if(!oldId) return prev;
  var oldC=findCyber(oldId);
  var hp=(oldC&&oldC.hpCost)||0;
  var eq=Object.assign({},prev.cyberEquipped); eq[slot]=null;
  var player=Object.assign({},prev.player,{maxHp:prev.player.maxHp+hp});
  return Object.assign({},prev,{cyberEquipped:eq,player:player});
}
// Adds one copy of a card — straight into hand if mid-combat and there's room (so it's
// immediately testable), otherwise into the deck for next draw/shuffle.
function devAddCard(prev, cardId){
  if(prev.enemy && prev.hand.length<HAND_LIMIT){
    return Object.assign({},prev,{hand:prev.hand.concat([cardId])});
  }
  return Object.assign({},prev,{deck:prev.deck.concat([cardId])});
}
// Removes one copy of a card, searching hand → discard → deck → exhausted for the first hit.
function devRemoveOneCard(prev, cardId){
  var piles=['hand','discard','deck','exhausted'];
  for(var i=0;i<piles.length;i++){
    var key=piles[i];
    var arr=(prev[key]||[]).slice();
    var idx=arr.indexOf(cardId);
    if(idx!==-1){
      arr.splice(idx,1);
      var patch={}; patch[key]=arr;
      return Object.assign({},prev,patch);
    }
  }
  return prev;
}

// ─── Map Generation ───────────────────────────────────────────────────────────
var MAP_ROWS = 14;
var MAP_COLS = 3;

var NODE_TYPES_BY_ROW = [
  ['combat','combat','event'],
  ['combat','event','combat'],
  ['combat','rest','combat'],
  ['combat','combat','shop'],
  ['elite','combat','event'],
  ['combat','shop','combat'],
  ['rest','combat','elite'],
  ['combat','event','combat'],
  ['elite','combat','shop'],
  ['combat','rest','combat'],
  ['combat','elite','event'],
  ['shop','combat','rest'],
  ['elite','combat','combat'],
  ['combat','shop','event'],
];

function generateMap(){
  var connections=[];
  for(var r=0;r<MAP_ROWS-1;r++){
    connections[r]=[[],[],[]];
    for(var c=0;c<MAP_COLS;c++){
      var options=[c];
      if(c>0) options.push(c-1);
      if(c<MAP_COLS-1) options.push(c+1);
      var pick=options[Math.floor(Math.random()*options.length)];
      connections[r][c].push(pick);
    }
    var reached=[false,false,false];
    for(var c2=0;c2<MAP_COLS;c2++){
      connections[r][c2].forEach(function(t){reached[t]=true;});
    }
    for(var t=0;t<MAP_COLS;t++){
      if(!reached[t]){
        var donor=t===0?0:t===2?2:(Math.random()<0.5?0:2);
        if(connections[r][donor].indexOf(t)===-1) connections[r][donor].push(t);
      }
    }
    for(var c3=0;c3<MAP_COLS;c3++){
      connections[r][c3]=connections[r][c3].filter(function(v,i,a){return a.indexOf(v)===i;});
    }
  }
  connections[MAP_ROWS-1]=[[1],[1],[1]];

  var nodes=[];
  for(var r2=0;r2<MAP_ROWS;r2++){
    var rowTypes=NODE_TYPES_BY_ROW[r2]||['combat','combat','combat'];
    for(var c4=0;c4<MAP_COLS;c4++){
      nodes.push({row:r2,col:c4,type:rowTypes[c4]});
    }
  }
  nodes.push({row:MAP_ROWS,col:1,type:'boss'});

  return {nodes:nodes,connections:connections};
}

var NODE_ICON  = {combat:'⚔',rest:'🔋',shop:'💾',elite:'💀',boss:'☠',event:'📡'};
var NODE_COLOR = {combat:'#2a78d6',rest:'#1baf7a',shop:'#eda100',elite:'#e34948',boss:'#ff2244',event:'#4a3aa7'};
var NODE_LABEL = {combat:'Encounter',rest:'Safe House',shop:'Black Market',elite:'CyberPsycho',boss:'Corp Boss',event:'Data Spike'};

// An event with no `requires` field is always eligible. One with `requires(s)` only shows up
// in the normal map's random pick once that predicate is true — used for event chains like
// Street Doc Favor → Old Favor Called In. Dev Mode's picker deliberately ignores this and
// always shows every event, consistent with Dev Mode bypassing every other acquisition rule.
function eligibleEvents(s){
  return EVENTS.filter(function(ev){ return !ev.requires || ev.requires(s); });
}

// ─── Events ───────────────────────────────────────────────────────────────────
var EVENTS=[
  {title:'Corporate Black Ice',desc:'A defensive netrunner trap flares to life around you.',
   options:[
    {label:'Push through (-12 HP, +70c)',fn:function(s){
      return clog(Object.assign({},s,{credits:s.credits+70,player:Object.assign({},s.player,{hp:Math.max(1,s.player.hp-12)})}),'Pushed through — took 12 damage, found 70 credits');
    }},
    {label:'Reroute around it',fn:function(s){return s;}},
   ]},
  {title:'Salvaged Prototype',desc:'A weapons cache holds one working prototype, still under warranty.',
   options:[
    {label:'Take the prototype (+Railgun)',fn:function(s){
      return clog(Object.assign({},s,{deck:s.deck.concat(['railgun'])}),'Added Railgun to your deck');
    }},
    {label:'Leave it — might be rigged',fn:function(s){return s;}},
   ]},
  {title:'Ganger Shakedown',desc:'A local crew blocks the alley. They want a toll, one way or another.',
   options:[
    {label:'Pay them off (-40c)',fn:function(s){
      return clog(Object.assign({},s,{credits:Math.max(0,s.credits-40)}),'Paid off the gang');
    }},
    {label:'Fight through (-10 HP)',fn:function(s){
      return clog(Object.assign({},s,{player:Object.assign({},s.player,{hp:Math.max(1,s.player.hp-10)})}),'Fought through — took 10 damage');
    }},
   ]},
  {title:'Severance Contract',desc:'A corp fixer offers a payout to walk away from one piece of your arsenal.',
   options:[
    {label:'Sign it (+90c, remove 1 card)',pickCard:true,fn:function(s){
      return clog(Object.assign({},s,{credits:s.credits+90}),'Signed the contract — gained 90 credits');
    }},
    {label:'Tear it up',fn:function(s){return s;}},
   ]},
  {title:'Rogue Courier',desc:'You catch up to a data courier who never saw you coming.',
   options:[
    {label:'Take the credits (+60c)',fn:function(s){
      return clog(Object.assign({},s,{credits:s.credits+60}),'Took the credit stash');
    }},
    {label:'Take their gear (free cyberware)',fn:function(s){
      var eligible=getEligibleCyber(s,'eventPool');
      if(!eligible.length) return clog(s,'No eligible cyberware available');
      var pick=eligible[Math.floor(Math.random()*eligible.length)];
      var res=acquireCyber(s, pick.id);
      return clog(res.gs, (res.result==='equipped'?'Installed ':'Stored ')+pick.name);
    }},
   ]},
  {title:'Overwatch Chip Cache',desc:'A downed security drone still has a functional processor.',
   options:[
    {label:'Extract & install the Overwatch Chip',fn:function(s){
      if(isEquipped(s,'overwatch_chip')||Object.values(s.cyberStorage).includes('overwatch_chip')) return clog(s,'You already have an Overwatch Chip');
      var res=acquireCyber(s,'overwatch_chip');
      if(res.result==='blocked') return clog(s,'No room — Legs slot full');
      return clog(res.gs, (res.result==='equipped'?'Installed ':'Stored ')+'Overwatch Chip');
    }},
    {label:'Leave it, too risky to hack',fn:function(s){return s;}},
   ]},
  {title:'Memory Wipe',desc:'A corrupted memory shard burns through your neural link. There is no clean way out of this.',
   options:[
    {label:'Suppress it (-8 max HP, permanent)',fn:function(s){
      var newMax=Math.max(10,s.player.maxHp-8);
      return clog(Object.assign({},s,{player:Object.assign({},s.player,{maxHp:newMax,hp:Math.min(s.player.hp,newMax)})}),'Suppressed the trauma — max HP reduced');
    }},
    {label:'Endure it raw (-18 HP now)',fn:function(s){
      return clog(Object.assign({},s,{player:Object.assign({},s.player,{hp:Math.max(1,s.player.hp-18)})}),'Endured the pain — took 18 damage');
    }},
   ]},
  {title:'Street Doc Favor',desc:'An old contact owes you one. She can patch you up, no questions asked.',
   options:[
    {label:'Take the treatment (heal 20 HP)',fn:function(s){
      var hp=Math.min(s.player.maxHp,s.player.hp+20);
      return clog(Object.assign({},s,{player:Object.assign({},s.player,{hp:hp})}),'Healed 20 HP');
    }},
    {label:'Save the favor for later',fn:function(s){
      return clog(Object.assign({},s,{eventFlags:Object.assign({},s.eventFlags,{streetDocFavorSaved:true})}),'You pocket the favor for later.');
    }},
   ]},
  {title:'Old Favor Called In',
   desc:'The street doc you passed on before tracks you down. "You didn\'t cash in. Respect that. Got something better than a patch job — if you want it."',
   requires:function(s){ return !!(s.eventFlags&&s.eventFlags.streetDocFavorSaved) && !(s.eventFlags&&s.eventFlags.oldFavorResolved); },
   options:[
    {label:'Accept the augment (install Muscle Memory Implant)',fn:function(s){
      var flagged=Object.assign({},s,{eventFlags:Object.assign({},s.eventFlags,{oldFavorResolved:true})});
      if(isEquipped(flagged,'muscle_memory')||Object.values(flagged.cyberStorage).includes('muscle_memory')) return clog(flagged,'You already have a Muscle Memory Implant');
      var res=acquireCyber(flagged,'muscle_memory');
      if(res.result==='blocked') return clog(flagged,'No room — Arms slot full');
      return clog(res.gs, (res.result==='equipped'?'Installed ':'Stored ')+'Muscle Memory Implant');
    }},
    {label:"Decline — you'd rather keep moving",fn:function(s){
      return clog(Object.assign({},s,{eventFlags:Object.assign({},s.eventFlags,{oldFavorResolved:true})}),'You walk away. The favor stays unspent.');
    }},
   ]},
  {title:"Fixer's Wager",desc:'A fixer offers a bet. Even odds, and she never lies about that part.',
   options:[
    {label:'Take the bet (50/50: +120c or -25 HP)',fn:function(s){
      var win=Math.random()<0.5;
      if(win) return clog(Object.assign({},s,{credits:s.credits+120}),'The bet paid off — +120 credits!');
      return clog(Object.assign({},s,{player:Object.assign({},s.player,{hp:Math.max(1,s.player.hp-25)})}),'The bet went bad — took 25 damage');
    }},
    {label:'Walk away',fn:function(s){return s;}},
   ]},
  {title:'Ghost Merge',desc:'A rogue AI construct offers to fuse with your neural core, permanently.',
   options:[
    {label:'Merge fully (install Ghost Core)',fn:function(s){
      if(isEquipped(s,'ghost_core')||Object.values(s.cyberStorage).includes('ghost_core')) return clog(s,'You already have a Ghost Core');
      var res=acquireCyber(s,'ghost_core');
      if(res.result==='blocked') return clog(s,'No room — Core slot full');
      return clog(res.gs, (res.result==='equipped'?'Installed ':'Stored ')+'Ghost Core');
    }},
    {label:'Refuse the merge',fn:function(s){return s;}},
   ]},
];

var SHOP_POOL=['railgun','frag_grenade','drone_strike','critical_shot','data_leech','neural_link','poison_cloud','kinetic_battery','overclock','poison_dart','overload'];

// ─── Init ─────────────────────────────────────────────────────────────────────
function emptySlots(){ var o={}; SLOTS.forEach(function(s){o[s]=null;}); return o; }

function initRun(){
  return {
    player:{hp:80,maxHp:80,block:0,poison:0},
    deck:shuffle(STARTING_DECK.slice()),hand:[],discard:[],powers:[],exhausted:[],
    enemy:null,energy:3,energy_base:3,heat:0,round:0,combatLog:[],
    credits:100,
    cyberEquipped:emptySlots(),
    cyberStorage:emptySlots(),
    floor:0,mapRow:-1,mapCol:null,
    mapData:generateMap(),
    pendingCardReward:false,pendingCyberReward:null,
    shopCards:shuffle(SHOP_POOL).slice(0,4),currentEvent:null,
    stats:{enemiesDefeated:0,damageDealt:0,damageTaken:0,cardsPlayed:0,creditsEarned:0},
    devMode:false,
    eventFlags:{},
  };
}

// Dev Mode run — same shape as a normal run, flagged so screens/routing can branch,
// with generous starting credits so testers aren't blocked from the shop immediately.
function initDevRun(){
  var base=initRun();
  return Object.assign({},base,{devMode:true,credits:999});
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Bar(props){
  var pct=Math.max(0,Math.min(100,(props.val/props.max)*100));
  return(
    <div style={{background:'#1a1a2a',borderRadius:'6px',height:props.h||'8px',overflow:'hidden'}}>
      <div style={{background:props.color,height:'100%',width:pct+'%',transition:'width 0.25s',borderRadius:'6px'}}/>
    </div>
  );
}
function Badge(props){
  return(
    <span style={{fontSize:'11px',background:props.color+'22',border:'1px solid '+props.color+'66',borderRadius:'4px',padding:'2px 8px',color:props.color,whiteSpace:'nowrap'}}>
      {props.children}
    </span>
  );
}
function Btn(props){
  return(
    <button onClick={props.onClick} disabled={props.disabled} style={{padding:props.small?'6px 14px':'11px 26px',background:'transparent',border:'1px solid '+(props.disabled?'#333':props.color),borderRadius:'6px',color:props.disabled?'#444':props.color,cursor:props.disabled?'not-allowed':'pointer',fontSize:props.small?'11px':'13px',fontFamily:'monospace',letterSpacing:'0.5px'}}>
      {props.children}
    </button>
  );
}
function SectionLabel(props){
  return <div style={{fontSize:'10px',color:'#444',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'8px'}}>{props.children}</div>;
}

// ─── Card Pile Viewer ─────────────────────────────────────────────────────────
function CardPileViewer(props){
  var title=props.title, cards=props.cards, onClose=props.onClose, note=props.note||null;
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'#000000bb',display:'flex',alignItems:'center',justifyContent:'center',zIndex:150}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:'#0d0d18',border:'1px solid #2a1a3a',borderRadius:'14px',width:'480px',maxHeight:'75vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 0 40px #00000099'}}>
        <div style={{padding:'18px 22px',borderBottom:'1px solid #1a1a2a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'10px',color:'#444',letterSpacing:'2px',marginBottom:'4px'}}>COMBAT</div>
            <div style={{fontSize:'15px',fontWeight:'bold',color:'#ccc'}}>{title} ({cards.length})</div>
            {note&&<div style={{fontSize:'10px',color:'#444',marginTop:'3px',fontStyle:'italic'}}>{note}</div>}
          </div>
          <Btn color='#444' onClick={onClose} small>Close ✕</Btn>
        </div>
        <div style={{overflowY:'auto',padding:'16px',flex:1}}>
          {cards.length===0&&<div style={{fontSize:'12px',color:'#333',fontStyle:'italic',textAlign:'center',padding:'24px'}}>This pile is empty.</div>}
          {cards.map(function(cardId,i){
            var c=CARDS[cardId]; if(!c) return null;
            var col=TYPE_COLOR[c.type]||'#888';
            return(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',background:'#0f0a1a',border:'1px solid '+col+'22',borderRadius:'7px',marginBottom:'6px'}}>
                <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                  <span style={{fontSize:'10px',color:col,width:'44px',textTransform:'uppercase',letterSpacing:'1px'}}>{c.type}</span>
                  <span style={{fontSize:'13px',color:'#bbb'}}>{c.name}</span>
                </div>
                <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:'#444',maxWidth:'150px',textAlign:'right'}}>{c.desc}</span>
                  <span style={{fontSize:'12px',color:'#ffdd44',minWidth:'20px',textAlign:'right'}}>{c.cost}⚡</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'10px 22px',borderTop:'1px solid #111',fontSize:'11px',color:'#333',textAlign:'center'}}>
          Click outside or press Close to return to combat
        </div>
      </div>
    </div>
  );
}

// ─── Card Remove Modal ────────────────────────────────────────────────────────
// Shared card-pile helpers — used by Safe House's card removal (RestScreen) and the
// Severance Contract Data Spike event, so both drive the exact same picker UI/logic.
function buildCardPool(cur){
  var pool=[];
  (cur.deck||[]).forEach(function(cardId,idx){ pool.push({cardId:cardId,pile:'deck',pileIdx:idx}); });
  (cur.discard||[]).forEach(function(cardId,idx){ pool.push({cardId:cardId,pile:'discard',pileIdx:idx}); });
  (cur.hand||[]).forEach(function(cardId,idx){ pool.push({cardId:cardId,pile:'hand',pileIdx:idx}); });
  (cur.exhausted||[]).forEach(function(cardId,idx){ pool.push({cardId:cardId,pile:'exhausted',pileIdx:idx}); });
  return pool;
}
function removeCardEntry(s, entry){
  var pileArr=(s[entry.pile]||[]).slice();
  pileArr.splice(entry.pileIdx,1);
  var patch={};
  patch[entry.pile]=pileArr;
  return Object.assign({},s,patch);
}

function CardRemoveModal(props){
  var pool=props.pool, onRemove=props.onRemove, onClose=props.onClose, contextLabel=props.contextLabel||'SAFE HOUSE';
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'#000000bb',display:'flex',alignItems:'center',justifyContent:'center',zIndex:150}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:'#0d0d18',border:'1px solid #2a1a3a',borderRadius:'14px',width:'480px',maxHeight:'75vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 0 40px #00000099'}}>
        <div style={{padding:'18px 22px',borderBottom:'1px solid #1a1a2a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'10px',color:'#444',letterSpacing:'2px',marginBottom:'4px'}}>{contextLabel}</div>
            <div style={{fontSize:'15px',fontWeight:'bold',color:'#ccc'}}>Choose a card to remove ({pool.length})</div>
          </div>
          <Btn color='#444' onClick={onClose} small>Cancel ✕</Btn>
        </div>
        <div style={{overflowY:'auto',padding:'16px',flex:1}}>
          {pool.length===0&&<div style={{fontSize:'12px',color:'#333',fontStyle:'italic',textAlign:'center',padding:'24px'}}>Deck is empty.</div>}
          {pool.map(function(entry,i){
            var c=CARDS[entry.cardId];
            if(!c){
              return(
                <div key={i} style={{padding:'10px 14px',background:'#0f0a1a',border:'1px solid #33333322',borderRadius:'7px',marginBottom:'6px',fontSize:'12px',color:'#555'}}>
                  Unknown card ({entry.cardId})
                </div>
              );
            }
            var col=TYPE_COLOR[c.type]||'#888';
            return(
              <button
                key={entry.pile+'-'+entry.pileIdx+'-'+i}
                onClick={function(){ onRemove(entry); }}
                style={{
                  width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',
                  padding:'10px 14px',background:'#0f0a1a',border:'1px solid '+col+'33',borderRadius:'7px',
                  marginBottom:'6px',cursor:'pointer',fontFamily:'monospace',textAlign:'left',
                }}
              >
                <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                  <span style={{fontSize:'10px',color:col,width:'44px',textTransform:'uppercase',letterSpacing:'1px'}}>{c.type}</span>
                  <span style={{fontSize:'13px',color:'#ddd'}}>{c.name}</span>
                </div>
                <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:'#666',maxWidth:'150px',textAlign:'right'}}>{c.desc}</span>
                  <span style={{fontSize:'12px',color:'#ffdd44',minWidth:'20px',textAlign:'right'}}>{c.cost}⚡</span>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{padding:'10px 22px',borderTop:'1px solid #111',fontSize:'11px',color:'#333',textAlign:'center'}}>
          Click any card to remove it from your deck permanently
        </div>
      </div>
    </div>
  );
}

// ─── Cyberware Manage Modal (Rest Site) ───────────────────────────────────────
function CyberManageModal(props){
  var gs=props.gs, onAction=props.onAction, onClose=props.onClose;
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'#000000bb',display:'flex',alignItems:'center',justifyContent:'center',zIndex:150}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:'#0d0d18',border:'1px solid #2a1a3a',borderRadius:'14px',width:'560px',maxHeight:'80vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 0 40px #00000099'}}>
        <div style={{padding:'18px 22px',borderBottom:'1px solid #1a1a2a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'10px',color:'#444',letterSpacing:'2px',marginBottom:'4px'}}>SAFE HOUSE</div>
            <div style={{fontSize:'15px',fontWeight:'bold',color:'#ccc'}}>Manage Cyberware</div>
          </div>
          <Btn color='#444' onClick={onClose} small>Close ✕</Btn>
        </div>
        <div style={{overflowY:'auto',padding:'16px',flex:1,display:'flex',flexDirection:'column',gap:'10px'}}>
          {SLOTS.map(function(slot){
            var eqId=gs.cyberEquipped[slot], stId=gs.cyberStorage[slot];
            var eqC=eqId?findCyber(eqId):null, stC=stId?findCyber(stId):null;
            return(
              <div key={slot} style={{background:'#0f0a1a',border:'1px solid #2a1a3a',borderRadius:'8px',padding:'12px 14px'}}>
                <div style={{fontSize:'11px',color:'#8844cc',letterSpacing:'1px',marginBottom:'8px'}}>{SLOT_ICON[slot]} {SLOT_LABEL[slot].toUpperCase()}</div>
                <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:'160px'}}>
                    <div style={{fontSize:'9px',color:'#444',marginBottom:'2px'}}>EQUIPPED</div>
                    <div style={{fontSize:'13px',color:eqC?'#cc88ff':'#333'}}>{eqC?eqC.icon+' '+eqC.name:'— empty —'}</div>
                  </div>
                  <div style={{flex:1,minWidth:'160px'}}>
                    <div style={{fontSize:'9px',color:'#444',marginBottom:'2px'}}>STORED</div>
                    <div style={{fontSize:'13px',color:stC?'#88aacc':'#333'}}>{stC?stC.icon+' '+stC.name:'— empty —'}</div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    {eqC&&!stC&&<Btn color='#4488cc' onClick={function(){onAction('store',slot);}} small>To Storage</Btn>}
                    {stC&&!eqC&&<Btn color='#1baf7a' onClick={function(){onAction('equip',slot);}} small>Equip</Btn>}
                    {eqC&&stC&&<Btn color='#eda100' onClick={function(){onAction('swap',slot);}} small>Swap</Btn>}
                    {!eqC&&!stC&&<span style={{fontSize:'10px',color:'#333',fontStyle:'italic'}}>nothing to manage</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'10px 22px',borderTop:'1px solid #111',fontSize:'11px',color:'#333',textAlign:'center'}}>
          Rearrange freely — changes apply immediately and don't use up your Safe House visit
        </div>
      </div>
    </div>
  );
}

// ─── Pause Menu ───────────────────────────────────────────────────────────────
function PauseMenu(props){
  var gs=props.gs,onResume=props.onResume,onQuit=props.onQuit;
  var ts=useState('deck'); var tab=ts[0],setTab=ts[1];
  var allCards=gs.deck.concat(gs.discard).concat(gs.hand).concat(gs.exhausted||[]);
  var counts={};
  allCards.forEach(function(id){counts[id]=(counts[id]||0)+1;});
  var unique=Object.keys(counts);
  return(
    <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
      <div style={{background:'#0d0d18',border:'1px solid #2a1a3a',borderRadius:'14px',width:'540px',maxHeight:'82vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 0 40px #00000088'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #1a1a2a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:'15px',color:'#cc44ff',letterSpacing:'3px',fontWeight:'bold'}}>⏸ PAUSED</div>
          <div style={{display:'flex',gap:'10px'}}>
            <Btn color='#1baf7a' onClick={onResume} small>{props.resumeLabel||'Resume'}</Btn>
            <Btn color='#ff4444' onClick={onQuit} small>Give Up</Btn>
          </div>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid #1a1a2a'}}>
          {['deck','cyberware'].map(function(t){
            return(
              <button key={t} onClick={function(){setTab(t);}} style={{flex:1,padding:'12px',background:'transparent',fontFamily:'monospace',border:'none',borderBottom:'2px solid '+(tab===t?'#cc44ff':'transparent'),color:tab===t?'#cc44ff':'#555',cursor:'pointer',fontSize:'12px',textTransform:'uppercase',letterSpacing:'1px'}}>
                {t==='deck'?'Deck ('+allCards.length+')':'Cyberware'}
              </button>
            );
          })}
        </div>
        <div style={{overflowY:'auto',padding:'16px',flex:1}}>
          {tab==='deck'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {unique.length===0&&<div style={{color:'#444',fontSize:'12px'}}>No cards.</div>}
              {unique.map(function(id){
                var c=CARDS[id]; if(!c) return null;
                var col=TYPE_COLOR[c.type]||'#888';
                var isEx=(gs.exhausted||[]).includes(id);
                return(
                  <div key={id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',background:'#0f0a1a',border:'1px solid '+col+'33',borderRadius:'7px',opacity:isEx?0.45:1}}>
                    <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                      <span style={{fontSize:'10px',color:col,width:'44px',textTransform:'uppercase'}}>{c.type}</span>
                      <span style={{fontSize:'13px',color:'#ddd'}}>{c.name}</span>
                      {isEx&&<span style={{fontSize:'10px',color:'#555',fontStyle:'italic'}}>exhausted</span>}
                    </div>
                    <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                      <span style={{fontSize:'11px',color:'#555',maxWidth:'140px',textAlign:'right'}}>{c.desc}</span>
                      <span style={{fontSize:'12px',color:'#ffdd44',minWidth:'20px',textAlign:'right'}}>{c.cost}⚡</span>
                      {counts[id]>1&&<span style={{fontSize:'11px',color:'#666'}}>x{counts[id]}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {tab==='cyberware'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {SLOTS.map(function(slot){
                var eqId=gs.cyberEquipped[slot], stId=gs.cyberStorage[slot];
                var eqC=eqId?findCyber(eqId):null, stC=stId?findCyber(stId):null;
                return(
                  <div key={slot} style={{display:'flex',gap:'12px',alignItems:'center',padding:'10px 14px',background:'#0f0a1a',border:'1px solid #2a1a3a',borderRadius:'8px'}}>
                    <span style={{fontSize:'11px',color:'#8844cc',width:'70px',flexShrink:0}}>{SLOT_ICON[slot]} {SLOT_LABEL[slot]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'12px',color:eqC?'#cc88ff':'#333'}}>{eqC?eqC.name:'— empty —'}</div>
                      {eqC&&<div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>{eqC.desc}</div>}
                    </div>
                    {stC&&<span style={{fontSize:'10px',color:'#556677',fontStyle:'italic'}}>+stored: {stC.name}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dev Pause Menu ─────────────────────────────────────────────────────────
// Deliberately a separate component from PauseMenu rather than a variant of it — PauseMenu
// stays a pure read-only viewer for normal play; this one owns all the live state-editing UI
// and is only ever mounted from Dev Mode screens.
var DEV_CARD_TYPES=['all','attack','skill','power'];

function DevPauseMenu(props){
  var gs=props.gs, onDevAction=props.onDevAction, onResume=props.onResume, onQuit=props.onQuit;
  var ts=useState('vitals'); var tab=ts[0],setTab=ts[1];
  var fs=useState('all'); var cardFilter=fs[0],setCardFilter=fs[1];

  var allCards=gs.deck.concat(gs.discard).concat(gs.hand).concat(gs.exhausted||[]);
  var counts={};
  allCards.forEach(function(id){counts[id]=(counts[id]||0)+1;});
  var unique=Object.keys(counts);

  var hs=useState(String(gs.player.hp)); var hpVal=hs[0],setHpVal=hs[1];
  var mhs=useState(String(gs.player.maxHp)); var maxHpVal=mhs[0],setMaxHpVal=mhs[1];
  var cs=useState(String(gs.credits)); var creditsVal=cs[0],setCreditsVal=cs[1];

  function applyHp(){
    var hp=parseInt(hpVal,10), maxHp=parseInt(maxHpVal,10);
    if(isNaN(hp)||isNaN(maxHp)||maxHp<1) return;
    hp=Math.max(0,Math.min(hp,maxHp));
    setHpVal(String(hp)); setMaxHpVal(String(maxHp));
    onDevAction(function(prev){return Object.assign({},prev,{player:Object.assign({},prev.player,{hp:hp,maxHp:maxHp})});});
  }
  function fullHeal(){
    setHpVal(String(gs.player.maxHp));
    onDevAction(function(prev){return Object.assign({},prev,{player:Object.assign({},prev.player,{hp:prev.player.maxHp})});});
  }
  function applyCredits(){
    var c=parseInt(creditsVal,10);
    if(isNaN(c)||c<0) return;
    onDevAction(function(prev){return Object.assign({},prev,{credits:c});});
  }
  function addCredits(n){
    setCreditsVal(String(Math.max(0,gs.credits+n)));
    onDevAction(function(prev){return Object.assign({},prev,{credits:Math.max(0,prev.credits+n)});});
  }
  function forceEquip(cyberId){ onDevAction(function(prev){return devForceEquip(prev,cyberId);}); }
  function forceClear(slot){ onDevAction(function(prev){return devForceClear(prev,slot);}); }
  function addCard(cardId){ onDevAction(function(prev){return devAddCard(prev,cardId);}); }
  function removeCard(cardId){ onDevAction(function(prev){return devRemoveOneCard(prev,cardId);}); }

  var libraryCards=Object.values(CARDS).filter(function(c){return cardFilter==='all'||c.type===cardFilter;});

  return(
    <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
      <div style={{background:'#0d0d18',border:'1px solid #4a2a1a',borderRadius:'14px',width:'580px',maxHeight:'84vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 0 40px #00000088'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #1a1a2a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'10px',color:'#ff8844',letterSpacing:'2px',marginBottom:'4px'}}>⚠ DEV MODE</div>
            <div style={{fontSize:'15px',color:'#cc44ff',letterSpacing:'2px',fontWeight:'bold'}}>⏸ PAUSED</div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <Btn color='#1baf7a' onClick={onResume} small>Resume</Btn>
            <Btn color='#ff4444' onClick={onQuit} small>Exit to Title</Btn>
          </div>
        </div>
        <div style={{display:'flex',borderBottom:'1px solid #1a1a2a'}}>
          {['vitals','deck','cyberware'].map(function(t){
            return(
              <button key={t} onClick={function(){setTab(t);}} style={{flex:1,padding:'12px',background:'transparent',fontFamily:'monospace',border:'none',borderBottom:'2px solid '+(tab===t?'#ff8844':'transparent'),color:tab===t?'#ff8844':'#555',cursor:'pointer',fontSize:'12px',textTransform:'uppercase',letterSpacing:'1px'}}>
                {t==='deck'?'Deck ('+allCards.length+')':t}
              </button>
            );
          })}
        </div>
        <div style={{overflowY:'auto',padding:'16px',flex:1}}>

          {tab==='vitals'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
              <div>
                <SectionLabel>Health</SectionLabel>
                <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
                  <input type="number" value={hpVal} onChange={function(e){setHpVal(e.target.value);}} style={{width:'80px',padding:'8px 10px',background:'#08080f',border:'1px solid #2a2a3a',borderRadius:'6px',color:'#fff',fontFamily:'monospace',fontSize:'13px'}}/>
                  <span style={{color:'#555',fontSize:'13px'}}>/</span>
                  <input type="number" value={maxHpVal} onChange={function(e){setMaxHpVal(e.target.value);}} style={{width:'80px',padding:'8px 10px',background:'#08080f',border:'1px solid #2a2a3a',borderRadius:'6px',color:'#fff',fontFamily:'monospace',fontSize:'13px'}}/>
                  <span style={{fontSize:'11px',color:'#555'}}>HP / Max HP</span>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <Btn color='#4488cc' onClick={applyHp} small>Apply</Btn>
                  <Btn color='#1baf7a' onClick={fullHeal} small>Full Heal</Btn>
                </div>
              </div>
              <div>
                <SectionLabel>Credits</SectionLabel>
                <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
                  <input type="number" value={creditsVal} onChange={function(e){setCreditsVal(e.target.value);}} style={{width:'110px',padding:'8px 10px',background:'#08080f',border:'1px solid #2a2a3a',borderRadius:'6px',color:'#fff',fontFamily:'monospace',fontSize:'13px'}}/>
                  <span style={{fontSize:'11px',color:'#555'}}>¢ Credits</span>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <Btn color='#eda100' onClick={applyCredits} small>Set</Btn>
                  <Btn color='#eda100' onClick={function(){addCredits(100);}} small>+100</Btn>
                  <Btn color='#eda100' onClick={function(){addCredits(500);}} small>+500</Btn>
                </div>
              </div>
            </div>
          )}

          {tab==='deck'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
              <div>
                <SectionLabel>Current Cards ({allCards.length}) — click − to remove one</SectionLabel>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {unique.length===0&&<div style={{color:'#444',fontSize:'12px'}}>No cards.</div>}
                  {unique.map(function(id){
                    var c=CARDS[id]; if(!c) return null;
                    var col=TYPE_COLOR[c.type]||'#888';
                    return(
                      <div key={id} style={{padding:'9px 12px',background:'#0f0a1a',border:'1px solid '+col+'33',borderRadius:'7px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                            <span style={{fontSize:'10px',color:col,width:'44px',textTransform:'uppercase',flexShrink:0}}>{c.type}</span>
                            <span style={{fontSize:'13px',color:'#ddd'}}>{c.name}</span>
                          </div>
                          <div style={{display:'flex',gap:'10px',alignItems:'center',flexShrink:0}}>
                            <span style={{fontSize:'12px',color:'#ffdd44'}}>{c.cost}⚡</span>
                            {counts[id]>1&&<span style={{fontSize:'11px',color:'#666'}}>x{counts[id]}</span>}
                            <button onClick={function(){removeCard(id);}} style={{width:'24px',height:'24px',borderRadius:'5px',background:'transparent',border:'1px solid #ff444466',color:'#ff6666',cursor:'pointer',fontFamily:'monospace',fontSize:'13px'}}>−</button>
                          </div>
                        </div>
                        <div style={{fontSize:'11px',color:'#777',marginTop:'6px',paddingLeft:'54px',lineHeight:'1.5'}}>{c.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <SectionLabel>Add Card{gs.enemy?' (goes to hand if room)':''}</SectionLabel>
                <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
                  {DEV_CARD_TYPES.map(function(t){
                    var col=TYPE_COLOR[t]||'#666';
                    return <button key={t} onClick={function(){setCardFilter(t);}} style={{padding:'5px 12px',borderRadius:'5px',fontFamily:'monospace',fontSize:'10px',cursor:'pointer',background:cardFilter===t?(t==='all'?'#2a2a3a':col+'22'):'transparent',border:'1px solid '+(cardFilter===t?(t==='all'?'#555':col):'#2a2a3a'),color:cardFilter===t?(t==='all'?'#fff':col):'#555',textTransform:'uppercase'}}>{t}</button>;
                  })}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {libraryCards.map(function(c){
                    var col=TYPE_COLOR[c.type]||'#888';
                    return(
                      <div key={c.id} style={{padding:'9px 12px',background:'#0f0a1a',border:'1px solid '+col+'22',borderRadius:'7px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div style={{display:'flex',gap:'10px',alignItems:'center',minWidth:0}}>
                            <span style={{fontSize:'10px',color:col,width:'44px',textTransform:'uppercase',flexShrink:0}}>{c.type}</span>
                            <span style={{fontSize:'12px',color:'#ddd'}}>{c.name}</span>
                          </div>
                          <div style={{display:'flex',gap:'10px',alignItems:'center',flexShrink:0}}>
                            <span style={{fontSize:'11px',color:'#ffdd44'}}>{c.cost}⚡</span>
                            <button onClick={function(){addCard(c.id);}} style={{width:'24px',height:'24px',borderRadius:'5px',background:'transparent',border:'1px solid #1baf7a66',color:'#1baf7a',cursor:'pointer',fontFamily:'monospace',fontSize:'13px',flexShrink:0}}>+</button>
                          </div>
                        </div>
                        <div style={{fontSize:'11px',color:'#777',marginTop:'6px',paddingLeft:'54px',lineHeight:'1.5'}}>{c.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab==='cyberware'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {CYBERNETICS.map(function(c){
                var eqId=gs.cyberEquipped[c.slot];
                var isThis=eqId===c.id;
                return(
                  <div key={c.id} style={{display:'flex',gap:'12px',alignItems:'center',padding:'10px 14px',background:'#0f0a1a',border:'1px solid '+(isThis?'#1baf7a66':'#2a1a3a'),borderRadius:'8px'}}>
                    <span style={{fontSize:'20px'}}>{c.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'12px',color:isThis?'#1baf7a':'#ccc'}}>{c.name} <span style={{fontSize:'9px',color:'#8844cc'}}>({SLOT_LABEL[c.slot]})</span></div>
                      <div style={{fontSize:'10px',color:'#777',marginTop:'2px'}}>{c.desc}</div>
                    </div>
                    {isThis
                      ? <Btn color='#ff4444' onClick={function(){forceClear(c.slot);}} small>Remove</Btn>
                      : <Btn color='#8844cc' onClick={function(){forceEquip(c.id);}} small>Force Equip</Btn>
                    }
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Cyberware Strip (combat) ─────────────────────────────────────────────────
function CyberwareStrip(props){
  var ids=props.cybernetics;
  var hs=useState(null); var hovered=hs[0],setHovered=hs[1];
  if(!ids||ids.length===0) return null;
  return(
    <div style={{position:'relative'}}>
      <SectionLabel>Installed Cybernetics</SectionLabel>
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
        {ids.map(function(cid){
          var c=findCyber(cid); if(!c) return null;
          var isHov=hovered===cid;
          return(
            <div key={cid} style={{position:'relative'}}>
              <div onMouseEnter={function(){setHovered(cid);}} onMouseLeave={function(){setHovered(null);}} style={{display:'flex',alignItems:'center',gap:'6px',padding:'5px 12px',borderRadius:'6px',cursor:'default',background:isHov?'#1a0a2a':'#110a1a',border:'1px solid '+(isHov?'#8844cc':'#2a1a3a'),transition:'all 0.1s'}}>
                <span style={{fontSize:'16px'}}>{c.icon}</span>
                <span style={{fontSize:'11px',color:isHov?'#cc88ff':'#664488'}}>{c.name}</span>
              </div>
              {isHov&&(
                <div style={{position:'absolute',bottom:'110%',left:'50%',transform:'translateX(-50%)',background:'#0d0a1a',border:'1px solid #4a1a6a',borderRadius:'8px',padding:'10px 14px',width:'200px',zIndex:50,boxShadow:'0 4px 24px #00000088',pointerEvents:'none'}}>
                  <div style={{fontSize:'12px',fontWeight:'bold',color:'#cc88ff',marginBottom:'6px'}}>{c.icon} {c.name}</div>
                  <div style={{fontSize:'11px',color:'#aaa',lineHeight:'1.7'}}>{c.desc}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Intent Display ───────────────────────────────────────────────────────────
function IntentDisplay(props){
  var intent=props.intent; if(!intent) return null;
  var meta=INTENT_META[intent.type]||INTENT_META.attack;
  return(
    <div style={{display:'flex',alignItems:'center',gap:'10px',background:'#12101c',border:'1px solid '+meta.color+'55',borderRadius:'8px',padding:'8px 14px',minWidth:'140px'}}>
      <span style={{fontSize:'20px'}}>{meta.icon}</span>
      <div>
        <div style={{fontSize:'12px',color:meta.color,fontWeight:'bold',letterSpacing:'1px'}}>{meta.label}</div>
        {intent.value&&(intent.type==='attack'||intent.type==='heavy_attack'||intent.type==='double_attack')&&(
          <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>
            {intent.type==='double_attack'?intent.value+' x 2 dmg':intent.value+' dmg'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App(){
  var ss=useState('title'); var screen=ss[0],setScreen=ss[1];
  var gs_=useState(null);   var gs=gs_[0],  setGs=gs_[1];
  var dg=useState(false);   var showDevGate=dg[0], setShowDevGate=dg[1];

  function startRun(){ setGs(initRun()); setScreen('loadout'); }

  function tryDevCode(code){
    if(code==='DevHell'){
      setGs(initDevRun());
      setScreen('devHub');
      setShowDevGate(false);
      return true;
    }
    return false;
  }

  function goNode(row,col,type){
    var s=Object.assign({},gs,{mapRow:row,mapCol:col,floor:gs.floor+1});
    if(type==='combat'||type==='elite'||type==='boss'){
      var keys=['corp_grunt','security_bot','netrunner'];
      var eKey=type==='boss'?'arasaka_boss':type==='elite'?'elite_enforcer':keys[Math.floor(Math.random()*3)];
      setGs(startCombat(s,eKey)); setScreen('combat');
    } else if(type==='rest') {setGs(s);setScreen('rest');}
      else if(type==='shop') {setGs(s);setScreen('shop');}
      else if(type==='event'){var pool=eligibleEvents(s);setGs(Object.assign({},s,{currentEvent:pool[Math.floor(Math.random()*pool.length)]}));setScreen('event');}
  }

  function startCombat(s,eKey){
    var enemy=makeEnemy(eKey);
    var full=shuffle(s.deck.concat(s.discard).concat(s.hand).concat(s.exhausted||[]));
    var drawN=Math.min(5+(isEquipped(s,'neural_overclock')?1:0),HAND_LIMIT);
    var deck=full.slice(),hand=[];
    for(var i=0;i<drawN;i++){if(hand.length<HAND_LIMIT&&deck.length) hand.push(deck.pop());}
    var ns=Object.assign({},s,{
      enemy:enemy,deck:deck,hand:hand,discard:[],exhausted:[],powers:[],
      player:Object.assign({},s.player,{block:isEquipped(s,'subdermal_armor')?6:0,poison:0}),
      energy:Math.max(1,s.energy_base+(isEquipped(s,'reflex_booster')?1:0)-(isEquipped(s,'ghost_core')?1:0)),
      heat:0,round:1,combatLog:[],lastAttackPlayed:null,
    });
    if(isEquipped(s,'drone_chassis')){ ns=dealDmg(dealDmg(ns,5),5); }
    return ns;
  }

  // ─── Dev Mode navigation — same underlying flows as the map, entered directly ──────────
  function devEnterCombat(eKey){ setGs(startCombat(gs,eKey)); setScreen('combat'); }
  function devEnterRest(){ setScreen('rest'); }
  function devEnterShop(){ setGs(Object.assign({},gs,{shopCards:shuffle(SHOP_POOL).slice(0,4)})); setScreen('shop'); }
  function devEnterEvent(ev){ setGs(Object.assign({},gs,{currentEvent:ev})); setScreen('event'); }
  // Generic escape hatch for the dev pause menu — takes an updater fn(prevState)->newState,
  // mirroring the setGs(function(prev){...}) pattern already used throughout this file.
  function devApplyState(updater){ setGs(updater); }

  function playCard(idx){
    var s=Object.assign({},gs);
    var cardId=s.hand[idx]; var card=CARDS[cardId];
    if(!card||s.energy<card.cost) return;
    var doesExhaust=card.type==='power'||!!card.exhausts;
    s=Object.assign({},s,{
      hand:s.hand.filter(function(_,i){return i!==idx;}),
      discard:doesExhaust?s.discard:s.discard.concat([cardId]),
      exhausted:doesExhaust?(s.exhausted||[]).concat([cardId]):(s.exhausted||[]),
      energy:s.energy-card.cost,
      stats:Object.assign({},s.stats,{cardsPlayed:((s.stats&&s.stats.cardsPlayed)||0)+1}),
      lastAttackPlayed:card.type==='attack'?cardId:s.lastAttackPlayed,
    });
    s=card.fn(s);
    if(s.enemy.hp<=0){finishCombat(s);return;}
    setGs(s);
  }

  function endTurn(){
    var s=Object.assign({},gs);
    if(s.enemy.hp<=0) return;
    var nextRound=s.round+1;
    var logLines=[];

    s=Object.assign({},s,{discard:s.discard.concat(s.hand),hand:[]});
    s=Object.assign({},s,{enemy:Object.assign({},s.enemy,{block:0})});

    if(s.enemy.poison>0){
      var pdmg=s.enemy.poison;
      var hasBio=(s.powers||[]).includes('bioaccumulation');
      var nextPoison=hasBio?s.enemy.poison:s.enemy.poison-1;
      var en1=Object.assign({},s.enemy,{hp:Math.max(0,s.enemy.hp-pdmg),poison:nextPoison});
      logLines.push('Poison deals '+pdmg+' dmg to '+en1.name+(hasBio?' (Bioaccumulation — no decay)':''));
      s=Object.assign({},s,{enemy:en1});
      if((s.powers||[]).includes('symbiotic_toxin')&&s.player.hp<s.player.maxHp){
        s=Object.assign({},s,{player:Object.assign({},s.player,{hp:Math.min(s.player.maxHp,s.player.hp+1)})});
        logLines.push('Symbiotic Toxin heals 1 HP');
      }
      if(en1.hp<=0){finishCombat(s);return;}
    }
    if(s.enemy.bleed>0){
      var bdmg=s.enemy.bleed;
      var en2=Object.assign({},s.enemy,{hp:Math.max(0,s.enemy.hp-bdmg)});
      logLines.push('Bleed deals '+bdmg+' dmg to '+en2.name);
      s=Object.assign({},s,{enemy:en2});
      if(en2.hp<=0){finishCombat(s);return;}
    }

    var result=executeIntent(s);
    s=result; logLines=result.combatLog.concat(logLines);

    var p=Object.assign({},s.player);
    if(p.poison>0){
      if(isEquipped(s,'toxin_filter')){p.hp=Math.min(p.maxHp,p.hp+p.poison);logLines.push('Toxin Filter heals '+p.poison+' HP');}
      else{p.hp=Math.max(0,p.hp-p.poison);logLines.push('Poison deals '+p.poison+' dmg to you');}
      p.poison=Math.max(0,p.poison-1);
    }
    if(p.hp<=0){
      if(s.devMode){
        var revived=Object.assign({},s,{player:Object.assign({},p,{hp:s.player.maxHp,poison:0}),combatLog:logLines});
        setGs(revived); setScreen('devHub'); return;
      }
      setGs(Object.assign({},s,{player:p,combatLog:logLines}));setScreen('death');return;
    }

    var nextTurn=(s.enemy.intentTurn||0)+1;
    var nextEnemy=Object.assign({},s.enemy,{intentTurn:nextTurn,hitsThisTurn:0});
    nextEnemy.currentIntent=resolveIntent(nextEnemy);
    s=Object.assign({},s,{enemy:nextEnemy});

    p.block=isEquipped(s,'overwatch_chip')?1:0;
    var deck=s.deck.slice(),discard=s.discard.slice();
    if(deck.length===0){deck=shuffle(discard);discard=[];}
    var drawN=Math.min(5+(isEquipped(s,'neural_overclock')?1:0),HAND_LIMIT);
    var hand=[];
    for(var i=0;i<drawN;i++){
      if(hand.length>=HAND_LIMIT) break;
      if(deck.length===0&&discard.length>0){deck=shuffle(discard);discard=[];}
      if(deck.length) hand.push(deck.pop());
    }

    var pcStacks=(s.exhausted||[]).filter(function(id){return id==='poison_cloud';}).length;
    if(pcStacks>0){
      for(var pc=0;pc<pcStacks;pc++){s=applyPoison(s,2);}
      logLines.unshift('Poison Cloud x'+pcStacks+': +'+(pcStacks*2)+' Poison');
    }

    if(isEquipped(s,'muscle_memory') && s.lastAttackPlayed){
      var echoCard=CARDS[s.lastAttackPlayed];
      if(echoCard){
        var beforeLog=s.combatLog;
        s=Object.assign({},s,{player:p,deck:deck,hand:hand,discard:discard});
        s=echoCard.fn(s);
        p=s.player; deck=s.deck; hand=s.hand; discard=s.discard;
        var echoMsg=s.combatLog!==beforeLog?s.combatLog[0]:(echoCard.name+' had no effect');
        logLines.unshift('🔁 Muscle Memory Implant replays '+echoCard.name+' — '+echoMsg);
        if(s.enemy.hp<=0){ finishCombat(Object.assign({},s,{combatLog:logLines.slice(0,6),deck:deck,hand:hand,discard:discard})); return; }
      }
    }

    var extraEnergy=(s.powers&&s.powers.includes('kinetic_battery'))?1:0;
    var startEnergy=s.energy_base+(isEquipped(s,'reflex_booster')?1:0);

    setGs(Object.assign({},s,{player:p,deck:deck,hand:hand,discard:discard,energy:startEnergy+extraEnergy,combatLog:logLines.slice(0,6),round:nextRound,lastAttackPlayed:null}));
  }

  function finishCombat(s){
    var reward=s.enemy.isBoss?80:s.enemy.isElite?50:30;
    var credits=reward+Math.floor(Math.random()*20);
    var stats=Object.assign({},s.stats,{
      enemiesDefeated:((s.stats&&s.stats.enemiesDefeated)||0)+1,
      creditsEarned:((s.stats&&s.stats.creditsEarned)||0)+credits,
    });
    var ns=Object.assign({},s,{credits:s.credits+credits,pendingCardReward:true,stats:stats});

    if(s.enemy.isBoss){
      if(s.devMode){
        var healed=Object.assign({},ns,{player:Object.assign({},ns.player,{hp:ns.player.maxHp})});
        setGs(healed); setScreen('devHub'); return;
      }
      setGs(ns); setScreen('victory'); return;
    }

    if(s.enemy.isElite){
      var eligible=getEligibleCyber(ns,'elite');
      var options=shuffle(eligible).slice(0,2);
      if(options.length>0){
        setGs(Object.assign({},ns,{pendingCyberReward:options.map(function(c){return c.id;})}));
        setScreen('cyberReward');
        return;
      }
    }
    setGs(ns); setScreen('reward');
  }

  function pickCyberReward(cyberId){
    setGs(function(prev){
      var res=acquireCyber(prev, cyberId);
      return Object.assign({},res.gs,{pendingCyberReward:null});
    });
    setScreen('reward');
  }
  function skipCyberReward(){
    setGs(function(prev){ return Object.assign({},prev,{pendingCyberReward:null}); });
    setScreen('reward');
  }

  function pickReward(cardId){
    setGs(function(prev){
      var pool=prev.deck.concat(prev.discard).concat(prev.exhausted||[]).concat([cardId]);
      return Object.assign({},prev,{deck:shuffle(pool),discard:[],exhausted:[],pendingCardReward:false});
    });
    setScreen(gs&&gs.devMode?'devHub':'map');
  }
  function skipReward(){
    setGs(function(prev){
      var pool=prev.deck.concat(prev.discard).concat(prev.exhausted||[]);
      return Object.assign({},prev,{deck:shuffle(pool),discard:[],exhausted:[],pendingCardReward:false});
    });
    setScreen(gs&&gs.devMode?'devHub':'map');
  }

  var startingIds=STARTING_DECK.filter(function(v,i,a){return a.indexOf(v)===i;});
  var rewardPool=Object.values(CARDS).filter(function(c){return startingIds.indexOf(c.id)===-1;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
  var quit=function(){setGs(null);setScreen('title');};

  return(
    <div style={{minHeight:'100vh',background:'#08080f',color:'#e0e0e0',fontFamily:'monospace'}}>
      {screen==='title'      &&<TitleScreen   onStart={startRun} onLibrary={function(){setScreen('library');}} onHowTo={function(){setScreen('howto');}} onDeveloper={function(){setShowDevGate(true);}}/>}
      {showDevGate&&<DevGateModal onSubmit={tryDevCode} onCancel={function(){setShowDevGate(false);}}/>}
      {screen==='library'    &&<CardLibraryScreen onBack={function(){setScreen('title');}}/>}
      {screen==='howto'      &&<HowToPlayScreen   onBack={function(){setScreen('title');}}/>}
      {screen==='loadout'    &&gs&&<LoadoutScreen gs={gs} onDone={function(ng){setGs(ng);setScreen('map');}}/>}
      {screen==='map'        &&gs&&<MapScreen    gs={gs} onNode={goNode} onQuit={quit}/>}
      {screen==='devHub'     &&gs&&<DevHubScreen gs={gs} onCombat={devEnterCombat} onRest={devEnterRest} onShop={devEnterShop} onEvent={devEnterEvent} onDevAction={devApplyState} onQuit={quit}/>}
      {screen==='combat'     &&gs&&<CombatScreen gs={gs} onPlay={playCard} onEndTurn={endTurn} onQuit={quit} onDevAction={devApplyState}/>}
      {screen==='cyberReward'&&gs&&<CyberRewardScreen gs={gs} onPick={pickCyberReward} onSkip={skipCyberReward}/>}
      {screen==='reward'     &&gs&&<RewardScreen gs={gs} pool={rewardPool} onPick={pickReward} onSkip={skipReward}/>}
      {screen==='rest'       &&gs&&<RestScreen   gs={gs} onDone={function(ng){setGs(ng);setScreen(ng.devMode?'devHub':'map');}}/>}
      {screen==='shop'       &&gs&&<ShopScreen   gs={gs} onDone={function(ng){setGs(ng);setScreen(ng.devMode?'devHub':'map');}}/>}
      {screen==='event'      &&gs&&<EventScreen  gs={gs} onDone={function(ng){setGs(ng);setScreen(ng.devMode?'devHub':'map');}}/>}
      {screen==='victory'    &&gs&&<VictoryScreen gs={gs} onRestart={startRun}/>}
      {screen==='death'      &&gs&&<DeathScreen   gs={gs} onRestart={startRun}/>}
    </div>
  );
}

// ─── Combat Screen ────────────────────────────────────────────────────────────
function CombatScreen(props){
  var gs=props.gs, onPlay=props.onPlay, onEndTurn=props.onEndTurn, onQuit=props.onQuit, onDevAction=props.onDevAction;

  var p1=useState(false); var paused=p1[0],setPaused=p1[1];
  var p2=useState(false); var showDraw=p2[0],setShowDraw=p2[1];
  var p3=useState(false); var showDiscard=p3[0],setShowDiscard=p3[1];
  var p4=useState(false); var showExhaust=p4[0],setShowExhaust=p4[1];

  var player=gs.player, enemy=gs.enemy, hand=gs.hand, energy=gs.energy;
  var combatLog=gs.combatLog||[], heat=gs.heat||0, powers=gs.powers||[];
  var deck=gs.deck, discard=gs.discard, exhausted=gs.exhausted||[], round=gs.round;

  var sortedDeck=deck.slice().sort(function(a,b){
    var ca=CARDS[a],cb=CARDS[b];
    if(!ca||!cb) return 0;
    return ca.name.localeCompare(cb.name);
  });

  useEffect(function(){
    function onKey(e){
      if(paused||showDraw||showDiscard||showExhaust) return;
      var n=parseInt(e.key);
      if(n>=1&&n<=8){onPlay(n-1);return;}
      if(e.key==='Enter'){onEndTurn();return;}
    }
    window.addEventListener('keydown',onKey);
    return function(){window.removeEventListener('keydown',onKey);};
  },[paused,showDraw,showDiscard,showExhaust,gs]);

  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#08080f'}}>
      {paused&&gs.devMode&&<DevPauseMenu gs={gs} onDevAction={onDevAction} onResume={function(){setPaused(false);}} onQuit={onQuit}/>}
      {paused&&!gs.devMode&&<PauseMenu gs={gs} onResume={function(){setPaused(false);}} onQuit={onQuit}/>}
      {showDraw&&<CardPileViewer title="Draw Pile" cards={sortedDeck} onClose={function(){setShowDraw(false);}} note="Shown alphabetically — draw order is hidden"/>}
      {showDiscard&&<CardPileViewer title="Discard Pile" cards={discard} onClose={function(){setShowDiscard(false);}}/>}
      {showExhaust&&<CardPileViewer title="Exhausted" cards={exhausted} onClose={function(){setShowExhaust(false);}} note="These cards return to your deck next combat"/>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 28px',borderBottom:'1px solid #111',background:'#0a0a12'}}>
        <span style={{fontSize:'13px',color:'#cc44ff',letterSpacing:'3px'}}>◈ PROJECT NEON</span>
        <span style={{fontSize:'12px',color:'#555',letterSpacing:'2px'}}>ROUND {round}</span>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          {heat>0&&<span style={{fontSize:'12px',color:'#ff6644'}}>🔥 HEAT {heat}</span>}
          <button onClick={function(){setPaused(true);}} style={{background:'transparent',border:'1px solid #2a2a3a',borderRadius:'5px',color:'#555',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',padding:'4px 10px'}}>⏸ PAUSE</button>
        </div>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'20px 28px',gap:'16px',maxWidth:'800px',width:'100%',margin:'0 auto'}}>

        <div style={{background:'#0d0d1a',border:'1px solid '+(enemy.isBoss?'#ff222244':enemy.isElite?'#ff884444':'#1a1a2a'),borderRadius:'12px',padding:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:'18px',fontWeight:'bold',color:enemy.isBoss?'#ff4444':enemy.isElite?'#ff8844':'#cc66ff',marginBottom:'10px'}}>{enemy.name}</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {(enemy.block||0)>0    &&<Badge color='#4488ff'>🛡 {enemy.block} Block</Badge>}
                {(enemy.poison||0)>0   &&<Badge color='#44cc88'>☣ {enemy.poison} Poison</Badge>}
                {(enemy.bleed||0)>0    &&<Badge color='#ff4488'>🩸 {enemy.bleed} Bleed</Badge>}
                {(enemy.strength||0)>0 &&<Badge color='#eda100'>💪 {enemy.strength} Str</Badge>}
              </div>
            </div>
            <IntentDisplay intent={enemy.currentIntent}/>
          </div>
          <Bar val={enemy.hp} max={enemy.maxHp} color={enemy.isBoss?'#ff2222':'#cc44ff'} h='10px'/>
          <div style={{fontSize:'12px',color:'#ff6666',marginTop:'8px'}}>{enemy.hp} / {enemy.maxHp} HP</div>
        </div>

        <div style={{background:'#0a0a14',border:'1px solid #111',borderRadius:'10px',padding:'12px 16px',minHeight:'72px'}}>
          {combatLog.length===0&&<div style={{fontSize:'11px',color:'#2a2a3a',fontStyle:'italic'}}>Combat log will appear here...</div>}
          {combatLog.slice(0,5).map(function(l,i){
            return <div key={i} style={{fontSize:'12px',color:i===0?'#ccc':'#444',marginBottom:'3px',lineHeight:'1.5'}}>{l}</div>;
          })}
        </div>

        <div style={{background:'#0a0a14',border:'1px solid #1a2a3a',borderRadius:'12px',padding:'18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <span style={{fontSize:'15px',color:'#88aaff',fontWeight:'bold'}}>Runner</span>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'flex-end'}}>
              {(player.block||0)>0  &&<Badge color='#4488ff'>🛡 {player.block} Block</Badge>}
              {(player.poison||0)>0 &&<Badge color='#44cc88'>☣ {player.poison} Poison</Badge>}
              {powers.map(function(pid){return <Badge key={pid} color='#cc44ff'>◈ {CARDS[pid]?CARDS[pid].name:pid}</Badge>;})}
            </div>
          </div>
          <Bar val={player.hp} max={player.maxHp} color='#2266ff' h='10px'/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginTop:'10px'}}>
            <span style={{color:'#ff5555'}}>❤ {player.hp} / {player.maxHp}</span>
            <span style={{color:'#ffdd44'}}>⚡ {energy} Energy</span>
          </div>
        </div>

        <CyberwareStrip cybernetics={equippedIds(gs)}/>

        <div>
          <SectionLabel>Hand — click or press [1]–[8] to play</SectionLabel>
          <div style={{display:'flex',flexWrap:'wrap',gap:'12px',justifyContent:'center',minHeight:'120px'}}>
            {hand.map(function(cardId,i){
              var c=CARDS[cardId]; if(!c) return null;
              var canPlay=energy>=c.cost;
              var col=TYPE_COLOR[c.type]||'#888';
              return(
                <button key={i} onClick={function(){onPlay(i);}} style={{width:'128px',minHeight:'120px',padding:'12px',background:canPlay?'#0f0a1a':'#09090f',border:'1px solid '+(canPlay?col:'#1a1a1a'),borderRadius:'10px',color:canPlay?'#fff':'#444',cursor:canPlay?'pointer':'not-allowed',display:'flex',flexDirection:'column',gap:'6px',textAlign:'left',boxShadow:canPlay?'0 0 12px '+col+'22':'none',position:'relative'}}>
                  <span style={{position:'absolute',top:'6px',right:'8px',fontSize:'9px',color:'#333'}}>[{i+1}]</span>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'10px',color:canPlay?col:'#333',textTransform:'uppercase',letterSpacing:'1px'}}>{c.type}</span>
                    <span style={{fontSize:'14px',color:canPlay?'#ffdd44':'#333',fontWeight:'bold'}}>{c.cost}</span>
                  </div>
                  <div style={{fontWeight:'bold',fontSize:'13px',lineHeight:'1.3'}}>{c.name}</div>
                  <div style={{fontSize:'10px',color:'#777',lineHeight:'1.5',flex:1}}>{c.desc}</div>
                </button>
              );
            })}
            {hand.length===0&&<div style={{color:'#2a2a3a',fontSize:'13px',alignSelf:'center',fontStyle:'italic'}}>No cards in hand</div>}
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'4px'}}>
          <div style={{fontSize:'11px',display:'flex',gap:'16px',alignItems:'center'}}>
            <button onClick={function(){setShowDraw(true);}} style={{background:'transparent',border:'none',fontFamily:'monospace',fontSize:'11px',color:deck.length>0?'#4a6a7a':'#2a2a3a',cursor:deck.length>0?'pointer':'default',padding:0,textDecoration:deck.length>0?'underline':'none'}}>
              Draw: {deck.length}
            </button>
            <button onClick={function(){setShowDiscard(true);}} style={{background:'transparent',border:'none',fontFamily:'monospace',fontSize:'11px',color:discard.length>0?'#4a6a7a':'#2a2a3a',cursor:discard.length>0?'pointer':'default',padding:0,textDecoration:discard.length>0?'underline':'none'}}>
              Discard: {discard.length}
            </button>
            <button onClick={function(){setShowExhaust(true);}} style={{background:'transparent',border:'none',fontFamily:'monospace',fontSize:'11px',color:exhausted.length>0?'#6a3a6a':'#2a2a3a',cursor:exhausted.length>0?'pointer':'default',padding:0,textDecoration:exhausted.length>0?'underline':'none'}}>
              Exhausted: {exhausted.length}
            </button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'10px',color:'#2a2a3a'}}>[Enter]</span>
            <Btn color='#cc44ff' onClick={onEndTurn}>End Turn ⟶</Btn>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Title / Library / How To Play ───────────────────────────────────────────
function TitleScreen(props){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'32px',position:'relative'}}>
      <div style={{position:'absolute',bottom:'14px',right:'18px',fontSize:'11px',color:'#333',letterSpacing:'1px'}}>v{GAME_VERSION}</div>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'11px',letterSpacing:'8px',color:'#6622aa',marginBottom:'10px'}}>PROJECT</div>
        <div style={{fontSize:'64px',fontWeight:'bold',color:'#cc44ff',letterSpacing:'6px',textShadow:'0 0 60px #8800ff55'}}>NEON</div>
        <div style={{fontSize:'12px',color:'#444',marginTop:'10px',letterSpacing:'3px'}}>CYBERPUNK ROGUELITE DECKBUILDER</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'14px',alignItems:'center'}}>
        <Btn color='#cc44ff' onClick={props.onStart}>▶  Start Game</Btn>
        <Btn color='#4488cc' onClick={props.onLibrary}>📚  Card Library</Btn>
        <Btn color='#666'    onClick={props.onHowTo}>?  How To Play</Btn>
        <Btn color='#333'    onClick={props.onDeveloper}>🛠  Developer</Btn>
      </div>
      <div style={{fontSize:'11px',color:'#2a2a3a',letterSpacing:'1px'}}>Build a deck · Install cybernetics · Survive the megacity</div>
    </div>
  );
}

// Secret entry point for Dev Mode — gated behind a typed code rather than a visible toggle,
// so it never risks being mistaken for a normal menu option by a regular player.
function DevGateModal(props){
  var onSubmit=props.onSubmit, onCancel=props.onCancel;
  var vs=useState(''); var val=vs[0],setVal=vs[1];
  var es=useState(false); var err=es[0],setErr=es[1];
  function attempt(){
    var ok=onSubmit(val);
    if(!ok){ setErr(true); setVal(''); }
  }
  return(
    <div onClick={onCancel} style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:250}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:'#0d0d18',border:'1px solid #2a1a3a',borderRadius:'14px',width:'360px',padding:'26px',boxShadow:'0 0 40px #00000099'}}>
        <div style={{fontSize:'11px',color:'#444',letterSpacing:'2px',marginBottom:'6px'}}>RESTRICTED ACCESS</div>
        <div style={{fontSize:'17px',fontWeight:'bold',color:'#cc44ff',marginBottom:'18px'}}>Enter Developer Code</div>
        <input
          type="password"
          autoFocus
          value={val}
          onChange={function(e){setVal(e.target.value);setErr(false);}}
          onKeyDown={function(e){if(e.key==='Enter') attempt();}}
          style={{width:'100%',padding:'10px 12px',background:'#08080f',border:'1px solid '+(err?'#ff4444':'#2a2a3a'),borderRadius:'6px',color:'#fff',fontFamily:'monospace',fontSize:'13px',marginBottom:'12px',boxSizing:'border-box'}}
          placeholder="Code"
        />
        {err&&<div style={{fontSize:'11px',color:'#ff4444',marginBottom:'12px'}}>Incorrect code.</div>}
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
          <Btn color='#444' onClick={onCancel} small>Cancel</Btn>
          <Btn color='#cc44ff' onClick={attempt} small>Enter</Btn>
        </div>
      </div>
    </div>
  );
}

function CardLibraryScreen(props){
  var fs=useState('all'); var filter=fs[0],setFilter=fs[1];
  var types=['all','attack','skill','power'];
  var cards=Object.values(CARDS).filter(function(c){return filter==='all'||c.type===filter;});
  return(
    <div style={{padding:'32px',maxWidth:'820px',margin:'0 auto',minHeight:'100vh'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px'}}>
        <div><SectionLabel>Card Library</SectionLabel><div style={{fontSize:'24px',fontWeight:'bold'}}>All Cards ({Object.keys(CARDS).length})</div></div>
        <Btn color='#555' onClick={props.onBack}>← Back</Btn>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'28px'}}>
        {types.map(function(t){
          var col=TYPE_COLOR[t]||'#666';
          return <button key={t} onClick={function(){setFilter(t);}} style={{padding:'7px 18px',borderRadius:'6px',fontFamily:'monospace',fontSize:'12px',cursor:'pointer',background:filter===t?(t==='all'?'#2a2a3a':col+'22'):'transparent',border:'1px solid '+(filter===t?(t==='all'?'#555':col):'#2a2a3a'),color:filter===t?(t==='all'?'#fff':col):'#555',textTransform:'uppercase',letterSpacing:'1px'}}>{t}</button>;
        })}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:'14px'}}>
        {cards.map(function(c){
          var col=TYPE_COLOR[c.type]||'#888';
          return(
            <div key={c.id} style={{width:'168px',minHeight:'160px',padding:'16px',background:'#0f0a1a',border:'1px solid '+col+'44',borderRadius:'12px',display:'flex',flexDirection:'column',gap:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'10px',color:col,textTransform:'uppercase',letterSpacing:'1px'}}>{c.type}</span>
                <span style={{fontSize:'13px',color:'#ffdd44',fontWeight:'bold'}}>{c.cost}⚡</span>
              </div>
              <div style={{fontWeight:'bold',fontSize:'14px',color:'#fff'}}>{c.name}</div>
              <div style={{fontSize:'10px',color:'#888',lineHeight:'1.6',flex:1}}>{c.desc}</div>
              <div style={{fontSize:'10px',color:RARITY_COLOR[c.rarity],textTransform:'uppercase',letterSpacing:'1px',marginTop:'auto'}}>{c.rarity}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HowToPlayScreen(props){
  var sections=[
    {title:'The Map',        body:'Navigate a branching megacity map spanning 15 floors. Combat nodes test your deck. Safe Houses restore HP. Black Markets let you upgrade. Data Spikes offer risky opportunities. Paths are fixed and visible from the start — plan your route.'},
    {title:'Combat',         body:'Each turn draw 5 cards and get 3 Energy. Play cards by spending Energy. End your turn to let the enemy act. Plan around the enemy intent shown above their health bar.'},
    {title:'Block',          body:'Block absorbs incoming damage but resets to zero at the start of each of your turns. Build block before the enemy attacks to protect your HP.'},
    {title:'Status Effects', body:'Poison deals damage each turn then decreases by 1. Bleed deals damage every turn with no decrease. Strength permanently increases enemy attack damage.'},
    {title:'Your Deck',      body:'Start with 8 cards, hand capped at 8. After each combat choose one of three to add. Shops sell more. Safe Houses let you remove weak cards.'},
    {title:'Cybernetics',    body:'Six body slots — Arms, Legs, Heart, Lungs, Core, Head — each holding one implant, with one extra slot per body part in storage. Choose your starting build before the run, find more from CyberPsychos and shops, and rearrange freely at Safe Houses.'},
    {title:'Powers',         body:'Power cards activate a persistent effect and exhaust for the rest of combat. They return to your deck next fight. Multiple copies stack their effects.'},
    {title:'Enemies',        body:'CyberPsychos hit hard, shift tactics at 50% HP, and drop cyberware when defeated. The Arasaka Commander has three escalating phases — plan ahead before engaging.'},
  ];
  return(
    <div style={{padding:'32px',maxWidth:'640px',margin:'0 auto',minHeight:'100vh'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px'}}>
        <div><SectionLabel>How To Play</SectionLabel><div style={{fontSize:'24px',fontWeight:'bold'}}>Runner Handbook</div></div>
        <Btn color='#555' onClick={props.onBack}>← Back</Btn>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        {sections.map(function(sec,i){
          return(
            <div key={i} style={{padding:'18px 20px',background:'#0d0d18',border:'1px solid #1a1a28',borderRadius:'10px'}}>
              <div style={{fontSize:'13px',fontWeight:'bold',marginBottom:'8px',color:'#cc44ff'}}>{sec.title}</div>
              <div style={{fontSize:'12px',color:'#888',lineHeight:'1.9'}}>{sec.body}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loadout Screen (pre-run cyberware purchase) ──────────────────────────────
function LoadoutScreen(props){
  var ss=useState(props.gs); var s=ss[0],setS=ss[1];

  function buy(c){
    if(s.credits<c.cost) return;
    var res=acquireCyber(Object.assign({},s,{credits:s.credits-c.cost}), c.id);
    setS(res.gs);
  }

  return(
    <div style={{padding:'36px',maxWidth:'760px',margin:'0 auto',minHeight:'100vh'}}>
      <SectionLabel>Pre-Run Loadout</SectionLabel>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
        <div style={{fontSize:'26px',fontWeight:'bold'}}>Choose Your Build</div>
        <div style={{fontSize:'18px',color:'#eda100',fontWeight:'bold'}}>¢ {s.credits}</div>
      </div>
      <div style={{fontSize:'12px',color:'#555',marginBottom:'28px'}}>
        Spend your starting credits on cyberware before jacking in. Whatever's left carries into the run.
      </div>

      <div style={{display:'flex',gap:'14px',flexWrap:'wrap',marginBottom:'32px'}}>
        {CYBERNETICS.filter(function(c){return (c.sources||[]).indexOf('shop')!==-1;}).map(function(c){
          var owned=isEquipped(s,c.id);
          var canBuy=!owned&&s.credits>=c.cost;
          return(
            <div key={c.id} style={{background:'#0d0a1a',border:'1px solid '+(owned?'#1baf7a66':canBuy?'#6622aa44':'#1a1a28'),borderRadius:'10px',padding:'16px',width:'175px',display:'flex',flexDirection:'column',gap:'8px',opacity:owned?0.7:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'24px'}}>{c.icon}</span>
                <span style={{fontSize:'9px',color:'#8844cc',letterSpacing:'1px'}}>{SLOT_ICON[c.slot]} {SLOT_LABEL[c.slot].toUpperCase()}</span>
              </div>
              <div style={{fontSize:'13px',fontWeight:'bold',color:owned?'#1baf7a':'#fff'}}>{c.name}</div>
              <div style={{fontSize:'11px',color:'#888',lineHeight:'1.6',flex:1}}>{c.desc}</div>
              {owned
                ? <div style={{fontSize:'11px',color:'#1baf7a',textAlign:'center'}}>✓ Equipped</div>
                : <Btn color={canBuy?'#8844cc':'#333'} onClick={function(){buy(c);}} small disabled={!canBuy}>Equip ¢{c.cost}</Btn>
              }
            </div>
          );
        })}
      </div>

      <Btn color='#cc44ff' onClick={function(){props.onDone(s);}}>Begin Run →</Btn>
    </div>
  );
}

// ─── Map Screen ───────────────────────────────────────────────────────────────
function MapScreen(props){
  var gs=props.gs, onNode=props.onNode, onQuit=props.onQuit;
  var ps=useState(false); var paused=ps[0],setPaused=ps[1];

  var mapData=gs.mapData;
  var curRow=gs.mapRow;
  var curCol=gs.mapCol;

  function getReachable(){
    if(curRow===-1) return [{row:0,col:0},{row:0,col:1},{row:0,col:2}];
    if(curRow===MAP_ROWS) return [];
    var conns=mapData.connections[curRow];
    if(!conns||!conns[curCol]) return [];
    return conns[curCol].map(function(c){return {row:curRow+1,col:c};});
  }
  var reachable=getReachable();
  function isReachable(row,col){ return reachable.some(function(n){return n.row===row&&n.col===col;}); }
  function isVisited(row,col){ return row<curRow||(row===curRow&&col===curCol); }
  function isCurrent(row,col){ return row===curRow&&col===curCol; }

  var NODE_W=90, NODE_H=64, ROW_H=90, COL_W=130;
  var CANVAS_W=COL_W*MAP_COLS;
  var CANVAS_H=ROW_H*(MAP_ROWS+1)+NODE_H;

  function nodeCenter(row,col){
    var displayRow=MAP_ROWS-row;
    var x=row===MAP_ROWS?CANVAS_W/2:COL_W*0.5+col*COL_W;
    var y=displayRow*ROW_H+NODE_H/2;
    return {x:x,y:y};
  }

  var pathSegments=[];
  for(var r=0;r<MAP_ROWS;r++){
    var conns=mapData.connections[r];
    for(var c=0;c<MAP_COLS;c++){
      if(!conns[c]) continue;
      conns[c].forEach(function(tc){
        var from=nodeCenter(r,c), to=nodeCenter(r+1,tc);
        var traveled=isVisited(r,c)&&isVisited(r+1,tc);
        var active=isCurrent(r,c)&&isReachable(r+1,tc);
        pathSegments.push({x1:from.x,y1:from.y,x2:to.x,y2:to.y,traveled:traveled,active:active});
      });
    }
  }

  var allRows=[];
  for(var row=0;row<=MAP_ROWS;row++) allRows.push(row);

  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#08080f'}}>
      {paused&&<PauseMenu gs={gs} onResume={function(){setPaused(false);}} onQuit={onQuit} resumeLabel="Continue"/>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 28px',borderBottom:'1px solid #111',background:'#0a0a12',flexShrink:0}}>
        <span style={{fontSize:'14px',color:'#cc44ff',letterSpacing:'3px',fontWeight:'bold'}}>◈ PROJECT NEON</span>
        <div style={{display:'flex',gap:'24px',alignItems:'center',fontSize:'13px'}}>
          <span style={{color:'#ff5555'}}>❤ {gs.player.hp}/{gs.player.maxHp}</span>
          <span style={{color:'#eda100'}}>¢ {gs.credits}</span>
          <span style={{color:'#555'}}>Floor {gs.floor}</span>
          <button onClick={function(){setPaused(true);}} style={{background:'transparent',border:'1px solid #2a2a3a',borderRadius:'5px',color:'#555',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',padding:'4px 10px'}}>⏸ PAUSE</button>
        </div>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'24px',display:'flex',justifyContent:'center'}}>
        <div style={{position:'relative',width:CANVAS_W+'px',minHeight:CANVAS_H+'px',flexShrink:0}}>
          <svg style={{position:'absolute',top:0,left:0,width:'100%',height:CANVAS_H+'px',pointerEvents:'none',overflow:'visible'}}>
            {pathSegments.map(function(seg,i){
              var col=seg.traveled?'#cc44ff55':seg.active?'#cc44ff':'#1a1a2a';
              var w=seg.active?2:1;
              return <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={col} strokeWidth={w} strokeDasharray={seg.traveled||seg.active?'none':'4 4'}/>;
            })}
          </svg>

          {allRows.map(function(row){
            var isBossRow=row===MAP_ROWS;
            var cols=isBossRow?[1]:[0,1,2];
            return cols.map(function(col){
              var node=isBossRow?{row:MAP_ROWS,col:1,type:'boss'}:mapData.nodes.find(function(n){return n.row===row&&n.col===col;});
              if(!node) return null;
              var center=nodeCenter(row,col);
              var reach=isReachable(row,col);
              var visited=isVisited(row,col);
              var current=isCurrent(row,col);
              var ncolor=NODE_COLOR[node.type]||'#444';
              return(
                <div key={row+'-'+col} onClick={function(){if(reach) onNode(row,col,node.type);}} style={{
                  position:'absolute',left:(center.x-NODE_W/2)+'px',top:(center.y-NODE_H/2)+'px',
                  width:NODE_W+'px',height:NODE_H+'px',borderRadius:'10px',
                  background:current?'#1a0a2a':visited?'#0a0a0f':'#0d0d18',
                  border:'1px solid '+(current?ncolor:reach?ncolor:visited?'#cc44ff33':'#1a1a28'),
                  color:reach||current?'#fff':'#444',cursor:reach?'pointer':'default',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px',
                  boxShadow:reach?'0 0 18px '+ncolor+'44':current?'0 0 10px '+ncolor+'33':'none',
                  opacity:visited&&!current?0.35:reach||current?1:0.45,
                  transition:'all 0.15s',
                }}>
                  <span style={{fontSize:isBossRow?'22px':'18px',filter:reach||current?'none':'grayscale(0.8)'}}>{NODE_ICON[node.type]}</span>
                  <span style={{fontSize:'9px',color:reach||current?ncolor:'#333',letterSpacing:'1px',textTransform:'uppercase'}}>{NODE_LABEL[node.type]}</span>
                  {current&&<span style={{fontSize:'8px',color:'#cc44ff',letterSpacing:'1px'}}>◈ HERE</span>}
                </div>
              );
            });
          })}
        </div>
      </div>

      {equippedIds(gs).length>0&&(
        <div style={{padding:'14px 28px',borderTop:'1px solid #111',background:'#0a0a12',flexShrink:0}}>
          <SectionLabel>Installed Cybernetics</SectionLabel>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {equippedIds(gs).map(function(cid){
              var c=findCyber(cid); if(!c) return null;
              return <span key={cid} style={{fontSize:'12px',background:'#1a0a2a',border:'1px solid #3a1a5a',borderRadius:'6px',padding:'5px 12px',color:'#cc88ff'}}>{c.icon} {c.name}</span>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dev Mode: Picker Modal (reused for Encounter enemy choice & Data Spike event choice) ─────
function DevPickerModal(props){
  var title=props.title, options=props.options, onClose=props.onClose;
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'#000000bb',display:'flex',alignItems:'center',justifyContent:'center',zIndex:220}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:'#0d0d18',border:'1px solid #2a1a3a',borderRadius:'14px',width:'380px',maxHeight:'80vh',display:'flex',flexDirection:'column',padding:'20px',boxShadow:'0 0 40px #00000099',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexShrink:0}}>
          <div style={{fontSize:'14px',fontWeight:'bold',color:'#ccc'}}>{title}</div>
          <Btn color='#444' onClick={onClose} small>✕</Btn>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'10px',overflowY:'auto',paddingRight:'4px'}}>
          {options.map(function(opt,i){
            return(
              <div key={i}>
                <Btn color='#8844cc' onClick={opt.onClick}>{opt.label}</Btn>
                {opt.desc&&<div style={{fontSize:'11px',color:'#777',marginTop:'5px',padding:'0 4px',lineHeight:'1.5'}}>{opt.desc}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Dev Mode: Hub Screen ──────────────────────────────────────────────────────
// Mirrors the six map node types (NODE_ICON/NODE_COLOR/NODE_LABEL) so the tiles are visually
// consistent with the real map, but every tile is instantly reachable — no path/reachability logic.
var DEV_ENEMY_OPTIONS=[
  {key:'corp_grunt',   label:'Corp Grunt'},
  {key:'security_bot', label:'Security Bot'},
  {key:'netrunner',    label:'Netrunner'},
];

function DevHubScreen(props){
  var gs=props.gs, onCombat=props.onCombat, onRest=props.onRest, onShop=props.onShop, onEvent=props.onEvent, onDevAction=props.onDevAction, onQuit=props.onQuit;
  var ps=useState(false); var paused=ps[0],setPaused=ps[1];
  var ep=useState(false); var showEnemyPicker=ep[0],setShowEnemyPicker=ep[1];
  var evp=useState(false); var showEventPicker=evp[0],setShowEventPicker=evp[1];

  var TILES=[
    {type:'combat', action:function(){setShowEnemyPicker(true);}},
    {type:'event',  action:function(){setShowEventPicker(true);}},
    {type:'rest',   action:onRest},
    {type:'elite',  action:function(){onCombat('elite_enforcer');}},
    {type:'shop',   action:onShop},
    {type:'boss',   action:function(){onCombat('arasaka_boss');}},
  ];

  return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#08080f'}}>
      {paused&&<DevPauseMenu gs={gs} onDevAction={onDevAction} onResume={function(){setPaused(false);}} onQuit={onQuit}/>}
      {showEnemyPicker&&(
        <DevPickerModal title="Choose Enemy" onClose={function(){setShowEnemyPicker(false);}} options={DEV_ENEMY_OPTIONS.map(function(o){
          return {label:o.label, onClick:function(){setShowEnemyPicker(false); onCombat(o.key);}};
        })}/>
      )}
      {showEventPicker&&(
        <DevPickerModal title="Choose Data Spike" onClose={function(){setShowEventPicker(false);}} options={EVENTS.map(function(ev){
          return {label:ev.title, desc:ev.desc, onClick:function(){setShowEventPicker(false); onEvent(ev);}};
        })}/>
      )}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 28px',borderBottom:'1px solid #111',background:'#0a0a12',flexShrink:0}}>
        <span style={{fontSize:'14px',color:'#cc44ff',letterSpacing:'3px',fontWeight:'bold'}}>◈ PROJECT NEON</span>
        <div style={{display:'flex',gap:'20px',alignItems:'center',fontSize:'13px'}}>
          <span style={{fontSize:'11px',color:'#ff8844',letterSpacing:'2px',border:'1px solid #ff884466',borderRadius:'5px',padding:'3px 10px'}}>⚠ DEV MODE</span>
          <span style={{color:'#ff5555'}}>❤ {gs.player.hp}/{gs.player.maxHp}</span>
          <span style={{color:'#eda100'}}>¢ {gs.credits}</span>
          <button onClick={function(){setPaused(true);}} style={{background:'transparent',border:'1px solid #2a2a3a',borderRadius:'5px',color:'#555',cursor:'pointer',fontFamily:'monospace',fontSize:'11px',padding:'4px 10px'}}>⏸ PAUSE</button>
        </div>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'28px',padding:'28px'}}>
        <div style={{textAlign:'center'}}>
          <SectionLabel>Developer Hub</SectionLabel>
          <div style={{fontSize:'24px',fontWeight:'bold'}}>Jump To...</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 160px)',gap:'18px'}}>
          {TILES.map(function(tile){
            var col=NODE_COLOR[tile.type];
            return(
              <button key={tile.type} onClick={tile.action} style={{
                height:'120px',borderRadius:'12px',background:'#0d0d18',border:'1px solid '+col+'55',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'10px',
                cursor:'pointer',boxShadow:'0 0 18px '+col+'22',
              }}>
                <span style={{fontSize:'30px'}}>{NODE_ICON[tile.type]}</span>
                <span style={{fontSize:'12px',color:col,letterSpacing:'1px',textTransform:'uppercase'}}>{NODE_LABEL[tile.type]}</span>
              </button>
            );
          })}
        </div>
        <div style={{fontSize:'11px',color:'#333'}}>Use the pause menu above to edit your deck, cyberware, HP, or credits.</div>
      </div>
    </div>
  );
}

// ─── Cyberware Reward Screen (CyberPsycho drop) ───────────────────────────────
function CyberRewardScreen(props){
  var gs=props.gs, onPick=props.onPick, onSkip=props.onSkip;
  var cs=useState(null); var confirmed=cs[0],setConfirmed=cs[1];
  function handlePick(c){ setConfirmed(c); setTimeout(function(){onPick(c.id);},1200); }
  var options=(gs.pendingCyberReward||[]).map(function(id){return findCyber(id);}).filter(Boolean);

  return(
    <div style={{padding:'36px',maxWidth:'640px',margin:'0 auto'}}>
      <SectionLabel>CyberPsycho Down</SectionLabel>
      <div style={{fontSize:'26px',fontWeight:'bold',marginBottom:'6px'}}>Salvage Cyberware</div>
      <div style={{fontSize:'12px',color:'#555',marginBottom:'32px'}}>Choose one piece to take. It will equip automatically if the slot is free, or go into storage otherwise.</div>

      {confirmed&&(
        <div style={{marginBottom:'24px',padding:'14px 20px',background:'#0a1a0a',border:'1px solid #1baf7a55',borderRadius:'10px',display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{fontSize:'22px'}}>✓</span>
          <div>
            <div style={{fontSize:'13px',color:'#1baf7a',fontWeight:'bold'}}>{confirmed.name} salvaged</div>
            <div style={{fontSize:'11px',color:'#555',marginTop:'2px'}}>Continuing...</div>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',justifyContent:'center',marginBottom:'32px',opacity:confirmed?0.4:1,pointerEvents:confirmed?'none':'auto'}}>
        {options.map(function(c){
          return(
            <button key={c.id} onClick={function(){handlePick(c);}} style={{width:'190px',minHeight:'180px',padding:'18px',background:'#0d0a1a',border:'1px solid #6622aa66',borderRadius:'12px',color:'#fff',cursor:'pointer',display:'flex',flexDirection:'column',gap:'10px',textAlign:'left',boxShadow:'0 0 20px #6622aa22'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'28px'}}>{c.icon}</span>
                <span style={{fontSize:'9px',color:'#8844cc',letterSpacing:'1px'}}>{SLOT_ICON[c.slot]} {SLOT_LABEL[c.slot].toUpperCase()}</span>
              </div>
              <div style={{fontWeight:'bold',fontSize:'15px'}}>{c.name}</div>
              <div style={{fontSize:'11px',color:'#888',lineHeight:'1.6',flex:1}}>{c.desc}</div>
            </button>
          );
        })}
      </div>
      {!confirmed&&<Btn color='#444' onClick={onSkip}>Leave it →</Btn>}
    </div>
  );
}

// ─── Reward / Rest / Shop / Event ────────────────────────────────────────────
function RewardScreen(props){
  var gs=props.gs,pool=props.pool,onPick=props.onPick,onSkip=props.onSkip;
  var cs=useState(null); var confirmed=cs[0],setConfirmed=cs[1];
  function handlePick(c){ setConfirmed(c); setTimeout(function(){onPick(c.id);},1200); }
  return(
    <div style={{padding:'36px',maxWidth:'640px',margin:'0 auto'}}>
      <SectionLabel>Combat Complete</SectionLabel>
      <div style={{fontSize:'26px',fontWeight:'bold',marginBottom:'6px'}}>Choose a Card</div>
      <div style={{fontSize:'12px',color:'#555',marginBottom:'32px'}}>Credits added to account. Pick one card to add to your deck.</div>
      {confirmed&&(
        <div style={{marginBottom:'24px',padding:'14px 20px',background:'#0a1a0a',border:'1px solid #1baf7a55',borderRadius:'10px',display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{fontSize:'22px'}}>✓</span>
          <div>
            <div style={{fontSize:'13px',color:'#1baf7a',fontWeight:'bold'}}>{confirmed.name} added to deck</div>
            <div style={{fontSize:'11px',color:'#555',marginTop:'2px'}}>Returning to map...</div>
          </div>
        </div>
      )}
      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',justifyContent:'center',marginBottom:'32px',opacity:confirmed?0.4:1,pointerEvents:confirmed?'none':'auto'}}>
        {pool.map(function(c){
          var col=TYPE_COLOR[c.type]||'#888';
          var rcol=RARITY_COLOR[c.rarity]||'#888';
          return(
            <button key={c.id} onClick={function(){handlePick(c);}} style={{width:'172px',minHeight:'180px',padding:'18px',background:'#0d0a1a',border:'1px solid '+rcol+'66',borderRadius:'12px',color:'#fff',cursor:'pointer',display:'flex',flexDirection:'column',gap:'10px',textAlign:'left',boxShadow:'0 0 20px '+rcol+'22'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'10px',color:rcol,textTransform:'uppercase',letterSpacing:'1px'}}>{c.rarity}</span>
                <span style={{fontSize:'13px',color:'#ffdd44',fontWeight:'bold'}}>{c.cost}⚡</span>
              </div>
              <div style={{fontSize:'10px',color:col,textTransform:'uppercase',letterSpacing:'1px'}}>{c.type}</div>
              <div style={{fontWeight:'bold',fontSize:'15px'}}>{c.name}</div>
              <div style={{fontSize:'11px',color:'#888',lineHeight:'1.6',flex:1}}>{c.desc}</div>
            </button>
          );
        })}
      </div>
      {!confirmed&&<Btn color='#444' onClick={onSkip}>Skip reward →</Btn>}
    </div>
  );
}

function RestScreen(props){
  var ls=useState(props.gs); var s=ls[0],setS=ls[1];
  var ms=useState(''); var msg=ms[0],setMsg=ms[1];
  var ds=useState(false); var done=ds[0],setDone=ds[1];
  var rs=useState(false); var showRemove=rs[0],setShowRemove=rs[1];
  var cs=useState(false); var showCyber=cs[0],setShowCyber=cs[1];

  function heal(){
    if(done) return;
    var hp=Math.min(s.player.maxHp,s.player.hp+Math.floor(s.player.maxHp*0.3));
    setMsg('Healed to '+hp+' HP.'); setDone(true);
    setS(Object.assign({},s,{player:Object.assign({},s.player,{hp:hp})}));
  }

  function handleRemove(entry){
    if(done) return;
    setMsg('Removed '+(CARDS[entry.cardId]?CARDS[entry.cardId].name:entry.cardId)+'.');
    setDone(true);
    setShowRemove(false);
    setS(removeCardEntry(s,entry));
  }

  function handleCyberAction(action,slot){
    if(action==='store') setS(unequipToStorage(s,slot));
    else if(action==='equip') setS(equipFromStorage(s,slot));
    else if(action==='swap') setS(swapSlot(s,slot));
  }

  return(
    <div style={{padding:'36px',maxWidth:'480px',margin:'0 auto'}}>
      <SectionLabel>Safe House</SectionLabel>
      <div style={{fontSize:'26px',fontWeight:'bold',marginBottom:'8px'}}>Take Cover</div>
      <div style={{fontSize:'13px',color:'#555',marginBottom:'32px'}}>Take a moment. You won't get many.</div>
      {msg&&<div style={{fontSize:'13px',color:'#1baf7a',marginBottom:'20px',padding:'12px 16px',background:'#0a1a0f',border:'1px solid #1baf7a33',borderRadius:'8px'}}>{msg}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        <Btn color='#1baf7a' onClick={heal} disabled={done}>Heal (+30% HP)</Btn>
        <Btn color='#4488cc' onClick={function(){ if(!done) setShowRemove(true); }} disabled={done}>Remove a card from deck</Btn>
        <Btn color='#8844cc' onClick={function(){setShowCyber(true);}}>Manage Cyberware</Btn>
        <Btn color='#333'    onClick={function(){props.onDone(s);}}>Continue →</Btn>
      </div>

      {showRemove&&(
        <CardRemoveModal pool={buildCardPool(s)} onRemove={handleRemove} onClose={function(){setShowRemove(false);}}/>
      )}
      {showCyber&&(
        <CyberManageModal gs={s} onAction={handleCyberAction} onClose={function(){setShowCyber(false);}}/>
      )}
    </div>
  );
}

function ShopScreen(props){
  var ss=useState(props.gs); var s=ss[0],setS=ss[1];
  var shopCybers=getEligibleCyber(s,'shop').slice(0,3);

  function buyCyber(c){
    if(s.credits<c.cost) return;
    var res=acquireCyber(Object.assign({},s,{credits:s.credits-c.cost}), c.id);
    setS(res.gs);
  }
  function buyCard(cardId){
    if(s.credits<50) return;
    setS(Object.assign({},s,{credits:s.credits-50,deck:shuffle(s.deck.concat([cardId]))}));
  }
  function sell(slot){
    setS(sellStored(s,slot));
  }

  var storedEntries=SLOTS.filter(function(slot){return s.cyberStorage[slot];});

  return(
    <div style={{padding:'36px',maxWidth:'680px',margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px'}}>
        <div><SectionLabel>Black Market</SectionLabel><div style={{fontSize:'26px',fontWeight:'bold'}}>Shop</div></div>
        <div style={{fontSize:'20px',color:'#eda100',fontWeight:'bold'}}>¢ {s.credits}</div>
      </div>

      <div style={{marginBottom:'28px'}}>
        <SectionLabel>Cybernetics</SectionLabel>
        {shopCybers.length===0&&<div style={{fontSize:'12px',color:'#333',fontStyle:'italic',marginBottom:'12px'}}>Nothing new to offer — your slots are full or you own it all.</div>}
        <div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
          {shopCybers.map(function(c){
            var canBuy=s.credits>=c.cost;
            return(
              <div key={c.id} style={{background:'#0d0a1a',border:'1px solid '+(canBuy?'#6622aa44':'#1a1a28'),borderRadius:'10px',padding:'18px',width:'175px',display:'flex',flexDirection:'column',gap:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'28px'}}>{c.icon}</span>
                  <span style={{fontSize:'9px',color:'#8844cc'}}>{SLOT_ICON[c.slot]} {SLOT_LABEL[c.slot].toUpperCase()}</span>
                </div>
                <div style={{fontSize:'13px',fontWeight:'bold',color:canBuy?'#cc88ff':'#555'}}>{c.name}</div>
                <div style={{fontSize:'11px',color:'#666',lineHeight:'1.6',flex:1}}>{c.desc}</div>
                <Btn color={canBuy?'#8844cc':'#2a2a3a'} onClick={function(){buyCyber(c);}} small disabled={!canBuy}>Buy ¢{c.cost}</Btn>
              </div>
            );
          })}
        </div>
      </div>

      {storedEntries.length>0&&(
        <div style={{marginBottom:'28px'}}>
          <SectionLabel>Sell Stored Cyberware</SectionLabel>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
            {storedEntries.map(function(slot){
              var c=findCyber(s.cyberStorage[slot]);
              if(!c) return null;
              var refund=Math.floor(c.cost*0.5);
              return(
                <div key={slot} style={{background:'#0d0a1a',border:'1px solid #1baf7a44',borderRadius:'10px',padding:'14px',width:'160px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  <span style={{fontSize:'22px'}}>{c.icon}</span>
                  <div style={{fontSize:'12px',fontWeight:'bold',color:'#8fd'}}>{c.name}</div>
                  <div style={{fontSize:'10px',color:'#666'}}>{SLOT_LABEL[slot]}</div>
                  <Btn color='#1baf7a' onClick={function(){sell(slot);}} small>Sell ¢{refund}</Btn>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{marginBottom:'28px'}}>
        <SectionLabel>Cards — ¢50 each</SectionLabel>
        <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
          {s.shopCards.map(function(cardId){
            var c=CARDS[cardId]; if(!c) return null;
            var col=TYPE_COLOR[c.type]||'#888';
            var canBuy=s.credits>=50;
            return(
              <button key={cardId} onClick={function(){buyCard(cardId);}} style={{width:'130px',minHeight:'120px',padding:'12px',background:'#0a0a14',border:'1px solid '+(canBuy?col+'55':'#1a1a28'),borderRadius:'10px',color:canBuy?'#fff':'#444',cursor:canBuy?'pointer':'not-allowed',display:'flex',flexDirection:'column',gap:'6px',textAlign:'left'}}>
                <div style={{fontSize:'10px',color:canBuy?col:'#333',textTransform:'uppercase',letterSpacing:'1px'}}>{c.type}</div>
                <div style={{fontWeight:'bold',fontSize:'13px'}}>{c.name}</div>
                <div style={{fontSize:'10px',color:'#666',lineHeight:'1.4',flex:1}}>{c.desc}</div>
                <div style={{fontSize:'11px',color:'#ffdd44'}}>¢50</div>
              </button>
            );
          })}
        </div>
      </div>
      <Btn color='#444' onClick={function(){props.onDone(s);}}>Leave →</Btn>
    </div>
  );
}

function EventScreen(props){
  var gs=props.gs,onDone=props.onDone,ev=gs.currentEvent;
  var rs=useState(''); var result=rs[0],setResult=rs[1];
  var pk=useState(null); var pickingOpt=pk[0],setPickingOpt=pk[1];
  if(!ev){onDone(gs);return null;}

  function resolve(opt, stateForFn, extraMsg){
    var ng=opt.fn(stateForFn);
    var changed=ng.combatLog!==stateForFn.combatLog;
    var msg=changed?(ng.combatLog[0]||'Done.'):'Nothing happens.';
    setResult(extraMsg?extraMsg+' '+msg:msg);
    setTimeout(function(){onDone(Object.assign({},ng,{currentEvent:null}));},900);
  }

  return(
    <div style={{padding:'36px',maxWidth:'500px',margin:'0 auto'}}>
      <SectionLabel>Data Spike</SectionLabel>
      <div style={{fontSize:'24px',fontWeight:'bold',marginBottom:'10px'}}>{ev.title}</div>
      <div style={{fontSize:'13px',color:'#888',marginBottom:'32px',lineHeight:'1.9',padding:'16px',background:'#0d0d18',border:'1px solid #1a1a28',borderRadius:'10px'}}>{ev.desc}</div>
      {result&&<div style={{fontSize:'13px',color:'#cc44ff',marginBottom:'20px',padding:'12px 16px',background:'#0f0a1a',border:'1px solid #cc44ff33',borderRadius:'8px'}}>{result}</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {ev.options.map(function(opt,i){
          return(
            <Btn key={i} color='#4a3aa7' onClick={function(){
              if(opt.pickCard){ setPickingOpt(opt); return; }
              resolve(opt, gs, null);
            }}>{opt.label}</Btn>
          );
        })}
      </div>
      {pickingOpt&&(
        <CardRemoveModal pool={buildCardPool(gs)} contextLabel="DATA SPIKE" onClose={function(){setPickingOpt(null);}} onRemove={function(entry){
          var removedName=CARDS[entry.cardId]?CARDS[entry.cardId].name:entry.cardId;
          var reducedState=removeCardEntry(gs, entry);
          setPickingOpt(null);
          resolve(pickingOpt, reducedState, 'Removed '+removedName+'.');
        }}/>
      )}
    </div>
  );
}

// ─── Stats / Victory / Death ─────────────────────────────────────────────────
function StatBlock(props){
  var gs=props.gs,s=gs.stats||{};
  var rows=[
    {label:'Floors Reached',   value:gs.floor},
    {label:'Enemies Defeated', value:s.enemiesDefeated||0},
    {label:'Damage Dealt',     value:s.damageDealt||0},
    {label:'Damage Taken',     value:s.damageTaken||0},
    {label:'Cards Played',     value:s.cardsPlayed||0},
    {label:'Credits Earned',   value:'¢'+(s.creditsEarned||0)},
    {label:'Cybernetics',      value:equippedIds(gs).length},
  ];
  return(
    <div style={{background:'#0d0a1a',border:'1px solid #2a1a3a',borderRadius:'12px',padding:'22px',width:'300px'}}>
      <SectionLabel>Run Summary</SectionLabel>
      {rows.map(function(r,i){
        return(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #111',fontSize:'13px'}}>
            <span style={{color:'#555'}}>{r.label}</span>
            <span style={{color:'#ccc',fontWeight:'bold'}}>{r.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function VictoryScreen(props){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'28px',padding:'28px'}}>
      <div style={{fontSize:'11px',color:'#cc44ff',letterSpacing:'5px'}}>MISSION COMPLETE</div>
      <div style={{fontSize:'52px',fontWeight:'bold',color:'#cc44ff',textShadow:'0 0 40px #8800ff66'}}>JACKED OUT</div>
      <div style={{fontSize:'13px',color:'#666',textAlign:'center',maxWidth:'340px',lineHeight:'1.8'}}>The Arasaka Commander is dead. You vanish into the megacity — for now.</div>
      <StatBlock gs={props.gs}/>
      <Btn color='#cc44ff' onClick={props.onRestart}>Run Again →</Btn>
    </div>
  );
}

function DeathScreen(props){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:'28px',padding:'28px'}}>
      <div style={{fontSize:'11px',color:'#ff2244',letterSpacing:'5px'}}>SIGNAL LOST</div>
      <div style={{fontSize:'52px',fontWeight:'bold',color:'#ff2244'}}>FLATLINED</div>
      <div style={{fontSize:'13px',color:'#555'}}>The megacity swallows another runner.</div>
      <StatBlock gs={props.gs}/>
      <Btn color='#cc44ff' onClick={props.onRestart}>Jack In Again →</Btn>
    </div>
  );
}
