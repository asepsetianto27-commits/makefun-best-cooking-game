// Game state and rules: orders, chef, stations, wok, plating, scoring, timer.
// Knows nothing about canvas; render.js draws whatever this holds.

import {
  VIEW_W, VIEW_H, DAY_SECONDS, RUSH_AT, MAX_ORDERS, CHEF_SPEED,
  CHOP_SECONDS, COOK_SECONDS, BURN_AFTER, COMBO_STEP,
  RECIPES, DISH_NAMES, INGREDIENTS, PANTRY_ORDER, STATIONS, pantryBinRect, itemKey,
} from './config.js';
import { SeededRandom } from './random.js';

export function makeItem(id) {
  // No-prep ingredients (peanut sauce, tea, ice) are ready the moment you pick them up.
  return { kind: 'item', id, state: INGREDIENTS[id].prep === 'none' ? 'ready' : 'raw' };
}

function finishedStateFor(id) {
  const prep = INGREDIENTS[id].prep;
  if (prep === 'chop-cook' || prep === 'cook') return 'cooked';
  if (prep === 'chop') return 'chopped';
  return 'ready';
}

export function dishForPlate(items) {
  const keys = items.map(itemKey).slice().sort();
  for (const name of DISH_NAMES) {
    const needs = RECIPES[name].needs.slice().sort();
    if (needs.length === keys.length && needs.every((k, i) => k === keys[i])) return name;
  }
  return null;
}

export class World {
  constructor(seed) {
    this.rng = new SeededRandom(seed);
    this.screen = 'title'; // title | playing | paused | over
    this.elapsed = 0;
    this.timeLeft = DAY_SECONDS;
    this.score = 0;
    this.coins = 0;
    this.served = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.toast = '';
    this.toastTime = 0;
    this.spawnIn = 0;
    this.orders = [];
    this.orderSeq = 0;
    this.chef = {
      x: VIEW_W / 2, y: 470, dir: 1, moving: false,
      carrying: null, target: null, autoStation: null,
    };
    this.wok = { item: null, progress: 0, state: 'empty' }; // empty|cooking|done|burnt
    this.plate = []; // finished items sitting on the plating counter
    this.chopProgress = 0;
    this.particles = [];
    this.steam = [];
    this.shake = 0;
  }

  get rushing() {
    return this.timeLeft <= RUSH_AT && this.screen === 'playing';
  }

  startDay() {
    this.screen = 'playing';
    this.elapsed = 0;
    this.timeLeft = DAY_SECONDS;
    this.score = 0;
    this.coins = 0;
    this.served = 0;
    this.missed = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.orders = [];
    this.orderSeq = 0;
    this.chef.carrying = null;
    this.chef.target = null;
    this.chef.autoStation = null;
    this.chef.x = VIEW_W / 2;
    this.chef.y = 470;
    this.wok = { item: null, progress: 0, state: 'empty' };
    this.plate = [];
    this.chopProgress = 0;
    this.particles = [];
    this.spawnIn = 9;
    this.spawnOrder();
    this.spawnOrder();
    this.setToast('Hari dimulai! Ambil bahan dari bawah.');
  }

  setToast(text) {
    this.toast = text;
    this.toastTime = 3;
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const dish = this.rng.pick(DISH_NAMES);
    const recipe = RECIPES[dish];
    this.orderSeq += 1;
    const patience = recipe.patience * (this.rushing ? 0.8 : 1);
    this.orders.push({
      id: this.orderSeq,
      dish,
      patience,
      patienceMax: patience,
      coins: recipe.coins,
      bornAt: this.elapsed,
    });
  }

  spawnInterval() {
    if (this.rushing) return 5.5;
    return Math.max(7, 14 - this.elapsed * 0.045);
  }

  // ---- station helpers -------------------------------------------------

  nearestStation() {
    const c = this.chef;
    let best = null;
    let bestD = 92;
    for (const [key, st] of Object.entries(STATIONS)) {
      const d = Math.hypot(c.x - st.useX, c.y - st.useY);
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    }
    return best;
  }

  nearestPantryBin() {
    const c = this.chef;
    for (let i = 0; i < PANTRY_ORDER.length; i += 1) {
      const r = pantryBinRect(i);
      if (Math.hypot(c.x - r.useX, c.y - r.useY) < 92) return i;
    }
    return -1;
  }

