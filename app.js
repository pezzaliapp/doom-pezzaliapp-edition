// app.js — loader WAD + touch overlay + start engine
const canvas = document.getElementById('screen');
const wadInput = document.getElementById('wadInput');
const btnShareware = document.getElementById('loadShareware');
const btnStart = document.getElementById('btnStart');
const banner = document.getElementById('banner');
const btnInstall = document.getElementById('btnInstall');

const hasOPFS = !!(navigator.storage && navigator.storage.getDirectory);

async function saveWad(name, bytes){
  if (hasOPFS) {
    const root = await navigator.storage.getDirectory();
    const file = await root.getFileHandle(name, { create:true });
    const w = await file.createWritable();
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
    const file = await root.getFileHandle(name, { create:false });
    const fh = await file.getFile();
    return new Uint8Array(await fh.arrayBuffer());
  } else {
    const cache = await caches.open('doom-data');
    const resp = await cache.match(name);
    if (!resp) throw new Error('WAD non trovato');
    return new Uint8Array(await (await resp.blob()).arrayBuffer());
  }
}

function showWarn(msg){ banner.textContent = msg; banner.hidden = false; }
function hideWarn(){ banner.hidden = true; }

let iwadBuffer = null;

async function startGame(){
  hideWarn();
  if (!iwadBuffer){ showWarn('Carica prima un file WAD (doom1.wad o Freedoom).'); return; }
  if (!window.DoomEngineRunner){
    showWarn('Motore WASM non presente. Copia engine/engine.js e engine.wasm in /engine/');
    return;
  }
  try{
    await window.DoomEngineRunner.start(iwadBuffer);
  }catch(e){
    showWarn('Errore avvio engine: ' + (e.message || e));
  }
}

wadInput.addEventListener('change', async e=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = file.name.endsWith('.wad') ? file.name : 'doom1.wad';
  await saveWad(name, bytes);
  iwadBuffer = await loadWad(name);
  btnStart.disabled = false;
  hideWarn();
});
btnShareware.addEventListener('click', ()=> wadInput.click());
btnStart.addEventListener('click', startGame);

// PWA install
let deferred;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; btnInstall.hidden = false; });
btnInstall?.addEventListener('click', async ()=>{
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  btnInstall.hidden = true;
});

// Touch overlay -> sintetizza key events
const stickL = document.getElementById('stickL');
const nub = stickL.querySelector('.nub');
let stickActive = false, center = {x:0,y:0}, currentVec = {x:0,y:0};

function synthKey(code, type='keydown'){
  const ev = new KeyboardEvent(type, { code, key: code, bubbles:true });
  document.dispatchEvent(ev);
}
function updateDirections(vec){
  const dead = 10, x = vec.x, y = vec.y;
  ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].forEach(k=>synthKey(k,'keyup'));
  if (y < -dead){ synthKey('ArrowUp'); synthKey('KeyW'); }
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
  nub.style.transform = `translate(${cx}px, ${cy}px)`;
  currentVec = { x: cx, y: cy }; updateDirections(currentVec);
  e.preventDefault();
}
function handleEnd(){
  stickActive = false; nub.style.transform = 'translate(-50%,-50%)';
  currentVec = {x:0,y:0}; updateDirections(currentVec);
}
['touchstart','mousedown'].forEach(ev=> stickL.addEventListener(ev, handleStart, {passive:false}));
['touchmove','mousemove'].forEach(ev=> window.addEventListener(ev, handleMove, {passive:false}));
['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=> window.addEventListener(ev, handleEnd));

document.querySelectorAll('.btn').forEach(b=>{
  const code = b.dataset.key;
  b.addEventListener('touchstart', e=>{ synthKey(code,'keydown'); e.preventDefault(); });
  b.addEventListener('touchend',   e=>{ synthKey(code,'keyup');   e.preventDefault(); });
  b.addEventListener('mousedown',  e=> synthKey(code,'keydown'));
  b.addEventListener('mouseup',    e=> synthKey(code,'keyup'));
});