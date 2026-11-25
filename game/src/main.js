// Sizzle & Serve — bootstrap and game loop.
// Scales the 1280x720 canvas to the window, owns the frame loop, and wires
// the screen keys (start / pause / restart / mute) around the World.

import { VIEW_W, VIEW_H } from './config.js';
import { World } from './world.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const seedText = params.get('seed');
  const seed = seedText === null ? (Date.now() % 2147483647) : (parseInt(seedText, 10) || 1);
  return { seed, shot: params.get('shot') };
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = Math.floor(VIEW_W * scale) + 'px';
  canvas.style.height = Math.floor(VIEW_H * scale) + 'px';
}

const { seed, shot } = readParams();
const world = new World(seed);
const sounds = new SoundBank();
const input = new Input(canvas);
window.__game = world; // for play-testing from the console

fitCanvas();
window.addEventListener('resize', fitCanvas);

if (shot) {
  applyShot(world, shot);
  // Freeze the staged scene: no ticking, just one rendered frame.
  render(ctx, world);
} else {
  let last = performance.now();
  let announced = '';

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Screen keys work on every screen.
    if (input.pressed('Enter') && world.screen === 'title') {
      sounds.ensure();
      world.startDay();
      input.flush();
    }
    if (input.pressed('KeyR') && world.screen === 'over') {
      sounds.ensure();
      world.startDay();
      input.flush();
    }
    if (input.pressed('KeyP') && (world.screen === 'playing' || world.screen === 'paused')) {
      world.screen = world.screen === 'playing' ? 'paused' : 'playing';
      if (world.screen === 'paused') sounds.stopSizzle();
      input.flush();
    }
    if (input.pressed('KeyM')) {
      sounds.ensure();
      sounds.setMuted(!sounds.muted);
      world.setToast(sounds.muted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (input.pressed('KeyE') || input.pressed('Space')) sounds.ensure();

    world.update(dt, input, sounds);
    render(ctx, world);

    // Screen-reader status line, updated only when it changes.
    const line =
      world.screen === 'title' ? 'Sizzle and Serve. Tekan Enter untuk mulai.'
      : world.screen === 'over' ? 'Hari selesai. Skor ' + world.score + '. Tekan R untuk main lagi.'
      : world.screen === 'paused' ? 'Jeda.'
      : 'Skor ' + world.score + ', ' + world.served + ' disajikan, ' + world.timeLeft.toFixed(0) + ' detik tersisa.';
    if (line !== announced) {
      announced = line;
      statusEl.textContent = line;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
