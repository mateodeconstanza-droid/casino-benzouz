import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, SHORT_CATALOG } from '@/game/constants';

// =============================================================
// <Avatar3D> — preview Three.js d'un personnage 3D plus réaliste
// (proportions adultes, jawline, yeux + sourcils + nez + bouche,
// cheveux qui épousent la tête, vêtements avec col/manches).
// Auto-rotation pour montrer le perso de 3/4.
// Props : hair (id), outfit (id), shoes (id), short (id|null),
//         skin (hex), size (px largeur), interactive (bool drag).
// =============================================================
export const Avatar3D = ({
  hair = 0, outfit = 0, shoes = 0, short = null,
  skin = '#e0b48a', size = 220, interactive = true,
}) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const W = size;
    const H = Math.round(size * 1.45);

    const scene = new THREE.Scene();

    // ===== Camera (cadrée sur le perso, légèrement plongeante) =====
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
    camera.position.set(0, 1.55, 4.6);
    camera.lookAt(0, 1.45, 0);

    // ===== Renderer transparent =====
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ===== Lighting =====
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xfff5e0, 0.9);
    key.position.set(2.5, 4.5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8aa5d6, 0.45);
    fill.position.set(-3, 2, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd6a0, 0.55);
    rim.position.set(0, 3, -3);
    scene.add(rim);

    // ===== Plinthe ronde dégradée sous le perso (esthétique) =====
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x1a1820, roughness: 0.85, metalness: 0.2,
    });
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.08, 24), podiumMat);
    podium.position.y = 0.04;
    podium.receiveShadow = true;
    scene.add(podium);
    const podiumGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.005, 24),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.4 }),
    );
    podiumGlow.position.y = 0.085;
    scene.add(podiumGlow);

    // ===== Build character =====
    const character = buildCharacter({ hair, outfit, shoes, short, skin });
    character.position.y = 0.08;
    scene.add(character);

    // ===== Drag / auto-rotate =====
    let rafId;
    let t = 0;
    let manualRot = 0;
    let dragging = false;
    let lastX = 0;

    const onPointerDown = (e) => {
      if (!interactive) return;
      dragging = true;
      lastX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const cx = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const dx = cx - lastX;
      lastX = cx;
      manualRot += dx * 0.012;
    };
    const onPointerUp = () => { dragging = false; };

    if (interactive) {
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.style.cursor = 'grab';
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.012;
      const auto = Math.sin(t * 0.6) * 0.45;
      character.rotation.y = manualRot + (dragging ? 0 : auto);
      // Léger souffle (respiration du torse)
      character.scale.y = 1 + Math.sin(t * 1.3) * 0.005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      if (interactive) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      }
      // Dispose
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [hair, outfit, shoes, short, skin, size, interactive]);

  return (
    <div
      ref={mountRef}
      style={{
        width: size, height: Math.round(size * 1.45),
        display: 'inline-block',
      }}
    />
  );
};