  // ---- actions ----------------------------------------------------------

  interact(sounds) {
    const c = this.chef;
    const bin = this.nearestPantryBin();
    if (bin >= 0) {
      if (c.carrying) {
        this.setToast('Tangan penuh! Buang dulu (Q).');
        return;
      }
      c.carrying = makeItem(PANTRY_ORDER[bin]);
      sounds.pop();
      this.burst(c.x, c.y - 30, INGREDIENTS[PANTRY_ORDER[bin]].color, 6);
      return;
    }
    const station = this.nearestStation();
    if (!station) return;
    if (station === 'chop') this.useChoppingBoard(sounds);
    else if (station === 'wok') this.useWok(sounds);
    else if (station === 'plate') this.usePlating(sounds);
    else if (station === 'serve') this.useServeWindow(sounds);
    else if (station === 'trash') this.useTrash(sounds);
  }

  useChoppingBoard(sounds) {
    const c = this.chef;
    if (!c.carrying || c.carrying.kind !== 'item') {
      this.setToast('Bawa bahan yang bisa dicincang ke talenan.');
      return;
    }
    const prep = INGREDIENTS[c.carrying.id].prep;
    if (c.carrying.state === 'raw' && (prep === 'chop' || prep === 'chop-cook')) {
      // Hold-to-chop is handled in update(); a tap gives a nudge.
      this.chopProgress = Math.min(1, this.chopProgress + 0.08);
      sounds.chop();
      this.burst(c.x, c.y - 34, '#ffffff', 4);
      if (this.chopProgress >= 1) this.finishChop(sounds);
    } else {
      this.setToast('Bahan ini tidak perlu dicincang.');
    }
  }

  finishChop(sounds) {
    const c = this.chef;
    c.carrying.state = 'chopped';
    this.chopProgress = 0;
    sounds.chop();
    this.burst(c.x, c.y - 30, '#ffe9a8', 10);
    this.setToast(INGREDIENTS[c.carrying.id].name + ' sudah dicincang!');
  }

  useWok(sounds) {
    const c = this.chef;
    if (this.wok.item) {
      // Take food out of the wok. Burnt food comes out too — carry it to the trash.
      if (this.wok.state === 'burnt') {
        if (c.carrying) {
          this.setToast('Tangan penuh!');
          return;
        }
        c.carrying = this.wok.item;
        this.wok = { item: null, progress: 0, state: 'empty' };
        sounds.pop();
        this.setToast('Gosong! Buang ke tempat sampah (Q).');
        return;
      }
      if (this.wok.state !== 'done') {
        this.setToast('Belum matang — tunggu sampai cincin penuh.');
        return;
      }
      if (c.carrying) {
        this.setToast('Tangan penuh!');
        return;
      }
      c.carrying = this.wok.item;
      this.wok = { item: null, progress: 0, state: 'empty' };
      sounds.pop();
      return;
    }
    if (!c.carrying || c.carrying.kind !== 'item') {
      this.setToast('Bawa bahan mentah ke wok.');
      return;
    }
    const item = c.carrying;
    const prep = INGREDIENTS[item.id].prep;
    const needsCook = prep === 'cook' || prep === 'chop-cook';
    const cookedEnough =
      (prep === 'cook' && item.state === 'raw') ||
      (prep === 'chop-cook' && item.state === 'chopped');
    if (!needsCook) {
      this.setToast('Bahan ini tidak dimasak di wok.');
      return;
    }
    if (!cookedEnough) {
      this.setToast('Cincang dulu di talenan!');
      return;
    }
    this.wok.item = item;
    this.wok.progress = 0;
    this.wok.state = 'cooking';
    c.carrying = null;
    sounds.startSizzle();
  }

