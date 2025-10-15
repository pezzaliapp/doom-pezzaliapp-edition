cmake_minimum_required(VERSION 3.10)
project(DoomGenericWASM C)

# Sorgenti del mini-motore di test
set(SOURCES
  doomgeneric.c
  doomgeneric_sdl.c
  doomgeneric_wasm.c
)

# Output: "engine" (Emscripten genererà engine.js + engine.wasm)
add_executable(engine ${SOURCES})

# Opzioni per Emscripten (SDL2 via ports, memoria che cresce, FS attivo)
set_target_properties(engine PROPERTIES
  COMPILE_OPTIONS "-sUSE_SDL=2;-sALLOW_MEMORY_GROWTH=1"
  LINK_FLAGS "-sUSE_SDL=2 -sALLOW_MEMORY_GROWTH=1 -sWASM=1 -sFORCE_FILESYSTEM=1 -sEXIT_RUNTIME=0"
)
