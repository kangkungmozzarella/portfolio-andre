"use client";

// Small interface sounds, synthesised with Web Audio so there are no audio files to
// load. Off until the visitor turns them on; the choice is remembered per browser.

const KEY = "sound";
const listeners = new Set<() => void>();
let enabled = false;
let context: AudioContext | null = null;

try {
  enabled = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "on";
} catch {
  // Storage can be blocked (private windows); sound simply starts off.
}

export const soundStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => enabled,
  getServer: () => false,
  set(next: boolean) {
    enabled = next;
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
    listeners.forEach((listener) => listener());
  },
};

function audio() {
  if (!enabled || typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

// One oscillator with a pitch glide and a quick fade, the building block of every sound.
function tone({ type = "sine", from, to, duration, volume, wobble = 0 }: { type?: OscillatorType; from: number; to: number; duration: number; volume: number; wobble?: number }) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + duration);
  if (wobble) {
    // A fast vibrato that dies away: the "boing" of a rubber strap.
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 16;
    depth.gain.setValueAtTime(wobble, now);
    depth.gain.exponentialRampToValueAtTime(1, now + duration);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + duration);
  }
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export const sounds = {
  // A press on any button or link.
  pop: () => tone({ from: 640, to: 280, duration: 0.09, volume: 0.12 }),
  // Grabbing the badge.
  pinch: () => tone({ type: "triangle", from: 880, to: 1320, duration: 0.05, volume: 0.06 }),
  // Letting the badge go; a harder pull (0 to 1) bounces lower and longer.
  boing: (strength: number) =>
    tone({ type: "triangle", from: 320 - strength * 120, to: 140, duration: 0.35 + strength * 0.35, volume: 0.1 + strength * 0.08, wobble: 30 + strength * 60 }),
};
