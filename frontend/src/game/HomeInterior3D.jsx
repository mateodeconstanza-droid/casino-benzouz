import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fmt } from '@/game/constants';
import { STAKE } from '@/game/stake/theme';
import { HOUSES } from '@/game/Street3D';

// =============================================================
// THÈMES (décor complet : murs + sol + accent meubles)
// =============================================================
export const HOME_THEMES = {
  cozy: {
    label: 'Cosy',
    wall: 0xe8d5b7, floor: 0x8b5a3a,
    sofa: 0x6b4423, bed: 0xb98c62, table: 0x4a3222, accent: 0xcc8a3a,
  },
  modern: {
    label: 'Moderne',
    wall: 0xf0f0f2, floor: 0x2a2a30,
    sofa: 0x1a1a1f, bed: 0xfafafa, table: 0x202028, accent: 0x3fe6ff,
  },
  lux: {
    label: 'Luxueux',
    wall: 0x1a0f18, floor: 0x0d060e,
    sofa: 0x3a1218, bed: 0x4a0010, table: 0x0a0508, accent: 0xd4af37,
  },
  neon: {
    label: 'Néon',
    wall: 0x0a1828, floor: 0x05101c,
    sofa: 0x1a2a4a, bed: 0x2a1a4a, table: 0x101828, accent: 0xff2ad4,
  },
  classic: {
    label: 'Classique',
    wall: 0xf4efde, floor: 0xa6774a,
    sofa: 0x5a2a2a, bed: 0xe0c088, table: 0x6a4024, accent: 0x2a4a7a,
  },
};

// Calcul stats "trophy wall" à partir de l'historique BenzBet + gains cumulés
const computeStats = (profile) => {
  if (!profile) return [];
  let biggestBet = 0, longestStreak = 0, biggestOdds = 0, totalBets = 0;
  try {
    const hist = JSON.parse(localStorage.getItem(`benzbet:${profile.name}:history`) || '[]');
    totalBets = hist.length;
    let streak = 0;
    for (const h of hist) {
      if (h.status === 'won') {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
        if (h.payout > biggestBet) biggestBet = h.payout;
        if ((h.totalOdds || 0) > biggestOdds) biggestOdds = h.totalOdds;
      } else streak = 0;
    }
  } catch (_e) { /* noop */ }
  return [
    { icon: '💰', label: 'Gains cumulés', value: fmt(profile.totalWinnings || 0) + ' B' },
    { icon: '🎯', label: 'Plus gros gain BenzBet', value: fmt(biggestBet) + ' B' },
    { icon: '🔥', label: 'Meilleure streak', value: longestStreak + ' V' },
    { icon: '💎', label: 'Cote max gagnée', value: biggestOdds > 0 ? biggestOdds.toFixed(2) : '—' },
    { icon: '🎰', label: 'Paris placés', value: totalBets },
    { icon: '🔑', label: 'Propriétés', value: (profile.keys || []).length + ' / 10' },
  ];
};

