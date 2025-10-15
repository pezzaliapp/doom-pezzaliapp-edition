#include <emscripten.h>
#include <stdio.h>

void DG_WASM_Log(const char *msg) {
    printf("[WASM] %s\\n", msg);
}
