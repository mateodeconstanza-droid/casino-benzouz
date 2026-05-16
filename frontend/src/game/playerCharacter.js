import * as THREE from 'three';
import { HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, SHORT_CATALOG } from '@/game/constants';
import { roundedBox, softSphere, softCylinder, matMatte, matMetal } from '@/game/style';

// =============================================================
// buildPlayerCharacter — perso 3D unifié style GambleLife
// (GTA-cartoon : proportions marquées, tête expressive avec
// iris colorés, corps en V arrondi, vêtements à plis légers,
// matériaux mats, ombres portées). Réutilisé pour preview
// création de compte, lobby (TPS) et NPCs futurs.
//
// Retourne un THREE.Group avec userData :
//   { leftArm, rightArm, leftLeg, rightLeg, head, torso, eyes, mouth }
// pour permettre l'animation marche / parler / regards.
// =============================================================
export const buildPlayerCharacter = ({
  hair = 0, outfit = 0, shoes = 0, short = null, skin = '#e0b48a',
} = {}) => {
  const root = new THREE.Group();

  const hairItem = HAIR_CATALOG[hair] || HAIR_CATALOG[0];
  const outfitItem = OUTFIT_CATALOG[outfit] || OUTFIT_CATALOG[0];
  const shoesItem = SHOES_CATALOG[shoes] || SHOES_CATALOG[0];
  const shortItem = (short !== null && short !== undefined) ? (SHORT_CATALOG[short] || null) : null;

  const skinColor = new THREE.Color(skin);
  const skinDark  = skinColor.clone().multiplyScalar(0.78);
  const hairColor = new THREE.Color(hairItem.color);
  const shirtColor = new THREE.Color(outfitItem.color);
  const accentColor = outfitItem.accent ? new THREE.Color(outfitItem.accent) : null;

  // ===== Materials (mat / sans plastique brillant) =====
  const skinMat = matMatte(skinColor, { roughness: 0.7 });
  const skinShadowMat = matMatte(skinDark, { roughness: 0.75 });
  const hairMat = matMatte(hairColor, { roughness: 0.55, metalness: 0.15 });
  const shirtMat = matMatte(shirtColor, { roughness: 0.82 });
  const collarMat = matMatte(shirtColor.clone().multiplyScalar(0.78), { roughness: 0.85 });
  const accentMat = accentColor ? matMatte(accentColor, { roughness: 0.6, metalness: 0.25 }) : null;
  const pantsColor = shortItem ? new THREE.Color(shortItem.color) : new THREE.Color(0x1a2a3a);
  const pantsMat = matMatte(pantsColor, { roughness: 0.88 });
  const shoesMat = matMatte(new THREE.Color(shoesItem.color), { roughness: 0.7, metalness: 0.1 });
  const soleMat = matMatte(0xf2eee0, { roughness: 0.95 });
  const eyeWhiteMat = matMatte(0xfafaf2, { roughness: 0.3 });
  // Iris légèrement bleuâtre pour donner du caractère
  const irisMat = matMatte(0x3a6e98, { roughness: 0.4 });
  const pupilMat = matMatte(0x0a0e16, { roughness: 0.2 });
  // Lèvre légèrement rouge-rosé (pas fade)
  const lipColor = skinColor.clone().lerp(new THREE.Color(0xb84a4a), 0.45);
  const lipMat = matMatte(lipColor, { roughness: 0.6 });
  const browMat = matMatte(hairColor.clone().multiplyScalar(0.85), { roughness: 0.7 });

  // ===== Pelvis (anchor) — placé à y=1.0 m =====
  const pelvis = new THREE.Group();
  pelvis.position.y = 1.0;
  root.add(pelvis);

  // ===== Hips (forme arrondie) =====
  const hips = new THREE.Mesh(roundedBox(0.32, 0.18, 0.24, 0.08, 4), pantsMat);
  hips.position.y = 0;
  hips.castShadow = true;
  pelvis.add(hips);

  // ===== Legs (Group au pivot hanche pour animation) =====
  let leftLeg, rightLeg;
  for (let s = -1; s <= 1; s += 2) {
    const legGroup = new THREE.Group();
    legGroup.position.set(s * 0.09, -0.05, 0);
    pelvis.add(legGroup);

    if (shortItem) {
      // Short
      const shortPart = new THREE.Mesh(
        roundedBox(0.19, 0.32, 0.2, 0.07, 4),
        matMatte(new THREE.Color(shortItem.color), { roughness: 0.85 }),
      );
      shortPart.position.y = -0.16;
      shortPart.castShadow = true;
      legGroup.add(shortPart);
      if (shortItem.accent) {
        const stripe = new THREE.Mesh(
          softCylinder(0.097, 0.092, 0.04, 14),
          matMatte(new THREE.Color(shortItem.accent), { roughness: 0.6 }),
        );
        stripe.position.y = -0.30;
        legGroup.add(stripe);
      }
      // Cuisse (skin) sous le short
      const thigh = new THREE.Mesh(softCylinder(0.075, 0.07, 0.18, 14), skinMat);
      thigh.position.y = -0.42;
      thigh.castShadow = true;
      legGroup.add(thigh);
      // Mollet
      const calf = new THREE.Mesh(softCylinder(0.07, 0.058, 0.36, 14), skinMat);
      calf.position.y = -0.7;
      calf.castShadow = true;
      legGroup.add(calf);
      // Genou
      const knee = new THREE.Mesh(softSphere(0.075, 14, 10), skinMat);
      knee.position.y = -0.52;
      legGroup.add(knee);
    } else {
      // Pantalon entier — segmenté pour donner du volume
      const upperLeg = new THREE.Mesh(softCylinder(0.095, 0.08, 0.5, 14), pantsMat);
      upperLeg.position.y = -0.28;
      upperLeg.castShadow = true;
      legGroup.add(upperLeg);
      const lowerLeg = new THREE.Mesh(softCylinder(0.08, 0.07, 0.5, 14), pantsMat);
      lowerLeg.position.y = -0.78;
      lowerLeg.castShadow = true;
      legGroup.add(lowerLeg);
      // Genou (subtil renflement)
      const knee = new THREE.Mesh(softSphere(0.085, 12, 8), pantsMat);
      knee.position.y = -0.53;
      legGroup.add(knee);
    }

    if (s < 0) leftLeg = legGroup; else rightLeg = legGroup;
  }

  // ===== Shoes (rounded box pour côté "cartoon basket") =====
  let leftShoe, rightShoe;
  for (let s = -1; s <= 1; s += 2) {
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(s * 0.09, -1.02, 0.06);
    pelvis.add(shoeGroup);

    const shoeBody = new THREE.Mesh(
      roundedBox(0.18, 0.13, 0.32, 0.06, 4),
      shoesMat,
    );
    shoeBody.position.y = 0.0;
    shoeBody.castShadow = true;
    shoeGroup.add(shoeBody);

    // Semelle blanche débordante
    const sole = new THREE.Mesh(
      roundedBox(0.2, 0.05, 0.34, 0.025, 3),
      soleMat,
    );
    sole.position.y = -0.06;
    shoeGroup.add(sole);

    // Lacets / bande accent (or pour les chaussures or)
    if (shoesItem.color === '#d4af37') {
      const band = new THREE.Mesh(
        roundedBox(0.183, 0.04, 0.07, 0.02, 3),
        matMetal(0xd4af37, { roughness: 0.2 }),
      );
      band.position.set(0, 0.04, -0.05);
      shoeGroup.add(band);
    }

    if (s < 0) leftShoe = shoeGroup; else rightShoe = shoeGroup;
  }

  // ===== Torso (V-shape arrondi : taille fine, poitrine large) =====
  const torso = new THREE.Group();
  torso.position.y = 0.05;
  pelvis.add(torso);

  // Bas du torse (taille)
  const waist = new THREE.Mesh(roundedBox(0.36, 0.18, 0.24, 0.08, 4), shirtMat);
  waist.position.y = 0.09;
  waist.castShadow = true;
  torso.add(waist);

  // Poitrine (plus large) — utilise rounded box pour un aspect plus
  // "musclé/cartoon" qu'un cylindre
  const chest = new THREE.Mesh(roundedBox(0.56, 0.45, 0.32, 0.12, 4), shirtMat);
  chest.position.y = 0.42;
  chest.castShadow = true;
  torso.add(chest);

  // Encolure (col en U)
  const collar = new THREE.Mesh(softCylinder(0.13, 0.1, 0.07, 14), collarMat);
  collar.position.y = 0.65;
  torso.add(collar);

  // ===== Outfit accents (LV, costume, maillot foot) =====
  if (outfit === 10 && accentMat) {
    // Louis Vuitton : 2 bandes verticales dorées + petit écusson
    for (let s = -1; s <= 1; s += 2) {
      const band = new THREE.Mesh(roundedBox(0.025, 0.42, 0.04, 0.012, 3), accentMat);
      band.position.set(s * 0.07, 0.42, 0.17);
      torso.add(band);
    }
    const monogram = new THREE.Mesh(softSphere(0.025, 14, 12), matMetal(0xd4af37));
    monogram.position.set(0, 0.55, 0.165);
    torso.add(monogram);
  } else if (outfit === 11 && accentMat) {
    // Costume cravate
    const shirtPlate = new THREE.Mesh(
      roundedBox(0.20, 0.36, 0.02, 0.02, 3),
      matMatte(0xf2eed8, { roughness: 0.65 }),
    );
    shirtPlate.position.set(0, 0.42, 0.165);
    torso.add(shirtPlate);
    const tie = new THREE.Mesh(roundedBox(0.05, 0.3, 0.02, 0.012, 3), accentMat);
    tie.position.set(0, 0.42, 0.18);
    torso.add(tie);
    const tieKnot = new THREE.Mesh(roundedBox(0.07, 0.05, 0.03, 0.012, 3), accentMat);
    tieKnot.position.set(0, 0.6, 0.182);
    torso.add(tieKnot);
  } else if ((outfit === 12 || outfit === 13 || outfit === 14) && accentMat) {
    // Maillot foot : bande horizontale colorée
    const yLevel = (outfit === 13) ? 0.5 : 0.38;
    const stripe = new THREE.Mesh(
      roundedBox(0.565, 0.07, 0.325, 0.025, 3),
      accentMat,
    );
    stripe.position.y = yLevel;
    torso.add(stripe);
    // Numéro 10 imprimé au dos (plaque blanche)
    const num = new THREE.Mesh(
      roundedBox(0.18, 0.18, 0.005, 0.02, 3),
      matMatte(0xffffff, { roughness: 0.7 }),
    );
    num.position.set(0, 0.48, -0.165);
    torso.add(num);
  }

  // ===== Arms (Group au pivot épaule) =====
  let leftArm, rightArm;
  for (let s = -1; s <= 1; s += 2) {
    const armGroup = new THREE.Group();
    armGroup.position.set(s * 0.36, 0.58, 0);
    torso.add(armGroup);

    // Manche (haut bras) — légèrement inclinée vers l'extérieur
    const sleeve = new THREE.Mesh(softCylinder(0.085, 0.072, 0.42, 14), shirtMat);
    sleeve.position.y = -0.21;
    sleeve.rotation.z = -s * 0.08;
    sleeve.castShadow = true;
    armGroup.add(sleeve);

    // Coude
    const elbow = new THREE.Mesh(softSphere(0.075, 12, 10), shirtMat);
    elbow.position.y = -0.42;
    armGroup.add(elbow);

    // Avant-bras peau
    const fore = new THREE.Mesh(softCylinder(0.065, 0.055, 0.38, 14), skinMat);
    fore.position.y = -0.62;
    fore.rotation.z = -s * 0.08;
    fore.castShadow = true;
    armGroup.add(fore);

    // Main (sphère arrondie déformée — plus "ballon" qu'orbe nu)
    const hand = new THREE.Mesh(softSphere(0.07, 14, 12), skinMat);
    hand.scale.set(1, 1.15, 0.85);
    hand.position.set(s * 0.04, -0.85, 0);
    armGroup.add(hand);

    if (s < 0) leftArm = armGroup; else rightArm = armGroup;
  }

  // ===== Neck (cou visible) =====
  const neck = new THREE.Mesh(softCylinder(0.085, 0.09, 0.13, 14), skinMat);
  neck.position.y = 0.73;
  torso.add(neck);

  // ===== Head — légèrement plus grosse pour côté "cartoon GTA" =====
  const head = new THREE.Group();
  head.position.y = 0.92;
  torso.add(head);

  // Crâne — sphère légèrement écrasée verticalement (forme plus ovale)
  const skull = new THREE.Mesh(softSphere(0.20, 24, 18), skinMat);
  skull.scale.set(0.95, 1.04, 0.97);
  skull.castShadow = true;
  head.add(skull);

  // Mâchoire / menton
  const jaw = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    skinMat,
  );
  jaw.scale.set(0.92, 0.6, 0.92);
  jaw.position.y = -0.07;
  jaw.rotation.x = Math.PI;
  head.add(jaw);

  // Joues (subtle bumps pour donner du volume)
  for (let s = -1; s <= 1; s += 2) {
    const cheek = new THREE.Mesh(softSphere(0.05, 12, 10), skinMat);
    cheek.position.set(s * 0.13, -0.02, 0.13);
    head.add(cheek);
  }

  // ===== Eyes (yeux ronds et expressifs : sclère + iris coloré + pupille) =====
  const eyes = [];
  for (let s = -1; s <= 1; s += 2) {
    // Cavité oculaire (légère ombre)
    const socket = new THREE.Mesh(softSphere(0.038, 14, 12), skinShadowMat);
    socket.position.set(s * 0.07, 0.04, 0.165);
    socket.scale.set(1, 0.85, 0.5);
    head.add(socket);
    // Œil entier (white)
    const eyeBall = new THREE.Mesh(softSphere(0.032, 16, 14), eyeWhiteMat);
    eyeBall.position.set(s * 0.07, 0.04, 0.18);
    head.add(eyeBall);
    // Iris (bleu par défaut — plus tard variable selon profile.eyeColor)
    const iris = new THREE.Mesh(softSphere(0.018, 14, 12), irisMat);
    iris.position.set(s * 0.07, 0.04, 0.205);
    head.add(iris);
    // Pupille
    const pupil = new THREE.Mesh(softSphere(0.009, 12, 10), pupilMat);
    pupil.position.set(s * 0.07, 0.04, 0.215);
    head.add(pupil);
    eyes.push({ eyeBall, iris, pupil });
  }

  // ===== Eyebrows (en boîte arrondie inclinée) =====
  for (let s = -1; s <= 1; s += 2) {
    const brow = new THREE.Mesh(roundedBox(0.06, 0.014, 0.025, 0.005, 2), browMat);
    brow.position.set(s * 0.075, 0.10, 0.18);
    brow.rotation.z = -s * 0.18;
    head.add(brow);
  }

  // ===== Nose (cône long allongé pour silhouette plus adulte) =====
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.07, 6),
    skinMat,
  );
  nose.position.set(0, 0.0, 0.21);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);
  // Petite bille bout du nez
  const noseTip = new THREE.Mesh(softSphere(0.022, 12, 10), skinMat);
  noseTip.position.set(0, -0.03, 0.222);
  head.add(noseTip);

  // ===== Mouth (lèvre arrondie + ombre interne) =====
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.075, 0.2);
  head.add(mouthGroup);
  // Lèvre supérieure
  const upperLip = new THREE.Mesh(roundedBox(0.085, 0.014, 0.018, 0.006, 2), lipMat);
  upperLip.position.y = 0.008;
  mouthGroup.add(upperLip);
  // Lèvre inférieure (un poil plus large)
  const lowerLip = new THREE.Mesh(roundedBox(0.09, 0.018, 0.022, 0.008, 2), lipMat);
  lowerLip.position.y = -0.012;
  mouthGroup.add(lowerLip);
  // Petit espace sombre entre les deux (sourire neutre)
  const mouthShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.07, 0.005),
    matMatte(0x2a1a1a, { roughness: 0.95 }),
  );
  mouthShadow.position.y = -0.001;
  mouthShadow.position.z = 0.012;
  mouthGroup.add(mouthShadow);

  // ===== Ears (en losange arrondi) =====
  for (let s = -1; s <= 1; s += 2) {
    const ear = new THREE.Mesh(softSphere(0.035, 12, 10), skinMat);
    ear.scale.set(0.5, 1.2, 1.0);
    ear.position.set(s * 0.20, 0.02, 0.0);
    head.add(ear);
    // Conduit auditif (petite cavité)
    const earHole = new THREE.Mesh(softSphere(0.012, 8, 6), skinShadowMat);
    earHole.position.set(s * 0.21, 0.0, 0.0);
    head.add(earHole);
  }

  // Hair (varie par ID)
  buildHair(head, hair, hairMat);

  // ===== Refs animation =====
  root.userData = {
    leftArm, rightArm, leftLeg, rightLeg, leftShoe, rightShoe,
    head, torso, eyes, mouth: mouthGroup,
  };
  return root;
};