// =============================================================
// <HomeInterior3D>
// Intérieur first-person customisable (1 pièce ouverte, 3 zones)
// =============================================================
const HomeInterior3D = ({ profile, setProfile, houseId, onExit }) => {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const house = HOUSES.find(h => h.id === houseId);
  const owned = (profile?.ownedHouses || []).find(h => h.id === houseId);
  const initialTheme = owned?.customizations?.theme || (house?.type === 'villa' ? 'lux' : house?.type === 'apartment' ? 'modern' : 'cozy');
  const [theme, setTheme] = useState(initialTheme);
  const [showTrophies, setShowTrophies] = useState(false);

  const t = HOME_THEMES[theme];
  const stats = computeStats(profile);
  // Taille selon type (villa plus grande que appart)
  const size = house?.type === 'villa' ? { w: 22, d: 14, h: 4 }
            : house?.type === 'house' ? { w: 18, d: 12, h: 3.5 }
            : { w: 14, d: 10, h: 3 };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a10);

    const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 2.4, size.d / 2 - 1.5);
    camera.lookAt(0, 1.8, -size.d / 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const main = new THREE.DirectionalLight(0xffffff, 1.1);
    main.position.set(4, 7, 3);
    main.castShadow = true;
    scene.add(main);
    const accent = new THREE.PointLight(t.accent, 1.6, 14);
    accent.position.set(0, size.h - 0.3, 0);
    scene.add(accent);

    // Sol
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(size.w, size.d),
      new THREE.MeshStandardMaterial({ color: t.floor, roughness: 0.75, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Plafond
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(size.w, size.d),
      new THREE.MeshStandardMaterial({ color: 0xe8e8ec, roughness: 0.9 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = size.h;
    scene.add(ceil);

    // Murs (4)
    const wallMat = new THREE.MeshStandardMaterial({ color: t.wall, roughness: 0.85 });
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(size.w, size.h), wallMat);
    wallBack.position.set(0, size.h / 2, -size.d / 2);
    scene.add(wallBack);
    const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(size.w, size.h), wallMat);
    wallFront.position.set(0, size.h / 2, size.d / 2);
    wallFront.rotation.y = Math.PI;
    scene.add(wallFront);
    const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(size.d, size.h), wallMat);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.position.set(-size.w / 2, size.h / 2, 0);
    scene.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(size.d, size.h), wallMat);
    wallRight.rotation.y = -Math.PI / 2;
    wallRight.position.set(size.w / 2, size.h / 2, 0);
    scene.add(wallRight);

    // === ZONE SALON (gauche) ===
    const salon = new THREE.Group();
    salon.position.set(-size.w / 3, 0, 1.5);
    // Canapé
    const sofa = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.9, 1.1),
      new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.9 })
    );
    sofa.position.set(0, 0.45, 0);
    sofa.castShadow = true;
    salon.add(sofa);
    // Coussins dossier
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.7, 0.35),
      new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.9 })
    );
    back.position.set(0, 1.1, -0.4);
    salon.add(back);
    // Accoudoirs
    for (let sa = -1; sa <= 1; sa += 2) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.9, 1.1),
        new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.9 })
      );
      arm.position.set(sa * 1.35, 0.7, 0);
      salon.add(arm);
    }
    // Table basse
    const coffee = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.4, 0.8),
      new THREE.MeshStandardMaterial({ color: t.table, metalness: 0.3, roughness: 0.5 })
    );
    coffee.position.set(0, 0.2, 1.4);
    coffee.castShadow = true;
    salon.add(coffee);
    // TV
    const tvStand = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.4 })
    );
    tvStand.position.set(0, 0.25, -2.2);
    salon.add(tvStand);
    const tv = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x000, emissive: t.accent, emissiveIntensity: 0.55 })
    );
    tv.position.set(0, 1.2, -2.28);
    salon.add(tv);
    // Lampe d'ambiance (point light accent)
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshStandardMaterial({ color: t.accent, emissive: t.accent, emissiveIntensity: 1 })
    );
    lamp.position.set(-2.2, 1.3, 0.5);
    salon.add(lamp);
    const lampLight = new THREE.PointLight(t.accent, 0.8, 5);
    lampLight.position.copy(lamp.position);
    salon.add(lampLight);
    scene.add(salon);

    // === ZONE CUISINE (milieu) ===
    const kitchen = new THREE.Group();
    kitchen.position.set(0, 0, -size.d / 2 + 1.2);
    // Plan de travail en L
    const counter1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.9, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xeeeeef, metalness: 0.3, roughness: 0.25 })
    );
    counter1.position.set(0, 0.45, -0.2);
    counter1.castShadow = true;
    kitchen.add(counter1);
    // Meuble bas (base)
    const baseCab = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.82, 0.75),
      new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.5 })
    );
    baseCab.position.set(0, 0.41, -0.2);
    kitchen.add(baseCab);
    // Placards hauts
    for (let c = 0; c < 3; c++) {
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.8, 0.4),
        new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.5 })
      );
      cab.position.set(-1.4 + c * 1.4, 2.4, -0.4);
      kitchen.add(cab);
    }
    // Évier
    const sink = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x4a4a50, metalness: 0.9, roughness: 0.2 })
    );
    sink.position.set(1.2, 0.92, -0.2);
    kitchen.add(sink);
    // Plaques de cuisson
    const stove = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x551a0a, emissiveIntensity: 0.3 })
    );
    stove.position.set(-1.2, 0.92, -0.2);
    kitchen.add(stove);
    scene.add(kitchen);

    // === ZONE CHAMBRE (droite) ===
    const bedroom = new THREE.Group();
    bedroom.position.set(size.w / 3, 0, 1);
    // Lit
    const bedBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.35, 3.2),
      new THREE.MeshStandardMaterial({ color: t.table, roughness: 0.6 })
    );
    bedBase.position.set(0, 0.18, 0);
    bedBase.castShadow = true;
    bedroom.add(bedBase);
    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.35, 3.1),
      new THREE.MeshStandardMaterial({ color: t.bed, roughness: 0.9 })
    );
    mattress.position.set(0, 0.55, 0);
    bedroom.add(mattress);
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xfafafa })
    );
    pillow.position.set(0, 0.85, -1.15);
    bedroom.add(pillow);
    // Tête de lit
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.3, 0.18),
      new THREE.MeshStandardMaterial({ color: t.sofa, roughness: 0.6 })
    );
    headboard.position.set(0, 1.15, -1.55);
    bedroom.add(headboard);
    // Table de nuit + lampe
    const night = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.8, 0.55),
      new THREE.MeshStandardMaterial({ color: t.table })
    );
    night.position.set(-1.5, 0.4, -1);
    bedroom.add(night);
    const nLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({ color: t.accent, emissive: t.accent, emissiveIntensity: 1 })
    );
    nLamp.position.set(-1.5, 1, -1);
    bedroom.add(nLamp);
    const nLampLight = new THREE.PointLight(t.accent, 0.6, 3);
    nLampLight.position.copy(nLamp.position);
    bedroom.add(nLampLight);
    scene.add(bedroom);

    // === MUR TROPHÉES (au fond, derrière la TV) ===
    const trophyCvs = document.createElement('canvas');
    trophyCvs.width = 1024; trophyCvs.height = 640;
    const tcx = trophyCvs.getContext('2d');
    tcx.fillStyle = '#0d1117'; tcx.fillRect(0, 0, 1024, 640);
    // Cadre doré
    tcx.strokeStyle = '#d4af37'; tcx.lineWidth = 10;
    tcx.strokeRect(20, 20, 984, 600);
    // Titre
    tcx.fillStyle = '#d4af37';
    tcx.font = 'bold 56px Georgia';
    tcx.textAlign = 'center';
    tcx.fillText('🏆 MES TROPHÉES 🏆', 512, 90);
    tcx.fillStyle = '#aaa';
    tcx.font = '24px Georgia';
    tcx.fillText(`— ${profile?.name || 'Joueur'} —`, 512, 130);
    // 6 stats en grille 2×3
    stats.forEach((s, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 80 + col * 470;
      const y = 190 + row * 130;
      tcx.fillStyle = 'rgba(212,175,55,0.1)';
      tcx.fillRect(x, y, 420, 110);
      tcx.strokeStyle = '#d4af37'; tcx.lineWidth = 2;
      tcx.strokeRect(x, y, 420, 110);
      tcx.fillStyle = '#ffe9a3';
      tcx.font = '40px Georgia';
      tcx.textAlign = 'left';
      tcx.fillText(s.icon, x + 20, y + 66);
      tcx.fillStyle = '#fff';
      tcx.font = 'bold 24px Georgia';
      tcx.fillText(s.label, x + 80, y + 48);
      tcx.fillStyle = '#ffd700';
      tcx.font = 'bold 30px Georgia';
      tcx.fillText(String(s.value), x + 80, y + 85);
    });
    const trophyTex = new THREE.CanvasTexture(trophyCvs);
    const trophyWall = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3.75),
      new THREE.MeshBasicMaterial({ map: trophyTex })
    );
    trophyWall.position.set(-size.w / 3, 2.3, -size.d / 2 + 0.03);
    trophyWall.userData = { interaction: 'trophy' };
    scene.add(trophyWall);

    // Horloge murale déco (zone cuisine)
    const clock = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0xfff, emissive: t.accent, emissiveIntensity: 0.2 })
    );
    clock.position.set(0, 3.0, -size.d / 2 + 0.05);
    scene.add(clock);

    // === Caméra orbit légèrement pour montrer 3D ===
    const raycaster = new THREE.Raycaster();
    const mouseV = new THREE.Vector2();
    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseV.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseV.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseV, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (const h of hits) {
        let obj = h.object;
        while (obj && !obj.userData?.interaction) obj = obj.parent;
        if (obj?.userData?.interaction === 'trophy') {
          stateRef.current.onTrophyClick?.();
          return;
        }
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    stateRef.current = { scene, camera, renderer, disposed: false };
    let rafId = 0;
    let elapsed = 0;
    const loop = () => {
      if (stateRef.current.disposed) return;
      elapsed += 0.008;
      // Mouvement de caméra : léger balancement gauche/droite pour rendre vivant
      camera.position.x = Math.sin(elapsed * 0.4) * 1.6;
      camera.position.y = 2.4 + Math.sin(elapsed * 0.3) * 0.1;
      camera.lookAt(0, 1.7, -size.d / 2 + 1);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      stateRef.current.disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', handleClick);
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
  }, [theme, houseId]);

  useEffect(() => {
    stateRef.current.onTrophyClick = () => setShowTrophies(true);
  }, []);

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    // Persist dans profile.ownedHouses[].customizations.theme
    const next = {
      ...profile,
      ownedHouses: (profile.ownedHouses || []).map(h =>
        h.id === houseId ? { ...h, customizations: { ...(h.customizations || {}), theme: newTheme } } : h
      ),
    };
    setProfile(next);
  };

  return (
    <div
      data-testid="home-interior"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#000' }}
    >
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />

      {/* HUD top */}
      <div style={{
        position: 'absolute', top: 14, left: 14, right: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <button
          data-testid="home-exit-btn"
          onClick={onExit}
          style={{
            pointerEvents: 'auto',
            padding: '10px 16px', borderRadius: 20,
            background: 'rgba(10,10,15,0.8)', border: `2px solid ${STAKE.gold}`,
            color: STAKE.goldLight, fontWeight: 800, cursor: 'pointer', fontSize: 13,
            backdropFilter: 'blur(8px)',
          }}
        >← Sortir</button>
        <div style={{
          padding: '10px 16px', borderRadius: 20,
          background: 'rgba(10,10,15,0.8)', border: `2px solid ${STAKE.gold}`,
          color: STAKE.goldLight, fontWeight: 800, fontSize: 13,
          backdropFilter: 'blur(8px)', pointerEvents: 'auto',
        }}>
          🏠 {house?.label || 'Chez moi'}
        </div>
      </div>

      {/* Sélecteur de thème en bas */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
        padding: '0 12px', zIndex: 10,
      }}>
        {Object.entries(HOME_THEMES).map(([key, value]) => (
          <button
            key={key}
            data-testid={`theme-${key}`}
            onClick={() => applyTheme(key)}
            style={{
              padding: '10px 14px', borderRadius: 10,
              background: theme === key
                ? `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`
                : 'rgba(10,10,15,0.8)',
              border: `2px solid ${theme === key ? STAKE.goldLight : 'rgba(212,175,55,0.3)'}`,
              color: '#fff', fontWeight: 800, fontSize: 12,
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              minWidth: 78,
            }}
          >
            <span style={{
              width: 36, height: 18, borderRadius: 4,
              background: `linear-gradient(90deg, #${value.wall.toString(16).padStart(6,'0')}, #${value.accent.toString(16).padStart(6,'0')})`,
              border: '1px solid rgba(255,255,255,0.2)',
            }} />
            {value.label}
          </button>
        ))}
      </div>

      {/* Tip */}
      <div style={{
        position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)',
        padding: '8px 14px', borderRadius: 10, fontSize: 12,
        background: 'rgba(10,10,15,0.7)', color: '#fff',
        border: `1px solid rgba(212,175,55,0.3)`, backdropFilter: 'blur(6px)',
        zIndex: 5,
      }}>
        Clique sur le <b style={{ color: STAKE.gold }}>mur trophées</b> pour voir le détail · Change de thème en bas
      </div>

      {/* Modal détail trophées */}
      {showTrophies && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f2a42, #1d4a79)',
            border: `2px solid ${STAKE.gold}`, borderRadius: 16,
            padding: 24, maxWidth: 480, width: '92%',
            color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 900, marginBottom: 6, textAlign: 'center',
              color: STAKE.goldLight, letterSpacing: 1,
            }}>🏆 MUR DES TROPHÉES 🏆</div>
            <div style={{ fontSize: 12, color: STAKE.inkSoft, textAlign: 'center', marginBottom: 18 }}>
              Statistiques du joueur {profile?.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {stats.map(s => (
                <div key={s.label} style={{
                  padding: 12, borderRadius: 8,
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.25)',
                }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, color: STAKE.inkSoft, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: STAKE.goldLight, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <button
              data-testid="trophy-close"
              onClick={() => setShowTrophies(false)}
              style={{
                width: '100%', marginTop: 18, padding: 14, borderRadius: 10,
                background: `linear-gradient(135deg, ${STAKE.goldDark}, ${STAKE.gold})`,
                border: 'none', color: '#111', fontWeight: 900, cursor: 'pointer',
                fontSize: 13, letterSpacing: 1,
              }}
            >FERMER</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeInterior3D;