  usePlating(sounds) {
    const c = this.chef;
    if (c.carrying && c.carrying.kind === 'plate') {
      // Put the plate back down.
      if (this.plate.length === 0) {
        this.plate = c.carrying.items;
        c.carrying = null;
        sounds.pop();
      } else {
        this.setToast('Piring di meja masih ada isinya.');
      }
      return;
    }
    if (c.carrying && c.carrying.kind === 'item') {
      const item = c.carrying;
      if (item.state !== finishedStateFor(item.id)) {
        this.setToast('Bahan belum siap — cincang / masak dulu.');
        return;
      }
      if (this.plate.length >= 4) {
        this.setToast('Piring sudah penuh.');
        return;
      }
      if (this.plate.some((p) => itemKey(p) === itemKey(item))) {
        this.setToast('Bahan itu sudah ada di piring.');
        return;
      }
      this.plate.push(item);
      c.carrying = null;
      sounds.pop();
      const dish = dishForPlate(this.plate);
      if (dish) {
        this.setToast(dish + ' selesai dirakit! Sajikan!');
        sounds.ding();
      }
      return;
    }
    // Hands empty: pick the plate up.
    if (this.plate.length > 0) {
      c.carrying = { kind: 'plate', items: this.plate.slice(), dish: dishForPlate(this.plate) };
      this.plate = [];
      sounds.pop();
    } else {
      this.setToast('Piring kosong — taruh bahan di sini.');
    }
  }

  useServeWindow(sounds) {
    const c = this.chef;
    if (!c.carrying || c.carrying.kind !== 'plate') {
      this.setToast('Bawa piring berisi hidangan ke jendela saji.');
      return;
    }
    const plate = c.carrying;
    if (!plate.dish) {
      this.setToast('Piring belum jadi satu hidangan.');
      return;
    }
    const orderIdx = this.orders.findIndex((o) => o.dish === plate.dish);
    let earned = 2;
    if (orderIdx >= 0) {
      const order = this.orders[orderIdx];
      const timeBonus = Math.max(0, Math.round((order.patience / order.patienceMax) * 3));
      earned = order.coins + timeBonus;
      this.orders.splice(orderIdx, 1);
      this.combo += 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
    } else {
      this.combo = 0;
    }
    const mult = 1 + (this.combo - 1) * COMBO_STEP;
    const paid = Math.max(1, Math.round(earned * (this.combo > 0 ? mult : 1)));
    this.coins += paid;
    this.score += paid * 10;
    this.served += 1;
    c.carrying = null;
    sounds.ding();
    sounds.coin();
    this.coinBurst(1020, 200, paid);
    this.setToast(
      plate.dish + ' tersaji! +' + paid + ' koin' + (this.combo > 1 ? '  (kombo x' + this.combo + ')' : ''),
    );
  }

  useTrash(sounds) {
    const c = this.chef;
    if (!c.carrying) {
      this.setToast('Tidak ada yang dibuang.');
      return;
    }
    c.carrying = null;
    sounds.pop();
    this.setToast('Dibuang.');
  }

  trashCarried(sounds) {
    this.useTrash(sounds);
  }

  // ---- per-frame update ---------------------------------------------------

  update(dt, input, sounds) {
    if (this.screen !== 'playing') return;
    this.elapsed += dt;
    this.timeLeft = Math.max(0, DAY_SECONDS - this.elapsed);
    if (this.toastTime > 0) this.toastTime -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);

    // Orders lose patience; expired ones are missed.
    for (let i = this.orders.length - 1; i >= 0; i -= 1) {
      const o = this.orders[i];
      o.patience -= dt;
      if (o.patience <= 0) {
        this.orders.splice(i, 1);
        this.missed += 1;
        this.combo = 0;
        sounds.fail();
        this.setToast('Pesanan ' + o.dish + ' hangus — pelanggan pergi!');
        this.shake = 0.6;
      }
    }