// =============================================================
// buildHair — coupes par ID (proportions adaptées à la nouvelle
// tête plus grosse : tous les rayons sont scalés ~×1.18).
// =============================================================
const buildHair = (head, id, mat) => {
  switch (id) {
    case 1: { // Rasée
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.196, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
      );
      cap.scale.set(0.96, 1.04, 0.97);
      head.add(cap);
      break;
    }
    case 2: { // Afro
      const afro = new THREE.Mesh(softSphere(0.27, 22, 18), mat);
      afro.scale.set(1.05, 0.95, 1.05);
      afro.position.y = 0.07;
      head.add(afro);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const yOff = Math.sin(i * 1.1) * 0.07;
        const ball = new THREE.Mesh(softSphere(0.06, 10, 8), mat);
        ball.position.set(Math.cos(a) * 0.27, 0.07 + yOff, Math.sin(a) * 0.27);
        head.add(ball);
      }
      break;
    }
    case 3: { // Dreadlocks
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.215, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.6),
        mat,
      );
      cap.scale.set(1, 1.05, 1);
      cap.position.y = 0.04;
      head.add(cap);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const len = 0.46 + Math.abs(Math.sin(i * 1.7)) * 0.14;
        const dread = new THREE.Mesh(softCylinder(0.025, 0.022, len, 8), mat);
        dread.position.set(Math.cos(a) * 0.19, -len / 2 - 0.02, Math.sin(a) * 0.19);
        head.add(dread);
      }
      break;
    }
    case 4: { // Man bun
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.205, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
      );
      cap.scale.set(1, 1.05, 1);
      cap.position.y = 0.04;
      head.add(cap);
      const bun = new THREE.Mesh(softSphere(0.1, 16, 12), mat);
      bun.position.set(0, 0.1, -0.19);
      head.add(bun);
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.045, 0.012, 6, 14),
        matMatte(0x1a1a1a),
      );
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.1, -0.13);
      head.add(band);
      break;
    }
    case 5: { // Crête punk (mohawk)
      const sidesMat = matMatte(0x1a1a1a, { roughness: 0.6 });
      const sides = new THREE.Mesh(
        new THREE.SphereGeometry(0.198, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
        sidesMat,
      );
      sides.scale.set(0.95, 1, 0.97);
      sides.position.y = 0.02;
      head.add(sides);
      for (let i = -2; i <= 2; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.18, 6), mat);
        spike.position.set(i * 0.04, 0.21, 0);
        spike.rotation.z = i * 0.08;
        head.add(spike);
      }
      break;
    }
    case 6:
    case 7:
    case 8:
    case 9: { // Coupe longue avec frange — variantes blonde/platine/rose/or
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.225, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62),
        mat,
      );
      cap.scale.set(1.02, 1.05, 1.02);
      cap.position.y = 0.03;
      head.add(cap);
      // Frange
      const bang = new THREE.Mesh(roundedBox(0.32, 0.06, 0.07, 0.025, 3), mat);
      bang.position.set(0.04, 0.10, 0.17);
      bang.rotation.z = -0.18;
      head.add(bang);
      // Cheveux nuque
      const back = new THREE.Mesh(roundedBox(0.32, 0.22, 0.08, 0.03, 3), mat);
      back.position.set(0, -0.05, -0.16);
      head.add(back);
      // Glow néon pour rose / VIP
      if (id === 8 || id === 9) {
        cap.material = cap.material.clone();
        cap.material.emissive = new THREE.Color(id === 8 ? 0xb44480 : 0xd4af37);
        cap.material.emissiveIntensity = 0.22;
      }
      break;
    }
    case 0:
    default: { // Classique
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
        mat,
      );
      cap.scale.set(0.96, 1.0, 0.98);
      cap.position.y = 0.04;
      head.add(cap);
      // Frange courte
      const bang = new THREE.Mesh(roundedBox(0.24, 0.05, 0.06, 0.02, 3), mat);
      bang.position.set(0, 0.10, 0.165);
      bang.rotation.z = 0.05;
      head.add(bang);
      break;
    }
  }
};

