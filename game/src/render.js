// Every pixel of Sizzle & Serve: kitchen, order board, stations, chef, HUD.
// Pure drawing from the World state; no game logic lives here.

import {
  VIEW_W, VIEW_H, DAY_SECONDS, RUSH_AT, COLORS, RECIPES, INGREDIENTS,
  PANTRY_ORDER, STATIONS, pantryBinRect, stateLabel, itemKey,
} from './config.js';
import { dishForPlate } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, fill, back = '#00000033') {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = back;
  ctx.fill();
  if (frac > 0) {
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

// Draw one ingredient icon. `state` changes the look: raw, chopped, cooked, burnt.
export function drawIngredient(ctx, id, x, y, s, state = 'raw') {
  ctx.save();
  ctx.translate(x, y);
  const dark = state === 'burnt';
  const cooked = state === 'cooked';
  const chopped = state === 'chopped';
  const col = dark ? '#3a2a1c' : INGREDIENTS[id].color;
  const u = s / 40; // unit scale
  if (id === 'rice') {
    ctx.fillStyle = cooked ? '#f7d774' : '#f5f0e1';
    ctx.beginPath();
    ctx.ellipse(0, 4 * u, 16 * u, 10 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = cooked ? '#e8b93c' : '#e3dcc3';
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 6 * u, (2 - Math.abs(i)) * u, 2.4 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'noodle') {
    ctx.strokeStyle = cooked ? '#e8a93c' : '#f2c94c';
    ctx.lineWidth = 3.4 * u;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      const yy = (i - 1) * 7 * u;
      ctx.moveTo(-14 * u, yy);
      ctx.bezierCurveTo(-7 * u, yy - 6 * u, 0, yy + 6 * u, 7 * u, yy - 4 * u);
      ctx.bezierCurveTo(11 * u, yy - 7 * u, 14 * u, yy, 14 * u, yy);
      ctx.stroke();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = dark ? '#3a2a1c' : '#fdfdf6';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * u, 11 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark ? '#241708' : (cooked ? '#e8960c' : '#f2b705');
    ctx.beginPath();
    ctx.arc(2 * u, 0, 6 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'chicken') {
    ctx.fillStyle = dark ? '#3a2a1c' : (cooked ? '#c96f2e' : '#e88ca0');
    ctx.beginPath();
    ctx.ellipse(-3 * u, -2 * u, 11 * u, 9 * u, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark ? '#241708' : '#f6e3c8';
    ctx.lineWidth = 4 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6 * u, 4 * u);
    ctx.lineTo(15 * u, 12 * u);
    ctx.stroke();
    if (chopped) {
      ctx.strokeStyle = '#2b1d12';
      ctx.lineWidth = 1.6 * u;
      ctx.beginPath();
      ctx.moveTo(-10 * u, -8 * u);
      ctx.lineTo(2 * u, 6 * u);
      ctx.moveTo(-2 * u, -10 * u);
      ctx.lineTo(6 * u, 2 * u);
      ctx.stroke();
    }
  } else if (id === 'chili') {
    ctx.strokeStyle = dark ? '#241708' : '#c0392b';
    ctx.lineWidth = 5.5 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13 * u, -8 * u);
    ctx.quadraticCurveTo(2 * u, 8 * u, 14 * u, -6 * u);
    ctx.stroke();
    ctx.strokeStyle = '#3f9e4d';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(-13 * u, -8 * u);
    ctx.lineTo(-17 * u, -13 * u);
    ctx.stroke();
    if (chopped) {
      ctx.fillStyle = '#c0392b';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc((i - 1) * 9 * u, 6 * u, 3.4 * u, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'peanut') {
    ctx.fillStyle = dark ? '#241708' : '#8a5a33';
    ctx.beginPath();
    ctx.ellipse(0, 2 * u, 14 * u, 9 * u, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = dark ? '#3a2a1c' : '#a06a3e';
    ctx.beginPath();
    ctx.ellipse(0, 1 * u, 11 * u, 6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c98f';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 6 * u, 0, 1.8 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'tea') {
    ctx.fillStyle = dark ? '#241708' : '#c98a3d';
    rr(ctx, -11 * u, -8 * u, 22 * u, 18 * u, 3 * u);
    ctx.fill();
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 2.6 * u;
    ctx.beginPath();
    ctx.arc(12 * u, 0, 6 * u, -1.2, 1.2);
    ctx.stroke();
    ctx.fillStyle = '#f7e8c9';
    ctx.fillRect(-11 * u, -8 * u, 22 * u, 3 * u);
  } else if (id === 'ice') {
    ctx.fillStyle = dark ? '#7d99a8' : '#a8d8ea';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6 * u;
    for (const [ox, oy] of [[-7, -4], [6, -6], [0, 6]]) {
      ctx.save();
      ctx.translate(ox * u, oy * u);
      ctx.rotate(0.4);
      ctx.fillRect(-5 * u, -5 * u, 10 * u, 10 * u);
      ctx.strokeRect(-5 * u, -5 * u, 10 * u, 10 * u);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items) {
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8ccd0';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8eaec';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  if (items && items.length > 0) {
    const n = items.length;
    items.forEach((item, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      drawIngredient(ctx, item.id, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, 26, item.state);
    });
  }
}

function drawOrderTicket(ctx, order, x, y, w, h, now) {
  const recipe = RECIPES[order.dish];
  const frac = Math.max(0, order.patience / order.patienceMax);
  const low = frac < 0.3;
  const pulse = low ? 0.5 + 0.5 * Math.sin(now * 9) : 0;
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = COLORS.ticket;
  ctx.fill();
  ctx.lineWidth = low ? 3 + pulse : 2;
  ctx.strokeStyle = low ? '#d64541' : COLORS.ticketEdge;
  ctx.stroke();
  // Dish color tab.
  ctx.fillStyle = recipe.color;
  rr(ctx, x, y, 10, h, 5);
  ctx.fill();
  text(ctx, order.dish, x + w / 2 + 4, y + 17, 18, COLORS.ink);
  // Ingredient icons for the recipe.
  const needs = recipe.needs;
  const slotW = (w - 24) / needs.length;
  needs.forEach((need, i) => {
    const [id, state] = need.split(':');
    const cx = x + 16 + slotW * (i + 0.5);
    drawIngredient(ctx, id, cx, y + 44, 30, state);
    text(ctx, INGREDIENTS[id].name, cx, y + 63, 11, '#5a4632');
  });
  // Bottom row: coins left, patience bar middle, seconds right.
  text(ctx, order.coins + ' koin', x + 14, y + 84, 12, '#8a6d1f', 'left');
  text(ctx, Math.ceil(order.patience) + ' dtk', x + w - 14, y + 84, 12, '#5a4632', 'right');
  const pcol = frac > 0.5 ? COLORS.green : frac > 0.25 ? '#e8960c' : '#d64541';
  bar(ctx, x + 70, y + 79, w - 140, 10, frac, pcol);
}

function drawChef(ctx, chef, carrying) {
  const { x, y, dir, moving } = chef;
  const bob = moving ? Math.sin(performance.now() / 90) * 2 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(dir, 1);
  // Shadow.
  ctx.fillStyle = '#00000030';
  ctx.beginPath();
  ctx.ellipse(0, 24, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(-12, 8, 9, 16);
  ctx.fillRect(3, 8, 9, 16);
  // Body + apron.
  ctx.fillStyle = '#f2f2f2';
  rr(ctx, -17, -14, 34, 26, 9);
  ctx.fill();
  ctx.fillStyle = '#2f6db3';
  rr(ctx, -13, -6, 26, 18, 6);
  ctx.fill();
  // Arms.
  ctx.strokeStyle = '#f2f2f2';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.lineTo(-22, 4);
  ctx.moveTo(14, -8);
  ctx.lineTo(22, 4);
  ctx.stroke();
  // Head + chef hat.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -24, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -34, 7, 0, Math.PI * 2);
  ctx.arc(0, -38, 8, 0, Math.PI * 2);
  ctx.arc(8, -34, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -36, 26, 5);
  // Face.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(5, -25, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(5, -19, 4, 0.15, Math.PI - 0.4);
  ctx.stroke();
  ctx.restore();

  // Carried item floats beside the chef's hands, label below it on the floor.
  if (carrying) {
    const ix = x + dir * 38;
    const iy = y - 6 + bob;
    if (carrying.kind === 'plate') {
      drawPlate(ctx, ix, iy, 24, carrying.items);
      if (carrying.dish) text(ctx, carrying.dish, ix, iy + 38, 13, '#fff6e3');
    } else {
      drawIngredient(ctx, carrying.id, ix, iy, 34, carrying.state);
      text(ctx, stateLabel(carrying), ix, iy + 34, 12, '#fff6e3');
    }
  }
}

function drawKitchen(ctx, world, now) {
  // Wall.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, 150);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 140, VIEW_W, 10);
  // Wall tiles.
  ctx.strokeStyle = '#e8d3a8';
  ctx.lineWidth = 2;
  for (let x = 0; x < VIEW_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 140);
    ctx.stroke();
  }
  // Floor tiles.
  const tile = 64;
  for (let ty = 150; ty < VIEW_H; ty += tile) {
    for (let tx = 0; tx < VIEW_W; tx += tile) {
      ctx.fillStyle = ((tx / tile + ty / tile) % 2 === 0) ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx, ty, tile, tile);
    }
  }
  ctx.strokeStyle = '#00000018';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= VIEW_W; tx += tile) {
    ctx.beginPath();
    ctx.moveTo(tx, 150);
    ctx.lineTo(tx, VIEW_H);
    ctx.stroke();
  }
  for (let ty = 150; ty <= VIEW_H; ty += tile) {
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(VIEW_W, ty);
    ctx.stroke();
  }
}

function drawStations(ctx, world, now) {
  // Chopping board.
  const chop = STATIONS.chop;
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, chop.x, chop.y, chop.w, chop.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, chop.x, chop.y, chop.w, 26, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.board;
  rr(ctx, chop.x + 40, chop.y + 44, 160, 66, 8);
  ctx.fill();
  ctx.strokeStyle = '#b07a3e';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Knife.
  ctx.save();
  ctx.translate(chop.x + 195, chop.y + 70);
  ctx.rotate(-0.5);
  ctx.fillStyle = COLORS.steel;
  ctx.fillRect(0, -5, 34, 10);
  ctx.fillStyle = '#2b1d12';
  ctx.fillRect(-14, -4, 14, 8);
  ctx.restore();
  text(ctx, chop.label, chop.x + chop.w / 2, chop.y + 126, 15, '#fff6e3');
  if (world.chopProgress > 0) {
    const cx = chop.x + 120;
    const cy = chop.y + 77;
    ctx.strokeStyle = '#00000055';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + world.chopProgress * Math.PI * 2);
    ctx.stroke();
    text(ctx, 'CINCANG…', cx, cy - 44, 13, '#fff6e3');
  }

  // Wok / stove.
  const wok = STATIONS.wok;
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, wok.x, wok.y, wok.w, wok.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, wok.x, wok.y, wok.w, 26, 12);
  ctx.fill();
  // Burner + wok pan.
  ctx.fillStyle = '#3a3f4a';
  ctx.beginPath();
  ctx.arc(wok.x + 120, wok.y + 72, 46, 0, Math.PI * 2);
  ctx.fill();
  const flame = world.wok.state === 'cooking' ? 0.6 + 0.4 * Math.sin(now * 12) : 0;
  if (flame > 0) {
    ctx.fillStyle = '#ff8c1a';
    ctx.beginPath();
    ctx.ellipse(wok.x + 120, wok.y + 104, 34 * flame, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2b2f36';
  ctx.beginPath();
  ctx.arc(wok.x + 120, wok.y + 70, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = world.wok.state === 'burnt' ? '#241708' : '#4a4f58';
  ctx.beginPath();
  ctx.arc(wok.x + 120, wok.y + 70, 34, 0, Math.PI * 2);
  ctx.fill();
  if (world.wok.item) {
    drawIngredient(ctx, world.wok.item.id, wok.x + 120, wok.y + 70, 40, world.wok.item.state);
  }
  // Cook timer ring.
  if (world.wok.state === 'cooking' || world.wok.state === 'done') {
    const cx = wok.x + 120;
    const cy = wok.y + 70;
    const frac = world.wok.state === 'done' ? 1 - (world.wok.progress - 1) : world.wok.progress;
    ctx.strokeStyle = '#00000055';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = world.wok.state === 'done' ? COLORS.gold : '#ff8c1a';
    ctx.beginPath();
    ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + Math.max(0, Math.min(1, frac)) * Math.PI * 2);
    ctx.stroke();
    text(ctx, world.wok.state === 'done' ? 'MATANG!' : 'MASAK…', cx, cy - 58, 13, '#fff6e3');
  }
  if (world.wok.state === 'burnt') text(ctx, 'GOSONG!', wok.x + 120, wok.y + 34, 15, '#ff6b5e');
  text(ctx, wok.label, wok.x + wok.w / 2, wok.y + 126, 15, '#fff6e3');

  // Steam wisps.
  for (const s of world.steam) {
    const a = Math.max(0, 1 - s.age / s.life) * 0.55;
    ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * (1 + s.age), 0, Math.PI * 2);
    ctx.fill();
  }

  // Plating counter.
  const pl = STATIONS.plate;
  ctx.fillStyle = COLORS.counterFront;
  rr(ctx, pl.x, pl.y, pl.w, pl.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, pl.x, pl.y, pl.w, 26, 12);
  ctx.fill();
  drawPlate(ctx, pl.x + 120, pl.y + 72, 46, world.plate);
  const dish = dishForPlate(world.plate);
  if (dish) {
    text(ctx, dish + ' — SIAP!', pl.x + 120, pl.y + 13, 14, '#ffd166');
  } else if (world.plate.length > 0) {
    text(ctx, world.plate.length + ' bahan di piring', pl.x + 120, pl.y + 13, 13, '#fff6e3');
  }
  text(ctx, pl.label, pl.x + pl.w / 2, pl.y + 126, 15, '#fff6e3');

  // Serve window.
  const sv = STATIONS.serve;
  ctx.fillStyle = '#7a4a21';
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 12);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  rr(ctx, sv.x + 14, sv.y + 14, sv.w - 28, 66, 8);
  ctx.fill();
  ctx.fillStyle = '#c98a3d';
  ctx.fillRect(sv.x + 14, sv.y + 66, sv.w - 28, 14);
  text(ctx, '🔔  JENDELA SAJI', sv.x + sv.w / 2, sv.y + 47, 17, '#6f4525');
  text(ctx, sv.label, sv.x + sv.w / 2, sv.y + 126, 15, '#fff6e3');

  // Trash bin.
  const tr = STATIONS.trash;
  ctx.fillStyle = '#5a6068';
  rr(ctx, tr.x, tr.y + 40, tr.w, 74, 8);
  ctx.fill();
  ctx.fillStyle = '#767e88';
  rr(ctx, tr.x - 4, tr.y + 32, tr.w + 8, 14, 6);
  ctx.fill();
  text(ctx, '🗑', tr.x + tr.w / 2, tr.y + 80, 26, '#ffffff');
  text(ctx, tr.label, tr.x + tr.w / 2, tr.y + 126, 13, '#fff6e3');
}

function drawPantry(ctx, world) {
  PANTRY_ORDER.forEach((id, i) => {
    const r = pantryBinRect(i);
    const near = world.nearestPantryBin() === i;
    ctx.fillStyle = near ? '#8a5a33' : '#6f4525';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = '#f7e8c9';
    rr(ctx, r.x + 6, r.y + 6, r.w - 12, 58, 8);
    ctx.fill();
    drawIngredient(ctx, id, r.x + r.w / 2, r.y + 36, 36, 'raw');
    text(ctx, INGREDIENTS[id].label, r.x + r.w / 2, r.y + 84, 15, '#fff6e3');
    if (near) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 3;
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.stroke();
    }
  });
}

function drawHud(ctx, world, now) {
  // Score panel (left).
  ctx.fillStyle = '#00000055';
  rr(ctx, 10, 74, 200, 62, 10);
  ctx.fill();
  text(ctx, 'SKOR  ' + world.score, 22, 92, 17, '#fff6e3', 'left');
  text(ctx, 'Disajikan ' + world.served + '   Gagal ' + world.missed, 22, 118, 13, '#ffd166', 'left');

  // Day timer (top center-right) + coins.
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.ceil(world.timeLeft % 60);
  const clock = mins + ':' + String(secs === 60 ? 0 : secs).padStart(2, '0');
  const urgent = world.timeLeft <= 30;
  ctx.fillStyle = urgent && world.screen === 'playing' ? '#d64541' : '#00000055';
  rr(ctx, 1070, 74, 200, 62, 10);
  ctx.fill();
  text(ctx, (urgent ? '⏰ ' : '') + clock, 1170, 94, 22, urgent ? '#ffffff' : '#fff6e3');
  text(ctx, '🪙 ' + world.coins + ' koin' + (world.combo > 1 ? '   🔥 kombo x' + world.combo : ''), 1170, 120, 14, '#ffd166');

  // Order tickets.
  const ticketW = 235;
  const ticketH = 100;
  const startX = 300;
  const gap = 14;
  for (let i = 0; i < 3; i += 1) {
    const order = world.orders[i];
    const x = startX + i * (ticketW + gap);
    if (order) {
      drawOrderTicket(ctx, order, x, 10, ticketW, ticketH, now);
    } else {
      ctx.fillStyle = '#00000033';
      rr(ctx, x, 10, ticketW, ticketH, 10);
      ctx.fill();
      ctx.strokeStyle = '#ffffff44';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '— kosong —', x + ticketW / 2, 60, 14, '#ffffff88');
    }
  }

  // Rush banner.
  if (world.rushing) {
    const pulse = 0.6 + 0.4 * Math.sin(now * 6);
    ctx.fillStyle = 'rgba(214,69,65,' + (0.75 * pulse).toFixed(2) + ')';
    rr(ctx, VIEW_W / 2 - 130, 116, 260, 30, 15);
    ctx.fill();
    text(ctx, '⚡ JAM SIBUK! ⚡', VIEW_W / 2, 132, 16, '#ffffff');
  }

  // Toast + controls hint only while playing (title/game-over have their own text).
  if (world.screen === 'playing' || world.screen === 'paused') {
    if (world.toastTime > 0 && world.toast) {
      ctx.fillStyle = '#2b1d12ee';
      const w = Math.min(560, 24 + world.toast.length * 9);
      rr(ctx, VIEW_W / 2 - w / 2, 556, w, 34, 17);
      ctx.fill();
      text(ctx, world.toast, VIEW_W / 2, 574, 15, '#fff6e3');
    }
    text(ctx, 'WASD / panah jalan • E ambil & pakai • Q buang • P jeda • M suara', VIEW_W / 2, 706, 12, '#ffffffaa');
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = '#1d120acc';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '🍳  SIZZLE & SERVE  🍜', VIEW_W / 2, 150, 58, '#ffd166');
  text(ctx, 'Warung cepat saji — masak, sajikan, jangan sampai pelanggan pergi!', VIEW_W / 2, 205, 20, '#fff6e3');
  const lines = [
    '1. Ambil bahan dari rak bawah (berdiri di dekatnya, tekan E).',
    '2. Cincang di TALENAN (tahan E), masak di WOK sampai cincin penuh.',
    '3. Rakit di PIRING sesuai resep di tiket pesanan.',
    '4. Bawa piring ke JENDELA SAJI sebelum sabar pelanggan habis!',
    'Es Teh cepat: Teh + Es, tanpa masak. Wok yang kelamaan = gosong!',
  ];
  lines.forEach((line, i) => text(ctx, line, VIEW_W / 2, 270 + i * 34, 17, '#fff6e3'));
  const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 300);
  ctx.fillStyle = 'rgba(242,183,5,' + pulse.toFixed(2) + ')';
  rr(ctx, VIEW_W / 2 - 190, 470, 380, 56, 28);
  ctx.fill();
  text(ctx, 'TEKAN ENTER UNTUK MULAI', VIEW_W / 2, 499, 20, '#2b1d12');
  text(ctx, 'WASD / panah • E pakai • Q buang • P jeda • M suara • klik mouse juga bisa', VIEW_W / 2, 560, 14, '#ffffffcc');
  text(ctx, 'Hari kerja 2 menit 30 detik — makin sore makin ramai!', VIEW_W / 2, 590, 14, '#ffffffcc');
}

function drawPaused(ctx) {
  ctx.fillStyle = '#1d120abb';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '⏸  JEDA', VIEW_W / 2, 320, 54, '#ffd166');
  text(ctx, 'Tekan P untuk lanjut', VIEW_W / 2, 380, 20, '#fff6e3');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = '#1d120add';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '⏰  TUTUP WARUNG!', VIEW_W / 2, 150, 52, '#ffd166');
  text(ctx, world.served >= 8 ? 'Koki hebat! Pelanggan pulang kenyang.' : 'Hari yang berat — besok coba lagi!', VIEW_W / 2, 205, 20, '#fff6e3');
  const rows = [
    ['Skor akhir', String(world.score)],
    ['Koin', String(world.coins)],
    ['Hidangan disajikan', String(world.served)],
    ['Pesanan gagal', String(world.missed)],
    ['Kombo terbaik', 'x' + Math.max(1, world.bestCombo)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 280 + i * 42;
    text(ctx, label, VIEW_W / 2 - 160, y, 20, '#fff6e3', 'left');
    text(ctx, value, VIEW_W / 2 + 160, y, 20, '#ffd166', 'right');
  });
  const pulse = 0.7 + 0.3 * Math.sin(performance.now() / 300);
  ctx.fillStyle = 'rgba(242,183,5,' + pulse.toFixed(2) + ')';
  rr(ctx, VIEW_W / 2 - 170, 510, 340, 56, 28);
  ctx.fill();
  text(ctx, 'TEKAN R UNTUK MAIN LAGI', VIEW_W / 2, 539, 19, '#2b1d12');
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    const a = Math.max(0, 1 - p.age / p.life);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.coin) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff2b0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}

export function render(ctx, world) {
  const now = performance.now() / 1000;
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 8, (Math.random() - 0.5) * world.shake * 8);
  }
  drawKitchen(ctx, world, now);
  drawStations(ctx, world, now);
  drawPantry(ctx, world);
  drawChef(ctx, world.chef, world.chef.carrying);
  drawParticles(ctx, world);
  drawHud(ctx, world, now);
  if (world.screen === 'title') drawTitle(ctx, world);
  else if (world.screen === 'paused') drawPaused(ctx);
  else if (world.screen === 'over') drawGameOver(ctx, world);
  ctx.restore();
}
