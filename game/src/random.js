// Seeded random numbers (mulberry32) so a day plays the same for a given seed.
// The `?seed=` URL parameter picks the seed; without one we use the clock.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRandom {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }
  // Float in [0, 1).
  float() {
    return this.next();
  }
  // Integer in [min, max].
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  // Float in [min, max).
  range(min, max) {
    return min + this.next() * (max - min);
  }
  // Pick one element of an array.
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }
  // Fisher-Yates shuffle, returns a new array.
  shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }
}