// =============================================================
// buildCharacter — assemble le mesh du personnage
// =============================================================
const buildCharacter = ({ hair, outfit, shoes, short, skin }) => {
  const root = new THREE.Group();

  const hairItem = HAIR_CATALOG[hair] || HAIR_CATALOG[0];
  const outfitItem = OUTFIT_CATALOG[outfit] || OUTFIT_CATALOG[0];
  const shoesItem = SHOES_CATALOG[shoes] || SHOES_CATALOG[0];
  const shortItem = (short !== null && short !== undefined) ? (SHORT_CATALOG[short] || null) : null;

  // ===== Materials =====
  const skinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin), roughness: 0.65, metalness: 0.05,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hairItem.color), roughness: 0.55, metalness: 0.2,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(outfitItem.color), roughness: 0.78, metalness: 0.05,
  });
  const accentMat = outfitItem.accent
    ? new THREE.MeshStandardMaterial({
        color: new THREE.Color(outfitItem.accent),
        roughness: 0.6, metalness: 0.3,
        emissive: new THREE.Color(outfitItem.accent),
        emissiveIntensity: 0.05,
      })
    : null;
  const pantsMat = new THREE.MeshStandardMaterial({
    color: shortItem ? new THREE.Color(shortItem.color) : new THREE.Color(0x1a2a3a),
    roughness: 0.85, metalness: 0.05,
  });
  const shoesMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shoesItem.color), roughness: 0.7, metalness: 0.15,
  });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xfafaf6, roughness: 0.4 });
  const eyePupil = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.3 });
  const lipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin).multiplyScalar(0.65), roughness: 0.7,
  });
  const browMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hairItem.color).multiplyScalar(0.85), roughness: 0.7,
  });

  // ===== Pelvis (anchor) =====
  const pelvis = new THREE.Group();
  pelvis.position.y = 1.0;
  root.add(pelvis);

  // ===== Legs (slim, longer than cartoon) =====
  const legGeom = new THREE.CylinderGeometry(0.085, 0.07, 0.95, 12);
  legGeom.translate(0, -0.475, 0); // pivote depuis le haut
  for (let s = -1; s <= 1; s += 2) {
    const leg = new THREE.Mesh(legGeom, pantsMat);
    leg.position.set(s * 0.09, -0.05, 0);
    leg.castShadow = true;
    pelvis.add(leg);
    // Si short → portion supérieure habillée + portion inférieure peau
    if (shortItem) {
      // Le pant cylinder est habillé seulement sur les ~30% supérieurs (short)
      // Ici on remplace par 2 parties : short en haut + jambe nue en bas
      pelvis.remove(leg);
      const shortPart = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.085, 0.32, 12),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(shortItem.color), roughness: 0.85 }),
      );
      shortPart.position.set(s * 0.09, -0.21, 0);
      shortPart.castShadow = true;
      pelvis.add(shortPart);
      const skinLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.06, 0.65, 12),
        skinMat,
      );
      skinLeg.position.set(s * 0.09, -0.7, 0);
      skinLeg.castShadow = true;
      pelvis.add(skinLeg);
      // Mollet (subtle)
      const calf = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 10, 8),
        skinMat,
      );
      calf.scale.set(1, 1.4, 1);
      calf.position.set(s * 0.09, -0.7, 0.02);
      pelvis.add(calf);
      // Bande accent du short
      if (shortItem.accent) {
        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.097, 0.087, 0.06, 12),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(shortItem.accent), roughness: 0.6 }),
        );
        stripe.position.set(s * 0.09, -0.34, 0);
        pelvis.add(stripe);
      }
    }
  }

  // ===== Shoes (slim sneakers) =====
  for (let s = -1; s <= 1; s += 2) {
    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.09, 0.28),
      shoesMat,
    );
    shoe.position.set(s * 0.09, -1.0 + (shortItem ? 0 : 0), 0.05);
    shoe.castShadow = true;
    pelvis.add(shoe);
    // Semelle blanche
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.025, 0.285),
      new THREE.MeshStandardMaterial({ color: 0xf2eee0, roughness: 0.85 }),
    );
    sole.position.set(s * 0.09, -1.04, 0.05);
    pelvis.add(sole);
  }

  // ===== Torso (V-shape : épaules > taille) =====
  const torso = new THREE.Group();
  torso.position.y = 0.05;
  pelvis.add(torso);

  // Bas du torse (taille — étroit)
  const waist = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.18, 14),
    shirtMat,
  );
  waist.position.y = 0.09;
  waist.castShadow = true;
  torso.add(waist);
  // Haut du torse (poitrine — large)
  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.42, 14),
    shirtMat,
  );
  chest.position.y = 0.4;
  chest.castShadow = true;
  torso.add(chest);
  // Col en V
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.08, 0.06, 12),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfitItem.color).multiplyScalar(0.85), roughness: 0.7,
    }),
  );
  collar.position.y = 0.62;
  torso.add(collar);

  // ===== Outfit accents (Louis Vuitton motifs, foot stripes, costume) =====
  if (outfit === 10 && accentMat) {
    // LV motif : 2 bandes verticales dorées
    for (let s = -1; s <= 1; s += 2) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.42, 0.04), accentMat);
      band.position.set(s * 0.06, 0.4, 0.27);
      torso.add(band);
    }
  } else if (outfit === 11 && accentMat) {
    // Costume cravate : plastron blanc + cravate accent
    const shirt = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.32),
      new THREE.MeshStandardMaterial({ color: 0xf2eed8, roughness: 0.65 }),
    );
    shirt.position.set(0, 0.42, 0.281);
    torso.add(shirt);
    const tie = new THREE.Mesh(
      new THREE.PlaneGeometry(0.045, 0.3),
      accentMat,
    );
    tie.position.set(0, 0.42, 0.282);
    torso.add(tie);
  } else if ((outfit === 12 || outfit === 13 || outfit === 14) && accentMat) {
    // Maillots foot : bande horizontale colorée
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.281, 0.221, 0.07, 14, 1, true),
      accentMat,
    );
    stripe.position.y = (outfit === 13) ? 0.5 : 0.38;
    torso.add(stripe);
    // Numéro 10 sur le dos
    const num = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
    );
    num.position.set(0, 0.42, -0.282);
    num.rotation.y = Math.PI;
    torso.add(num);
  }

  // ===== Arms =====
  const armUpperGeom = new THREE.CylinderGeometry(0.075, 0.065, 0.45, 10);
  armUpperGeom.translate(0, -0.225, 0);
  const armLowerGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.45, 10);
  armLowerGeom.translate(0, -0.225, 0);
  for (let s = -1; s <= 1; s += 2) {
    // Manche (haut du bras)
    const sleeve = new THREE.Mesh(armUpperGeom, shirtMat);
    sleeve.position.set(s * 0.31, 0.55, 0);
    sleeve.rotation.z = -s * 0.12;
    sleeve.castShadow = true;
    torso.add(sleeve);
    // Avant-bras (peau)
    const fore = new THREE.Mesh(armLowerGeom, skinMat);
    fore.position.set(s * 0.36, 0.1, 0);
    fore.rotation.z = -s * 0.12;
    fore.castShadow = true;
    torso.add(fore);
    // Main (sphère légèrement aplatie)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), skinMat);
    hand.scale.set(1, 1.1, 0.85);
    hand.position.set(s * 0.4, -0.34, 0);
    torso.add(hand);
  }

  // ===== Neck =====
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.085, 0.13, 12),
    skinMat,
  );
  neck.position.y = 0.7;
  torso.add(neck);

  // ===== Head — proportions adultes (légèrement ovoïde) =====
  const head = new THREE.Group();
  head.position.y = 0.86;
  torso.add(head);

  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 18, 16),
    skinMat,
  );
  skull.scale.set(0.92, 1.05, 0.95); // un peu allongé verticalement
  skull.castShadow = true;
  head.add(skull);

  // Mâchoire / menton — petite forme triangulaire qui sort sous le crâne
  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    skinMat,
  );
  jaw.scale.set(0.88, 0.6, 0.9);
  jaw.position.y = -0.05;
  jaw.rotation.x = Math.PI; // hémisphère vers le bas
  head.add(jaw);

  // ===== Eyes (yeux blancs + pupille bleu sombre) =====
  for (let s = -1; s <= 1; s += 2) {
    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), eyeWhite);
    eyeBall.position.set(s * 0.055, 0.022, 0.135);
    head.add(eyeBall);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), eyePupil);
    pupil.position.set(s * 0.055, 0.022, 0.151);
    head.add(pupil);
  }

  // ===== Eyebrows =====
  for (let s = -1; s <= 1; s += 2) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.02), browMat);
    brow.position.set(s * 0.058, 0.062, 0.142);
    brow.rotation.z = -s * 0.12;
    head.add(brow);
  }

  // ===== Nose (petite pyramide) =====
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.022, 0.06, 4),
    skinMat,
  );
  nose.position.set(0, -0.005, 0.155);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);

  // ===== Mouth (lèvre fine) =====
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.012, 0.02),
    lipMat,
  );
  mouth.position.set(0, -0.063, 0.144);
  head.add(mouth);

  // ===== Ears =====
  for (let s = -1; s <= 1; s += 2) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), skinMat);
    ear.scale.set(0.55, 1.1, 1.0);
    ear.position.set(s * 0.155, 0.02, 0.005);
    head.add(ear);
  }

  // ===== Hair styles — par ID =====
  buildHair(head, hair, hairMat);

  return root;
};