// =============================================================
// buildPlayerCharacterLite — VERSION OPTIMISÉE pour les remote players
// (multijoueur). ~10 meshes au lieu de 65. Garde la couleur de skin,
// outfit, hair, shoes — visuellement reconnaissable mais ultra léger.
// Utilisé quand on rend ≥ 5 avatars distants simultanés.
//
// Retourne THREE.Group avec userData : { leftArm, rightArm, leftLeg,
// rightLeg } compatibles avec l'animation de marche existante.
// =============================================================
export const buildPlayerCharacterLite = ({
  hair = 0, outfit = 0, shoes = 0, skin = '#e0b48a',
} = {}) => {
  const root = new THREE.Group();
  const skinHex = typeof skin === 'string' && skin.startsWith('#')
    ? parseInt(skin.slice(1), 16) : 0xe0b48a;
  const outfitDef = OUTFIT_CATALOG[outfit] || OUTFIT_CATALOG[0];
  const hairDef = HAIR_CATALOG[hair] || HAIR_CATALOG[0];
  const shoeDef = SHOES_CATALOG[shoes] || SHOES_CATALOG[0];
  const outfitHex = parseInt((outfitDef.color || '#888').slice(1), 16);
  const hairHex = parseInt((hairDef.color || '#222').slice(1), 16);
  const shoeHex = parseInt((shoeDef.color || '#222').slice(1), 16);

  const matSkin = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
  const matOutfit = new THREE.MeshStandardMaterial({ color: outfitHex, roughness: 0.7 });
  const matHair = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.7 });
  const matShoes = new THREE.MeshStandardMaterial({ color: shoeHex, roughness: 0.5 });

  // 1. Torse (capsule outfit color)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 8), matOutfit);
  torso.position.y = 1.1;
  root.add(torso);

  // 2. Tête (sphère skin)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), matSkin);
  head.position.y = 1.75;
  root.add(head);

  // 3. Cheveux (demi-sphère hair color, sauf rasée id=1)
  if (hair !== 1) {
    const hairMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2),
      matHair
    );
    hairMesh.position.y = 1.78;
    root.add(hairMesh);
  }

  // 4-5. Bras gauche / droit (pivotés depuis l'épaule)
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.4, 4, 6);
  const leftArm = new THREE.Group(); // pivot épaule
  leftArm.position.set(-0.32, 1.4, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, matSkin);
  leftArmMesh.position.y = -0.25;
  leftArm.add(leftArmMesh);
  root.add(leftArm);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 1.4, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, matSkin);
  rightArmMesh.position.y = -0.25;
  rightArm.add(rightArmMesh);
  root.add(rightArm);

  // 6-7. Jambes (cylindres outfit color)
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.5, 4, 6);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.14, 0.75, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, matOutfit);
  leftLegMesh.position.y = -0.3;
  leftLeg.add(leftLegMesh);
  root.add(leftLeg);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.14, 0.75, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, matOutfit);
  rightLegMesh.position.y = -0.3;
  rightLeg.add(rightLegMesh);
  root.add(rightLeg);

  // 8-9. Chaussures (petites box shoe color)
  const shoeGeo = new THREE.BoxGeometry(0.16, 0.08, 0.24);
  const leftShoe = new THREE.Mesh(shoeGeo, matShoes);
  leftShoe.position.set(-0.14, 0.04, 0.04);
  root.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeo, matShoes);
  rightShoe.position.set(0.14, 0.04, 0.04);
  root.add(rightShoe);

  root.userData = { leftArm, rightArm, leftLeg, rightLeg, head, torso };
  return root;
};
