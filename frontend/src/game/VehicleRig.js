import * as THREE from 'three';
import { PALETTE, roundedBox, matMatte, matMetal, matGlow } from '@/game/style';

// =============================================================
// buildVehicleRig(vehicleId)
// Retourne un THREE.Group qui contient le véhicule + le rider.
// Le rig doit être positionné à la position du joueur dans la boucle FPS,
// avec rig.rotation.y = -playerRotY pour suivre la direction de la caméra.
// L'animation (roues, balance) est gérée par le parent via .userData.parts :
//   - wheels[] : cylindres tournant autour de X (skateboard/bike/quad)
//   - riderLegL / riderLegR : pour simuler le pédalage
//   - riderArmL / riderArmR
//   - glow : halo sol pour hoverboard
// =============================================================
export const buildVehicleRig = (vehicleId) => {
  const rig = new THREE.Group();
  rig.userData = { vehicleId, parts: { wheels: [] } };

  // ---- Rider (mini perso standardisé) ----
  const rider = buildMiniRider();
  rig.add(rider);
  rig.userData.parts.rider = rider;
  rig.userData.parts.riderLegL = rider.userData.legL;
  rig.userData.parts.riderLegR = rider.userData.legR;
  rig.userData.parts.riderArmL = rider.userData.armL;
  rig.userData.parts.riderArmR = rider.userData.armR;
  rig.userData.parts.riderRoot = rider;

  // ─── Helpers communs ─────────────────────────────────────────────
  // fix-rendering : `clearcoat` (et `clearcoatRoughness`) → MeshPhysicalMaterial
  // pour les surfaces peintes (carrosserie GTA V), sinon Standard normal.
  const _mkMat = (color, opts = {}) => {
    if (opts.clearcoat != null) {
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: opts.metalness ?? 0.5,
        roughness: opts.roughness ?? 0.4,
        clearcoat: opts.clearcoat,
        clearcoatRoughness: opts.clearcoatRoughness ?? 0.08,
        emissive: opts.emissive,
        emissiveIntensity: opts.emissiveIntensity || 0,
      });
    }
    return new THREE.MeshStandardMaterial({
      color,
      metalness: opts.metalness ?? 0.3,
      roughness: opts.roughness ?? 0.7,
      emissive: opts.emissive,
      emissiveIntensity: opts.emissiveIntensity || 0,
    });
  };
  const addCylinder = (parent, r1, r2, h, color, opts = {}) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r1, r2, h, opts.radial || 14),
      _mkMat(color, opts),
    );
    parent.add(m);
    return m;
  };
  const addBox = (parent, w, h, d, color, opts = {}) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      _mkMat(color, opts),
    );
    parent.add(m);
    return m;
  };

  // =============================================================
  // SKATEBOARD : deck en érable, grip tape noir, trucks chromés,
  // roues blanches en uréthane avec roulements dorés.
  // =============================================================
  if (vehicleId === 'skateboard') {
    const board = new THREE.Group();
    rig.add(board);

    // Deck en érable (warm brown), rounded box
    const deckMat = matMatte(PALETTE.wood, { roughness: 0.78 });
    const main = new THREE.Mesh(roundedBox(1.6, 0.045, 0.46, 0.04, 3), deckMat);
    main.position.set(0, 0.13, 0);
    board.add(main);
    // Kick tail / kick nose (extrémités relevées)
    for (let s = -1; s <= 1; s += 2) {
      const kick = new THREE.Mesh(roundedBox(0.32, 0.045, 0.46, 0.04, 3), deckMat);
      kick.position.set(s * 0.86, 0.18, 0);
      kick.rotation.z = -s * 0.22;
      board.add(kick);
    }

    // Grip tape noir mat sur tout le dessus
    const gripMat = matMatte(PALETTE.darkInk, { roughness: 0.97 });
    const grip = new THREE.Mesh(roundedBox(2.2, 0.005, 0.43, 0.02, 2), gripMat);
    grip.position.set(0, 0.155, 0);
    board.add(grip);

    // Trucks en aluminium chromé
    const truckMat = new THREE.MeshStandardMaterial({ color: 0xb6b8bc, metalness: 0.85, roughness: 0.25 });
    for (let s = -1; s <= 1; s += 2) {
      // Baseplate
      addBox(board, 0.28, 0.04, 0.08, 0xb6b8bc, { metalness: 0.85, roughness: 0.25 })
        .position.set(s * 0.62, 0.105, 0);
      // Hanger triangulaire
      const hanger = addBox(board, 0.07, 0.07, 0.42, 0x8c8e92, { metalness: 0.9, roughness: 0.2 });
      hanger.position.set(s * 0.62, 0.075, 0);
      // Axle horizontal traversant
      const axle = addCylinder(board, 0.018, 0.018, 0.5, 0xd0d3d8, { metalness: 0.95, roughness: 0.15 });
      axle.rotation.z = Math.PI / 2;
      axle.position.set(s * 0.62, 0.07, 0);
    }

    // 4 roues uréthane blanches avec roulements dorés visibles
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.55, metalness: 0.1 });
    const bearingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sz = -1; sz <= 1; sz += 2) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 16), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx * 0.62, 0.075, sz * 0.20);
        board.add(wheel);
        rig.userData.parts.wheels.push(wheel);
        // Roulement central
        const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.085, 10), bearingMat);
        bearing.rotation.z = Math.PI / 2;
        bearing.position.set(sx * 0.62, 0.075, sz * 0.20);
        board.add(bearing);
      }
    }

    // Rider debout sur le skate (pieds écartés, légère flexion)
    rider.position.set(0, 0.18, 0);
    return rig;
  }

  // =============================================================
  // VÉLO : cadre triangulaire chrome, fourche avant, 2 roues à
  // rayons fins, pédalier + plateau, selle cuir, guidon courbé.
  // =============================================================
  if (vehicleId === 'bike') {
    // fix-rendering : carrosserie peinte GTA V (clearcoat = vernis transparent)
    const frameMat = new THREE.MeshPhysicalMaterial({ color: 0xb43229, metalness: 0.7, roughness: 0.3, clearcoat: 1.0, clearcoatRoughness: 0.06 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.6, roughness: 0.5 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd2d4d8, metalness: 0.95, roughness: 0.18 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.75 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.85, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.2 });

    // ── Cadre triangulaire (top tube, down tube, seat tube) ──
    const topTube = addCylinder(rig, 0.04, 0.04, 0.85, 0xb43229, { metalness: 0.7, roughness: 0.3 });
    topTube.rotation.z = Math.PI / 2;
    topTube.position.set(0.05, 0.95, 0);

    const downTube = addCylinder(rig, 0.045, 0.045, 1.0, 0xb43229, { metalness: 0.7, roughness: 0.3 });
    downTube.rotation.z = Math.PI / 2.6; // descente vers pédalier
    downTube.position.set(-0.1, 0.7, 0);

    const seatTube = addCylinder(rig, 0.04, 0.04, 0.7, 0xb43229, { metalness: 0.7, roughness: 0.3 });
    seatTube.position.set(-0.55, 0.6, 0);
    seatTube.rotation.z = -0.18;

    // Chain stays (vers roue arrière)
    for (let sz = -1; sz <= 1; sz += 2) {
      const cs = addCylinder(rig, 0.025, 0.025, 0.7, 0xb43229, { metalness: 0.7, roughness: 0.3 });
      cs.rotation.z = Math.PI / 2;
      cs.position.set(-0.85, 0.32, sz * 0.06);
    }
    // Seat stays (vers selle)
    for (let sz = -1; sz <= 1; sz += 2) {
      const ss = addCylinder(rig, 0.022, 0.022, 0.78, 0xb43229, { metalness: 0.7, roughness: 0.3 });
      ss.rotation.z = -1.05;
      ss.position.set(-0.7, 0.62, sz * 0.06);
    }

    // ── Fourche avant ──
    const headTube = addCylinder(rig, 0.05, 0.05, 0.32, 0x111111, { metalness: 0.85, roughness: 0.2 });
    headTube.position.set(0.6, 0.92, 0);
    headTube.rotation.z = -0.18;
    for (let sz = -1; sz <= 1; sz += 2) {
      const fork = addCylinder(rig, 0.022, 0.022, 0.55, 0x222226, { metalness: 0.85, roughness: 0.25 });
      fork.position.set(0.62, 0.55, sz * 0.06);
      fork.rotation.z = -0.18;
    }

    // ── Guidon courbé ──
    const stem = addCylinder(rig, 0.04, 0.04, 0.18, 0x222226, { metalness: 0.85 });
    stem.rotation.z = -0.18;
    stem.position.set(0.65, 1.06, 0);
    const handlebar = addCylinder(rig, 0.025, 0.025, 0.55, 0x111111, { metalness: 0.85 });
    handlebar.rotation.x = Math.PI / 2;
    handlebar.position.set(0.7, 1.13, 0);
    // Poignées caoutchouc
    for (let sz = -1; sz <= 1; sz += 2) {
      const grip = addCylinder(rig, 0.034, 0.034, 0.13, 0x141414, { roughness: 0.95 });
      grip.rotation.x = Math.PI / 2;
      grip.position.set(0.7, 1.13, sz * 0.21);
    }

    // ── Selle ──
    const seat = addBox(rig, 0.36, 0.07, 0.18, 0x222226, { roughness: 0.75 });
    seat.position.set(-0.55, 1.04, 0);
    const seatPost = addCylinder(rig, 0.025, 0.025, 0.4, 0x141414);
    seatPost.position.set(-0.55, 0.83, 0);

    // ── Pédalier (chainring + pédales) ──
    const chainring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.025, 18),
      chromeMat,
    );
    chainring.rotation.z = Math.PI / 2;
    chainring.position.set(0, 0.32, 0);
    rig.add(chainring);
    rig.userData.parts.pedal = chainring;
    // Crank arms
    for (let sz = -1; sz <= 1; sz += 2) {
      const crank = addBox(rig, 0.08, 0.18, 0.025, 0x141414, { metalness: 0.6 });
      crank.position.set(0, 0.32, sz * 0.07);
      // pédale
      const pedal = addBox(rig, 0.12, 0.02, 0.07, 0x141414);
      pedal.position.set(0.05, 0.23, sz * 0.13);
    }

    // ── Roues à rayons (12 rayons par roue) ──
    const buildSpokedWheel = (cx, cy, cz) => {
      const w = new THREE.Group();
      // Pneu (torus)
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 22), tireMat);
      tire.rotation.y = Math.PI / 2;
      w.add(tire);
      // Jante chromée
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 6, 22), rimMat);
      rim.rotation.y = Math.PI / 2;
      w.add(rim);
      // Rayons fins
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, 0.55, 6),
          chromeMat,
        );
        spoke.position.set(0, Math.sin(a) * 0.14, Math.cos(a) * 0.14);
        spoke.rotation.x = a;
        w.add(spoke);
      }
      // Moyeu central
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10),
        chromeMat,
      );
      hub.rotation.z = Math.PI / 2;
      w.add(hub);
      w.position.set(cx, cy, cz);
      return w;
    };
    const wheelF = buildSpokedWheel(0.7, 0.34, 0);
    rig.add(wheelF);
    rig.userData.parts.wheels.push(wheelF);
    const wheelR = buildSpokedWheel(-0.85, 0.34, 0);
    rig.add(wheelR);
    rig.userData.parts.wheels.push(wheelR);

    // Garde-boue arrière (touche réaliste)
    const fender = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.025, 6, 16, Math.PI),
      blackMat,
    );
    fender.rotation.y = Math.PI / 2;
    fender.position.set(-0.85, 0.34, 0);
    fender.rotation.x = Math.PI; // demi-arc au-dessus
    rig.add(fender);

    // Petite sonnette dorée sur le guidon
    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      rimMat,
    );
    bell.position.set(0.7, 1.16, -0.13);
    rig.add(bell);

    // Rider assis sur la selle
    rider.position.set(-0.5, 1.08, 0);
    return rig;
  }

  // =============================================================
  // QUAD : châssis rouge avec carénage, 4 grosses roues knobby,
  // suspensions visibles, guidon haut, selle, phares avant.
  // =============================================================
  if (vehicleId === 'quad' || vehicleId === 'quad-pro') {
    const isPro = vehicleId === 'quad-pro';
    const bodyColor = isPro ? 0x2a2a2e : PALETTE.burgundy;
    const accentColor = isPro ? PALETTE.gold : 0xf4d35e;
    const tireMat = matMatte(PALETTE.darkInk, { roughness: 0.95 });
    const rimMat = matMetal(0x999da3, { roughness: 0.25 });
    const bodyMat = matMatte(bodyColor, { roughness: 0.45, metalness: 0.3 });
    const accentMat = matMetal(accentColor, { roughness: 0.3, metalness: 0.7 });
    const blackMat = matMatte(PALETTE.darkInk, { roughness: 0.5, metalness: 0.4 });
    const chromeMat = matMetal(0xd0d3d8, { roughness: 0.2 });

    // ── Châssis principal (rounded) ──
    const mainBody = new THREE.Mesh(roundedBox(1.7, 0.42, 0.95, 0.1, 4), bodyMat);
    mainBody.position.set(0, 0.55, 0);
    rig.add(mainBody);

    // Carénage avant relevé
    const frontFairing = new THREE.Mesh(roundedBox(0.5, 0.45, 0.95, 0.08, 4), bodyMat);
    frontFairing.position.set(0.7, 0.65, 0);
    frontFairing.rotation.z = -0.18;
    rig.add(frontFairing);

    // Bande accent or
    const stripe = new THREE.Mesh(roundedBox(1.7, 0.06, 0.97, 0.03, 3), accentMat);
    stripe.position.set(0, 0.78, 0);
    rig.add(stripe);

    // ── Garde-boue (4 fenders) ──
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sz = -1; sz <= 1; sz += 2) {
        const fender = new THREE.Mesh(
          new THREE.TorusGeometry(0.32, 0.04, 5, 16, Math.PI),
          bodyMat,
        );
        fender.rotation.y = Math.PI / 2;
        fender.position.set(sx * 0.62, 0.4, sz * 0.55);
        fender.rotation.x = Math.PI;
        rig.add(fender);
      }
    }

    // ── 4 grosses roues knobby (avant un peu plus petites que arrière) ──
    const buildQuadWheel = (cx, cy, cz, isRear) => {
      const w = new THREE.Group();
      const r = isRear ? 0.36 : 0.32;
      const w2 = isRear ? 0.22 : 0.18;
      // Pneu
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, w2, 18),
        tireMat,
      );
      tire.rotation.z = Math.PI / 2;
      w.add(tire);
      // Knobs (12 petits picots autour du pneu pour effet knobby)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const knob = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.06, w2 * 0.9),
          tireMat,
        );
        knob.position.set(0, Math.sin(a) * (r + 0.02), Math.cos(a) * (r + 0.02));
        knob.rotation.x = a;
        w.add(knob);
      }
      // Jante alu
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.55, r * 0.55, w2 * 1.05, 14),
        rimMat,
      );
      rim.rotation.z = Math.PI / 2;
      w.add(rim);
      // Moyeu central
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, w2 * 1.1, 10),
        chromeMat,
      );
      hub.rotation.z = Math.PI / 2;
      w.add(hub);
      w.position.set(cx, cy, cz);
      return w;
    };
    const wFL = buildQuadWheel(0.62, 0.32, 0.55, false); rig.add(wFL); rig.userData.parts.wheels.push(wFL);
    const wFR = buildQuadWheel(0.62, 0.32, -0.55, false); rig.add(wFR); rig.userData.parts.wheels.push(wFR);
    const wRL = buildQuadWheel(-0.62, 0.36, 0.55, true); rig.add(wRL); rig.userData.parts.wheels.push(wRL);
    const wRR = buildQuadWheel(-0.62, 0.36, -0.55, true); rig.add(wRR); rig.userData.parts.wheels.push(wRR);

    // ── Suspensions visibles (4 amortisseurs ressort + tube) ──
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sz = -1; sz <= 1; sz += 2) {
        const shock = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.32, 10),
          accentMat,
        );
        shock.position.set(sx * 0.62, 0.5, sz * 0.45);
        rig.add(shock);
        // Spring (boules empilées pour faire ressort visible)
        for (let k = 0; k < 5; k++) {
          const coil = new THREE.Mesh(
            new THREE.TorusGeometry(0.06, 0.013, 6, 14),
            chromeMat,
          );
          coil.rotation.x = Math.PI / 2;
          coil.position.set(sx * 0.62, 0.4 + k * 0.05, sz * 0.45);
          rig.add(coil);
        }
      }
    }

    // ── Phares avant (2 cônes lumineux) ──
    for (let sz = -1; sz <= 1; sz += 2) {
      const headlight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, emissive: 0xfff2c4, emissiveIntensity: 0.9, roughness: 0.2,
        }),
      );
      headlight.rotation.z = Math.PI / 2;
      headlight.position.set(0.95, 0.65, sz * 0.28);
      rig.add(headlight);
    }

    // ── Selle (2 places) ──
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.12, 0.46),
      blackMat,
    );
    seat.position.set(-0.05, 0.85, 0);
    rig.add(seat);

    // ── Réservoir / décor central ──
    const tank = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.18, 0.42),
      bodyMat,
    );
    tank.position.set(0.3, 0.92, 0);
    rig.add(tank);

    // ── Guidon haut (steering bar) ──
    const handlebarPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.55, 10),
      blackMat,
    );
    handlebarPost.position.set(0.7, 1.05, 0);
    rig.add(handlebarPost);
    const handlebar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10),
      blackMat,
    );
    handlebar.rotation.x = Math.PI / 2;
    handlebar.position.set(0.7, 1.3, 0);
    rig.add(handlebar);
    // Poignées
    for (let sz = -1; sz <= 1; sz += 2) {
      const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.13, 10),
        new THREE.MeshStandardMaterial({ color: 0x202024, roughness: 0.95 }),
      );
      grip.rotation.x = Math.PI / 2;
      grip.position.set(0.7, 1.3, sz * 0.28);
      rig.add(grip);
    }

    // ── Numéro / logo sur le côté ──
    const numPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.25),
      new THREE.MeshStandardMaterial({
        color: 0xfff8d8, emissive: accentColor, emissiveIntensity: 0.18, roughness: 0.5,
      }),
    );
    numPlate.position.set(0, 0.55, 0.49);
    rig.add(numPlate);
    const numPlate2 = numPlate.clone();
    numPlate2.position.z = -0.49;
    numPlate2.rotation.y = Math.PI;
    rig.add(numPlate2);

    // ── Pot d'échappement chromé ──
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.55, 10),
      chromeMat,
    );
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(-0.92, 0.55, 0.4);
    rig.add(exhaust);

    // ── Pare-chocs avant ──
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.18, 0.85),
      blackMat,
    );
    bumper.position.set(1.0, 0.4, 0);
    rig.add(bumper);

    // Rider assis sur la selle (centré)
    rider.position.set(-0.05, 1.0, 0);
    return rig;
  }

  // =============================================================
  // HOVERBOARD : sci-fi (inchangé volontairement)
  // =============================================================
  if (vehicleId === 'hoverboard') {
    // fix-rendering : deck hoverboard laqué (clearcoat sci-fi)
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.12, 0.5),
      new THREE.MeshPhysicalMaterial({ color: 0x1a1a22, metalness: 0.8, roughness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.04 }),
    );
    deck.position.set(0, 0.55, 0);
    rig.add(deck);
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.06, 0.54),
      new THREE.MeshStandardMaterial({
        color: 0xcc1a24, emissive: 0xff2a38, emissiveIntensity: 1.1, metalness: 0.2, roughness: 0.3,
      }),
    );
    edge.position.set(0, 0.45, 0);
    rig.add(edge);
    rig.userData.parts.edge = edge;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.02, 0.52),
      new THREE.MeshStandardMaterial({
        color: 0xd4af37, metalness: 1, roughness: 0.15,
        emissive: 0xd4af37, emissiveIntensity: 0.4,
      }),
    );
    stripe.position.set(0, 0.62, 0);
    rig.add(stripe);
    for (let s = -1; s <= 1; s += 2) {
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.12, 14),
        new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.9, roughness: 0.2 }),
      );
      pod.position.set(s * 0.55, 0.38, 0);
      rig.add(pod);
      const gl = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x3fe6ff, transparent: true, opacity: 0.55 }),
      );
      gl.position.set(s * 0.55, 0.28, 0);
      rig.add(gl);
    }
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 1, 28),
      new THREE.MeshBasicMaterial({ color: 0xff2a38, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, 0.04, 0);
    rig.add(glow);
    rig.userData.parts.glow = glow;
    const pl = new THREE.PointLight(0xff2a38, 1.6, 3);
    pl.position.set(0, 0.15, 0);
    rig.add(pl);
    rig.userData.parts.light = pl;
    rider.position.set(0, 0.62, 0);
    rider.rotation.z = -0.04;
    return rig;
  }

  // Fallback : skateboard
  rider.position.set(0, 0.17, 0);
  return rig;
};

