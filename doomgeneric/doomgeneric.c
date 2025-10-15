#include <stdio.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int main() {
    printf("DoomGenericWASM engine started.\\n");
    emscripten_set_main_loop([](){}, 0, 1);
    return 0;
}
