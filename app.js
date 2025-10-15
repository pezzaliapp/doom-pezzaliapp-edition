// app.js — loader WAD + touch overlay + start engine

// ---- DOM refs ----
const canvas       = document.getElementById('screen');
const wadInput     = document.getElementById('wadInput');
const btnShareware = document.getElementById('loadShareware');
const btnStart     = document.getElementById('btnStart');
const banner       = document.getElementById('banner');
const btnInstall   = document.getElementById('btnInstall');

// ---- Helpers banner ----
function showWarn(msg){ if (banner){ banner.hidden = false; banner.textContent = msg; } console.log(msg); }
function hideWarn(){ if (banner) banner.hidden = true; }

// ---- Storage (OPFS -> Cache) ----
const hasOPFS = !!(navigator.storage && navigator.storage.getDirectory);

async function saveWad(name, bytes){
  if (hasOPFS) {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(name, { create:true });
    const w = await fh.createWritable();
    await w.write(bytes);
    await w.close();
  } else {
    const cache = await caches.open('doom-data');
    await cache.put(new Request(name), new Response(new Blob([bytes])));
  }
}
async function loadWad(name){
  if (hasOPFS) {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(name, { create:false });
    const f = await fh.getFile();
    return new Uint8Array(await f.arrayBuffer());
  } else {
    const cache = await caches.open('doom-data');
    const resp = await cache.match(name);
    if (!resp) throw new Error('WAD non trovato');
    return new Uint8Array(await resp.arrayBuffer());
  }
}

// ---- WAD in memoria da avviare ----
let iwadBuffer = null;

// ---- Start Engine ----
async function startGame(){
  hideWarn();

  if (!iwadBuffer){
    showWarn('Carica prima un file WAD (doom1.wad o Freedoom).');
    return;
  }
  if (!window.DoomEngineRunner){
    showWarn('Motore non pronto. Controlla che /engine/engine.js e /engine/engine.wasm esistano e fai Hard Reload.');
    return;
  }
  try{
    showWarn('Avvio motore…');
    await window.DoomEngineRunner.start(iwadBuffer);
    hideWarn();
  }catch(e){
    showWarn('Errore avvio engine: ' + (e?.message || e));
  }
}

// ---- File chooser ----
wadInput?.addEventListener('change', async e=>{
  const file = e.target.files?.[0];
  if (!file) return;
  try{
    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = file.name.toLowerCase().endsWith('.wad') ? file.name : 'doom1.wad';
    await saveWad(name, bytes);
    iwadBuffer = await loadWad(name);
    btnStart.disabled = false;
    hideWarn();
  }catch(err){
    showWarn('Errore lettura WAD: '+(err?.message||err));
  }
});

// ---- Shareware button: scarica un WAD libero ----
btnShareware?.addEventListener('click', async ()=>{
  // 1° tentativo: Freedoom (open source); 2° fallback: Doom1 shareware
  const urls = [
    'https://github.com/freedoom/freedoom/releases/latest/download/freedoom1.wad',
    'https://freedoom.soulsphere.org/freedoom1.wad',
    'https://archive.org/download/doom-shareware/doom1.wad'
  ];
  let ok = false;
  for (const url of urls){
    try{
      showWarn('Scarico WAD: ' + url);
      const res = await fetch(url, { mode:'cors' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const buf = new Uint8Array(await res.arrayBuffer());
      await saveWad('doom1.wad', buf);
      iwadBuffer = await loadWad('doom1.wad');
      btnStart.disabled = false;
      hideWarn();
      ok = true;
      break;
    }catch(e){
      console.warn('Download fallito', url, e);
    }
  }
  if (!ok) showWarn('Impossibile scaricare un WAD shareware. Prova con “Scegli file”.');
});

// ---- Start button ----
btnStart?.addEventListener('click', startGame);

// ---- PWA install ----
let deferred;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferred = e; if (btnInstall) btnInstall.hidden = false;
});
btnInstall?.addEventListener('click', async ()=>{
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice.catch(()=>{});
  deferred = null;
  if (btnInstall) btnInstall.hidden = true;
});

// ---- Touch overlay → sintetizza tasti ----
const stickL = document.getElementById('stickL');
const nub = stickL?.querySelector('.nub');
let stickActive = false, center = {x:0,y:0};

function synthKey(code, type='keydown'){
  const ev = new KeyboardEvent(type, { code, key: code, bubbles:true });
  document.dispatchEvent(ev);
}
function updateDirections(vec){
  const dead = 10, {x, y} = vec;
  ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].forEach(k=>synthKey(k,'keyup'));
  if (y < -dead){ synthKey('ArrowUp');  synthKey('KeyW'); }
  if (y >  dead){ synthKey('ArrowDown'); synthKey('KeyS'); }
  if (x < -dead){ synthKey('ArrowLeft'); synthKey('KeyA'); }
  if (x >  dead){ synthKey('ArrowRight'); synthKey('KeyD'); }
}
function handleStart(e){
  const t = (e.touches? e.touches[0]: e);
  const rect = stickL.getBoundingClientRect();
  center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  stickActive = true;
  handleMove(e);
}
function handleMove(e){
  if (!stickActive) return;
  const t = (e.touches? e.touches[0]: e);
  const dx = t.clientX - center.x, dy = t.clientY - center.y;
  const max = 52;
  const cx = Math.max(-max, Math.min(max, dx));
  const cy = Math.max(-max, Math.min(max, dy));
  if (nub) nub.style.transform = `translate(${cx}px, ${cy}px)`;
  updateDirections({ x: cx, y: cy });
  e.preventDefault();
}
function handleEnd(){
  stickActive = false;
  if (nub) nub.style.transform = 'translate(-50%,-50%)';
  updateDirections({x:0,y:0});
}
if (stickL){
  ['touchstart','mousedown'].forEach(ev=> stickL.addEventListener(ev, handleStart, {passive:false}));
  ['touchmove','mousemove'].forEach(ev=> window.addEventListener(ev, handleMove, {passive:false}));
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=> window.addEventListener(ev, handleEnd));
}

// Bottoni azione (A/B ecc.) con data-key
document.querySelectorAll('.btn[data-key]').forEach(b=>{
  const code = b.dataset.key;
  b.addEventListener('touchstart', e=>{ synthKey(code,'keydown'); e.preventDefault(); });
  b.addEventListener('touchend',   e=>{ synthKey(code,'keyup');   e.preventDefault(); });
  b.addEventListener('mousedown',  ()=> synthKey(code,'keydown'));
  b.addEventListener('mouseup',    ()=> synthKey(code,'keyup'));
});

// Messaggio iniziale
showWarn('Pronto. Carica un WAD o premi “Usa WAD shareware”, poi Avvia.');
