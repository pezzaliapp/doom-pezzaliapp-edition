# DOOM PezzaliAPP Edition — PWA (GitHub Pages ready)

PWA pronta all'uso con:
- **overlay touch** (mobile),
- **cache app-shell**,
- **loader WAD** con salvataggio OPFS/IndexedDB,
- **mock engine** per test immediato,
- **workflow GitHub Actions** per auto-build del motore reale (PrBoom wasm).

## Come pubblicare su GitHub Pages
1. Crea repo vuoto e carica TUTTI i file di questa cartella.
2. Settings → **Pages** → Deploy from branch → `main` / root.
3. Apri `https://TUOUSERNAME.github.io/NOME-REPO/`

## Provalo subito (mock)
- La cartella `/engine` contiene un **motore fittizio** (non DOOM reale) per confermare che la PWA funziona.
- Clicca **Carica WAD** e seleziona `doom1.wad` (shareware) o `freedoom1.wad` → **Avvia**. Vedrai un messaggio nel canvas che indica quanti byte sono stati caricati.

## Passa al motore reale (PrBoom WebAssembly)
Tre opzioni:
1. **Manuale**: compila PrBoom wasm in locale e sostituisci `/engine/engine.js` e `/engine/engine.wasm`.
2. **Automatica (consigliata)**: usa il workflow incluso `.github/workflows/build-engine.yml`:
   - Vai su **Actions** → **Build DOOM Engine (WASM)** → **Run workflow**.
   - Al termine, il job committa in `main` i nuovi `engine.js/engine.wasm` nella cartella `/engine`.
3. **Chocolate Doom wasm**: identico flusso, con repo diverso.

> Nota licenze: il **motore** è open-source GPL (PrBoom/Chocolate Doom). I **dati** (WAD/PAK) **non** si redistribuiscono: usa `doom1.wad` shareware o **Freedoom**.

## Troubleshooting
- **Schermo fermo / engine mancante** → assicurati che i due file `/engine/engine.js` e `/engine/engine.wasm` esistano e siano accessibili.
- **Cache vecchia** → modifica `CACHE` in `sw.js` e ricarica.
- **CORS/wasm** → Pages serve HTTPS, ok. In locale usa `python3 -m http.server`.

## Build locale rapida (facoltativa)
```bash
# Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest && source ./emsdk_env.sh

# PrBoom+
git clone https://github.com/coelckers/prboom-plus.git
cd prboom-plus && mkdir build-web && cd build-web
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release -DOPENGL=OFF -DSDL2=ON
emmake make -j

# Copia output (rinomina se necessario)
cp path/to/output.js   ../DEST/engine/engine.js
cp path/to/output.wasm ../DEST/engine/engine.wasm
```

Buon divertimento! 🎮