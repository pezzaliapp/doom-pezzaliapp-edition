#include <SDL.h>
#include <stdio.h>

static SDL_Window*   g_win = NULL;
static SDL_Renderer* g_ren = NULL;
static int           g_tick = 0;

int DG_InitVideo(void) {
  if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) < 0) {
    printf("SDL init error: %s\n", SDL_GetError());
    return 0;
  }

  g_win = SDL_CreateWindow(
      "DOOM PezzaliAPP — WASM test",
      SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
      640, 480, SDL_WINDOW_SHOWN);

  if (!g_win) {
    printf("SDL window error: %s\n", SDL_GetError());
    return 0;
  }

  g_ren = SDL_CreateRenderer(g_win, -1, SDL_RENDERER_ACCELERATED);
  if (!g_ren) {
    printf("SDL renderer error: %s\n", SDL_GetError());
    return 0;
  }

  return 1;
}

void DG_DrawTestPattern(void) {
  // sfondo che cambia lentamente (tint pulsante)
  g_tick++;
  int v = (g_tick / 2) % 255;
  SDL_SetRenderDrawColor(g_ren, v, 30, 60, 255);
  SDL_RenderClear(g_ren);

  // rettangolo centrale
  SDL_Rect r = { 640/2 - 120, 480/2 - 60, 240, 120 };
  SDL_SetRenderDrawColor(g_ren, 240, 240, 240, 255);
  SDL_RenderFillRect(g_ren, &r);

  SDL_RenderPresent(g_ren);

  // drena la coda eventi per evitare warning
  SDL_Event e;
  while (SDL_PollEvent(&e)) {
    if (e.type == SDL_QUIT) { /* in WASM normalmente non si esce */ }
  }
}
