#include <stdio.h>
#include <emscripten/emscripten.h>

// dichiarazioni implementate in doomgeneric_sdl.c
int DG_InitVideo(void);
void DG_DrawTestPattern(void);

// piccolo main di test: inizializza e disegna qualcosa ogni frame
static void main_loop(void) {
  DG_DrawTestPattern();
}

int main(void) {
  printf("[DoomGenericWASM] start\n");

  if (!DG_InitVideo()) {
    printf("[DoomGenericWASM] SDL init failed\n");
    return 1;
  }

  // 0 fps => il browser decide; 1 => loop principale gestito da emscripten
  emscripten_set_main_loop(main_loop, 0, 1);
  return 0;
}
