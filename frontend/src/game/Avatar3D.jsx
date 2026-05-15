import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildPlayerCharacter } from '@/game/playerCharacter';

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
    camera.position.set(0, 1.65, 5.0);
    camera.lookAt(0, 1.5, 0);

    // ===== Renderer transparent =====
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    const character = buildPlayerCharacter({ hair, outfit, shoes, short, skin });
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

export default Avatar3D;
