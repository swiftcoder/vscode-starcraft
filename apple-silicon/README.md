# Apple Silicon

StarCraft II for AI runs the headless game client in a linux/amd64 container.
On Apple Silicon (M1/M2/M3/M4) Macs, Docker runs x86-64 containers under
emulation: either QEMU, or Apple's Rosetta.

Rosetta is several times faster than QEMU, but StarCraft II 4.10 crashes under
it while loading the map. Matches then end at 0 game loops, with both players
reported as `SC2Crash` and the result `Error`.

## Cause

The fault is `lock cmpxchg %edx,(%rdi)` inside glibc's `pthread_mutex_lock`.

StarCraft II keeps some pthread mutexes at addresses that are only 2-byte
aligned. That is fine on real x86 hardware. Rosetta translates the instruction
into ARM atomics, which raise SIGBUS when the operand crosses a 16-byte
boundary.

## Fix

`alignmutex.c` is a small `LD_PRELOAD` library that routes every misaligned
mutex to an aligned shadow mutex. It covers lock, unlock, trylock, timedlock,
init, destroy and the cond-wait functions, and keeps each mutex's type.
Aligned mutexes pass straight through, so it does nothing in processes
without misaligned mutexes.

StarCraft II for AI mounts the library into the game container and sets
`LD_PRELOAD` for it when it detects an Apple Silicon Mac. See the
`starcraft.rosetta` setting to change that behaviour.

## Building the library

`alignmutex.so` is checked in, prebuilt for x86-64 Linux against glibc 2.36
(the same glibc as the Debian 12 based game image). To rebuild it, run:

```sh
./build.sh
```

The script builds the library in a `gcc:13` container, so Docker is the only
requirement.

## Provenance

The library and the root cause analysis come from
[aiarena/local-play-bootstrap#22](https://github.com/aiarena/local-play-bootstrap/pull/22)
by Justin Wei. See the pull request for the original discussion and tests.
