// All sound is synthesized with WebAudio — no audio files, no network.
// Short helper tones and filtered noise cover chop, sizzle, ding, coin and fail.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) this.stopSizzle();
  }

  _tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _noise(dur, gain, filterFreq, type = 'bandpass') {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.ctx.destination);
    src.start(t0);
  }

  // Two quick knife thuds.
  chop() {
    this._noise(0.07, 0.35, 900, 'lowpass');
    this._tone(180, 0.08, 'triangle', 0.25, 0, 90);
  }

  // Looping frying noise while something cooks in the wok.
  startSizzle() {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400;
    const amp = this.ctx.createGain();
    amp.gain.value = 0.05;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.ctx.destination);
    src.start();
    this.sizzleNodes = { src, amp };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.amp.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      this.sizzleNodes.src.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      /* already stopped */
    }
    this.sizzleNodes = null;
  }

  // Order served bell.
  ding() {
    this._tone(880, 0.35, 'sine', 0.22);
    this._tone(1318, 0.4, 'sine', 0.14, 0.07);
  }

  // Coin cascade.
  coin() {
    this._tone(988, 0.1, 'square', 0.1);
    this._tone(1319, 0.12, 'square', 0.1, 0.08);
    this._tone(1568, 0.22, 'square', 0.1, 0.16);
  }

  // Missed order / burnt food.
  fail() {
    this._tone(220, 0.3, 'sawtooth', 0.12, 0, 140);
    this._tone(165, 0.4, 'sawtooth', 0.1, 0.12, 110);
  }

  // Soft pickup blip.
  pop() {
    this._tone(520, 0.09, 'sine', 0.16, 0, 760);
  }

  // New ticket arrives.
  ticket() {
    this._tone(659, 0.12, 'triangle', 0.16);
    this._tone(784, 0.16, 'triangle', 0.14, 0.1);
  }
}
