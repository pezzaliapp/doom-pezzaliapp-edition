// wasm-glue.js — loader compatibile con script "classico" Emscripten
(function(){
  function loadClassicScript(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ()=>resolve(); s.onerror = e=>reject(e);
      document.head.appendChild(s);
    });
  }

  const Runner = {
    engineLoaded: false,
    ModuleFactory: null,
    async ensureEngine(){
      if (this.engineLoaded) return true;
      try{
        await loadClassicScript('./engine/engine.js');
        if (typeof window.createDoomModule !== 'function' && typeof window.Module === 'undefined') {
          throw new Error('Engine JS caricato ma non espone createDoomModule/Module');
        }
        this.ModuleFactory = window.createDoomModule || (opts => (window.Module || opts));
        this.engineLoaded = true;
        return true;
      }catch(err){
        console.warn('Engine non trovato:', err);
        return false;
      }
    },
    async start(iwadBytes){
      const ok = await this.ensureEngine();
      if (!ok) throw new Error('Motore WASM mancante: copia engine/engine.js e engine.wasm');

      const canvas = document.getElementById('screen');
      const Module = await this.ModuleFactory({
        canvas,
        print: (t)=>console.log(t),
        printErr: (t)=>console.error(t),
        noInitialRun: true,
        onAbort: (r)=>console.error('Abort:', r),
        locateFile: (path) => path.endsWith('.wasm') ? './engine/engine.wasm' : path,
        preRun: [(mod)=>{
          if (iwadBytes && iwadBytes.length){
            try{ mod.FS.mkdir('/data'); }catch{}
            mod.FS.writeFile('/data/doom1.wad', iwadBytes);
          }
        }]
      });

      const args = ['/bin/doom','-iwad','/data/doom1.wad'];
      if (Module.callMain) Module.callMain(args);
      else if (typeof Module._main === 'function') Module._main(args.length, 0);
    }
  };

  window.DoomEngineRunner = Runner;
})();