// =============================================================
// buildHair — geometries différentes par ID de coupe
// =============================================================
const buildHair = (head, id, mat) => {
  switch (id) {
    case 1: { // Rasée
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.162, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
      );
      cap.scale.set(0.92, 1.05, 0.95);
      head.add(cap);
      break;
    }
    case 2: { // Afro
      const afro = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), mat);
      afro.scale.set(1.05, 0.95, 1.05);
      afro.position.y = 0.07;
      head.add(afro);
      // Texture bouclée : ajout de petites sphères autour
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        const yOff = Math.sin(i * 1.1) * 0.06;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), mat);
        ball.position.set(Math.cos(a) * 0.22, 0.07 + yOff, Math.sin(a) * 0.22);
        head.add(ball);
      }
      break;
    }
    case 3: { // Dreadlocks
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
        mat,
      );
      cap.scale.set(1, 1.05, 1);
      cap.position.y = 0.04;
      head.add(cap);
      // 12 mèches qui tombent
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const len = 0.35 + Math.random() * 0.2;
        const dread = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.018, len, 6),
          mat,
        );
        dread.position.set(
          Math.cos(a) * 0.16,
          -len / 2 - 0.02,
          Math.sin(a) * 0.16,
        );
        head.add(dread);
      }
      break;
    }
    case 4: { // Man bun
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
      );
      cap.scale.set(1, 1.05, 1);
      cap.position.y = 0.04;
      head.add(cap);
      // Le chignon
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), mat);
      bun.position.set(0, 0.1, -0.16);
      head.add(bun);
      // Élastique
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.012, 6, 14),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
      );
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.1, -0.105);
      head.add(band);
      break;
    }
    case 5: { // Crête punk (mohawk)
      const sidesMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
      const sides = new THREE.Mesh(
        new THREE.SphereGeometry(0.165, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
        sidesMat,
      );
      sides.scale.set(0.95, 1, 0.97);
      sides.position.y = 0.02;
      head.add(sides);
      // Crête : prismes alignés sur le sommet
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.025, 0.16, 4),
          mat,
        );
        spike.position.set(i * 0.04, 0.18, 0);
        spike.rotation.z = i * 0.08;
        head.add(spike);
      }
      break;
    }
    case 6: // Blonde surfeur (longue mèche)
    case 7: // Platine
    case 8: // Rose néon
    case 9: { // Dorés VIP — tous : coupe longue avec frange
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.185, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
        mat,
      );
      cap.scale.set(1.02, 1.05, 1.02);
      cap.position.y = 0.03;
      head.add(cap);
      // Frange / mèche avant
      const bang = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.05, 0.06),
        mat,
      );
      bang.position.set(0.04, 0.07, 0.135);
      bang.rotation.z = -0.18;
      head.add(bang);
      // Cheveux qui descendent un peu sur la nuque
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.07),
        mat,
      );
      back.position.set(0, -0.05, -0.13);
      head.add(back);
      // Si id 8 (rose néon) ou 9 (dorés VIP) → léger glow
      if (id === 8 || id === 9) {
        cap.material = cap.material.clone();
        cap.material.emissive = new THREE.Color(id === 8 ? 0xb44480 : 0xd4af37);
        cap.material.emissiveIntensity = 0.18;
      }
      break;
    }
    case 0:
    default: { // Classique : coupe courte qui suit le crâne
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.172, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
      );
      cap.scale.set(0.95, 1.0, 0.97);
      cap.position.y = 0.04;
      head.add(cap);
      // Frange courte
      const bang = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.04, 0.05),
        mat,
      );
      bang.position.set(0, 0.07, 0.13);
      bang.rotation.z = 0.05;
      head.add(bang);
      break;
    }
  }
};

export default Avatar3D;
