cmake_minimum_required(VERSION 3.10)
project(DoomGenericWASM)
add_executable(engine doomgeneric.c doomgeneric_sdl.c)
target_link_libraries(engine SDL2)
