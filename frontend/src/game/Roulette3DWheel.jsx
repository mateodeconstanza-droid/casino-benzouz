import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ROULETTE_NUMBERS, RED_NUMBERS } from '@/game/constants';

// Couleur officielle européenne : 0 = vert, sinon rouge/noir selon table
const colorOf = (n) => (n === 0 ? 0x1a8a3a : RED_NUMBERS.includes(n) ? 0xcc0f1f : 0x0a0a0a);

// =============================================================
// <Roulette3DWheel>
// Roue 3D Three.js style Stake First-Person.
// Props:
//   size        — largeur/hauteur du canvas (px), défaut 380
//   winNumber   — 0..36 à faire gagner (null = repos)
//   spinSignal  — entier qui change à chaque nouveau spin (trigger)
//   onLanded()  — callback quand la bille se pose dans la poche
// =============================================================
const Roulette3DWheel = ({ size = 380, winNumber = null, spinSignal = 0, onLanded }) => {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---------- Scene / Camera / Renderer ----------
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    // Vue plongée + recul pour voir les numéros comme sur Stake
    camera.position.set(0, 7.5, 9.5);
    camera.lookAt(0, -0.3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ---------- Lights ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffe9bd, 1.4);
    key.position.set(5, 8, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ab8ff, 0.6);
    rim.position.set(-6, 4, -4);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffd88a, 1.2, 16);
    fill.position.set(0, 5, 2);
    scene.add(fill);

    // ---------- Cuvette extérieure (bois foncé) ----------
    const bowl = new THREE.Group();
    scene.add(bowl);

    // Anneau bois extérieur
    const outerRing = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.4, 0.6, 64),
      new THREE.MeshStandardMaterial({
        color: 0x3a1e0c, metalness: 0.35, roughness: 0.55,
        emissive: 0x110700, emissiveIntensity: 0.2,
      })
    );
    outerRing.position.y = -0.2;
    outerRing.receiveShadow = true;
    bowl.add(outerRing);

    // Liseré doré haut
    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.08, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.15 })
    );
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 0.12;
    bowl.add(goldRim);

    // Paroi intérieure inclinée (cuvette)
    const cuvette = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 3.2, 0.7, 64, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1a0f04, metalness: 0.2, roughness: 0.8, side: THREE.DoubleSide,
      })
    );
    cuvette.position.y = -0.15;
    bowl.add(cuvette);

    // ---------- Disque rotatif (roue numérotée) ----------
    const wheel = new THREE.Group();
    scene.add(wheel);

    // Plateau principal (alu brossé) — plus petit que les pockets pour les laisser visibles
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.0, 0.2, 64),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1f, metalness: 0.7, roughness: 0.35 })
    );
    disk.position.y = -0.12;
    disk.receiveShadow = true;
    wheel.add(disk);

    // Liseré doré autour du disque
    const diskRim = new THREE.Mesh(
      new THREE.TorusGeometry(3.05, 0.04, 16, 72),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 })
    );
    diskRim.rotation.x = Math.PI / 2;
    diskRim.position.y = 0.02;
    wheel.add(diskRim);

    // ---------- Poches numérotées ----------
    const N = ROULETTE_NUMBERS.length; // 37
    const stepAngle = (Math.PI * 2) / N;
    const pocketRadius = 2.65;
    const pocketInnerRadius = 2.2;
    const pocketPositions = []; // world-space slot center for ball landing

    ROULETTE_NUMBERS.forEach((num, i) => {
      const angle = i * stepAngle;
      // Slot — plus haut et plus large pour être bien visible
      const pocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.2, 0.5),
        new THREE.MeshStandardMaterial({
          color: colorOf(num), metalness: 0.3, roughness: 0.5,
          emissive: colorOf(num), emissiveIntensity: 0.25,
        })
      );
      pocket.position.set(Math.cos(angle) * pocketRadius, 0.05, Math.sin(angle) * pocketRadius);
      pocket.rotation.y = -angle;
      wheel.add(pocket);
      pocketPositions.push({ num, idx: i, angle });

      // Numéro peint (texture canvas)
      const cvs = document.createElement('canvas');
      cvs.width = 64; cvs.height = 64;
      const cx = cvs.getContext('2d');
      cx.fillStyle = num === 0 ? '#0e6a2d' : (RED_NUMBERS.includes(num) ? '#a50a18' : '#111');
      cx.fillRect(0, 0, 64, 64);
      cx.fillStyle = '#fff';
      cx.font = 'bold 40px Georgia';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(String(num), 32, 34);
      const tex = new THREE.CanvasTexture(cvs);
      const numPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.38, 0.38),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      numPlane.position.set(Math.cos(angle) * pocketRadius, 0.16, Math.sin(angle) * pocketRadius);
      numPlane.rotation.x = -Math.PI / 2;
      numPlane.rotation.z = -angle - Math.PI / 2;
      wheel.add(numPlane);

      // Séparateurs dorés (frets) entre poches
      const fret = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.26, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 })
      );
      const fretAngle = angle + stepAngle / 2;
      fret.position.set(Math.cos(fretAngle) * pocketRadius, 0.08, Math.sin(fretAngle) * pocketRadius);
      fret.rotation.y = -fretAngle;
      wheel.add(fret);
    });

    // ---------- Moyeu central (cone + spokes + dôme doré) ----------
    const hub = new THREE.Group();
    wheel.add(hub);

    // Dôme doré central
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.15, emissive: 0x3a2a0a, emissiveIntensity: 0.25 })
    );
    dome.position.y = 0.02;
    hub.add(dome);

    // Cone étoile (8 branches)
    for (let s = 0; s < 8; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.05, 0.16),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.22 })
      );
      spoke.rotation.y = (s * Math.PI) / 4;
      spoke.position.y = -0.05;
      hub.add(spoke);
    }

    // Anneau moyeu
    const hubRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.05, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 })
    );
    hubRing.rotation.x = Math.PI / 2;
    hubRing.position.y = -0.03;
    hub.add(hubRing);

    // ---------- Bille ----------
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfdfdff, metalness: 0.3, roughness: 0.18,
        emissive: 0xffffff, emissiveIntensity: 0.2,
      })
    );
    ball.castShadow = true;
    ball.position.set(3.6, 0.45, 0);
    scene.add(ball);

    // ---------- Aiguille (pointeur) ----------
    const pointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.35, 3),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.2 })
    );
    pointer.rotation.x = Math.PI;
    pointer.position.set(0, 0.55, -3.75);
    scene.add(pointer);

    // ---------- State globale ----------
    stateRef.current = {
      renderer, scene, camera, wheel, ball,
      pocketPositions,
      spinning: false,
      wheelAngle: 0,
      ballAngle: 0,
      ballRadius: 3.6,
      ballY: 0.55,
      startedAt: 0,
      targetNum: null,
      lastSignal: spinSignal,
      onLandedCB: onLanded,
      disposed: false,
    };

    let rafId = 0;
    const loop = () => {
      const st = stateRef.current;
      if (st.disposed) return;
      const now = performance.now();

      if (!st.spinning) {
        // Idle : la roue tourne lentement en continu (ambiance)
        st.wheelAngle += 0.0015;
        wheel.rotation.y = st.wheelAngle;
        // Bille immobile sur la piste haute
        ball.position.set(Math.cos(st.ballAngle) * st.ballRadius, st.ballY, Math.sin(st.ballAngle) * st.ballRadius);
        st.ballAngle += 0.001;
      } else {
        // ===== ANIMATION DU SPIN =====
        const elapsed = (now - st.startedAt) / 1000;
        const totalDuration = 6.5; // s
        const t = Math.min(elapsed / totalDuration, 1);

        // Rotation roue : décélère doucement
        const wheelSpeed = 2.2 * (1 - t * 0.85); // rad/s
        st.wheelAngle += wheelSpeed * 0.016;
        wheel.rotation.y = st.wheelAngle;

        // Bille : angle, rayon, hauteur
        const ballSpeed = -(5.5 * Math.pow(1 - t, 1.4));
        st.ballAngle += ballSpeed * 0.016;

        if (t < 0.55) {
          // Phase 1 : bille sur la piste haute extérieure
          st.ballRadius = 3.6;
          st.ballY = 0.55 + Math.sin(elapsed * 7) * 0.02;
        } else if (t < 0.9) {
          // Phase 2 : descente vers la piste des poches avec rebonds
          const localT = (t - 0.55) / 0.35;
          st.ballRadius = 3.6 - localT * 0.95; // 3.6 -> 2.65
          st.ballY = 0.55 - localT * 0.3 + Math.abs(Math.sin(localT * Math.PI * 4)) * 0.1;
        } else {
          // Phase 3 : atterrissage dans la poche cible
          const landT = Math.min((t - 0.9) / 0.1, 1);
          if (st.targetNum !== null) {
            const pocket = st.pocketPositions.find(p => p.num === st.targetNum);
            if (pocket) {
              const targetWorldAngle = -Math.PI / 2;
              const desiredBallAngle = targetWorldAngle;
              const desiredRadius = 2.65;
              st.ballAngle = lerpAngle(st.ballAngle, desiredBallAngle, landT * 0.18);
              st.ballRadius = THREE.MathUtils.lerp(st.ballRadius, desiredRadius, landT * 0.25);
              st.ballY = THREE.MathUtils.lerp(st.ballY, 0.22, landT * 0.25);

              const finalWheelAngle = targetWorldAngle - pocket.angle;
              st.wheelAngle = THREE.MathUtils.lerp(st.wheelAngle, finalWheelAngle, landT * 0.15);
              wheel.rotation.y = st.wheelAngle;
            }
          }
        }

        if (t >= 0.97 && st.targetNum !== null) {
          const pocket = st.pocketPositions.find(p => p.num === st.targetNum);
          if (pocket) {
            const worldAngle = st.wheelAngle + pocket.angle;
            const rPos = 2.65;
            ball.position.set(Math.cos(worldAngle) * rPos, 0.22, Math.sin(worldAngle) * rPos);
          }
        } else {
          ball.position.set(Math.cos(st.ballAngle) * st.ballRadius, st.ballY, Math.sin(st.ballAngle) * st.ballRadius);
        }

        if (t >= 1) {
          st.spinning = false;
          if (st.targetNum !== null) {
            const pocket = st.pocketPositions.find(p => p.num === st.targetNum);
            if (pocket) {
              const targetWorldAngle = -Math.PI / 2;
              st.wheelAngle = targetWorldAngle - pocket.angle;
              wheel.rotation.y = st.wheelAngle;
              ball.position.set(Math.cos(targetWorldAngle) * 2.65, 0.22, Math.sin(targetWorldAngle) * 2.65);
            }
          }
          if (typeof st.onLandedCB === 'function') st.onLandedCB();
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      stateRef.current.disposed = true;
      cancelAnimationFrame(rafId);
      try { mount.removeChild(renderer.domElement); } catch (_e) { /* noop */ }
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const m = Array.isArray(o.material) ? o.material : [o.material];
          m.forEach(mat => { if (mat.map) mat.map.dispose(); mat.dispose(); });
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Déclenche un spin quand le signal change
  useEffect(() => {
    const st = stateRef.current;
    if (!st || !st.renderer) return;
    if (spinSignal === 0) return;
    if (winNumber === null || winNumber === undefined) return;
    st.targetNum = winNumber;
    st.spinning = true;
    st.startedAt = performance.now();
    st.onLandedCB = onLanded;
  }, [spinSignal, winNumber, onLanded]);

  return (
    <div
      ref={mountRef}
      data-testid="roulette-3d-wheel"
      style={{ width: size, height: size, display: 'inline-block' }}
    />
  );
};

// Interpolation angulaire (prend le chemin le plus court)
function lerpAngle(a, b, t) {
  const delta = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return a + delta * t;
}

export default Roulette3DWheel;
