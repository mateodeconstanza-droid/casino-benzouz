import * as THREE from 'three';
import { HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, SHORT_CATALOG } from '@/game/constants';

// =============================================================
// buildPlayerCharacter — construit le mesh 3D du joueur, partagé
// entre la preview de création (Avatar3D), le lobby (Lobby3D) et
// les vues TPS. Garantit que le perso de création = celui in-game.
//
// Retourne un THREE.Group avec userData contenant les pivots
// d'animation : leftArm, rightArm, leftLeg, rightLeg, leftShoe,
// rightShoe (si applicables).
//
// Profile/options :
//   { hair, outfit, shoes, short, skin }
// =============================================================
export const buildPlayerCharacter = ({
  hair = 0, outfit = 0, shoes = 0, short = null, skin = '#e0b48a',
} = {}) => {
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
  const pantsColor = shortItem ? new THREE.Color(shortItem.color) : new THREE.Color(0x1a2a3a);
  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor, roughness: 0.85, metalness: 0.05,
  });
  const shoesMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shoesItem.color), roughness: 0.7, metalness: 0.15,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfafaf6, roughness: 0.4 });
  const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.3 });
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
  // Note : on stocke les jambes avec pivot en haut pour pouvoir les
  // tourner depuis la hanche pendant l'animation marche.
  let leftLeg, rightLeg;
  if (shortItem) {
    // Short → upper part avec couleur du short, lower part = peau
    for (let s = -1; s <= 1; s += 2) {
      const legGroup = new THREE.Group();
      legGroup.position.set(s * 0.09, -0.05, 0);
      pelvis.add(legGroup);
      // Short
      const shortPart = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.085, 0.32, 12),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(shortItem.color), roughness: 0.85 }),
      );
      shortPart.position.y = -0.16;
      shortPart.castShadow = true;
      legGroup.add(shortPart);
      // Bande accent
      if (shortItem.accent) {
        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.097, 0.087, 0.06, 12),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(shortItem.accent), roughness: 0.6 }),
        );
        stripe.position.y = -0.29;
        legGroup.add(stripe);
      }
      // Jambe peau
      const skinLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.06, 0.65, 12),
        skinMat,
      );
      skinLeg.position.y = -0.65;
      skinLeg.castShadow = true;
      legGroup.add(skinLeg);
      // Mollet (subtle bulge)
      const calf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skinMat);
      calf.scale.set(1, 1.4, 1);
      calf.position.set(0, -0.65, 0.02);
      legGroup.add(calf);
      if (s < 0) leftLeg = legGroup; else rightLeg = legGroup;
    }
  } else {
    for (let s = -1; s <= 1; s += 2) {
      const legGroup = new THREE.Group();
      legGroup.position.set(s * 0.09, -0.05, 0);
      pelvis.add(legGroup);
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.07, 0.95, 12),
        pantsMat,
      );
      leg.position.y = -0.475;
      leg.castShadow = true;
      legGroup.add(leg);
      if (s < 0) leftLeg = legGroup; else rightLeg = legGroup;
    }
  }

  // ===== Shoes (slim sneakers) =====
  let leftShoe, rightShoe;
  for (let s = -1; s <= 1; s += 2) {
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(s * 0.09, -1.0, 0.05);
    pelvis.add(shoeGroup);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.28), shoesMat);
    shoe.castShadow = true;
    shoeGroup.add(shoe);
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.025, 0.285),
      new THREE.MeshStandardMaterial({ color: 0xf2eee0, roughness: 0.85 }),
    );
    sole.position.y = -0.04;
    shoeGroup.add(sole);
    if (s < 0) leftShoe = shoeGroup; else rightShoe = shoeGroup;
  }

  // ===== Torso (V-shape : épaules > taille) =====
  const torso = new THREE.Group();
  torso.position.y = 0.05;
  pelvis.add(torso);

  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.18, 14), shirtMat);
  waist.position.y = 0.09;
  waist.castShadow = true;
  torso.add(waist);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 14), shirtMat);
  chest.position.y = 0.4;
  chest.castShadow = true;
  torso.add(chest);
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.08, 0.06, 12),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfitItem.color).multiplyScalar(0.85), roughness: 0.7,
    }),
  );
  collar.position.y = 0.62;
  torso.add(collar);

  // ===== Outfit accents =====
  if (outfit === 10 && accentMat) {
    for (let s = -1; s <= 1; s += 2) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.42, 0.04), accentMat);
      band.position.set(s * 0.06, 0.4, 0.27);
      torso.add(band);
    }
  } else if (outfit === 11 && accentMat) {
    const shirtPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.32),
      new THREE.MeshStandardMaterial({ color: 0xf2eed8, roughness: 0.65 }),
    );
    shirtPlate.position.set(0, 0.42, 0.281);
    torso.add(shirtPlate);
    const tie = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.3), accentMat);
    tie.position.set(0, 0.42, 0.282);
    torso.add(tie);
  } else if ((outfit === 12 || outfit === 13 || outfit === 14) && accentMat) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.281, 0.221, 0.07, 14, 1, true),
      accentMat,
    );
    stripe.position.y = (outfit === 13) ? 0.5 : 0.38;
    torso.add(stripe);
    const num = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
    );
    num.position.set(0, 0.42, -0.282);
    num.rotation.y = Math.PI;
    torso.add(num);
  }

  // ===== Arms (épaule = pivot pour animation) =====
  let leftArm, rightArm;
  for (let s = -1; s <= 1; s += 2) {
    const armGroup = new THREE.Group();
    armGroup.position.set(s * 0.31, 0.55, 0);
    torso.add(armGroup);
    // Manche (haut bras)
    const sleeveGeom = new THREE.CylinderGeometry(0.075, 0.065, 0.45, 10);
    sleeveGeom.translate(0, -0.225, 0);
    const sleeve = new THREE.Mesh(sleeveGeom, shirtMat);
    sleeve.rotation.z = -s * 0.12;
    sleeve.castShadow = true;
    armGroup.add(sleeve);
    // Avant-bras peau
    const foreGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.45, 10);
    foreGeom.translate(0, -0.225, 0);
    const fore = new THREE.Mesh(foreGeom, skinMat);
    fore.position.y = -0.45;
    fore.rotation.z = -s * 0.12;
    fore.castShadow = true;
    armGroup.add(fore);
    // Main
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), skinMat);
    hand.scale.set(1, 1.1, 0.85);
    hand.position.y = -0.89;
    hand.position.x = s * 0.05;
    armGroup.add(hand);
    if (s < 0) leftArm = armGroup; else rightArm = armGroup;
  }

  // ===== Neck =====
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.13, 12), skinMat);
  neck.position.y = 0.7;
  torso.add(neck);

  // ===== Head =====
  const head = new THREE.Group();
  head.position.y = 0.86;
  torso.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 16), skinMat);
  skull.scale.set(0.92, 1.05, 0.95);
  skull.castShadow = true;
  head.add(skull);

  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    skinMat,
  );
  jaw.scale.set(0.88, 0.6, 0.9);
  jaw.position.y = -0.05;
  jaw.rotation.x = Math.PI;
  head.add(jaw);

  // Eyes
  for (let s = -1; s <= 1; s += 2) {
    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), eyeWhiteMat);
    eyeBall.position.set(s * 0.055, 0.022, 0.135);
    head.add(eyeBall);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), eyePupilMat);
    pupil.position.set(s * 0.055, 0.022, 0.151);
    head.add(pupil);
  }
  // Eyebrows
  for (let s = -1; s <= 1; s += 2) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.02), browMat);
    brow.position.set(s * 0.058, 0.062, 0.142);
    brow.rotation.z = -s * 0.12;
    head.add(brow);
  }
  // Nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 4), skinMat);
  nose.position.set(0, -0.005, 0.155);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);
  // Mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.02), lipMat);
  mouth.position.set(0, -0.063, 0.144);
  head.add(mouth);
  // Ears
  for (let s = -1; s <= 1; s += 2) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), skinMat);
    ear.scale.set(0.55, 1.1, 1.0);
    ear.position.set(s * 0.155, 0.02, 0.005);
    head.add(ear);
  }

  // Hair styles (réutilise le module local)
  buildHair(head, hair, hairMat);

  // ===== Refs pour animation =====
  root.userData = { leftArm, rightArm, leftLeg, rightLeg, leftShoe, rightShoe, head, torso };
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
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const len = 0.38 + Math.abs(Math.sin(i * 1.7)) * 0.12;
        const dread = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.018, len, 6), mat,
        );
        dread.position.set(Math.cos(a) * 0.16, -len / 2 - 0.02, Math.sin(a) * 0.16);
        head.add(dread);
      }
      break;
    }
    case 4: { // Man bun
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat,
      );
      cap.scale.set(1, 1.05, 1);
      cap.position.y = 0.04;
      head.add(cap);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), mat);
      bun.position.set(0, 0.1, -0.16);
      head.add(bun);
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
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.16, 4), mat);
        spike.position.set(i * 0.04, 0.18, 0);
        spike.rotation.z = i * 0.08;
        head.add(spike);
      }
      break;
    }
    case 6: // Blonde surfeur
    case 7: // Platine
    case 8: // Rose néon
    case 9: { // Dorés VIP
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.185, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), mat,
      );
      cap.scale.set(1.02, 1.05, 1.02);
      cap.position.y = 0.03;
      head.add(cap);
      const bang = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.06), mat);
      bang.position.set(0.04, 0.07, 0.135);
      bang.rotation.z = -0.18;
      head.add(bang);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.07), mat);
      back.position.set(0, -0.05, -0.13);
      head.add(back);
      if (id === 8 || id === 9) {
        cap.material = cap.material.clone();
        cap.material.emissive = new THREE.Color(id === 8 ? 0xb44480 : 0xd4af37);
        cap.material.emissiveIntensity = 0.18;
      }
      break;
    }
    case 0:
    default: { // Classique
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.172, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat,
      );
      cap.scale.set(0.95, 1.0, 0.97);
      cap.position.y = 0.04;
      head.add(cap);
      const bang = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), mat);
      bang.position.set(0, 0.07, 0.13);
      bang.rotation.z = 0.05;
      head.add(bang);
      break;
    }
  }
};
