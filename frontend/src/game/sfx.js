// Générateur de sons synthétiques via Web Audio API.
// Aucun asset externe — tout est généré à la volée.
// Usage : import sfx from '@/game/sfx';  sfx.play('bazooka');

let ctx = null;
let masterGain = null;
let ambientNode = null;
let enabled = true;

const getCtx = () => {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);
  } catch (_e) {
    ctx = null;
  }
  return ctx;
};

// ---- Primitives ----
const tone = (c, { freq, duration = 0.2, type = 'sine', volume = 0.25, attack = 0.005, decay = 0.1, slideTo = null }) => {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), c.currentTime + duration);
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + Math.max(attack + 0.01, duration));
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + duration + 0.05);
  return { osc, gain };
};

const noise = (c, { duration = 0.3, volume = 0.3, filterFreq = 1000, filterType = 'lowpass', slideTo = null }) => {
  const bufSize = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, c.currentTime);
  if (slideTo != null) filter.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), c.currentTime + duration);
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();
  src.stop(c.currentTime + duration + 0.05);
};

// ---- Sons dédiés ----
const playGun = () => {
  const c = getCtx(); if (!c) return;
  noise(c, { duration: 0.12, volume: 0.4, filterFreq: 1800, filterType: 'bandpass', slideTo: 600 });
  tone(c, { freq: 220, slideTo: 60, duration: 0.18, type: 'square', volume: 0.18 });
};

const playShotgun = () => {
  const c = getCtx(); if (!c) return;
  noise(c, { duration: 0.25, volume: 0.55, filterFreq: 900, filterType: 'lowpass', slideTo: 200 });
  tone(c, { freq: 100, slideTo: 40, duration: 0.3, type: 'sawtooth', volume: 0.22 });
};

const playBazooka = () => {
  const c = getCtx(); if (!c) return;
  // Whoosh du tir
  noise(c, { duration: 0.35, volume: 0.3, filterFreq: 2000, filterType: 'bandpass', slideTo: 300 });
  // Grosse explosion basse-fréquence
  setTimeout(() => {
    noise(c, { duration: 0.9, volume: 0.7, filterFreq: 500, filterType: 'lowpass', slideTo: 50 });
    tone(c, { freq: 60, slideTo: 20, duration: 1.1, type: 'sawtooth', volume: 0.35 });
    tone(c, { freq: 120, slideTo: 40, duration: 0.9, type: 'triangle', volume: 0.25 });
  }, 300);
};

const playLaser = () => {
  const c = getCtx(); if (!c) return;
  tone(c, { freq: 1800, slideTo: 300, duration: 0.25, type: 'sawtooth', volume: 0.25 });
  tone(c, { freq: 3600, slideTo: 900, duration: 0.22, type: 'square', volume: 0.12 });
};

const playThrowknife = () => {
  const c = getCtx(); if (!c) return;
  // Swoosh aigu
  noise(c, { duration: 0.32, volume: 0.22, filterFreq: 3500, filterType: 'bandpass', slideTo: 800 });
};

const playKnife = () => {
  const c = getCtx(); if (!c) return;
  noise(c, { duration: 0.18, volume: 0.28, filterFreq: 5000, filterType: 'highpass', slideTo: 2000 });
  tone(c, { freq: 900, slideTo: 300, duration: 0.15, type: 'sawtooth', volume: 0.1 });
};

const playFlame = () => {
  const c = getCtx(); if (!c) return;
  noise(c, { duration: 0.6, volume: 0.35, filterFreq: 700, filterType: 'lowpass' });
};

const playGrenade = () => {
  const c = getCtx(); if (!c) return;
  playThrowknife();
  setTimeout(() => playBazooka(), 450);
};

const playCrossbow = () => {
  const c = getCtx(); if (!c) return;
  tone(c, { freq: 400, slideTo: 90, duration: 0.12, type: 'triangle', volume: 0.3 });
  noise(c, { duration: 0.18, volume: 0.15, filterFreq: 2000, filterType: 'bandpass' });
};

const playUzi = () => {
  const c = getCtx(); if (!c) return;
  // Pas courts, plus aigus
  noise(c, { duration: 0.05, volume: 0.3, filterFreq: 2500, filterType: 'bandpass' });
  tone(c, { freq: 260, slideTo: 120, duration: 0.08, type: 'square', volume: 0.15 });
};