// =============================================================
// buildMiniRider() — personnage stylisé réutilisable
// =============================================================
const buildMiniRider = () => {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe0b48a, roughness: 0.85 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x3fe6ff, roughness: 0.8, metalness: 0.1 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.85 });

  // Torse
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.25), shirt);
  torso.position.y = 1.2;
  g.add(torso);
  // Bras
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), shirt);
  armL.geometry.translate(0, -0.275, 0);
  armL.position.set(-0.27, 1.43, 0);
  g.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.27;
  g.add(armR);
  // Jambes
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.18), pants);
  legL.geometry.translate(0, -0.35, 0);
  legL.position.set(-0.1, 0.88, 0);
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.1;
  g.add(legR);
  // Tête
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), skin);
  head.position.y = 1.65;
  g.add(head);
  // Cheveux simples
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x2a1a10 }),
  );
  hair.position.y = 1.72;
  g.add(hair);

  g.userData = { armL, armR, legL, legR };
  return g;
};

// =============================================================
// animateVehicleRig(rig, speed, t)
// speed ∈ [0..1] (0 = stationnaire, 1 = plein régime)
// t = temps global en secondes
// =============================================================
export const animateVehicleRig = (rig, speed, t) => {
  if (!rig?.userData?.parts) return;
  const p = rig.userData.parts;
  const id = rig.userData.vehicleId;

  // Roues : rotation continue proportionnelle à la vitesse
  const wheelSpeed = 12 * speed;
  (p.wheels || []).forEach(w => {
    if (id === 'bike') w.rotation.x += wheelSpeed * 0.03;
    else if (id === 'quad' || id === 'quad-pro') w.rotation.x += wheelSpeed * 0.045;
    else w.rotation.x += wheelSpeed * 0.04;
  });

  // Animation rider
  const swing = Math.sin(t * (6 + speed * 8)) * (0.15 + speed * 0.4);
  if (id === 'bike' && p.riderLegL && p.riderLegR) {
    p.riderLegL.rotation.x =  swing;
    p.riderLegR.rotation.x = -swing;
    if (p.pedal) p.pedal.rotation.x -= wheelSpeed * 0.05;
  } else if (id === 'skateboard') {
    if (p.riderRoot) p.riderRoot.rotation.z = Math.sin(t * 3) * 0.04 * (0.3 + speed);
    if (p.riderArmL) p.riderArmL.rotation.x = Math.sin(t * 2) * 0.1;
    if (p.riderArmR) p.riderArmR.rotation.x = -Math.sin(t * 2) * 0.1;
  } else if (id === 'quad' || id === 'quad-pro') {
    // Légère oscillation de la suspension à grande vitesse
    if (p.riderRoot) p.riderRoot.position.y = 1.0 + Math.sin(t * 6) * 0.012 * speed;
    // Bras qui tiennent fermement le guidon (pas d'animation forte)
    if (p.riderArmL) p.riderArmL.rotation.z = 0.4;
    if (p.riderArmR) p.riderArmR.rotation.z = -0.4;
  } else if (id === 'hoverboard') {
    const floatY = Math.sin(t * 2.2) * 0.05;
    if (p.riderRoot) p.riderRoot.position.y = 0.62 + floatY;
    if (p.glow) p.glow.material.opacity = 0.3 + Math.abs(Math.sin(t * 3)) * 0.2;
    if (p.edge) p.edge.material.emissiveIntensity = 0.9 + Math.abs(Math.sin(t * 4)) * 0.4;
    if (p.riderArmL) p.riderArmL.rotation.z = Math.sin(t * 1.6) * 0.12;
    if (p.riderArmR) p.riderArmR.rotation.z = -Math.sin(t * 1.6) * 0.12;
  }
};
