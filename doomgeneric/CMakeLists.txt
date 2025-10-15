cmake_minimum_required(VERSION 3.10)
project(DoomGenericWASM C)

# Imposta l’output in formato WebAssembly
set(CMAKE_EXECUTABLE_SUFFIX ".html")

# File sorgenti principali
set(SOURCES
  doomgeneric.c
  doomgeneric_sdl.c
  doomgeneric_wasm.c
)

# Aggiungi eseguibile WebAssembly
add_executable(engine ${SOURCES})

# Opzioni per Emscripten
set_target_properties(engine PROPERTIES
  LINK_FLAGS "-s USE_SDL=2 -s ALLOW_MEMORY_GROWTH=1 -s WASM=1 -s FORCE_FILESYSTEM=1 -s EXPORTED_FUNCTIONS=['_main']"
)
