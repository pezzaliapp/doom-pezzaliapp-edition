// wasm-glue.js — runner/loader per /doom-pezzaliapp-edition/engine/*
(function () {
  const banner = document.getElementById('banner');
  const canvas = document.getElementById('screen');

  // BASE assoluta per la tua app pubblicata
  const BASE = new URL('https://www.alessandropezzali.it/doom-pezzaliapp-edition/');
  const ENGINE_BASE = new URL('engine/', BASE);

  const show = (t)=>{ if (banner){ banner.hidden = false; banner.textContent = t; } console.log('[engine]', t); };
  const hide = ()=>{ if (banner) banner.hidden = true; };

  function loadScript(url){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = url; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = ()=>reject(new Error('Load failed: '+url));
      document.head.appendChild(s);
    });
  }

  async function startClassic(iwad){
    // Emscripten "classic" (Module globale)
    window.Module = {
      noInitialRun: false,
      canvas,
      print: (t)=>console.log(t),
      printErr: (t)=>console.error(t),
      onAbort: (t)=>show('Motore abortito: '+t),
      locateFile: (p)=> p.endsWith('.wasm')
        ? new URL('engine.wasm', ENGINE_BASE).href
        : p,
      preRun: [(mod)=>{
        try { mod.FS.mkdir('/data'); } catch {}
        if (iwad?.length) mod.FS.writeFile('/data/doom1.wad', iwad);
        mod.arguments = iwad?.length ? ['-iwad','/data/doom1.wad'] : [];
      }],
    };
    show('Carico motore (classic)…');
    await loadScript(new URL('engine.js', ENGINE_BASE).href);
    hide();
  }

  async function startModular(iwad){
    show('Carico motore (modular)…');
    await loadScript(new URL('engine.js', ENGINE_BASE).href);

    const factory =
      window.createDoomModule ||
      window.createModule ||
      (typeof window.Module === 'function' ? window.Module : null);

    if (!factory) throw new Error('Factory modular non trovata (createDoomModule/createModule)');

    const Module = await factory({
      canvas,
      noInitialRun: true,
      print: (t)=>console.log(t),
      printErr: (t)=>console.error(t),
      onAbort: (t)=>show('Motore abortito: '+t),
      locateFile: (p)=> p.endsWith('.wasm')
        ? new URL('engine.wasm', ENGINE_BASE).href
        : p,
      preRun: [(mod)=>{
        try { mod.FS.mkdir('/data'); } catch {}
        if (iwad?.length) mod.FS.writeFile('/data/doom1.wad', iwad);
      }],
    });

    const args = iwad?.length ? ['-iwad','/data/doom1.wad'] : [];
    if (Module.callMain) Module.callMain(args);
    else if (typeof Module._main === 'function') Module._main(args.length, 0);
    hide();
  }

  window.DoomEngineRunner = {
    async start(iwad){
      // Verifica che i file siano raggiungibili (diagnostica chiara in console)
      const wasmURL = new URL('engine.wasm', ENGINE_BASE).href;
      const jsURL   = new URL('engine.js',   ENGINE_BASE).href;
      console.log('[engine] probing', jsURL, wasmURL);
      try {
        // piccolo HEAD per errori CORS/404
        await fetch(wasmURL, { method:'HEAD' });
      } catch (e) {
        show('Impossibile raggiungere engine.wasm: ' + (e.message||e));
        throw e;
      }

      try { await startModular(iwad); }
      catch (e) {
        console.warn('[engine] modular failed:', e);
        show('Modular non rilevato, provo classic…');
        await startClassic(iwad);
      }
    }
  };
})();
