#include <SDL.h>
#include <stdio.h>

int DG_InitVideo() {
    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) < 0) {
        printf("SDL init failed: %s\\n", SDL_GetError());
        return 0;
    }
    SDL_Window *win = SDL_CreateWindow("DOOM PezzaliAPP Edition", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 640, 480, 0);
    if (!win) {
        printf("Failed to create SDL window: %s\\n", SDL_GetError());
        return 0;
    }
    return 1;
}
