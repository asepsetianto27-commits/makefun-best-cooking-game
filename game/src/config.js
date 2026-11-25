// Sizzle & Serve — shared constants: canvas size, palette, recipes, stations.
// Every number the world and the renderer use lives here so tuning is one edit.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const DAY_SECONDS = 150;
export const RUSH_AT = 30; // last 30 seconds of the day are the rush
export const MAX_ORDERS = 3;
export const CHEF_SPEED = 300;
export const CHOP_SECONDS = 1.1;
export const COOK_SECONDS = 4.0;
export const BURN_AFTER = 4.5; // seconds past done before the wok item burns
export const COMBO_STEP = 0.1;

export const COLORS = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#f7e8c9',
  wallTrim: '#e8b04b',
  counterTop: '#8a5a33',
  counterFront: '#6f4525',
  board: '#d9a066',
  steel: '#9aa5ad',
  steelDark: '#6e7a82',
  ink: '#2b1d12',
  cream: '#fff6e3',
  red: '#d64541',
  green: '#3f9e4d',
  gold: '#f2b705',
  ticket: '#fff8e7',
  ticketEdge: '#d9a441',
};

// One ingredient definition per pantry item.
// prep: 'none' | 'chop' | 'cook' | 'chop-cook' — what it needs before plating.
export const INGREDIENTS = {
  rice:    { name: 'Nasi',    prep: 'cook',      color: '#f5f0e1', label: 'NASI' },
  noodle:  { name: 'Mie',     prep: 'cook',      color: '#f2c94c', label: 'MIE' },
  egg:     { name: 'Telur',   prep: 'cook',      color: '#f7e9c8', label: 'TELUR' },
  chicken: { name: 'Ayam',    prep: 'chop-cook', color: '#e88ca0', label: 'AYAM' },
  chili:   { name: 'Cabai',   prep: 'chop',      color: '#d64541', label: 'CABAI' },
  peanut:  { name: 'Kacang',  prep: 'none',      color: '#8a5a33', label: 'KACANG' },
  tea:     { name: 'Teh',     prep: 'none',      color: '#c98a3d', label: 'TEH' },
  ice:     { name: 'Es',      prep: 'none',      color: '#a8d8ea', label: 'ES' },
};

export const PANTRY_ORDER = ['rice', 'noodle', 'egg', 'chicken', 'chili', 'peanut', 'tea', 'ice'];

// A recipe is the list of finished ingredient states a plate must hold.
export const RECIPES = {
  'Nasi Goreng': {
    needs: ['rice:cooked', 'egg:cooked', 'chili:chopped'],
    coins: 12,
    patience: 52,
    color: '#e07b39',
  },
  'Mie Ayam': {
    needs: ['noodle:cooked', 'chicken:cooked'],
    coins: 10,
    patience: 48,
    color: '#f2c94c',
  },
  'Sate Ayam': {
    needs: ['chicken:cooked', 'peanut:ready'],
    coins: 11,
    patience: 48,
    color: '#c96f4a',
  },
  'Es Teh': {
    needs: ['tea:ready', 'ice:ready'],
    coins: 6,
    patience: 34,
    color: '#c98a3d',
  },
};

export const DISH_NAMES = Object.keys(RECIPES);

// Stations the chef walks between. `use` is the floor point the chef stands on.
export const STATIONS = {
  chop:  { label: 'TALENAN',  x: 60,  y: 150, w: 240, h: 140, useX: 180, useY: 312 },
  wok:   { label: 'WOK',      x: 340, y: 150, w: 240, h: 140, useX: 460, useY: 312 },
  plate: { label: 'PIRING',   x: 620, y: 150, w: 240, h: 140, useX: 740, useY: 312 },
  serve: { label: 'SAJIKAN',  x: 900, y: 150, w: 240, h: 140, useX: 1020, useY: 312 },
  trash: { label: 'SAMPAH',   x: 1180, y: 150, w: 80, h: 140, useX: 1220, useY: 312 },
};

// Pantry bins along the bottom edge.
export const PANTRY = {
  y: 592,
  h: 108,
  binW: 146,
  gap: 12,
  startX: 20,
};

export function pantryBinRect(index) {
  return {
    x: PANTRY.startX + index * (PANTRY.binW + PANTRY.gap),
    y: PANTRY.y,
    w: PANTRY.binW,
    h: PANTRY.h,
    useX: PANTRY.startX + index * (PANTRY.binW + PANTRY.gap) + PANTRY.binW / 2,
    useY: 578,
  };
}

// Finished-state label shown under an ingredient icon.
export function stateLabel(item) {
  if (!item) return '';
  if (item.kind === 'plate') return item.dish || 'Piring';
  const base = INGREDIENTS[item.id].name;
  if (item.state === 'chopped') return base + ' cincang';
  if (item.state === 'cooked') return base + ' matang';
  if (item.state === 'burnt') return base + ' GOSONG';
  return base;
}

// Recipe key for a finished ingredient item, e.g. 'rice:cooked'.
export function itemKey(item) {
  return item.id + ':' + item.state;
}
