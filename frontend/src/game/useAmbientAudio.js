import { useEffect, useRef } from 'react';

// ============================================================
// useAmbientAudio — hook partagé pour ambiances sonores procédurales
// Utilise WebAudio API (pas de fichiers externes) → 0 KB de bundle
//
// Usage:
//   const audioRef = useRef({ player: { x, z, y } });
//   useAmbientAudio({
//     stateRef: audioRef,
//     layers: [
//       { type: 'wind',    target: (p) => p.y > 1 ? 0.18 : 0 },
//       { type: 'waves',   target: (p) => p.x > 75 ? 0.25 : 0 },
//       { type: 'seagull', target: (p) => p.x > 70 ? 0.12 : 0, oneshot: true },
//       { type: 'crowd',   target: (p) => 0.1 },
//       { type: 'horn',    target: (p) => p.x < 70 ? 0.05 : 0, oneshot: true },
//     ],
//   });
// ============================================================

const buildLayer = (ctx, type) => {
  const sampleRate = ctx.sampleRate;

  if (type === 'wind') {
    const buf = ctx.createBuffer(1, sampleRate * 4, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 600;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
    return { src, gain };
  }

  if (type === 'waves') {
    // Vagues : bruit basse fréquence + modulation amplitude lente
    const buf = ctx.createBuffer(1, sampleRate * 6, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const wave = Math.sin(t * 2 * Math.PI * 0.5) * 0.5 + Math.sin(t * 2 * Math.PI * 0.3) * 0.5;
      data[i] = (Math.random() * 2 - 1) * 0.5 * (0.4 + 0.6 * Math.abs(wave));
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
    return { src, gain };
  }

  if (type === 'crowd') {
    // Foule de casino : multiples voix superposées (pink noise + filtres)
    const buf = ctx.createBuffer(1, sampleRate * 5, sampleRate);
    const data = buf.getChannelData(0);
    let lastVal = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      lastVal = (lastVal * 0.97 + white * 0.03);
      data[i] = lastVal * 0.3;
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 1.5;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start();
    return { src, gain };
  }

  return null;
};

const playOneshot = (ctx, type, gainVal = 0.1) => {
  if (type === 'seagull') {
    // Cri de mouette : 2-3 notes décroissantes
    const notes = [880, 660, 550];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.1);
      const start = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gainVal * 0.6, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.4);
    });
  } else if (type === 'horn') {
    // Klaxon de voiture : 2 notes courtes (couplet majeur)
    [440, 554.37].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gainVal * 0.5, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.18);
    });
  }
};

export const useAmbientAudio = ({ stateRef, layers, enabled = true }) => {
  const ctxRef = useRef(null);
  const layerRefs = useRef([]);
  const oneshotTimers = useRef([]);

  useEffect(() => {
    if (!enabled) return;
    let raf;
    let ctx;
    const localOneshotTimers = [];
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      // Init des couches continues
      layerRefs.current = layers.map(layer => {
        if (layer.oneshot) return null;
        return buildLayer(ctx, layer.type);
      });
      // Boucle de mise à jour des volumes
      const tick = () => {
        const p = stateRef.current?.player;
        if (p) {
          layers.forEach((layer, idx) => {
            if (layer.oneshot) return;
            const node = layerRefs.current[idx];
            if (!node) return;
            const target = layer.target(p);
            node.gain.gain.value = node.gain.gain.value + (target - node.gain.gain.value) * 0.04;
          });
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // One-shots aléatoires
      layers.forEach((layer, idx) => {
        if (!layer.oneshot) return;
        const schedule = () => {
          const p = stateRef.current?.player;
          if (p) {
            const target = layer.target(p);
            if (target > 0.02) playOneshot(ctx, layer.type, target);
          }
          // Re-schedule dans 4-12s
          const t = setTimeout(schedule, 4000 + Math.random() * 8000);
          localOneshotTimers.push(t);
          oneshotTimers.current[idx] = t;
        };
        const t0 = setTimeout(schedule, 2000 + Math.random() * 4000);
        localOneshotTimers.push(t0);
        oneshotTimers.current[idx] = t0;
      });
    } catch (_e) { /* noop */ }
    return () => {
      try {
        if (raf) cancelAnimationFrame(raf);
        localOneshotTimers.forEach(t => clearTimeout(t));
        layerRefs.current.forEach(node => { if (node?.src) try { node.src.stop(); } catch (_e) { /* noop */ } });
        if (ctx && ctx.state !== 'closed') ctx.close();
      } catch (_e) { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
};

export default useAmbientAudio;