const playExplosion = () => {
  const c = getCtx(); if (!c) return;
  noise(c, { duration: 1.0, volume: 0.55, filterFreq: 600, filterType: 'lowpass', slideTo: 40 });
  tone(c, { freq: 70, slideTo: 25, duration: 1.2, type: 'sawtooth', volume: 0.3 });
};

// Sons casino
const playChip = () => {
  const c = getCtx(); if (!c) return;
  tone(c, { freq: 1400, slideTo: 800, duration: 0.07, type: 'sine', volume: 0.2 });
  tone(c, { freq: 900, slideTo: 500, duration: 0.06, type: 'sine', volume: 0.12 });
};

// Son distinctif "VIP plaquette" : tintement métallique cristallin + résonance basse
const playVipChip = () => {
  const c = getCtx(); if (!c) return;
  tone(c, { freq: 2400, slideTo: 1700, duration: 0.12, type: 'sine', volume: 0.22 });
  tone(c, { freq: 1700, duration: 0.18, type: 'triangle', volume: 0.18 });
  setTimeout(() => tone(c, { freq: 3200, duration: 0.15, type: 'sine', volume: 0.1 }), 60);
  setTimeout(() => tone(c, { freq: 220, duration: 0.4, type: 'sine', volume: 0.08 }), 30);
};

const playCardDeal = () => {
  const c = getCtx(); if (!c) return;
  noise(c, { duration: 0.08, volume: 0.15, filterFreq: 4000, filterType: 'highpass' });
};

const playWin = () => {
  const c = getCtx(); if (!c) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => tone(c, { freq: f, duration: 0.2, type: 'triangle', volume: 0.3 }), i * 90);
  });
};

const playLose = () => {
  const c = getCtx(); if (!c) return;
  tone(c, { freq: 400, slideTo: 150, duration: 0.5, type: 'sawtooth', volume: 0.25 });
};

const playClick = () => {
  const c = getCtx(); if (!c) return;
  tone(c, { freq: 1200, duration: 0.04, type: 'square', volume: 0.1 });
};

// Ambiance casino : brouhaha synthé léger (filtered noise + légères cloches)
const startAmbience = () => {
  const c = getCtx(); if (!c || ambientNode) return;
  // Source de bruit continu
  const bufSize = c.sampleRate * 2;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const gain = c.createGain();
  gain.gain.value = 0.06;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();
  ambientNode = { src, gain };

  // Cloches aléatoires de slots toutes les 4-10s
  const randomBell = () => {
    if (!ambientNode) return;
    const freqs = [880, 1174, 1318];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    tone(c, { freq: f, duration: 0.12, type: 'sine', volume: 0.08 });
    setTimeout(randomBell, 4000 + Math.random() * 6000);
  };
  setTimeout(randomBell, 3000);
};

const stopAmbience = () => {
  if (!ambientNode) return;
  try { ambientNode.gain.gain.exponentialRampToValueAtTime(0.0001, (ctx?.currentTime || 0) + 0.3); } catch (_e) { /* noop */ }
  try { ambientNode.src.stop((ctx?.currentTime || 0) + 0.35); } catch (_e) { /* noop */ }
  ambientNode = null;
};

const setVolume = (v) => {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
};

const setEnabled = (v) => {
  enabled = !!v;
  if (masterGain) masterGain.gain.value = enabled ? 0.55 : 0;
  if (!enabled) stopAmbience();
};

const SOUNDS = {
  gun: playGun,
  shotgun: playShotgun,
  bazooka: playBazooka,
  laser: playLaser,
  throwknife: playThrowknife,
  knife: playKnife,
  machete: playKnife,
  flame: playFlame,
  flamethrower: playFlame,
  grenade: playGrenade,
  crossbow: playCrossbow,
  uzi: playUzi,
  laserrifle: playLaser,
  explosion: playExplosion,
  chip: playChip,
  vipChip: playVipChip,
  card: playCardDeal,
  win: playWin,
  lose: playLose,
  click: playClick,
};

const play = (name) => {
  if (!enabled) return;
  const fn = SOUNDS[name];
  if (fn) fn();
};

const sfx = {
  play,
  startAmbience,
  stopAmbience,
  setVolume,
  setEnabled,
  get enabled() { return enabled; },
};

export default sfx;