    // Spawn new orders on a quickening schedule.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      if (this.orders.length < MAX_ORDERS) sounds.ticket();
      this.spawnIn = this.spawnInterval();
    }

    // Wok cooking.
    if (this.wok.state === 'cooking') {
      this.wok.progress += dt / COOK_SECONDS;
      if (this.wok.progress >= 1) {
        this.wok.progress = 1;
        this.wok.state = 'done';
        this.wok.item.state = 'cooked';
        sounds.stopSizzle();
        sounds.ding();
      }
    } else if (this.wok.state === 'done') {
      this.wok.progress += dt / BURN_AFTER;
      if (this.wok.progress >= 2) {
        this.wok.state = 'burnt';
        this.wok.item.state = 'burnt';
        sounds.fail();
        this.setToast('Wok gosong! Buang isinya.');
      }
    }

    // Hold-to-chop while standing at the board with E held.
    const atBoard = this.nearestStation() === 'chop';
    const c = this.chef;
    const choppable =
      c.carrying && c.carrying.kind === 'item' && c.carrying.state === 'raw' &&
      (INGREDIENTS[c.carrying.id].prep === 'chop' || INGREDIENTS[c.carrying.id].prep === 'chop-cook');
    if (atBoard && choppable && (input.down('KeyE') || input.down('Space'))) {
      this.chopProgress += dt / CHOP_SECONDS;
      if (Math.random() < dt * 8) this.burst(180, 210, '#ffffff', 1);
      if (this.chopProgress >= 1) this.finishChop(sounds);
    } else if (this.chopProgress > 0 && !choppable) {
      this.chopProgress = 0;
    }

    // Chef movement: keyboard, or click-to-walk target.
    const mv = input.moveVector();
    if (mv.dx !== 0 || mv.dy !== 0) {
      c.target = null;
      c.autoStation = null;
      c.x += mv.dx * CHEF_SPEED * dt;
      c.y += mv.dy * CHEF_SPEED * dt;
      c.dir = mv.dx !== 0 ? Math.sign(mv.dx) : c.dir;
      c.moving = true;
    } else if (c.target) {
      const dx = c.target.x - c.x;
      const dy = c.target.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        c.target = null;
        c.moving = false;
        if (c.autoStation) {
          const st = c.autoStation;
          c.autoStation = null;
          this.interact(sounds);
          void st;
        }
      } else {
        c.x += (dx / d) * CHEF_SPEED * dt;
        c.y += (dy / d) * CHEF_SPEED * dt;
        c.dir = dx !== 0 ? Math.sign(dx) : c.dir;
        c.moving = true;
      }
    } else {
      c.moving = false;
    }
    c.x = Math.max(28, Math.min(VIEW_W - 28, c.x));
    c.y = Math.max(318, Math.min(580, c.y));

    // Mouse click: walk there; clicking a station or bin auto-uses it.
    let click = input.takeClick();
    while (click) {
      c.target = { x: click.x, y: Math.max(318, Math.min(580, click.y)) };
      c.autoStation = null;
      for (const [key, st] of Object.entries(STATIONS)) {
        if (click.x >= st.x && click.x <= st.x + st.w && click.y >= st.y && click.y <= st.y + st.h) {
          c.target = { x: st.useX, y: st.useY };
          c.autoStation = key;
        }
      }
      for (let i = 0; i < PANTRY_ORDER.length; i += 1) {
        const r = pantryBinRect(i);
        if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) {
          c.target = { x: r.useX, y: r.useY };
          c.autoStation = 'pantry';
        }
      }
      click = input.takeClick();
    }

    // Edge-triggered actions.
    if (input.pressed('KeyE') || input.pressed('Space')) this.interact(sounds);
    if (input.pressed('KeyQ')) this.trashCarried(sounds);

    // Particles.
    this.updateParticles(dt);
    // Wok steam.
    if (this.wok.state === 'cooking' || this.wok.state === 'done') {
      if (Math.random() < dt * 14) {
        this.steam.push({
          x: 460 + (Math.random() - 0.5) * 50,
          y: 168,
          vy: -34 - Math.random() * 20,
          life: 0.9 + Math.random() * 0.5,
          age: 0,
          size: 5 + Math.random() * 7,
        });
      }
    }
    for (let i = this.steam.length - 1; i >= 0; i -= 1) {
      const s = this.steam[i];
      s.age += dt;
      s.y += s.vy * dt;
      if (s.age >= s.life) this.steam.splice(i, 1);
    }

    if (this.timeLeft <= 0) {
      this.screen = 'over';
      sounds.stopSizzle();
      if (this.served > 0) sounds.ding();
    }
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.5 + Math.random() * 0.4, age: 0, color, size: 3 + Math.random() * 4,
      });
    }
  }

  coinBurst(x, y, n) {
    for (let i = 0; i < Math.min(14, 4 + n); i += 1) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = 140 + Math.random() * 160;
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.8 + Math.random() * 0.5, age: 0, color: '#f2b705', size: 5 + Math.random() * 4, coin: true,
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      if (p.age >= p.life) this.particles.splice(i, 1);
    }
  }
}
