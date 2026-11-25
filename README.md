# 🍳 Sizzle & Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/asepsetianto27-commits/makefun-best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/asepsetianto27-commits/makefun-best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast-paced 2D cooking game set in a warm Indonesian warung kitchen. You are the
chef: grab ingredients from the pantry, chop them on the board, fry them in the
wok, assemble dishes on the plate, and serve them at the window before your
customers lose patience. One work day lasts 2 minutes 30 seconds — and the last
30 seconds are the dinner rush.

## Dishes

| Dish | Recipe | Coins |
| --- | --- | --- |
| Nasi Goreng | cooked rice + cooked egg + chopped chili | 12 |
| Mie Ayam | cooked noodle + cooked chicken | 10 |
| Sate Ayam | cooked chicken + peanut sauce | 11 |
| Es Teh | tea + ice (no cooking — the fast one) | 6 |

Serve on time to build a combo multiplier. Leave food in the wok too long and
it burns — throw it in the trash. Let a ticket's patience bar run out and the
customer walks away.

## How to play

1. Walk to a pantry bin at the bottom and press **E** to pick up an ingredient.
2. Chop at the **TALENAN** (hold **E**), cook at the **WOK** (wait for the ring
   to fill, then take the food out before it burns).
3. Place finished ingredients on the **PIRING** counter to assemble a dish.
4. Carry the finished plate to the **JENDELA SAJI** and press **E** to serve.

## Controls

- **WASD / arrow keys** — move the chef
- **E / Space** — pick up, chop, cook, plate, serve
- **Q** — throw away what you are carrying
- **P** — pause · **M** — mute · **R** — restart after closing time
- **Mouse** — click anywhere to walk there; click a station to walk to it and use it

## Run

No build step, no network — plain static files. From `game/`:

```sh
python3 -m http.server
```

then open http://localhost:8000 in desktop Chrome. All art is drawn in canvas
code and all sounds are synthesized with WebAudio; nothing is downloaded.

`?seed=` picks a deterministic day, `?shot=start|chopping|serve|rush` stages a
screenshot scene.

---

Built for the make.fun best cooking game bounty.
Play more: https://make.fun/?ref=7a80mfws
