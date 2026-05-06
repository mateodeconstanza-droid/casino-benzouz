import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// =============================================================
// GambleLife — Style guide unifié (palette + helpers 3D)
// Inspiration : GTA Vice City × Animal Crossing.
// Tout ce qui touche à l'apparence du jeu (perso, bâtiments,
// véhicules, mobilier) doit s'aligner sur ce module.
// =============================================================

// ── Palette principale (limitée volontairement pour cohérence) ──
export const PALETTE = {
  // Ciel / atmosphère
  skyTop:     0x4dbfff,
  skyBottom:  0xffd9b3,
  fog:        0xc6d8e8,
  sunWarm:    0xffe1b8,
  sunCool:    0x9bc2e6,

  // Bâtiments / sol
  asphalt:    0x4a4a52,
  sidewalk:   0xc9c4b8,
  grass:      0x7bc46c,
  sand:       0xefd9a8,
  sea:        0x2899c7,

  // Casino / accents luxe
  gold:       0xd4af37,
  goldBright: 0xfff0a8,
  goldDark:   0x8b6914,
  cream:      0xf6e8c5,
  burgundy:   0x8b1f2b,
  emerald:    0x148f5b,

  // Bois / matériaux naturels
  wood:       0x8a5a32,
  woodDark:   0x4a2a14,
  marble:     0xefe6d2,

  // Néons / nuit
  neonPink:   0xff2a8a,
  neonCyan:   0x3fe6ff,
  neonPurple: 0xa46cff,

  // Caractère / peau
  darkInk:    0x1a1820,
};

// ── Géométrie : RoundedBox réutilisable (cache pour perf) ──
const _boxCache = new Map();
export const roundedBox = (w, h, d, radius = 0.12, segments = 4) => {
  const key = `${w}|${h}|${d}|${radius}|${segments}`;
  if (!_boxCache.has(key)) {
    _boxCache.set(key, new RoundedBoxGeometry(w, h, d, segments, radius));
  }
  return _boxCache.get(key);
};

// ── Sphère lisse haute résolution (caractère, fruits, etc.) ──
const _sphereCache = new Map();
export const softSphere = (radius, widthSeg = 24, heightSeg = 18) => {
  const key = `${radius}|${widthSeg}|${heightSeg}`;
  if (!_sphereCache.has(key)) {
    _sphereCache.set(key, new THREE.SphereGeometry(radius, widthSeg, heightSeg));
  }
  return _sphereCache.get(key);
};

// ── Cylindre arrondi (membres, tronc, lampes) ──
const _cylinderCache = new Map();
export const softCylinder = (rTop, rBottom, height, radial = 16) => {
  const key = `${rTop}|${rBottom}|${height}|${radial}`;
  if (!_cylinderCache.has(key)) {
    _cylinderCache.set(key, new THREE.CylinderGeometry(rTop, rBottom, height, radial));
  }
  return _cylinderCache.get(key);
};

// ── Material factory : style "toon-réaliste" GambleLife ──
// Privilégie :
//   - faible spéculaire (pas de plastique brillant)
//   - léger métalness sur les accents (or, chrome)
//   - emissive doux pour les surfaces "magiques" (néons, mer)
// Évite :
//   - les valeurs metalness > 0.4 sauf pour or/chrome
//   - les couleurs cyber-noires pures sans nuance
// On omet `emissive`/`emissiveIntensity` quand non demandés sinon
// MeshStandardMaterial déclenche un warning "parameter 'emissive' has
// value of undefined" pour chaque material créé.
const buildStdParams = (color, opts) => {
  const params = {
    color: new THREE.Color(color),
    roughness: opts.roughness ?? 0.78,
    metalness: opts.metalness ?? 0.05,
  };
  if (opts.emissive !== undefined && opts.emissive !== null) {
    params.emissive = new THREE.Color(opts.emissive);
    params.emissiveIntensity = opts.emissiveIntensity ?? 0.5;
  }
  return params;
};

export const matMatte = (color, opts = {}) =>
  new THREE.MeshStandardMaterial(buildStdParams(color, opts));

export const matMetal = (color, opts = {}) =>
  new THREE.MeshStandardMaterial(buildStdParams(color, {
    roughness: opts.roughness ?? 0.25,
    metalness: opts.metalness ?? 0.85,
    emissive: opts.emissive,
    emissiveIntensity: opts.emissiveIntensity,
  }));

// "Soft glow" : material légèrement émissif (pour néons, écrans, mer)
export const matGlow = (color, intensity = 0.35) => {
  const c = new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: c, roughness: 0.5, metalness: 0.1,
    emissive: c, emissiveIntensity: intensity,
  });
};

// ── Setup standard d'éclairage scène extérieure (jour Vice City) ──
// Retourne les lights pour qu'elles soient ajoutées à scene + utilisables
// pour anim (cycle jour/nuit etc.).
export const setupOutdoorLighting = (scene) => {
  // Hemisphere : ciel chaud + sol pour ambient quasi-toon
  const hemi = new THREE.HemisphereLight(PALETTE.skyTop, PALETTE.sand, 0.55);
  scene.add(hemi);

  // Soleil principal (warm yellow)
  const sun = new THREE.DirectionalLight(PALETTE.sunWarm, 1.15);
  sun.position.set(60, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // Fill cool (sky bounce)
  const fill = new THREE.DirectionalLight(PALETTE.sunCool, 0.4);
  fill.position.set(-50, 30, -30);
  scene.add(fill);

  // Ambient global doux
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  return { hemi, sun, fill };
};

// ── Ciel : grand dôme dégradé (skyTop → skyBottom) ──
export const createSkyDome = () => {
  const geo = new THREE.SphereGeometry(500, 32, 16);
  // Inverse les normales pour rendu intérieur
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      topColor:    { value: new THREE.Color(PALETTE.skyTop) },
      bottomColor: { value: new THREE.Color(PALETTE.skyBottom) },
      offset:      { value: 33 },
      exponent:    { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
};

// ── Brouillard atmosphérique standard ──
export const setupFog = (scene, density = 'normal') => {
  const map = {
    light:  { near: 60, far: 320, color: PALETTE.fog },
    normal: { near: 40, far: 240, color: PALETTE.fog },
    dense:  { near: 20, far: 140, color: PALETTE.fog },
  };
  const cfg = map[density] || map.normal;
  scene.fog = new THREE.Fog(cfg.color, cfg.near, cfg.far);
};

// ── Helpers à exposer pour code legacy qui veut un look cohérent ──
export const STYLE_HELPERS = {
  PALETTE,
  roundedBox, softSphere, softCylinder,
  matMatte, matMetal, matGlow,
  setupOutdoorLighting, createSkyDome, setupFog,
};
