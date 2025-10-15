// wasm-glue.js — robusto + diagnostica a schermo per DoomGeneric/emscripten
(function(){
  const banner = document.getElementById('banner');
  const canvas = document.getElementById('screen');
  const engineBase = new URL('./engine/', location.href);

  function say(t){ if(banner){ banner.hidden=false; banner.textContent=t; } console.log(t); }
  function ok(){ if(banner){ banner.hidden=true; } }
  function loadScript(src){
    return new Promise((res, rej)=>{
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ()=>res();
      s.onerror = ()=>rej(new Error('Load failed: '+src));
      document.head.appendChild(s);
    });
  }

  async function startClassic(iwad){
    window.Module = {
      noInitialRun: false,
      canvas,
      print: (t)=>console.log(t),
      printErr: (t)=>console.error(t),
      onAbort: (t)=>say('Motore abortito: '+t),
      locateFile: (p)=> p.endsWith('.wasm')
        ? new URL('engine.wasm', engineBase).href
        : p,
      preRun: [(mod)=>{
        try{ mod.FS.mkdir('/data'); }catch{}
        if (iwad && iwad.length) mod.FS.writeFile('/data/doom1.wad', iwad);
        mod.arguments = ['-iwad','/data/doom1.wad'];
      }]
    };
    say('Carico motore (classic)…');
    await loadScript(new URL('engine.js', engineBase).href);
    ok();
  }

  async function startModular(iwad){
    say('Carico motore (modular)…');
    await loadScript(new URL('engine.js', engineBase).href);
    const factory =
      window.createDoomModule ||
      window.createModule ||
      (typeof window.Module === 'function' ? window.Module : null);
    if (!factory) throw new Error('Factory modular non trovata');

    const Module = await factory({
      canvas,
      noInitialRun: true,
      print: (t)=>console.log(t),
      printErr: (t)=>console.error(t),
      onAbort: (t)=>say('Motore abortito: '+t),
      locateFile: (p)=> p.endsWith('.wasm')
        ? new URL('engine.wasm', engineBase).href
        : p,
      preRun: [(mod)=>{
        try{ mod.FS.mkdir('/data'); }catch{}
        if (iwad && iwad.length) mod.FS.writeFile('/data/doom1.wad', iwad);
      }]
    });
    const args = ['-iwad','/data/doom1.wad'];
    if (Module.callMain) Module.callMain(args);
    else if (typeof Module._main === 'function') Module._main(args.length, 0);
    ok();
  }

  window.DoomEngineRunner = {
    async start(iwadBytes){
      try { await startModular(iwadBytes); }
      catch(e){
        console.warn(e);
        say('Modular non rilevato ('+(e.message||e)+'), provo classic…');
        await startClassic(iwadBytes);
      }
    }
  };
})();
