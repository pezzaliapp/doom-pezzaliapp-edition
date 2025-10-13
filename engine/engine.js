// engine.js — MOCK ENGINE (per test) — NON è DOOM reale
(function(){
  function drawText(canvas, lines){
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#9db0d9';
    ctx.font = '18px monospace';
    let y = 36;
    for (const ln of lines){ ctx.fillText(ln, 16, y); y += 26; }
  }
  window.createDoomModule = function(opts){
    const Module = Object.assign({
      canvas: (opts && opts.canvas) || document.createElement('canvas'),
      print: (opts && opts.print) || console.log.bind(console),
      printErr: (opts && opts.printErr) || console.error.bind(console),
      noInitialRun: true,
      FS: { _files:{}, mkdir(){}, writeFile(path, bytes){ this._files[path]=bytes; Module._iwadBytes=bytes; } },
      callMain(argv){
        const size = Module._iwadBytes ? (Module._iwadBytes.byteLength||Module._iwadBytes.length||0) : 0;
        drawText(Module.canvas, [
          'DOOM PezzaliAPP — Mock Engine',
          'Pipeline OK. WAD: ' + (size ? (size+' bytes') : 'nessun file'),
          'Sostituisci /engine con il motore reale (PrBoom/Chocolate).'
        ]);
        Module.print('Mock engine avviato con args: ' + (argv||[]).join(' '));
      }
    }, opts||{});
    try{ if (opts && Array.isArray(opts.preRun)) opts.preRun.forEach(fn=>{ try{ fn(Module); }catch(e){ Module.printErr(e); } }); }catch(e){}
    return Promise.resolve(Module);
  };
})();