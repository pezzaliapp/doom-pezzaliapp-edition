// wasm-glue.js — compatibile con Emscripten "modularized" e "classic autoboot"
(function(){
  function loadClassicScript(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = ()=>resolve();
      s.onerror = e=>reject(e);
      document.head.appendChild(s);
    });
  }

  async function startClassic(iwadBytes){
    // PREP: definiamo Module PRIMA di caricare engine.js
    const canvas = document.getElementById('screen');

    // Emscripten autoboot userà questi campi
    window.Module = {
      noInitialRun: false,                   // lascia che parta da solo
      canvas,
      print: (t)=>console.log(t),
      printErr: (t)=>console.error(t),
      locateFile: (path) => path.endsWith('.wasm') ? './engine/engine.wasm' : path,
      preRun: [(mod)=>{
        try{ mod.FS.mkdir('/data'); }catch{}
        if (iwadBytes && iwadBytes.length){
          mod.FS.writeFile('/data/doom1.wad', iwadBytes);
        }
        // Passiamo gli argomenti PRIMA dell'avvio
        mod.arguments = ['-iwad','/data/doom1.wad'];
      }]
    };

    await loadClassicScript('./engine/engine.js'); // questo farà partire il main() da solo
  }

  async function startModular(iwadBytes){
    // Carichiamo lo script che espone createDoomModule
    await loadClassicScript('./engine/engine.js');
    if (typeof window.createDoomModule !== 'function') {
      throw new Error('createDoomModule non trovato (build non modularizzata?)');
    }
    const canvas = document.getElementById('screen');
    const Module = await window.createDoomModule({
      canvas,
      print: (t)=>console.log(t),
      printErr: (t)=>console.error(t),
      noInitialRun: true,
      locateFile: (path) => path.endsWith('.wasm') ? './engine/engine.wasm' : path,
      preRun: [(mod)=>{
        try{ mod.FS.mkdir('/data'); }catch{}
        if (iwadBytes && iwadBytes.length){
          mod.FS.writeFile('/data/doom1.wad', iwadBytes);
        }
      }]
    });
    const args = ['-iwad','/data/doom1.wad'];
    if (Module.callMain) Module.callMain(args);
    else if (typeof Module._main === 'function') Module._main(args.length, 0);
  }

  const Runner = {
    async start(iwadBytes){
      // Prova prima modular, altrimenti classic autoboot
      try {
        await startModular(iwadBytes);
      } catch (e) {
        console.warn('Modular build non rilevata, passo alla classic:', e.message||e);
        await startClassic(iwadBytes);
      }
    }
  };

  window.DoomEngineRunner = Runner;
})();
