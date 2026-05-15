import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PALETTE, createSkyDome, roundedBox, matMatte, matMetal, matGlow } from '@/game/style';

// =============================================================
// <LobbyBackdrop3D> — scène 3D décorative en fond du FortniteLobby.
// Mini-version de la map : ciel dégradé, casino central, plages, mer
// au loin, palmiers + lampadaires animés. Caméra cinématique qui orbit.
// Aucune interaction — purement visuel, derrière tout l'UI.
// =============================================================
export const LobbyBackdrop3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();

    // ===== Camera (orbite lente) =====
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 12, 36);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    // === fix-rendering ===
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ===== Sky =====
    scene.add(createSkyDome());

    // ===== Lighting =====
    scene.add(new THREE.HemisphereLight(PALETTE.skyTop, PALETTE.sand, 0.6));
    const sun = new THREE.DirectionalLight(PALETTE.sunWarm, 1.2);
    sun.position.set(40, 60, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    // ===== Sol (asphalte + plaza pavée centrale) =====
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 220),
      matMatte(PALETTE.asphalt, { roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Plaza pavée
    const plaza = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 35),
      matMatte(0xc7b89a, { roughness: 0.9 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.005, 4);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // ===== Casino central =====
    const casinoGroup = new THREE.Group();
    casinoGroup.position.set(0, 0, -8);
    scene.add(casinoGroup);
    const body = new THREE.Mesh(roundedBox(14, 8, 10, 0.35, 4), matMatte(PALETTE.cream, { roughness: 0.78 }));
    body.position.y = 4; body.castShadow = true; body.receiveShadow = true;
    casinoGroup.add(body);
    const belt = new THREE.Mesh(roundedBox(14.2, 0.4, 10.2, 0.1, 3), matMetal(PALETTE.gold));
    belt.position.y = 2.7;
    casinoGroup.add(belt);
    const roof = new THREE.Mesh(roundedBox(15, 1.5, 11, 0.25, 4), matMatte(PALETTE.burgundy, { roughness: 0.65 }));
    roof.position.y = 8.75; roof.castShadow = true;
    casinoGroup.add(roof);
    const trim = new THREE.Mesh(roundedBox(15.4, 0.25, 11.4, 0.1, 3), matMetal(PALETTE.gold));
    trim.position.y = 8.05;
    casinoGroup.add(trim);
    // Néons "GAMBLELIFE"
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 1.6),
      matGlow(PALETTE.goldBright, 0.85),
    );
    sign.position.set(0, 6.8, 5.05);
    casinoGroup.add(sign);
    // Fenêtres lumineuses
    for (let f = 0; f < 6; f++) {
      const win = new THREE.Mesh(
        roundedBox(1.2, 1.6, 0.15, 0.08, 3),
        matGlow(PALETTE.goldBright, 0.5),
      );
      const side = f % 2 === 0 ? -1 : 1;
      const slot = Math.floor(f / 2);
      win.position.set(side * (3.5 + slot * 1.8), 5.2, 5.05);
      casinoGroup.add(win);
    }

    // ===== Bâtiments de fond (skyline lointaine) =====
    const skyline = new THREE.Group();
    const seeds = [42, 117, 9, 256, 33, 88, 401, 511, 1024, 7, 199, 333];
    seeds.forEach((s, i) => {
      const x = -90 + (i * 16) + ((s % 7) - 3);
      const z = -45 - ((s % 5) * 4);
      const w = 5 + (s % 6);
      const h = 8 + (s % 14);
      const d = 5 + (s % 5);
      const colors = [0x4a5a6a, 0x5a4a6a, 0x6a5a4a, 0x4a6a5a, 0x6a4a3a];
      const bld = new THREE.Mesh(
        roundedBox(w, h, d, 0.2, 3),
        matMatte(colors[s % colors.length], { roughness: 0.85 }),
      );
      bld.position.set(x, h / 2, z);
      bld.castShadow = true;
      skyline.add(bld);
      // Toit corniche dorée
      const tt = new THREE.Mesh(roundedBox(w + 0.2, 0.15, d + 0.2, 0.06, 2), matMetal(PALETTE.gold));
      tt.position.set(x, h, z);
      skyline.add(tt);
    });
    scene.add(skyline);

    // ===== Palmiers décoratifs =====
    const palms = new THREE.Group();
    [
      [-22, 1], [22, 1], [-30, 6], [30, 6], [-15, 15], [15, 15], [0, 18],
    ].forEach(([x, z]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 5.5, 10),
        matMatte(0x6a4f30, { roughness: 0.95 }),
      );
      trunk.position.set(x, 2.75, z);
      trunk.castShadow = true;
      palms.add(trunk);
      const fronds = 8;
      for (let f = 0; f < fronds; f++) {
        const angle = (f / fronds) * Math.PI * 2;
        const tilt = 0.45;
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 3, 5),
          matMatte(0x2c8a3a, { roughness: 0.85 }),
        );
        frond.position.set(x + Math.cos(angle) * 1.4, 5.7, z + Math.sin(angle) * 1.4);
        frond.rotation.z = Math.cos(angle) * tilt;
        frond.rotation.x = -Math.sin(angle) * tilt;
        palms.add(frond);
      }
    });
    scene.add(palms);

    // ===== Mer en arrière-plan (côté est, derrière les bâtiments) =====
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 80),
      matMatte(PALETTE.sea, { roughness: 0.3, metalness: 0.2 }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0.06, -90);
    scene.add(sea);

    // ===== Lampadaires éclairés (4 autour de la plaza) =====
    [[-14, 6], [14, 6], [-14, -2], [14, -2]].forEach(([x, z]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8),
        matMatte(0x1a1a1a, { roughness: 0.4, metalness: 0.6 }),
      );
      post.position.set(x, 2.1, z);
      scene.add(post);
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        matGlow(PALETTE.goldBright, 0.85),
      );
      lamp.position.set(x, 4.3, z);
      scene.add(lamp);
    });

    // ===== Animation : caméra qui orbite lentement =====
    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.0025;
      camera.position.x = Math.sin(t) * 36;
      camera.position.z = Math.cos(t) * 36 + 6;
      camera.position.y = 12 + Math.sin(t * 0.6) * 1.5;
      camera.lookAt(0, 4, -2);
      // Petite oscillation des palmes
      palms.children.forEach((c, i) => {
        if (c.geometry?.type === 'ConeGeometry') {
          c.rotation.z += Math.sin(t * 6 + i) * 0.001;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  );
};

export default LobbyBackdrop3D;
