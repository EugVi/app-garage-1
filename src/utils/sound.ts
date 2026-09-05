// Sound synthesis using Web Audio API — no external files
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.15, delay: number = 0) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
  g.gain.setValueAtTime(0, ac.currentTime + delay);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + delay + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + duration);
}

function sweep(from: number, to: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.12) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, ac.currentTime + duration);
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export const sounds = {
  deposit() {
    tone(523, 0.1, 'sine', 0.12, 0);     // C5
    tone(784, 0.15, 'sine', 0.12, 0.08); // G5
  },
  burnout() {
    // tire skid — short noise burst
    const ac = getCtx();
    if (!ac) return;
    const bufferSize = ac.sampleRate * 0.25;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    const g = ac.createGain();
    g.gain.value = 0.1;
    noise.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    noise.start();
  },
  milestone() {
    tone(659, 0.1, 'sine', 0.1, 0);    // E5
    tone(880, 0.15, 'sine', 0.1, 0.08); // A5
  },
  vehicleComplete() {
    // engine start
    sweep(200, 400, 0.3, 'sawtooth', 0.08);
    tone(523, 0.1, 'sine', 0.12, 0.2);
    tone(659, 0.1, 'sine', 0.12, 0.28);
    tone(784, 0.2, 'sine', 0.12, 0.36);
  },
  levelUp() {
    tone(523, 0.08, 'triangle', 0.1, 0);
    tone(659, 0.08, 'triangle', 0.1, 0.07);
    tone(784, 0.08, 'triangle', 0.1, 0.14);
    tone(1047, 0.15, 'triangle', 0.12, 0.21);
  },
};

export function playSound(enabled: boolean, fn: () => void) {
  if (!enabled) return;
  try { fn(); } catch { /* ignore */ }
}
