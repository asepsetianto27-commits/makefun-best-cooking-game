// Screenshot stages: `?shot=<name>&seed=1` poses the game for a still image.
// Each stage starts a fresh day from the seed, then arranges a fixed scene so
// every render of the same query looks the same.

import { RECIPES, INGREDIENTS } from './config.js';
import { makeItem } from './world.js';

function addOrder(world, dish, patienceFrac) {
  world.spawnOrder();
  const order = world.orders[world.orders.length - 1];
  order.dish = dish;
  order.patience = RECIPES[dish].patience * patienceFrac;
  order.patienceMax = RECIPES[dish].patience;
  return order;
}

function plateFor(world, dish) {
  const items = RECIPES[dish].needs.map((need) => {
    const [id, state] = need.split(':');
    const item = makeItem(id);
    item.state = state;
    return item;
  });
  return items;
}

export function applyShot(world, name) {
  world.startDay();
  world.screen = 'playing';
  world.elapsed = 42;
  world.timeLeft = 150 - 42;
  world.orders = [];
  world.plate = [];
  world.chef.carrying = null;

  if (name === 'start') {
    // Cover: full kitchen mid-game — orders on the board, wok cooking,
    // chef carrying a finished plate, timer running.
    addOrder(world, 'Nasi Goreng', 0.8);
    addOrder(world, 'Mie Ayam', 0.65);
    addOrder(world, 'Es Teh', 0.9);
    world.chef.x = 740;
    world.chef.y = 430;
    world.chef.carrying = { kind: 'plate', items: plateFor(world, 'Mie Ayam'), dish: 'Mie Ayam' };
    world.wok.item = makeItem('rice');
    world.wok.item.state = 'raw';
    world.wok.state = 'cooking';
    world.wok.progress = 0.55;
    world.plate = [];
    const egg = makeItem('egg');
    egg.state = 'cooked';
    world.plate = [egg];
    world.score = 120;
    world.coins = 12;
    world.served = 1;
    world.steam.push({ x: 460, y: 168, vy: -40, life: 1.2, age: 0.3, size: 9 });
    world.steam.push({ x: 445, y: 160, vy: -36, life: 1.2, age: 0.6, size: 7 });
    return;
  }

  if (name === 'chopping') {
    // Chef at the board mid-chop; a dish half-assembled on the plate.
    addOrder(world, 'Nasi Goreng', 0.62);
    addOrder(world, 'Mie Ayam', 0.75);
    addOrder(world, 'Sate Ayam', 0.5);
    world.chef.x = 180;
    world.chef.y = 330;
    world.chef.carrying = makeItem('chili');
    world.chopProgress = 0.55;
    const rice = makeItem('rice');
    rice.state = 'cooked';
    const egg = makeItem('egg');
    egg.state = 'cooked';
    world.plate = [rice, egg];
    world.wok.item = makeItem('noodle');
    world.wok.item.state = 'raw';
    world.wok.state = 'cooking';
    world.wok.progress = 0.4;
    world.score = 120;
    world.coins = 12;
    world.served = 1;
    world.steam.push({ x: 460, y: 168, vy: -40, life: 1.2, age: 0.3, size: 9 });
    return;
  }

  if (name === 'serve') {
    // Finished plate carried to the serve window, coins flying.
    addOrder(world, 'Nasi Goreng', 0.45);
    addOrder(world, 'Es Teh', 0.7);
    world.chef.x = 1020;
    world.chef.y = 330;
    world.chef.carrying = { kind: 'plate', items: plateFor(world, 'Nasi Goreng'), dish: 'Nasi Goreng' };
    world.score = 340;
    world.coins = 34;
    world.served = 3;
    world.combo = 3;
    world.coinBurst(1020, 200, 12);
    world.wok.item = makeItem('chicken');
    world.wok.item.state = 'chopped';
    world.wok.state = 'done';
    world.wok.progress = 1;
    return;
  }

  if (name === 'rush') {
    // Rush hour: three orders, low patience, wok steaming, clock nearly out.
    world.elapsed = 126;
    world.timeLeft = 24;
    addOrder(world, 'Nasi Goreng', 0.18);
    addOrder(world, 'Mie Ayam', 0.28);
    addOrder(world, 'Sate Ayam', 0.12);
    world.chef.x = 460;
    world.chef.y = 330;
    world.chef.carrying = makeItem('chicken');
    world.chef.carrying.state = 'chopped';
    world.wok.item = makeItem('rice');
    world.wok.item.state = 'raw';
    world.wok.state = 'cooking';
    world.wok.progress = 0.7;
    const tea = makeItem('tea');
    tea.state = 'ready';
    world.plate = [tea];
    world.score = 860;
    world.coins = 86;
    world.served = 8;
    world.combo = 4;
    world.steam.push({ x: 460, y: 168, vy: -42, life: 1.2, age: 0.2, size: 10 });
    world.steam.push({ x: 478, y: 158, vy: -38, life: 1.2, age: 0.5, size: 8 });
    world.steam.push({ x: 442, y: 150, vy: -36, life: 1.2, age: 0.8, size: 7 });
    return;
  }

  // Unknown shot name: plain mid-game kitchen.
  addOrder(world, 'Mie Ayam', 0.7);
  addOrder(world, 'Es Teh', 0.85);
  world.chef.x = 640;
  world.chef.y = 470;
  world.chef.carrying = makeItem('egg');
}
