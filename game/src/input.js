// Keyboard + mouse input. The world polls `down()` every frame and consumes
// edge events (`pressed()`, clicks) so one keypress never fires twice.

export class Input {
  constructor(canvas) {
    this.held = new Set();
    this.pressedQueue = [];
    this.clicks = [];
    this.canvas = canvas;
    this.mouse = { x: 0, y: 0 };
    this._onKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressedQueue.push(event.code);
      this.held.add(event.code);
    };
    this._onKeyUp = (event) => {
      this.held.delete(event.code);
    };
    this._onMouse = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 1280 / rect.width;
      const scaleY = 720 / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      this.mouse.x = x;
      this.mouse.y = y;
      if (event.type === 'mousedown') this.clicks.push({ x, y });
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('mousedown', this._onMouse);
    canvas.addEventListener('mousemove', this._onMouse);
  }

  down(code) {
    return this.held.has(code);
  }

  // True once per physical keypress; call at most once per code per frame.
  pressed(code) {
    const i = this.pressedQueue.indexOf(code);
    if (i === -1) return false;
    this.pressedQueue.splice(i, 1);
    return true;
  }

  anyPressed(codes) {
    return codes.some((c) => this.pressed(c));
  }

  // Consume all queued presses (used when changing screens).
  flush() {
    this.pressedQueue.length = 0;
    this.clicks.length = 0;
  }

  takeClick() {
    return this.clicks.shift() || null;
  }

  // Movement vector from WASD / arrows, normalized.
  moveVector() {
    let dx = 0;
    let dy = 0;
    if (this.down('KeyA') || this.down('ArrowLeft')) dx -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) dx += 1;
    if (this.down('KeyW') || this.down('ArrowUp')) dy -= 1;
    if (this.down('KeyS') || this.down('ArrowDown')) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }
    return { dx, dy };
  }
}
