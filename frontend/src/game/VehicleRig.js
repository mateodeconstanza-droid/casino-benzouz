import * as THREE from 'three';

// =============================================================
// buildVehicleRig(vehicleId)
// Retourne un THREE.Group qui contient le véhicule + le rider (mini perso).
// Le rig doit être positionné à la position du joueur dans la boucle FPS,
// avec rig.rotation.y = -playerRotY pour suivre la direction de la caméra.
// L'animation (roues, balance) est gérée par le parent via .userData.parts :
//   - wheels[] : cylindres tournant autour de X (skateboard/bike)
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

  // ---- Véhicule selon l'ID ----
  if (vehicleId === 'skateboard') {
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.07, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.4, roughness: 0.3 })
    );
    deck.position.set(0, 0.13, 0);
    rig.add(deck);
    // Grip band
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.005, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.95 })
    );
    grip.position.set(0, 0.17, 0);
    rig.add(grip);
    // Accent doré sur le plateau
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.009, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2, emissive: 0xd4af37, emissiveIntensity: 0.3 })
    );
    stripe.position.set(0, 0.175, 0);
    rig.add(stripe);
    // Trucks
    for (let s = -1; s <= 1; s += 2) {
      const truck = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.05, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x888, metalness: 0.8, roughness: 0.25 })
      );
      truck.position.set(s * 0.6, 0.08, 0);
      rig.add(truck);
    }
    // 4 roues
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sz = -1; sz <= 1; sz += 2) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.08, 14),
          new THREE.MeshStandardMaterial({ color: 0xffecaa, emissive: 0xffd700, emissiveIntensity: 0.15 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx * 0.6, 0.05, sz * 0.18);
        rig.add(wheel);
        rig.userData.parts.wheels.push(wheel);
      }
    }
    // Rider debout sur le skate (léger écart pieds)
    rider.position.set(0, 0.17, 0);
    return rig;
  }

  if (vehicleId === 'bike') {
    // Barre principale
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xcc1a24, metalness: 0.7, roughness: 0.25 })
    );
    frame.position.set(0, 0.55, 0);
    rig.add(frame);
    // Tube de direction
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10),
      new THREE.MeshStandardMaterial({ color: 0xcc1a24, metalness: 0.7, roughness: 0.25 })
    );
    head.position.set(0.7, 0.55, 0);
    head.rotation.z = 0.3;
    rig.add(head);
    // Guidon
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x222 })
    );
    bar.position.set(0.82, 0.9, 0);
    rig.add(bar);
    // Selle
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x111 })
    );
    seat.position.set(-0.55, 0.93, 0);
    rig.add(seat);
    // Tige de selle
    const seatPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.45, 10),
      new THREE.MeshStandardMaterial({ color: 0x222 })
    );
    seatPost.position.set(-0.55, 0.67, 0);
    rig.add(seatPost);
    // Pédalier
    const pedal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 })
    );
    pedal.rotation.z = Math.PI / 2;
    pedal.position.set(0, 0.25, 0);
    rig.add(pedal);
    rig.userData.parts.pedal = pedal;
    // 2 roues
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3 });
    const rimMat   = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 });
    for (let s = -1; s <= 1; s += 2) {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.06, 8, 20),
        wheelMat
      );
      tire.rotation.y = Math.PI / 2;
      tire.position.set(s * 0.75, 0.32, 0);
      rig.add(tire);
      rig.userData.parts.wheels.push(tire);
      const rim = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.28, 14),
        rimMat
      );
      rim.rotation.y = Math.PI / 2;
      rim.position.set(s * 0.75, 0.32, 0);
      rig.add(rim);
    }
    // Rider assis sur la selle
    rider.position.set(-0.5, 0.98, 0);
    return rig;
  }

  if (vehicleId === 'hoverboard') {
    // Plateau principal type tech (bi-matière, LED rouge)
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.12, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.8, roughness: 0.2 })
    );
    deck.position.set(0, 0.55, 0);
    rig.add(deck);
    // Bords LED rouge émissifs
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.06, 0.54),
      new THREE.MeshStandardMaterial({
        color: 0xcc1a24, emissive: 0xff2a38, emissiveIntensity: 1.1, metalness: 0.2, roughness: 0.3,
      })
    );
    edge.position.set(0, 0.45, 0);
    rig.add(edge);
    rig.userData.parts.edge = edge;
    // Bande dorée centrale
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.02, 0.52),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.15, emissive: 0xd4af37, emissiveIntensity: 0.4 })
    );
    stripe.position.set(0, 0.62, 0);
    rig.add(stripe);
    // Points d'attache magnétiques bas
    for (let s = -1; s <= 1; s += 2) {
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 0.12, 14),
        new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.9, roughness: 0.2 })
      );
      pod.position.set(s * 0.55, 0.38, 0);
      rig.add(pod);
      // Glow cyan sous le pod
      const gl = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x3fe6ff, transparent: true, opacity: 0.55 })
      );
      gl.position.set(s * 0.55, 0.28, 0);
      rig.add(gl);
    }
    // Halo sol (ground glow)
    const glow = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 1, 28),
      new THREE.MeshBasicMaterial({ color: 0xff2a38, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, 0.04, 0);
    rig.add(glow);
    rig.userData.parts.glow = glow;
    // Point light sous la board
    const pl = new THREE.PointLight(0xff2a38, 1.6, 3);
    pl.position.set(0, 0.15, 0);
    rig.add(pl);
    rig.userData.parts.light = pl;
    // Rider en position surfée (légèrement penché)
    rider.position.set(0, 0.62, 0);
    rider.rotation.z = -0.04; // inclinaison surf
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
  // Bras (ancrés haut du torse pour animation)
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), shirt);
  armL.geometry.translate(0, -0.275, 0); // pivote depuis le haut
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
    new THREE.MeshStandardMaterial({ color: 0x2a1a10 })
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
    else w.rotation.x += wheelSpeed * 0.04;
  });

  // Animation rider
  const swing = Math.sin(t * (6 + speed * 8)) * (0.15 + speed * 0.4);
  if (id === 'bike' && p.riderLegL && p.riderLegR) {
    p.riderLegL.rotation.x =  swing;
    p.riderLegR.rotation.x = -swing;
    if (p.pedal) p.pedal.rotation.x -= wheelSpeed * 0.05;
  } else if (id === 'skateboard') {
    // Légère rotation du corps pour simuler équilibre
    if (p.riderRoot) p.riderRoot.rotation.z = Math.sin(t * 3) * 0.04 * (0.3 + speed);
    if (p.riderArmL) p.riderArmL.rotation.x = Math.sin(t * 2) * 0.1;
    if (p.riderArmR) p.riderArmR.rotation.x = -Math.sin(t * 2) * 0.1;
  } else if (id === 'hoverboard') {
    // Flottaison : oscillation verticale du rig + pulse glow
    const floatY = Math.sin(t * 2.2) * 0.05;
    if (p.riderRoot) p.riderRoot.position.y = 0.62 + floatY;
    if (p.glow) p.glow.material.opacity = 0.3 + Math.abs(Math.sin(t * 3)) * 0.2;
    if (p.edge) p.edge.material.emissiveIntensity = 0.9 + Math.abs(Math.sin(t * 4)) * 0.4;
    if (p.riderArmL) p.riderArmL.rotation.z = Math.sin(t * 1.6) * 0.12;
    if (p.riderArmR) p.riderArmR.rotation.z = -Math.sin(t * 1.6) * 0.12;
  }
};
