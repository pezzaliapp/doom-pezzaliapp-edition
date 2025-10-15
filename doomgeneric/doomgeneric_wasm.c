#include <stdio.h>
#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE
void DG_WASM_Log(const char* msg) {
  printf("[WASM] %s\n", msg ? msg : "(null)");
}
