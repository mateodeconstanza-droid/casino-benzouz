import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildPlayerCharacter } from '@/game/playerCharacter';
import { roundedBox } from '@/game/style';
import { SKINS_CATALOG, SKIN_RARITY } from '@/game/constants';

// =============================================================
// <LobbyScene3D> — Scène 3D pour le lobby Fortnite-style
//
// Affiche le perso du joueur sur une plateforme rotative au centre,
// caméra qui orbit lentement, sol marbré, éclairage cinéma, halo de
// rareté selon le skin équipé.
// L'UI 2D (boutons, HUD) reste superposée par-dessus dans FortniteLobby.
//
// Props : profile (lit equippedSkin, hair, outfit, shoes, skin)
// =============================================================
export const LobbyScene3D = ({ profile }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    // ===== Scene + Camera =====
    const scene = new THREE.Scene();
    scene.background = null;  // transparent → on garde le voile CSS par-dessus
    const camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.2, 5);
    camera.lookAt(0, 1.5, 0);

    // ===== Renderer =====
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ===== Env map PBR =====
    {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    // ===== Sol miroir marbre =====
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a22, metalness: 0.85, roughness: 0.18,
      clearcoat: 1.0, clearcoatRoughness: 0.05,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    // ===== Plateforme rotative dorée =====
    const platform = new THREE.Group();
    scene.add(platform);
    // Disque base
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.5, 0.12, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x0a0a14, metalness: 0.9, roughness: 0.25,
        clearcoat: 1, clearcoatRoughness: 0.08,
      })
    );
    disk.position.y = 0.06;
    platform.add(disk);
    // Bordure or
    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.42, 0.04, 16, 64),
      new THREE.MeshStandardMaterial({
        color: 0xd4af37, metalness: 1, roughness: 0.15,
        emissive: 0xd4af37, emissiveIntensity: 0.4,
      })
    );
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 0.13;
    platform.add(goldRim);
    // Rayons décoratifs (ne tournent pas avec la plateforme)
    const rays = new THREE.Group();
    scene.add(rays);
    for (let i = 0; i < 24; i++) {
      const ray = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.005, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xd4af37, toneMapped: false })
      );
      ray.position.set(0, 0.07, 0);
      ray.rotation.y = (i / 24) * Math.PI * 2;
      ray.translateZ(1.7);
      rays.add(ray);
    }

    // ===== Halo de rareté (cylindre lumineux derrière le perso) =====
    const pack = SKINS_CATALOG.find((s) => s.id === profile?.equippedSkin);
    const rarity = (pack && SKIN_RARITY[pack.rarity]) || SKIN_RARITY.common;
    const rarityHex = parseInt((rarity.color || '#cca366').slice(1), 16);
    const halo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.001, 1.3, 3.4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: rarityHex, transparent: true, opacity: 0.18,
        toneMapped: false, side: THREE.DoubleSide,
      })
    );
    halo.position.y = 1.5;
    scene.add(halo);

    // ===== Rig du joueur (perso 3D détaillé avec son skin) =====
    const rig = buildPlayerCharacter({
      skinPack: profile?.equippedSkin,
      skin: profile?.skin || '#e0b48a',
      outfit: profile?.outfit ?? 0,
      hair: profile?.hair ?? 0,
      shoes: profile?.shoes ?? 0,
    });
    rig.position.y = 0.12;  // posé sur la plateforme
    rig.rotation.y = Math.PI;  // face caméra
    platform.add(rig);

    // ===== Particules dorées flottantes =====
    const particles = new THREE.Group();
    scene.add(particles);
    for (let i = 0; i < 28; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 6, 6),
        new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? rarityHex : 0xd4af37,
          toneMapped: false, transparent: true, opacity: 0.7 + Math.random() * 0.3,
        })
      );
      p.userData = {
        angle: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.004,
        radius: 1.5 + Math.random() * 1.5,
        yBase: 0.5 + Math.random() * 2.2,
        ySpeed: 0.001 + Math.random() * 0.002,
        yPhase: Math.random() * Math.PI * 2,
      };
      particles.add(p);
    }

    // ===== Lumières =====
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffd9a0, 1.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8ab5ff, 0.7);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);
    const rimLight = new THREE.SpotLight(rarityHex, 2.5, 8, Math.PI / 6, 0.5);
    rimLight.position.set(0, 3.5, -3);
    rimLight.target.position.set(0, 1.5, 0);
    scene.add(rimLight); scene.add(rimLight.target);

    // ===== Animation loop =====
    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.01;
      // Plateforme tourne sur elle-même → le perso tourne avec
      platform.rotation.y += 0.004;
      // Rayons au sol tournent en sens inverse
      rays.rotation.y -= 0.002;
      // Halo respire
      halo.material.opacity = 0.14 + Math.sin(t * 1.4) * 0.06;
      // Particules orbitent + ondulent verticalement
      particles.children.forEach((p) => {
        const u = p.userData;
        u.angle += u.speed;
        p.position.x = Math.cos(u.angle) * u.radius;
        p.position.z = Math.sin(u.angle) * u.radius;
        p.position.y = u.yBase + Math.sin(t * 2 + u.yPhase) * 0.4;
      });
      // Caméra orbite très lentement
      const camAngle = t * 0.08;
      camera.position.x = Math.sin(camAngle) * 0.6;
      camera.position.z = 5 + Math.cos(camAngle) * 0.3;
      camera.lookAt(0, 1.5, 0);
      // Petit bob du perso (respiration)
      rig.position.y = 0.12 + Math.sin(t * 2) * 0.02;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.equippedSkin, profile?.hair, profile?.outfit, profile?.shoes, profile?.skin]);

  return (
    <div
      ref={mountRef}
      data-testid="lobby-scene-3d"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', // ne capte pas les clics (HUD au-dessus)
      }}
    />
  );
};

export default LobbyScene3D;
