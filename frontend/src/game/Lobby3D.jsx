import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { WEAPONS, VEHICLES, CASINO_3D_COLORS, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, TROPHIES, DEALER_PROFILES, WHEEL_PRIZES, fmt } from '@/game/constants';
import { ArrowButton, Dealer, WeaponIcon, menuBtnStyle, StatCard } from '@/game/ui';
import { FPWeaponView, TPPlayerView, FPHookahView } from '@/game/FPWeapon';
import { useHookah } from '@/game/useHookah';
import { useAmbientAudio } from '@/game/useAmbientAudio';
import { VehicleGraphic } from '@/game/ui';
import sfx from '@/game/sfx';
import { MPClient } from '@/game/multiplayer';
import { buildPlayerCharacter, buildPlayerCharacterLite } from '@/game/playerCharacter';
import { PALETTE, roundedBox, matMatte, matMetal, matGlow, createContactShadow } from '@/game/style';
import { useLookControls } from '@/game/useLookControls';
import { UniversalMenu } from '@/game/UniversalMenu';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// ============== SCÈNE 3D THREE.JS - LOBBY COMPLET V4 ==============
const Lobby3D = ({ profile, casino, casinoId, deviceType, onSelectGame, onLogout, onExitCasino, onReplayTutorial, onOpenTrophies, onOpenShop, onOpenATM, onOpenWheel, walletReady, wheelReady, balance, onOpenBar, onOpenToilet, onOpenGambleBet, weapons, selectedWeapon, setSelectedWeapon, onShoot, onChangeCasino, onOpenCharacter, onToggleVehicle, onOpenQuests, mpMode, mpServerId, onOpenControls, onOpenProfile, onOpenLeaderboard, onOpenBattlePass, onOpenCrash, onOpenDice, onOpenCoinFlip, onOpenMines }) => {
  const mountRef = useRef(null);
  const [nearZone, setNearZone] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [showArcadeMenu, setShowArcadeMenu] = useState(false);
  const [shooting, setShooting] = useState(false);
  // TPS par défaut : les joueurs voient leur skin pendant qu'ils jouent
  const [viewMode, setViewMode] = useState('third'); // 'first' | 'third'
  const viewModeRef = useRef('third');
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  const firingRef = useRef(false);
  const [visibleBullets, setVisibleBullets] = useState([]);
  const [muzzleKey, setMuzzleKey] = useState(0);
  const nearZoneRef = useRef(null);
  const onSelectRef = useRef(onSelectGame);
  const zoneCallbacksRef = useRef({});
  onSelectRef.current = onSelectGame;
  zoneCallbacksRef.current = {
    blackjack: () => onSelectGame('blackjack'),
    roulette: () => onSelectGame('roulette'),
    highcard: () => onSelectGame('highcard'),
    poker: () => onSelectGame('poker'),
    bar: () => onOpenBar(),
    toilet: () => onOpenToilet(),
    atm: () => onOpenATM(),
    wheel: () => onOpenWheel(),
    shop: () => onOpenShop(),
    benzbet: () => onOpenGambleBet(),
    'arcade-crash': () => onOpenCrash && onOpenCrash(),
    'arcade-mines': () => onOpenMines && onOpenMines(),
    'arcade-dice':  () => onOpenDice && onOpenDice(),
    'arcade-coin':  () => onOpenCoinFlip && onOpenCoinFlip(),
    exit: () => onExitCasino && onExitCasino(),
  };
  
  // État touches pour mobile
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false });

  // ====== MULTIJOUEUR ======
  const mpOnline = mpMode === 'online' && !!mpServerId;
  const mpRef = useRef(null);       // MPClient instance
  const myIdRef = useRef(null);     // ID reçu du serveur
  const remotePlayersRef = useRef({}); // id -> { mesh, data }
  const sceneRefLocal = useRef(null); // accessible via sceneRef plus bas
  const [chatMessages, setChatMessages] = useState([]); // [{from, text, ts}]
  const [chatInput, setChatInput] = useState('');
  const [showChatInput, setShowChatInput] = useState(false);
  // Chat collapsible — par défaut REPLIÉ sur mobile, déplié sur desktop
  const [chatCollapsed, setChatCollapsed] = useState(deviceType === 'mobile');
  const chatInputRef = useRef(null);
  const [killFeed, setKillFeed] = useState([]); // [{killer, victim, weapon, ts}]
  const [myHp, setMyHp] = useState(100);
  // Système de vies — 3 vies par session MP. Une vie perdue à chaque mort.
  // À 0 → mode spectateur jusqu'à reconnexion / session suivante.
  const [sessionLives, setSessionLives] = useState(3);
  const [spectating, setSpectating] = useState(false);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState(0);

  // ====== ANIMATION D'ARRIVÉE — cinématique d'entrée 3 s ======
  // Caméra qui descend en spirale depuis 7m de haut, atterrit pile à la position
  // 1ère personne du joueur (œil à 1.7m), avec overlay flash + nom du casino.
  // Le spawn est capturé à la 1ère frame (`arrivalSpawnRef`) pour que la caméra
  // ne dérive pas, et `camera.position` est restauré à chaque frame pour ne pas
  // déplacer le joueur dans le monde pendant la cinématique.
  const ARRIVAL_DURATION_MS = 3000;
  const [arriving, setArriving] = useState(true);
  const arrivingRef = useRef(true);
  const arrivalStartRef = useRef(performance.now());
  const arrivalSpawnRef = useRef(null); // { x, z } figés à la 1ère frame

  // ====== CHICHA — hook partagé ======
  const { equippedHookah, hasHookah, usingHookah, useHookah: useHookahFn } = useHookah(profile);

  // Position du joueur lue par les couches sonores ambiantes (mise à jour
  // depuis la boucle de rendu Three.js — voir useEffect plus bas).
  const stateRef = useRef({ player: { x: 0, y: 0, z: 0 } });

  // ====== AMBIANCE SONORE casino — désactivée ======
  // (Utilisateur a demandé silence sauf tirs d'arme.)
  useAmbientAudio({ stateRef, layers: [] });
  useEffect(() => { arrivingRef.current = arriving; }, [arriving]);
  useEffect(() => {
    arrivalStartRef.current = performance.now();
    arrivalSpawnRef.current = null; // reset pour qu'elle soit re-capturée à la 1ère frame
    setArriving(true);
    const t = setTimeout(() => setArriving(false), ARRIVAL_DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const colors = CASINO_3D_COLORS[casinoId] || CASINO_3D_COLORS.vegas;
    const primaryHex = parseInt(casino.primary.slice(1), 16);
    const secondaryHex = parseInt(casino.secondary.slice(1), 16);
    const accentHex = parseInt(casino.accent.slice(1), 16);
    
    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1028);
    scene.fog = new THREE.Fog(0x1a1028, 25, 80);
    sceneRef.current = scene;
    sceneRefLocal.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    // Spawn juste devant la porte d'entrée (z=17.5 = porte). On apparaît à
    // z=14, face -Z, avec une vue dégagée sur le hall (poker à z=4,
    // blackjack/highcard à z=-2, roulette à z=-8). Avant on spawnait à z=5,
    // pile à 1m derrière la table de poker (z=4) — donc bloqué dès l'arrivée.
    camera.position.set(0, 1.7, 14);
    cameraRef.current = camera;

    // ========== AVATAR 3D JOUEUR (vue 3ème personne) ==========
    // Simple personnage stylisé construit avec des primitives Three.js.
    // Couleurs tirées du profil (cheveux, tenue, chaussures, teint).
    const buildPlayerAvatar = () => {
      // Utilise le module partagé pour que le perso de création ===
      // celui dans le lobby et en jeu. Les refs (leftArm, rightArm,
      // leftLeg, rightLeg, leftShoe, rightShoe) sont posées par
      // playerCharacter.js dans userData, et exploitées par
      // l'animation de marche TPS plus bas.
      const av = buildPlayerCharacter({
        skinPack: profile?.equippedSkin,    // ← priorité skin pack
        hair: profile?.hair ?? 0,
        outfit: profile?.outfit ?? 0,
        shoes: profile?.shoes ?? 0,
        short: profile?.short ?? null,
        skin: profile?.skin || '#e0b48a',
      });
      av.visible = false; // shown only in 3rd person
      // fix-rendering : ombre de contact (visible aussi en TPS)
      av.add(createContactShadow({ radius: 0.45, opacity: 0.5 }));
      return av;
    };
    const playerAvatar = buildPlayerAvatar();
    scene.add(playerAvatar);

    // ===== Weapon mesh attaché au bras droit (visible en TPS) =====
    // Quand selectedWeaponRef.current change, on remplace le mesh.
    let attachedWeaponId = null;
    let attachedWeapon = null;
    const buildWeaponMesh = (id) => {
      if (!id) return null;
      const g = new THREE.Group();
      // Position : dans la main droite (qui est à -0.85 du bras)
      g.position.set(0.04, -0.85, 0.05);
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x14141a, metalness: 0.6, roughness: 0.45 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2d18, roughness: 0.85 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xa8acb0, metalness: 0.9, roughness: 0.3 });
      if (id === 'gun' || id === 'shotgun' || id === 'uzi') {
        // Pistolet/UZI : corps + canon + crosse
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.22), blackMat);
        body.position.set(0, 0, 0.04);
        g.add(body);
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.18), blackMat);
        barrel.position.set(0, 0.04, 0.18);
        g.add(barrel);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.07), blackMat);
        grip.position.set(0, -0.07, 0);
        g.add(grip);
        if (id === 'shotgun') {
          // Canon plus long
          barrel.scale.z = 1.6;
          barrel.position.z = 0.22;
        }
        if (id === 'uzi') {
          // Chargeur sortant + accent or
          const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.05), blackMat);
          mag.position.set(0, -0.13, 0.04);
          g.add(mag);
          const acc = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.022, 0.22), goldMat);
          acc.position.set(0, 0.05, 0.04);
          g.add(acc);
        }
      } else if (id === 'knife' || id === 'machete' || id === 'throwknife') {
        // Lame + manche
        const len = id === 'machete' ? 0.36 : 0.22;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, len), steelMat);
        blade.position.set(0, 0, len / 2 + 0.05);
        g.add(blade);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.12), woodMat);
        handle.position.set(0, 0, -0.01);
        g.add(handle);
      } else if (id === 'crossbow') {
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.32), woodMat);
        stock.position.set(0, 0, 0.1);
        g.add(stock);
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.04), blackMat);
        bow.position.set(0, 0.04, 0.18);
        g.add(bow);
      } else if (id === 'bazooka') {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 12), blackMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.03, 0.18);
        g.add(tube);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.07), blackMat);
        grip.position.set(0, -0.07, 0);
        g.add(grip);
      } else if (id === 'flamethrower') {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12), goldMat);
        tank.rotation.x = Math.PI / 2;
        tank.position.set(0, 0, -0.05);
        g.add(tank);
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.22, 10), blackMat);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(0, 0.03, 0.18);
        g.add(nozzle);
      } else if (id === 'grenade') {
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshStandardMaterial({ color: 0x3a4a2a, roughness: 0.85 }));
        ball.position.set(0, 0, 0.05);
        g.add(ball);
      } else if (id === 'laserrifle') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.32), blackMat);
        body.position.set(0, 0, 0.12);
        g.add(body);
        const emitter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0x3fe6ff, emissive: 0x3fe6ff, emissiveIntensity: 1.2, roughness: 0.4 }),
        );
        emitter.rotation.x = Math.PI / 2;
        emitter.position.set(0, 0, 0.32);
        g.add(emitter);
      } else if (id === 'sniper') {
        // Long canon noir + crosse bois + lunette dorée
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.16), woodMat);
        stock.position.set(0, 0, -0.05);
        g.add(stock);
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.42), blackMat);
        body.position.set(0, 0.02, 0.18);
        g.add(body);
        // Lunette (cylindre doré)
        const scope = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12),
          goldMat,
        );
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.07, 0.14);
        g.add(scope);
        // Canon plus long
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.2), blackMat);
        barrel.position.set(0, 0.025, 0.42);
        g.add(barrel);
        // Crosse poignée
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.07), blackMat);
        grip.position.set(0, -0.07, -0.02);
        g.add(grip);
      } else if (id === 'katana') {
        // Lame longue courbée + tsuba + manche
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.01, 0.55),
          new THREE.MeshStandardMaterial({ color: 0xd8d8e0, metalness: 0.95, roughness: 0.15 }),
        );
        blade.position.set(0, 0, 0.35);
        // Très légère courbure : rotation sur Y pour donner un angle
        blade.rotation.y = 0.05;
        g.add(blade);
        // Tsuba (garde, disque doré)
        const tsuba = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.018, 14),
          goldMat,
        );
        tsuba.rotation.x = Math.PI / 2;
        tsuba.position.set(0, 0, 0.08);
        g.add(tsuba);
        // Manche bois tressé noir
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.18, 10),
          new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.9 }),
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.set(0, 0, -0.03);
        g.add(handle);
      }
      return g;
    };
    // ===== Hookah mesh : tenue à la main droite (visible en TPS) =====
    // Quand le joueur a une chicha équipée mais NE l'utilise pas → tenue à
    // côté du corps. Quand il l'utilise → bras qui se lève vers la bouche.
    const buildHookahMesh = (id) => {
      if (!id) return null;
      const g = new THREE.Group();
      g.position.set(0.04, -0.85, 0.05);
      const baseCol = id === 'hookah-gold' ? 0xffd700
                    : id === 'hookah-platinum' ? 0xe5e4e2 : 0xc8a85a;
      const baseMat = new THREE.MeshStandardMaterial({ color: baseCol, metalness: 0.6, roughness: 0.3 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 });
      // Bowl (large hémisphère)
      const bowl = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        baseMat,
      );
      bowl.position.y = 0.06;
      bowl.rotation.x = Math.PI;
      g.add(bowl);
      // Tige verticale
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8),
        darkMat,
      );
      stem.position.y = 0.15;
      g.add(stem);
      // Foyer + braise
      const foyer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.025, 0.025, 10),
        darkMat,
      );
      foyer.position.y = 0.25;
      g.add(foyer);
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff4a00, transparent: true, opacity: 0.95 }),
      );
      ember.position.y = 0.265;
      g.add(ember);
      // Tuyau qui descend
      const hose = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.012, 6, 14, Math.PI),
        darkMat,
      );
      hose.position.set(0.05, 0.05, 0);
      hose.rotation.z = Math.PI / 2;
      g.add(hose);
      return g;
    };
    let attachedHookahId = null;
    let attachedHookah = null;
    const refreshAttachedHookah = () => {
      const id = (hasHookah && !selectedWeaponRef.current) ? equippedHookah : null;
      if (id === attachedHookahId) return;
      if (attachedHookah) {
        playerAvatar.userData.rightArm?.remove(attachedHookah);
        attachedHookah.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        attachedHookah = null;
      }
      const ng = buildHookahMesh(id);
      if (ng && playerAvatar.userData.rightArm) {
        playerAvatar.userData.rightArm.add(ng);
        attachedHookah = ng;
      }
      attachedHookahId = id;
    };

    const refreshAttachedWeapon = () => {
      const id = selectedWeaponRef.current;
      if (id === attachedWeaponId) return;
      // Remove ancien
      if (attachedWeapon) {
        playerAvatar.userData.rightArm?.remove(attachedWeapon);
        attachedWeapon.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        attachedWeapon = null;
      }
      const ng = buildWeaponMesh(id);
      if (ng && playerAvatar.userData.rightArm) {
        playerAvatar.userData.rightArm.add(ng);
        attachedWeapon = ng;
      }
      attachedWeaponId = id;
    };

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    // === fix-rendering : uniformisé à 2 (avant 1.5 → casino moins net que la rue) ===
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    // === fix-rendering : look cinéma GTA V ===
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // === fix-rendering : env map PBR procédurale ===
    {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    // === gta-mechanics : SpringArm caméra TPS ===
    // 1) Lerp smooth pour fluidifier les rotations (Directive #1)
    // 2) anti-lag-multiplayer : 2D AABB raycast au lieu d'intersectObjects(scene)
    //    L'ancienne version itérait ~700 meshes recursivement à chaque frame
    //    (casino + 4 bornes + 50 remote rigs). Le nouveau fait un slab-test
    //    rapide sur la liste pré-calculée de colliders (~30 boxes).
    // Constantes TPS UNIFIÉES (identiques à Street3D ville) :
    const TPS_DESIRED_DIST = 3.2;   // mêmes valeurs partout
    const TPS_MIN_DIST     = 0.6;
    const TPS_WALL_PAD     = 0.18;
    const TPS_HEIGHT       = 2.9;   // ~camY + 0.6 = 2.3 + 0.6
    const TPS_LERP         = 0.18;
    const tpsTargetPos     = new THREE.Vector3();
    const tpsSmoothPos     = new THREE.Vector3(0, TPS_HEIGHT, 0);
    let tpsSmoothInit = false;

    // Slab-method ray vs AABB 2D (horizontal). Retourne la distance min ou Infinity.
    // Beaucoup plus rapide qu'intersectObjects sur des centaines de meshes.
    const _slabRayAABB = (ox, oz, dx, dz, aabb) => {
      const inv_dx = dx !== 0 ? 1 / dx : Infinity;
      const inv_dz = dz !== 0 ? 1 / dz : Infinity;
      const tx1 = (aabb.minX - ox) * inv_dx;
      const tx2 = (aabb.maxX - ox) * inv_dx;
      const tz1 = (aabb.minZ - oz) * inv_dz;
      const tz2 = (aabb.maxZ - oz) * inv_dz;
      const tmin = Math.max(Math.min(tx1, tx2), Math.min(tz1, tz2));
      const tmax = Math.min(Math.max(tx1, tx2), Math.max(tz1, tz2));
      if (tmax < 0 || tmin > tmax) return Infinity;
      return Math.max(0, tmin);
    };

    // ========== SOL MARBRE UNIFORME ==========
    // Texture marbre dessinée en canvas (uniforme partout)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512; floorCanvas.height = 512;
    const floorCtx = floorCanvas.getContext('2d');
    // Fond crème/beige marbré
    const floorGrad = floorCtx.createRadialGradient(256, 256, 0, 256, 256, 400);
    floorGrad.addColorStop(0, '#f0e8d0');
    floorGrad.addColorStop(0.5, '#d8c898');
    floorGrad.addColorStop(1, '#b8a878');
    floorCtx.fillStyle = floorGrad;
    floorCtx.fillRect(0, 0, 512, 512);
    // Veines du marbre
    for (let i = 0; i < 30; i++) {
      floorCtx.strokeStyle = `rgba(${100 + Math.random() * 60}, ${80 + Math.random() * 40}, ${60 + Math.random() * 40}, 0.3)`;
      floorCtx.lineWidth = 0.5 + Math.random() * 1.5;
      floorCtx.beginPath();
      floorCtx.moveTo(Math.random() * 512, Math.random() * 512);
      for (let j = 0; j < 5; j++) {
        floorCtx.quadraticCurveTo(
          Math.random() * 512, Math.random() * 512,
          Math.random() * 512, Math.random() * 512
        );
      }
      floorCtx.stroke();
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(8, 8);
    
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ 
        map: floorTex,
        roughness: 0.3, 
        metalness: 0.2,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.isFloor = true; // gta-mechanics : ignoré par le raycast caméra
    scene.add(floor);

    // ========== TAPIS AUX COULEURS DU PAYS ==========
    // Canvas avec les bandes du drapeau
    const carpetCanvas = document.createElement('canvas');
    carpetCanvas.width = 512; carpetCanvas.height = 256;
    const carpetCtx = carpetCanvas.getContext('2d');
    // Fond sombre pour bords
    carpetCtx.fillStyle = '#1a0a05';
    carpetCtx.fillRect(0, 0, 512, 256);
    // Bandes des couleurs du drapeau (au centre)
    const stripeHeight = 256 - 60; // marges haut/bas
    const stripeY = 30;
    const stripeCount = casino.flag.length;
    const stripeWidth = (512 - 40) / stripeCount;
    casino.flag.forEach((col, i) => {
      carpetCtx.fillStyle = col;
      carpetCtx.fillRect(20 + i * stripeWidth, stripeY, stripeWidth, stripeHeight);
    });
    // Bordure dorée
    carpetCtx.strokeStyle = '#ffd700';
    carpetCtx.lineWidth = 8;
    carpetCtx.strokeRect(20, stripeY, 512 - 40, stripeHeight);
    // Motif central (étoile ou emblème)
    carpetCtx.fillStyle = 'rgba(255,215,0,0.3)';
    carpetCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 - 0.5) * Math.PI / 2.5;
      const r = i % 2 === 0 ? 40 : 18;
      const x = 256 + r * Math.cos(angle);
      const y = 130 + r * Math.sin(angle);
      if (i === 0) carpetCtx.moveTo(x, y);
      else carpetCtx.lineTo(x, y);
    }
    carpetCtx.closePath();
    carpetCtx.fill();
    
    const carpetTex = new THREE.CanvasTexture(carpetCanvas);
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 30),
      new THREE.MeshStandardMaterial({ 
        map: carpetTex,
        roughness: 0.95,
      })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.rotation.z = Math.PI / 2;
    carpet.position.y = 0.01;
    carpet.receiveShadow = true;
    scene.add(carpet);

    // ========== PLAFOND avec motifs ==========
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: colors.ceiling, roughness: 1 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 6;
    scene.add(ceiling);

    // Moulures dorées au plafond
    for (let i = 0; i < 6; i++) {
      const mold = new THREE.Mesh(
        new THREE.BoxGeometry(56, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 })
      );
      mold.position.set(0, 5.9, -25 + i * 10);
      scene.add(mold);
    }

    // ========== MURS — refaits style guide unifié ==========
    // Chaque mur a : (1) une grosse plaque crème dans la palette,
    // (2) un soubassement bois sombre sur les 1.5 premiers mètres,
    // (3) une corniche or en haut. Cohérent avec la façade extérieure.
    const wallMat = matMatte(PALETTE.cream, { roughness: 0.85 });
    const wainsMat = matMatte(PALETTE.woodDark, { roughness: 0.85 });
    const goldTrimMat = matMetal(PALETTE.gold, { roughness: 0.25 });
    const wallHi = matMatte(primaryHex, { roughness: 0.7, metalness: 0.3 });

    const buildWallSegment = (w, h, x, y, z, rotY = 0) => {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
      wall.position.set(x, y, z);
      wall.rotation.y = rotY;
      wall.receiveShadow = true;
      scene.add(wall);
      // Soubassement bois (boiserie basse)
      const wains = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.4), wainsMat);
      wains.position.set(x, 0.7, z);
      wains.rotation.y = rotY;
      // Légèrement décollé pour éviter z-fighting
      const off = 0.005;
      const dx = Math.sin(rotY) * off, dz = Math.cos(rotY) * off;
      wains.position.x += dx; wains.position.z += dz;
      scene.add(wains);
      // Corniche or fine en haut
      const trim = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.18), goldTrimMat);
      trim.position.set(x + dx, h - 0.2, z + dz);
      trim.rotation.y = rotY;
      scene.add(trim);
      // Liseré or au-dessus du soubassement
      const lineGold = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.06), goldTrimMat);
      lineGold.position.set(x + dx, 1.45, z + dz);
      lineGold.rotation.y = rotY;
      scene.add(lineGold);
    };

    // Mur arrière (rotY=0, normale vers +Z)
    buildWallSegment(40, 6, 0, 3, -20, 0);
    // Bande décorative casino sur le mur arrière
    const wallBackBand = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.4), wallHi);
    wallBackBand.position.set(0, 4.6, -19.94);
    scene.add(wallBackBand);

    // Mur avant gauche / droit / haut (rotY=π)
    buildWallSegment(16, 6, -12, 3, 20, Math.PI);
    buildWallSegment(16, 6, 12, 3, 20, Math.PI);
    const wallFrontTop = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), wallMat);
    wallFrontTop.position.set(0, 5.25, 20);
    wallFrontTop.rotation.y = Math.PI;
    scene.add(wallFrontTop);

    // Murs latéraux
    buildWallSegment(40, 6, -20, 3, 0, Math.PI / 2);
    buildWallSegment(40, 6, 20, 3, 0, -Math.PI / 2);

    // ========== LUMIÈRES — atmosphère casino chaude (fix-rendering : bump ACES) ==========
    scene.add(new THREE.AmbientLight(0xfff4dc, 0.75));
    const hemi = new THREE.HemisphereLight(0xfff0c8, 0xb87a2a, 0.75);
    scene.add(hemi);
    const wallSun = new THREE.DirectionalLight(0xffd9a0, 0.6);
    wallSun.position.set(0, 6, 18);
    scene.add(wallSun);
    
    // LUSTRES grandiose (6 pièces)
    const chandelierPositions = [[0, 0], [0, -8]];
    chandelierPositions.forEach(([x, z]) => {
      const group = new THREE.Group();
      
      // Chaîne
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.7 })
      );
      chain.position.set(0, 5.5, 0);
      group.add(chain);
      
      // Support doré
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      support.position.set(0, 5.1, 0);
      group.add(support);
      
      // Structure anneaux
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.05, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      ring1.position.set(0, 4.8, 0);
      group.add(ring1);
      
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.05, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      ring2.position.set(0, 4.6, 0);
      group.add(ring2);
      
      // Ampoules autour
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: colors.light })
        );
        bulb.position.set(Math.cos(angle) * 0.7, 4.8, Math.sin(angle) * 0.7);
        group.add(bulb);
        // Halo
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshBasicMaterial({ color: colors.light, transparent: true, opacity: 0.3 })
        );
        halo.position.copy(bulb.position);
        group.add(halo);
      }
      
      // Lumière réelle
      const light = new THREE.PointLight(0xffe080, 2.2, 22);
      light.position.set(0, 4.8, 0);
      // ombre désactivée pour perf
      group.add(light);
      
      // Pendeloques de cristal
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.08, 0),
          new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, metalness: 0.9, roughness: 0.1 })
        );
        crystal.position.set(Math.cos(angle) * 0.45, 4.4, Math.sin(angle) * 0.45);
        group.add(crystal);
      }
      
      group.position.set(x, 0, z);
      scene.add(group);
    });
    
    // Spots au-dessus des tables (en plus des lustres)
    const createSpot = (x, z, col) => {
      const spot = new THREE.SpotLight(col, 3.5, 18, Math.PI / 5, 0.3, 1);
      spot.position.set(x, 5.5, z);
      spot.target.position.set(x, 0, z);
      scene.add(spot);
      scene.add(spot.target);
    };
    createSpot(0, 5, colors.light);
    createSpot(0, -5, colors.light);
    createSpot(0, -15, colors.light);
    createSpot(-20, 0, 0xffd700);
    createSpot(20, 0, 0xffd700);
    createSpot(-20, -20, colors.light);
    createSpot(20, -20, colors.light);
    // Spot supplémentaire concentré sur la roulette pour la mettre en valeur
    const rouletteSpot = new THREE.SpotLight(0xffffff, 5, 10, Math.PI / 4, 0.2, 1);
    rouletteSpot.position.set(0, 5, -8);
    rouletteSpot.target.position.set(0, 1, -8);
    scene.add(rouletteSpot);
    scene.add(rouletteSpot.target);

    // LEDs murales
    for (let i = 0; i < 12; i++) {
      const led1 = new THREE.PointLight(primaryHex, 0.7, 6);
      led1.position.set(-29, 4, -25 + i * 5);
      scene.add(led1);
      const led2 = new THREE.PointLight(primaryHex, 0.7, 6);
      led2.position.set(29, 4, -25 + i * 5);
      scene.add(led2);
    }

    // ========== ENSEIGNE D'ENTRÉE ==========
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = 1024;
    entranceCanvas.height = 256;
    const ectx = entranceCanvas.getContext('2d');
    // Fond néon
    const grad = ectx.createLinearGradient(0, 0, 1024, 256);
    grad.addColorStop(0, casino.primary);
    grad.addColorStop(0.5, '#000');
    grad.addColorStop(1, casino.secondary);
    ectx.fillStyle = grad;
    ectx.fillRect(0, 0, 1024, 256);
    ectx.fillStyle = '#000';
    ectx.fillRect(10, 10, 1004, 236);
    ectx.strokeStyle = casino.secondary;
    ectx.lineWidth = 6;
    ectx.strokeRect(15, 15, 994, 226);
    ectx.fillStyle = casino.secondary;
    ectx.shadowColor = casino.secondary;
    ectx.shadowBlur = 20;
    ectx.font = 'bold 90px Georgia, serif';
    ectx.textAlign = 'center';
    ectx.fillText(casino.name.toUpperCase(), 512, 110);
    ectx.fillStyle = '#fff';
    ectx.shadowBlur = 10;
    ectx.font = 'italic 40px Georgia, serif';
    ectx.fillText(casino.tagline, 512, 180);
    const etex = new THREE.CanvasTexture(entranceCanvas);
    const entranceSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3),
      new THREE.MeshBasicMaterial({ map: etex, transparent: true })
    );
    entranceSign.position.set(0, 4.8, 19.9);
    entranceSign.rotation.y = Math.PI;
    scene.add(entranceSign);
    // Bordure lumineuse autour
    for (let i = 0; i < 10; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      const angle = i / 20;
      if (i < 10) bulb.position.set(-6 + angle * 12, 3.3, 19.85);
      else bulb.position.set(-6 + (angle - 0.5) * 12, 6.3, 19.85);
      scene.add(bulb);
    }
    
    // Tableaux décoratifs sur les murs
    const createPainting = (x, y, z, rotY, color) => {
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      frame.position.set(x, y, z);
      frame.rotation.y = rotY;
      scene.add(frame);
      const inner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.7, 1.2),
        new THREE.MeshStandardMaterial({ color })
      );
      inner.position.set(x + Math.cos(rotY + Math.PI/2) * 0.06, y, z + Math.sin(rotY + Math.PI/2) * 0.06);
      inner.rotation.y = rotY;
      scene.add(inner);
    };
    createPainting(-19.8, 3, -8, Math.PI / 2, 0x4a2a10);
    createPainting(-19.8, 3, 8, Math.PI / 2, 0x1a4a1a);
    createPainting(19.8, 3, -8, -Math.PI / 2, 0x1a1a4a);
    createPainting(19.8, 3, 8, -Math.PI / 2, 0x4a1a1a);

    // ========== TVs AVEC MATCHS LIVE ==========
    const tvTextures = [];
    const createTV = (x, y, z, rotY, sport) => {
      const tvGroup = new THREE.Group();
      
      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.9, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
      );
      tvGroup.add(frame);
      
      // Écran (canvas)
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      const tex = new THREE.CanvasTexture(canvas);
      tvTextures.push({ canvas, ctx, texture: tex, sport, frame: 0, homeScore: 0, awayScore: 0 });
      
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.9, 1.63),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      screen.position.z = 0.08;
      tvGroup.add(screen);
      
      // Support mural
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 })
      );
      bracket.position.z = -0.15;
      tvGroup.add(bracket);
      
      tvGroup.position.set(x, y, z);
      tvGroup.rotation.y = rotY;
      scene.add(tvGroup);
    };
    
    // 4 TVs autour du casino
    createTV(-19.8, 4.2, -3, Math.PI / 2, 'football');
    createTV(-19.8, 4.2, 3, Math.PI / 2, 'basket');
    createTV(19.8, 4.2, -3, -Math.PI / 2, 'tennis');
    createTV(19.8, 4.2, 3, -Math.PI / 2, 'football2');
    
    // Fonction qui dessine le frame de chaque TV
    const drawTVFrame = (tvData, time) => {
      const { canvas, ctx, texture, sport } = tvData;
      const w = canvas.width, h = canvas.height;
      
      if (sport === 'football' || sport === 'football2') {
        // Terrain de foot vue latérale
        ctx.fillStyle = '#1a5a1a';
        ctx.fillRect(0, 0, w, h);
        // Bandes alternées
        for (let i = 0; i < 6; i++) {
          if (i % 2 === 0) {
            ctx.fillStyle = '#1a6a1a';
            ctx.fillRect(i * (w/6), 0, w/6, h);
          }
        }
        // Lignes
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, w - 40, h - 80);
        ctx.beginPath();
        ctx.moveTo(w/2, 40); ctx.lineTo(w/2, h - 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w/2, h/2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ballon qui se déplace
        const ballX = w/2 + Math.sin(time * 0.002) * (w/3);
        const ballY = h/2 + Math.cos(time * 0.003) * 40;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ballX - 2, ballY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Joueurs (petits rectangles)
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + time * 0.0005;
          const px = w/2 + Math.cos(angle) * 80 + Math.sin(time * 0.003 + i) * 20;
          const py = h/2 + Math.sin(angle) * 50;
          ctx.fillStyle = i < 3 ? '#ff0040' : '#0040ff';
          ctx.fillRect(px - 4, py - 10, 8, 20);
          // Tête
          ctx.fillStyle = '#f4c088';
          ctx.beginPath();
          ctx.arc(px, py - 13, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Bandeau score
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(sport === 'football' ? 'PSG 2 - 1 OM' : 'REAL 0 - 0 BARCA', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE', w - 90, 22);
        
      } else if (sport === 'basket') {
        // Terrain de basket
        ctx.fillStyle = '#c8925a';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 40, w - 40, h - 80);
        ctx.beginPath();
        ctx.arc(w/2, h/2, 35, 0, Math.PI * 2);
        ctx.stroke();
        // Paniers
        ctx.fillStyle = '#222';
        ctx.fillRect(20, h/2 - 25, 8, 50);
        ctx.fillRect(w - 28, h/2 - 25, 8, 50);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(15, h/2 - 10, 5, 20);
        ctx.fillRect(w - 20, h/2 - 10, 5, 20);
        
        // Ballon
        const bx = w/2 + Math.sin(time * 0.003) * (w/3);
        const by = h/2 + Math.abs(Math.cos(time * 0.004)) * 30;
        ctx.fillStyle = '#e85020';
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx - 7, by); ctx.lineTo(bx + 7, by);
        ctx.moveTo(bx, by - 7); ctx.lineTo(bx, by + 7);
        ctx.stroke();
        
        // Joueurs
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2 + time * 0.0008;
          const px = w/2 + Math.cos(angle) * 100 + Math.sin(time * 0.002 + i) * 15;
          const py = h/2 + Math.sin(angle) * 60;
          ctx.fillStyle = i < 5 ? '#ffcc00' : '#006600';
          ctx.fillRect(px - 4, py - 11, 8, 22);
          ctx.fillStyle = '#f4c088';
          ctx.beginPath();
          ctx.arc(px, py - 14, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('LAKERS 89 - 84 CELTICS', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE Q3', w - 110, 22);
        
      } else if (sport === 'tennis') {
        // Court de tennis
        ctx.fillStyle = '#2a8a3e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#4aaa5e';
        ctx.fillRect(50, 50, w - 100, h - 100);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, w - 100, h - 100);
        // Filet
        ctx.beginPath();
        ctx.moveTo(w/2, 50); ctx.lineTo(w/2, h - 50);
        ctx.stroke();
        // Lignes de service
        ctx.strokeRect(50, h/2 - 40, w/2 - 50, 80);
        ctx.strokeRect(w/2, h/2 - 40, w/2 - 50, 80);
        
        // Balle
        const tx = w/2 + Math.sin(time * 0.005) * (w/3);
        const ty = h/2 + Math.cos(time * 0.006) * 60;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(tx, ty, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 2 joueurs
        const p1x = 150 + Math.sin(time * 0.003) * 30;
        const p2x = w - 150 + Math.cos(time * 0.004) * 30;
        ctx.fillStyle = '#fff';
        ctx.fillRect(p1x - 4, h/2 - 14, 8, 28);
        ctx.fillRect(p2x - 4, h/2 - 14, 8, 28);
        ctx.fillStyle = '#f4c088';
        ctx.beginPath();
        ctx.arc(p1x, h/2 - 18, 4, 0, Math.PI * 2);
        ctx.arc(p2x, h/2 - 18, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Score
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('DJOKOVIC 6-4 4-3  NADAL', 10, 22);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('● LIVE', w - 90, 22);
      }
      
      texture.needsUpdate = true;
    };

    // ========== AFFICHES / PUBLICITÉS ==========
    const createPoster = (x, y, z, rotY, type) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (type === 'concert') {
        // Fond dégradé
        const grad = ctx.createLinearGradient(0, 0, 0, 600);
        grad.addColorStop(0, '#ff00aa');
        grad.addColorStop(0.5, '#6a0080');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 600);
        // Titre
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 56px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('CONCERT', 200, 100);
        ctx.font = 'bold 42px Georgia';
        ctx.fillStyle = '#fff';
        ctx.fillText('LIVE', 200, 160);
        // Silhouette
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(200, 320, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(160, 350, 80, 160);
        // Info
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('THIS SATURDAY', 200, 550);
        ctx.font = '20px Arial';
        ctx.fillText('CASINO ARENA', 200, 580);
      } else if (type === 'boxing') {
        ctx.fillStyle = '#1a0000';
        ctx.fillRect(0, 0, 400, 600);
        // Bordure rouge
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, 380, 580);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 60px Impact';
        ctx.textAlign = 'center';
        ctx.fillText('BOXING', 200, 100);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 40px Impact';
        ctx.fillText('NIGHT', 200, 160);
        // VS
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 80px Impact';
        ctx.fillText('VS', 200, 340);
        // Noms
        ctx.font = 'bold 30px Arial';
        ctx.fillText('TYSON', 200, 260);
        ctx.fillText('ALI', 200, 420);
        ctx.fillStyle = '#ff0';
        ctx.font = '22px Arial';
        ctx.fillText('MAIN EVENT', 200, 520);
        ctx.font = '18px Arial';
        ctx.fillText('FRIDAY 10PM', 200, 560);
      } else if (type === 'casino') {
        ctx.fillStyle = '#0a0a20';
        ctx.fillRect(0, 0, 400, 600);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 72px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('JACKPOT', 200, 120);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Georgia';
        ctx.fillText('1 000 000', 200, 280);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Georgia';
        ctx.fillText('BENZOUZ', 200, 320);
        // Cartes
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(60 + i * 75, 400, 50, 70);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(60 + i * 75, 400, 50, 70);
          ctx.fillStyle = i % 2 === 0 ? '#000' : '#ff0000';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(['A', 'K', 'Q', 'J'][i], 85 + i * 75, 440);
        }
        ctx.fillStyle = '#ff00aa';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('TENTEZ VOTRE CHANCE', 200, 560);
      }
      
      const tex = new THREE.CanvasTexture(canvas);
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.8),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      poster.position.set(x, y, z);
      poster.rotation.y = rotY;
      scene.add(poster);
      // Cadre
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.9, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
      );
      frame.position.copy(poster.position);
      frame.position.x += Math.cos(rotY + Math.PI) * 0.05;
      frame.position.z += Math.sin(rotY + Math.PI) * 0.05;
      frame.rotation.y = rotY;
      scene.add(frame);
    };
    
    createPoster(-19.7, 2.2, -13, Math.PI / 2, 'concert');
    createPoster(-19.7, 2.2, 13, Math.PI / 2, 'boxing');
    createPoster(19.7, 2.2, -13, -Math.PI / 2, 'casino');
    createPoster(19.7, 2.2, 13, -Math.PI / 2, 'concert');

    // ========== PLANTES ==========
    const createPlant = (x, z) => {
      const plantGroup = new THREE.Group();
      // Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.3, 0.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x5a2a10, roughness: 0.8 })
      );
      pot.position.y = 0.3;
      plantGroup.add(pot);
      // Feuilles
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 1.2, 4),
          new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.9 })
        );
        leaf.position.set(Math.cos(angle) * 0.15, 1.2, Math.sin(angle) * 0.15);
        leaf.rotation.z = Math.cos(angle) * 0.3;
        leaf.rotation.x = Math.sin(angle) * 0.3;
        plantGroup.add(leaf);
      }
      // Tronc/tige central
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a2010 })
      );
      trunk.position.y = 0.9;
      plantGroup.add(trunk);
      plantGroup.position.set(x, 0, z);
      scene.add(plantGroup);
    };
    
    createPlant(-18, -18);
    createPlant(18, -18);
    createPlant(-18, 18);
    createPlant(18, 18);
    createPlant(-5, 18);
    createPlant(5, 18);

    // ========== MIROIRS (grands panneaux réfléchissants simulés) ==========
    const createMirror = (x, y, z, rotY) => {
      const mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshStandardMaterial({ 
          color: 0xe0e0e0, 
          metalness: 0.95, 
          roughness: 0.08,
          envMapIntensity: 1.0,
        })
      );
      mirror.position.set(x, y, z);
      mirror.rotation.y = rotY;
      scene.add(mirror);
      // Cadre doré
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 3.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      frame.position.copy(mirror.position);
      frame.position.x += Math.cos(rotY + Math.PI) * 0.03;
      frame.position.z += Math.sin(rotY + Math.PI) * 0.03;
      frame.rotation.y = rotY;
      scene.add(frame);
    };
    
    createMirror(0, 3, -19.85, 0);

    // ========== DRAPEAU GÉANT DU PAYS ==========
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 512; flagCanvas.height = 320;
    const fctx = flagCanvas.getContext('2d');
    const bands = casino.flag.length;
    casino.flag.forEach((col, i) => {
      fctx.fillStyle = col;
      fctx.fillRect((i / bands) * 512, 0, 512 / bands, 320);
    });
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const giantFlag = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 2.5),
      new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 })
    );
    giantFlag.position.set(-8, 4.3, -19.8);
    scene.add(giantFlag);
    const giantFlag2 = giantFlag.clone();
    giantFlag2.position.set(8, 4.3, -19.8);
    scene.add(giantFlag2);

    // Stocker tvTextures pour animation dans la loop
    const tvTexturesRef = tvTextures;

    // ========== PNJ QUI SE BALADENT ==========
    const createNPC = (startX, startZ, skinHex, shirtHex, pantsHex, hairHex) => {
      const npc = new THREE.Group();
      
      // Jambes
      const pantsMat = new THREE.MeshStandardMaterial({ color: pantsHex });
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), pantsMat);
      legL.position.set(-0.12, 0.4, 0);
      npc.add(legL);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 8), pantsMat);
      legR.position.set(0.12, 0.4, 0);
      npc.add(legR);
      // Chaussures
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.3), shoeMat);
      shoeL.position.set(-0.12, 0.035, 0.08);
      npc.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.3), shoeMat);
      shoeR.position.set(0.12, 0.035, 0.08);
      npc.add(shoeR);
      
      // Torse
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.55, 12), shirtMat);
      body.position.y = 1.15;
      npc.add(body);
      
      // Épaules
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), shirtMat);
      shoulder.position.set(-0.3, 1.4, 0);
      npc.add(shoulder);
      const shoulderR = shoulder.clone();
      shoulderR.position.x = 0.3;
      npc.add(shoulderR);
      
      // Bras
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 8), shirtMat);
      armL.position.set(-0.35, 1.05, 0);
      npc.add(armL);
      const armR = armL.clone();
      armR.position.x = 0.35;
      npc.add(armR);
      
      // Mains
      const handMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), handMat);
      handL.position.set(-0.38, 0.7, 0);
      npc.add(handL);
      const handR = handL.clone();
      handR.position.x = 0.38;
      npc.add(handR);
      
      // Cou + tête
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      neck.position.y = 1.48;
      npc.add(neck);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      head.position.y = 1.73;
      head.scale.y = 1.1;
      npc.add(head);
      
      // Cheveux
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: hairHex })
      );
      hair.position.y = 1.78;
      npc.add(hair);
      
      // Yeux simples
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
      eyeL.position.set(-0.08, 1.78, 0.2);
      npc.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.08;
      npc.add(eyeR);
      
      npc.position.set(startX, 0, startZ);
      npc.userData = { isNpc: true, dead: false, legL, legR, armL, armR, noCollide: true };
      scene.add(npc);
      return npc;
    };
    
    // Créer 6 PNJ avec des profils variés
    const npcs = [];
    const npcColors = [
      [0xe8b896, 0x4a2a80, 0x1a1a2a, 0x2a1810], // costume violet
      [0xd4a878, 0x8b0000, 0x2a1a0a, 0x3a1810],
      [0xf0c090, 0x006633, 0x1a1a1a, 0xffd700], // blonde
      [0xc08870, 0xff4500, 0x0a0a0a, 0x1a0a0a],
      [0xe0a078, 0x1a4b8a, 0x0a1020, 0x4a2818],
      [0xf4c088, 0xffd700, 0x2a1a2a, 0x1a1010], // riche doré
    ];
    const npcPaths = [
      { x0: -10, z0: 10, x1: 10, z1: 10, speed: 0.008 },
      { x0: 10, z0: -5, x1: -10, z1: -5, speed: 0.007 },
      { x0: -15, z0: -15, x1: 15, z1: 15, speed: 0.005 },
      { x0: 5, z0: 15, x1: -5, z1: -15, speed: 0.009 },
      { x0: 15, z0: 0, x1: -15, z1: 0, speed: 0.006 },
      { x0: 0, z0: -18, x1: 0, z1: 18, speed: 0.004 },
    ];
    for (let i = 0; i < 6; i++) {
      const [skin, shirt, pants, hair] = npcColors[i];
      const path = npcPaths[i];
      const npc = createNPC(path.x0, path.z0, skin, shirt, pants, hair);
      npcs.push({ mesh: npc, path, phase: Math.random() * Math.PI * 2 });
    }
    allNpcsRef.current = npcs.map(n => n.mesh);

    // ========== FONCTION CRÉATION CROUPIER 3D DÉTAILLÉ ==========
    const createDealer3D = (profileData) => {
      const g = new THREE.Group();
      const skinHex = parseInt(profileData.skin.slice(1), 16);
      const hairHex = parseInt(profileData.hair.slice(1), 16);
      
      // Jambes (pantalon noir) - NOUVEAU, évite de rentrer dans la table
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.8 });
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.85, 8), pantsMat);
      legL.position.set(-0.13, 0.42, 0);
      g.add(legL);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.85, 8), pantsMat);
      legR.position.set(0.13, 0.42, 0);
      g.add(legR);
      
      // Chaussures noires
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.2, metalness: 0.3 });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), shoeMat);
      shoeL.position.set(-0.13, 0.04, 0.08);
      g.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.32), shoeMat);
      shoeR.position.set(0.13, 0.04, 0.08);
      g.add(shoeR);
      
      // Ceinture
      const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a0a05, roughness: 0.5 })
      );
      belt.position.y = 0.88;
      g.add(belt);
      const beltBuckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.07, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      beltBuckle.position.set(0, 0.88, 0.33);
      g.add(beltBuckle);
      
      // Torse (veste noire)
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.6, 12), suitMat);
      body.position.y = 1.22;
      body.castShadow = true;
      g.add(body);
      
      // Chemise blanche (devant)
      const shirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.5 })
      );
      shirt.position.set(0, 1.25, 0.32);
      g.add(shirt);
      
      // Revers de la veste
      const revL = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.35, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.6 })
      );
      revL.position.set(-0.11, 1.3, 0.32);
      revL.rotation.z = -0.1;
      g.add(revL);
      const revR = revL.clone();
      revR.position.x = 0.11;
      revR.rotation.z = 0.1;
      g.add(revR);
      
      // Noeud papillon
      const bowCenter = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x6a0000 })
      );
      bowCenter.position.set(0, 1.45, 0.36);
      g.add(bowCenter);
      const bowL = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 4),
        new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 })
      );
      bowL.rotation.z = Math.PI / 2;
      bowL.position.set(-0.06, 1.45, 0.36);
      g.add(bowL);
      const bowR = bowL.clone();
      bowR.position.x = 0.06;
      bowR.rotation.z = -Math.PI / 2;
      g.add(bowR);
      
      // Épaulettes
      const shoulderL = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        suitMat
      );
      shoulderL.position.set(-0.33, 1.48, 0);
      g.add(shoulderL);
      const shoulderR = shoulderL.clone();
      shoulderR.position.x = 0.33;
      g.add(shoulderR);
      
      // Cou
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.15, 10),
        new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.5 })
      );
      neck.position.y = 1.6;
      g.add(neck);
      
      // Tête
      const headMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), headMat);
      head.position.y = 1.86;
      head.scale.y = 1.15; // légèrement allongé
      head.castShadow = true;
      g.add(head);
      
      // Cheveux
      if (profileData.gender === 'f') {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.75),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9 })
        );
        hair.position.y = 1.88;
        g.add(hair);
        // Queue ou mèches longues
        const pony = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.09, 0.3, 8),
          new THREE.MeshStandardMaterial({ color: hairHex })
        );
        pony.position.set(0, 1.6, -0.22);
        g.add(pony);
      } else {
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9 })
        );
        hair.position.y = 1.92;
        g.add(hair);
      }
      
      // Oreilles
      const earMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const earL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), earMat);
      earL.position.set(-0.23, 1.86, 0);
      earL.scale.set(0.7, 1.2, 1);
      g.add(earL);
      const earR = earL.clone();
      earR.position.x = 0.23;
      g.add(earR);
      
      // Yeux
      const eyesHex = parseInt(profileData.eyes.slice(1), 16);
      const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const eyeIris = new THREE.MeshStandardMaterial({ color: eyesHex });
      
      const eyeLW = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeWhite);
      eyeLW.position.set(-0.09, 1.9, 0.2);
      eyeLW.scale.set(1, 0.7, 0.5);
      g.add(eyeLW);
      const eyeRW = eyeLW.clone(); eyeRW.position.x = 0.09; g.add(eyeRW);
      
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.023, 8, 8), eyeIris);
      eyeL.position.set(-0.09, 1.9, 0.24);
      g.add(eyeL);
      const eyeR = eyeL.clone(); eyeR.position.x = 0.09; g.add(eyeR);
      
      const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const pupL = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), pupilMat);
      pupL.position.set(-0.09, 1.9, 0.26);
      g.add(pupL);
      const pupR = pupL.clone(); pupR.position.x = 0.09; g.add(pupR);
      
      // Sourcils
      const browMat = new THREE.MeshStandardMaterial({ color: hairHex });
      const browL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), browMat);
      browL.position.set(-0.09, 1.96, 0.22);
      browL.rotation.z = -0.1;
      g.add(browL);
      const browR = browL.clone();
      browR.position.x = 0.09;
      browR.rotation.z = 0.1;
      g.add(browR);
      
      // Nez
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6),
        new THREE.MeshStandardMaterial({ color: skinHex }));
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.85, 0.25);
      g.add(nose);
      
      // Bouche (plus détaillée)
      const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7a3828 });
      const lipUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.02), mouthMat);
      lipUpper.position.set(0, 1.76, 0.23);
      g.add(lipUpper);
      const lipLower = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.02), 
        new THREE.MeshStandardMaterial({ color: 0x8a4030 }));
      lipLower.position.set(0, 1.745, 0.23);
      g.add(lipLower);
      
      // Barbe
      if (profileData.beard) {
        const beard = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 12, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.4),
          new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.95 })
        );
        beard.position.y = 1.76;
        beard.scale.set(1.05, 0.8, 1);
        g.add(beard);
        // Moustache
        const mustache = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: hairHex })
        );
        mustache.position.set(0, 1.78, 0.23);
        g.add(mustache);
      }
      
      // Lunettes
      if (profileData.glasses) {
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });
        const lensL = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 6, 12), glassMat);
        lensL.position.set(-0.09, 1.9, 0.25);
        g.add(lensL);
        const lensR = lensL.clone(); lensR.position.x = 0.09; g.add(lensR);
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.008), glassMat);
        bridge.position.set(0, 1.9, 0.25);
        g.add(bridge);
        // Branches
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.14), glassMat);
        armL.position.set(-0.17, 1.9, 0.18);
        g.add(armL);
        const armRB = armL.clone();
        armRB.position.x = 0.17;
        g.add(armRB);
      }
      
      // Bras avec épaules, biceps, avant-bras, mains
      const armUpperL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.1, 0.4, 8), suitMat
      );
      armUpperL.position.set(-0.4, 1.3, 0.05);
      armUpperL.rotation.x = -0.15;
      armUpperL.rotation.z = 0.05;
      g.add(armUpperL);
      const armUpperR = armUpperL.clone();
      armUpperR.position.x = 0.4;
      armUpperR.rotation.z = -0.05;
      g.add(armUpperR);
      
      const armLowerL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.09, 0.38, 8), suitMat
      );
      armLowerL.position.set(-0.43, 0.92, 0.18);
      armLowerL.rotation.x = -0.35;
      g.add(armLowerL);
      const armLowerR = armLowerL.clone();
      armLowerR.position.x = 0.43;
      g.add(armLowerR);
      
      // Manchettes blanches qui dépassent
      const cuffMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8 });
      const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), cuffMat);
      cuffL.position.set(-0.46, 0.74, 0.23);
      g.add(cuffL);
      const cuffR = cuffL.clone();
      cuffR.position.x = 0.46;
      g.add(cuffR);
      
      // Mains
      const handMat = new THREE.MeshStandardMaterial({ color: skinHex });
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), handMat);
      handL.position.set(-0.47, 0.68, 0.27);
      handL.scale.set(1, 0.85, 1.1);
      g.add(handL);
      const handR = handL.clone(); 
      handR.position.x = 0.47;
      g.add(handR);
      
      return g;
    };


    // ========== TABLES DE JEU ==========
    const createTable = (x, z, label, colHex, id, dealerData) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Piétement
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.8, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a1608, metalness: 0.4, roughness: 0.6 })
      );
      base.position.y = 0.4;
      base.castShadow = true;
      group.add(base);

      let topGeom;
      if (id === 'roulette') topGeom = new THREE.CylinderGeometry(2, 2, 0.15, 32);
      else {
        topGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32);
        topGeom.scale(1.4, 1, 1);
      }
      const top = new THREE.Mesh(topGeom,
        new THREE.MeshStandardMaterial({ color: 0x0a4020, roughness: 0.8 }));
      top.position.y = 0.9;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      // Bordure dorée
      let borderGeom;
      if (id === 'roulette') borderGeom = new THREE.TorusGeometry(2, 0.08, 8, 32);
      else {
        borderGeom = new THREE.TorusGeometry(1.8, 0.08, 8, 32);
        borderGeom.scale(1.4, 1, 1);
      }
      const border = new THREE.Mesh(borderGeom,
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 }));
      border.position.y = 0.98;
      border.rotation.x = Math.PI / 2;
      group.add(border);

      // Eléments spécifiques
      let rouletteWheel = null;
      let rouletteBall = null;
      let animatedCards = null;
      if (id === 'roulette') {
        // ===== ROULETTE 3D TAILLE RÉELLE AVEC BILLE QUI ROULE =====
        // Cuvette externe en bois
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 0.25, 48),
          new THREE.MeshStandardMaterial({ color: 0x3a1a08, metalness: 0.4, roughness: 0.55 })
        );
        bowl.position.set(0, 1.05, 0);
        group.add(bowl);

        // Piste interne (couronne blanche/beige pour la bille)
        const track = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3, 1.3, 0.12, 48),
          new THREE.MeshStandardMaterial({ color: 0xf0e4c8, metalness: 0.3, roughness: 0.5 })
        );
        track.position.set(0, 1.17, 0);
        group.add(track);

        // Groupe tournant (wheel disc qui tourne)
        rouletteWheel = new THREE.Group();
        rouletteWheel.userData.noCollide = true;
        rouletteWheel.position.set(0, 1.2, 0);
        group.add(rouletteWheel);

        // Disque central
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(1.15, 1.15, 0.08, 48),
          new THREE.MeshStandardMaterial({ color: 0x2a1608, metalness: 0.7, roughness: 0.25 })
        );
        disc.position.y = 0;
        rouletteWheel.add(disc);

        // 37 poches colorées (rouge/noir/vert pour le 0)
        const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
        const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
        for (let i = 0; i < 37; i++) {
          const num = ORDER[i];
          const pocketColor = num === 0 ? 0x0a8a3a : (REDS.has(num) ? 0xb81a1a : 0x0a0a0a);
          const angle = (i / 37) * Math.PI * 2;
          // Pocket (trapèze)
          const pocket = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.05, 0.12),
            new THREE.MeshStandardMaterial({ color: pocketColor, metalness: 0.3, roughness: 0.6 })
          );
          pocket.position.set(Math.cos(angle) * 1.05, 0.06, Math.sin(angle) * 1.05);
          pocket.rotation.y = -angle;
          rouletteWheel.add(pocket);
          // Séparateur argenté
          const sep = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.09, 0.22),
            new THREE.MeshStandardMaterial({ color: 0xd4d4d4, metalness: 0.9, roughness: 0.2 })
          );
          const sAngle = angle + Math.PI / 37;
          sep.position.set(Math.cos(sAngle) * 1.05, 0.08, Math.sin(sAngle) * 1.05);
          sep.rotation.y = -sAngle;
          rouletteWheel.add(sep);
        }

        // Moyeu central doré
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.45, 0.18, 24),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
        );
        hub.position.y = 0.14;
        rouletteWheel.add(hub);

        // Croix centrale
        for (let i = 0; i < 4; i++) {
          const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 0.04, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
          );
          spoke.position.y = 0.1;
          spoke.rotation.y = (i / 4) * Math.PI * 2;
          rouletteWheel.add(spoke);
        }

        // Pointeur au-dessus (fixe)
        const pointer = new THREE.Mesh(
          new THREE.ConeGeometry(0.06, 0.18, 4),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        pointer.position.set(0, 1.45, -1.2);
        pointer.rotation.x = Math.PI;
        group.add(pointer);

        // Bille (blanche, métallique) sur la piste externe
        rouletteBall = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.2 })
        );
        rouletteBall.position.set(1.25, 1.27, 0);
        rouletteBall.userData = { angle: 0, radius: 1.25, ballSpeed: 0.035, noCollide: true };
        group.add(rouletteBall);

      } else if (id === 'blackjack' || id === 'poker' || id === 'highcard') {
        // ===== ANIMATION 3D DES CARTES DISTRIBUÉES =====
        // Cartes animées qui s'envolent du croupier vers les places des joueurs.
        animatedCards = new THREE.Group();
        animatedCards.userData.noCollide = true;
        group.add(animatedCards);
        const cardCount = id === 'poker' ? 7 : id === 'blackjack' ? 5 : 2;
        for (let i = 0; i < cardCount; i++) {
          const card = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.02, 0.32),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
          );
          // Dos rouge (décoratif)
          const back = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.4 })
          );
          back.rotation.x = -Math.PI / 2;
          back.position.y = 0.011;
          card.add(back);
          // Position cible : étalées en éventail devant les sièges
          const angleFan = (i - (cardCount - 1) / 2) * 0.35;
          const tx = Math.sin(angleFan) * 0.9;
          const tz = 0.3 + Math.cos(angleFan) * 0.9;
          card.userData = {
            startPos: new THREE.Vector3(0, 1.05, -2.3),
            endPos: new THREE.Vector3(tx, 1.0, tz),
            delay: i * 400,
            duration: 600,
          };
          card.position.copy(card.userData.startPos);
          card.rotation.y = angleFan;
          animatedCards.add(card);
        }
        animatedCards.userData = { cycleStart: Date.now(), noCollide: true };
      }

      // ===== CHAISES AUTOUR DE LA TABLE =====
      // 3 à 4 sièges positionnés autour de la table (rayon 2.4m, exclusion côté croupier -Z)
      const chairCount = id === 'roulette' ? 4 : 3;
      const chairs = [];
      for (let i = 0; i < chairCount; i++) {
        // Répartition en demi-cercle du côté joueur (vers +Z)
        const spread = id === 'roulette' ? Math.PI * 1.2 : Math.PI * 0.85;
        const angle = -spread / 2 + (i / Math.max(1, chairCount - 1)) * spread + Math.PI / 2;
        const radius = 2.6;
        const cx = Math.cos(angle) * radius;
        const cz = Math.sin(angle) * radius;
        const chair = new THREE.Group();
        // Assise
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.1, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x6a1a1a, roughness: 0.55 })
        );
        seat.position.y = 0.5;
        chair.add(seat);
        // Dossier
        const back = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.7, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x7a2020, roughness: 0.55 })
        );
        back.position.set(0, 0.85, -0.21);
        chair.add(back);
        // Pied central doré
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.12, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3 })
        );
        leg.position.y = 0.22;
        chair.add(leg);
        chair.position.set(cx, 0, cz);
        chair.rotation.y = Math.atan2(-cx, -cz); // face à la table
        chair.userData.noCollide = true; // Les chaises ne bloquent pas l'approche
        group.add(chair);
        chairs.push({
          mesh: chair,
          worldPos: new THREE.Vector3(x + cx, 0, z + cz),
          faceAngle: chair.rotation.y,
        });
      }

      // Jetons décoratifs
      for (let i = 0; i < 5; i++) {
        const chipColors = [0xff0000, 0x0000ff, 0x00ff00, 0x000000, 0xffd700];
        const chip = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16),
          new THREE.MeshStandardMaterial({ color: chipColors[i % 5] })
        );
        chip.position.set(Math.cos(i) * 1.3, 1.0 + (i * 0.04), Math.sin(i) * 1.3);
        group.add(chip);
      }

      // Croupier 3D détaillé
      const dealer = createDealer3D(dealerData);
      dealer.position.set(0, 0, -2.8);
      dealer.userData = { isDealer: true, dead: false, noCollide: true };
      group.add(dealer);

      // Panneau lumineux
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 0.05),
        new THREE.MeshBasicMaterial({ color: colHex })
      );
      sign.position.set(0, 3.8, -2.5);
      group.add(sign);

      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 60px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 256, 64);
      const tex = new THREE.CanvasTexture(canvas);
      const text = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 0.7),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      text.position.set(0, 3.8, -2.47);
      group.add(text);

      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: id };
      group.add(zone);

      scene.add(group);
      return { wheel: rouletteWheel, ball: rouletteBall, cards: animatedCards, zone, dealer, chairs, tableX: x, tableZ: z, id };
    };

    // Tables avec croupiers uniques
    const bjDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const rlDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const hcDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    
    const bj = createTable(-6, -2, 'BLACKJACK', secondaryHex, 'blackjack', bjDealer);
    const rl = createTable(0, -8, 'ROULETTE', 0xff0040, 'roulette', rlDealer);
    const hc = createTable(6, -2, 'CARTE HAUTE', 0x00d4ff, 'highcard', hcDealer);
    const pkDealer = DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)];
    const pk = createTable(0, 4, 'POKER', 0x00aa66, 'poker', pkDealer);

    // Regrouper infos tables pour la logique de mouvement (s'asseoir)
    const allTables = [bj, rl, hc, pk];

    // Liste de tous les croupiers pour le tir visé
    allDealersRef.current = [bj.dealer, rl.dealer, hc.dealer, pk.dealer].filter(Boolean);

    // ========== BAR ==========
    const createBar = () => {
      const group = new THREE.Group();
      group.position.set(-13, 0, 5);
      group.rotation.y = Math.PI / 2; // face vers l'intérieur

      // ========== COMPTOIR EN L ==========
      // Comptoir principal (5m de long)
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.1, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.4, metalness: 0.2 })
      );
      counter.position.set(0, 0.55, 0.8);
      group.add(counter);

      // Dessus du comptoir en marbre
      const counterTop = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.1, metalness: 0.4 })
      );
      counterTop.position.set(0, 1.15, 0.8);
      group.add(counterTop);

      // Bordure dorée sur le bord du comptoir
      const counterEdge = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 })
      );
      counterEdge.position.set(0, 1.21, 1.29);
      group.add(counterEdge);

      // Face avant du comptoir avec panneaux
      for (let i = 0; i < 5; i++) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.9, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.5 })
        );
        panel.position.set(-2 + i, 0.55, 1.27);
        group.add(panel);
        // Petit filet doré
        const filet = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.02, 0.03),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        filet.position.set(-2 + i, 0.55, 1.29);
        group.add(filet);
      }

      // ========== TABOURETS DE BAR (3) ==========
      for (let i = -1; i <= 1; i++) {
        const stool = new THREE.Group();
        // Siège rouge
        const seat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 })
        );
        seat.position.y = 0.85;
        stool.add(seat);
        // Pied chromé
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x888, metalness: 0.9, roughness: 0.2 })
        );
        pole.position.y = 0.4;
        stool.add(pole);
        // Base
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.35, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 })
        );
        base.position.y = 0.025;
        stool.add(base);
        stool.position.set(i * 1.5, 0, 1.7);
        group.add(stool);
      }

      // ========== MUR DU FOND + ÉTAGÈRES ==========
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x1a0a05, roughness: 0.8 })
      );
      backWall.position.set(0, 2, -0.4);
      group.add(backWall);

      // Grande étagère centrale en bois
      const shelfMain = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2.2, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.5 })
      );
      shelfMain.position.set(0, 2.3, -0.25);
      group.add(shelfMain);

      // 3 étagères horizontales pour les bouteilles
      for (let s = 0; s < 3; s++) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.05, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.3, metalness: 0.2 })
        );
        shelf.position.set(0, 1.6 + s * 0.7, -0.1);
        group.add(shelf);
      }

      // Bouteilles sur chaque étagère (différentes couleurs)
      const bottleColors = [
        0x8b4513, // whisky ambre
        0xd4af37, // or
        0x2a4a1a, // vert foncé
        0x7a0a0a, // vin rouge
        0x1a4b8a, // bleu
        0xf0a040, // rhum
        0xe8e8e8, // gin clair
        0x3a0a3a, // liqueur violette
      ];
      for (let s = 0; s < 3; s++) {
        for (let b = 0; b < 10; b++) {
          const color = bottleColors[b % bottleColors.length];
          // Corps de la bouteille
          const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.08, 0.35, 10),
            new THREE.MeshStandardMaterial({ 
              color, 
              transparent: true, 
              opacity: 0.7,
              roughness: 0.05,
              metalness: 0.3,
            })
          );
          body.position.set(-2.3 + b * 0.5, 1.85 + s * 0.7, -0.1);
          group.add(body);
          // Goulot
          const neck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.035, 0.12, 8),
            new THREE.MeshStandardMaterial({ color })
          );
          neck.position.set(-2.3 + b * 0.5, 2.08 + s * 0.7, -0.1);
          group.add(neck);
          // Bouchon
          const cap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
          );
          cap.position.set(-2.3 + b * 0.5, 2.16 + s * 0.7, -0.1);
          group.add(cap);
        }
      }

      // ========== VERRES EN RÉSERVE (fix-rendering : vrai verre PBR) ==========
      const realGlassMat = new THREE.MeshPhysicalMaterial({
        color: 0xccddff,
        roughness: 0.05,
        metalness: 0.0,
        transmission: 0.92,     // vrai verre transparent (refract)
        ior: 1.5,               // indice de réfraction du verre
        thickness: 0.05,
        transparent: true,
      });
      for (let g = 0; g < 6; g++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8),
          realGlassMat,
        );
        glass.position.set(-1.2 + g * 0.15, 1.22, 0.4);
        group.add(glass);
      }

      // ========== BARMAN 3D DÉTAILLÉ ==========
      const barman = createDealer3D({ 
        skin: '#e8b896', hair: '#2a1810', eyes: '#4a2c1a', 
        beard: true, glasses: false, gender: 'm' 
      });
      // Le barman est debout derrière le comptoir
      barman.position.set(0, 0, 0);
      // Il tient un shaker ? on simule avec un petit cylindre dans la main
      const shaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.05, 0.25, 10),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 })
      );
      shaker.position.set(0.55, 0.75, 0.2);
      barman.add(shaker);
      group.add(barman);

      // ========== ENSEIGNE BAR NÉON ==========
      const barCanvas = document.createElement('canvas');
      barCanvas.width = 512; barCanvas.height = 128;
      const bctx = barCanvas.getContext('2d');
      bctx.fillStyle = '#000';
      bctx.fillRect(0, 0, 512, 128);
      bctx.shadowColor = '#ffd700';
      bctx.shadowBlur = 20;
      bctx.fillStyle = '#ffd700';
      bctx.font = 'bold 70px Georgia, serif';
      bctx.textAlign = 'center';
      bctx.fillText('🍸 BAR', 256, 80);
      bctx.shadowBlur = 0;
      bctx.fillStyle = '#ff00aa';
      bctx.font = 'italic 24px Georgia';
      bctx.fillText('Cocktails • Bières • Spiritueux', 256, 115);
      const btex = new THREE.CanvasTexture(barCanvas);
      const barSign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 0.9),
        new THREE.MeshBasicMaterial({ map: btex, transparent: true })
      );
      barSign.position.set(0, 4.1, -0.3);
      group.add(barSign);

      // ========== LUMIÈRE SOUS COMPTOIR (effet pub) ==========
      const underLight = new THREE.PointLight(0xffaa00, 1.5, 5);
      underLight.position.set(0, 0.3, 1);
      group.add(underLight);

      // Lumière derrière le bar pour éclairer les bouteilles
      const backLight1 = new THREE.PointLight(0xff00aa, 0.8, 4);
      backLight1.position.set(-1.5, 2.5, 0.3);
      group.add(backLight1);
      const backLight2 = new THREE.PointLight(0x00ffff, 0.8, 4);
      backLight2.position.set(1.5, 2.5, 0.3);
      group.add(backLight2);

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'bar' };
      zone.position.set(0, 1, 2.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };

    const barObj = createBar();

    // ========== TOILETTES ==========
    const createToilet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, 5);
      
      // Cabine
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 })
      );
      cabin.position.set(0, 2, -0.5);
      group.add(cabin);
      
      // Porte
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.4, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.8 })
      );
      door.position.set(0, 1.2, 0.74);
      group.add(door);
      
      // Poignée
      const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      handle.position.set(0.4, 1.2, 0.78);
      group.add(handle);
      
      // Panneau WC
      const wcCanvas = document.createElement('canvas');
      wcCanvas.width = 256; wcCanvas.height = 256;
      const wctx = wcCanvas.getContext('2d');
      wctx.fillStyle = '#fff';
      wctx.fillRect(0, 0, 256, 256);
      wctx.fillStyle = '#000';
      wctx.font = 'bold 150px sans-serif';
      wctx.textAlign = 'center';
      wctx.fillText('🚻', 128, 180);
      const wcTex = new THREE.CanvasTexture(wcCanvas);
      const wcSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial({ map: wcTex })
      );
      wcSign.position.set(0, 2.7, 0.78);
      group.add(wcSign);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'toilet' };
      zone.position.set(0, 1, 1);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const toiletObj = createToilet();

    // ========== ATM ==========
    const createATM = () => {
      const group = new THREE.Group();
      group.position.set(-8, 0, 12);
      
      // Corps de l'ATM
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a3a4a, metalness: 0.6, roughness: 0.4 })
      );
      body.position.y = 1.1;
      body.castShadow = true;
      group.add(body);
      
      // Écran
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.6),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
      );
      screen.position.set(0, 1.6, 0.41);
      group.add(screen);
      
      // Clavier
      const keypad = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.4, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      keypad.position.set(0, 1.1, 0.41);
      group.add(keypad);
      
      // Fente billets
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.05, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      slot.position.set(0, 0.75, 0.41);
      group.add(slot);
      
      // Logo ATM
      const atmCanvas = document.createElement('canvas');
      atmCanvas.width = 256; atmCanvas.height = 128;
      const actx = atmCanvas.getContext('2d');
      actx.fillStyle = '#000';
      actx.fillRect(0, 0, 256, 128);
      actx.fillStyle = '#00ff88';
      actx.font = 'bold 80px Arial';
      actx.textAlign = 'center';
      actx.fillText('ATM', 128, 90);
      const atex = new THREE.CanvasTexture(atmCanvas);
      const atmSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.45),
        new THREE.MeshBasicMaterial({ map: atex })
      );
      atmSign.position.set(0, 2.05, 0.41);
      group.add(atmSign);
      
      // Lumière verte
      const atmLight = new THREE.PointLight(0x00ff88, 0.8, 3);
      atmLight.position.set(0, 2, 1);
      group.add(atmLight);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'atm' };
      zone.position.set(0, 1, 1);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const atmObj = createATM();

    // ========== ROUE DE LA FORTUNE 3D ==========
    const createWheel = () => {
      const group = new THREE.Group();
      group.position.set(8, 0, 12);
      
      // Support
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 2.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x8b6914, metalness: 0.7 })
      );
      stand.position.y = 1.25;
      group.add(stand);
      
      // Base
      const wheelBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      wheelBase.rotation.x = Math.PI / 2;
      wheelBase.position.y = 2.5;
      group.add(wheelBase);
      
      // Roue colorée
      const wheelCanvas = document.createElement('canvas');
      wheelCanvas.width = 512; wheelCanvas.height = 512;
      const wctx = wheelCanvas.getContext('2d');
      wctx.translate(256, 256);
      const segmentAngle = (Math.PI * 2) / WHEEL_PRIZES.length;
      WHEEL_PRIZES.forEach((prize, i) => {
        wctx.fillStyle = prize.color;
        wctx.beginPath();
        wctx.moveTo(0, 0);
        wctx.arc(0, 0, 240, i * segmentAngle, (i + 1) * segmentAngle);
        wctx.fill();
        wctx.strokeStyle = '#ffd700';
        wctx.lineWidth = 4;
        wctx.stroke();
        // Label
        wctx.save();
        wctx.rotate(i * segmentAngle + segmentAngle / 2);
        wctx.fillStyle = '#fff';
        wctx.font = 'bold 32px Georgia';
        wctx.textAlign = 'center';
        wctx.fillText(prize.label, 150, 10);
        wctx.restore();
      });
      const wheelTex = new THREE.CanvasTexture(wheelCanvas);
      const wheelDisc = new THREE.Mesh(
        new THREE.CircleGeometry(1.4, 32),
        new THREE.MeshBasicMaterial({ map: wheelTex, side: THREE.DoubleSide })
      );
      wheelDisc.rotation.x = Math.PI / 2;
      wheelDisc.position.y = 2.55;
      group.add(wheelDisc);
      
      // Indicateur (triangle)
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.3, 3),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      pointer.rotation.x = Math.PI;
      pointer.position.y = 4.1;
      group.add(pointer);
      
      // Centre doré
      const center = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      center.rotation.x = Math.PI / 2;
      center.position.y = 2.6;
      group.add(center);
      
      // Ampoules autour
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        bulb.position.set(Math.cos(angle) * 1.55, 2.5 + Math.sin(angle) * 0.1, Math.sin(angle) * 1.55);
        bulb.position.y = 2.5;
        bulb.position.x = Math.cos(angle) * 1.55;
        bulb.position.z = Math.sin(angle) * 1.55;
        group.add(bulb);
      }
      
      // Enseigne JACKPOT
      const jpCanvas = document.createElement('canvas');
      jpCanvas.width = 512; jpCanvas.height = 128;
      const jctx = jpCanvas.getContext('2d');
      jctx.fillStyle = '#1a1a1a';
      jctx.fillRect(0, 0, 512, 128);
      jctx.fillStyle = '#ffd700';
      jctx.font = 'bold 70px Georgia';
      jctx.textAlign = 'center';
      jctx.fillText('🎡 JACKPOT', 256, 80);
      const jptex = new THREE.CanvasTexture(jpCanvas);
      const jpSign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 0.6),
        new THREE.MeshBasicMaterial({ map: jptex, transparent: true })
      );
      jpSign.position.y = 5;
      group.add(jpSign);
      
      // Lumière
      const wlight = new THREE.PointLight(0xffd700, 1.5, 6);
      wlight.position.set(0, 3, 1);
      group.add(wlight);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'wheel' };
      zone.position.set(0, 1.5, 1.5);
      group.add(zone);
      
      scene.add(group);
      return { wheelDisc, zone };
    };
    const wheelObj = createWheel();

    // ========== BOUTIQUE D'ARMES ==========
    const createShop = () => {
      const group = new THREE.Group();
      group.position.set(-13, 0, -14);
      group.rotation.y = 0; // face vers +Z

      // ========== MUR ARRIÈRE ROUGE SOMBRE ==========
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 4),
        new THREE.MeshStandardMaterial({ color: 0x2a0505, roughness: 0.9 })
      );
      backWall.position.set(0, 2, -0.5);
      group.add(backWall);

      // Plaque métallique stylisée
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 3.5, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.4 })
      );
      plate.position.set(0, 2, -0.4);
      group.add(plate);

      // Rivets dorés sur la plaque
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const rivet = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 })
        );
        rivet.position.set(
          Math.cos(angle) * 2.5,
          2 + Math.sin(angle) * 1.5,
          -0.35
        );
        group.add(rivet);
      }

      // ========== COMPTOIR / VITRINE ==========
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.4 })
      );
      counter.position.set(0, 0.5, 1);
      group.add(counter);

      // Dessus vitré noir
      const counterGlass = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.05, 1.2),
        new THREE.MeshStandardMaterial({ 
          color: 0x0a0a20, 
          transparent: true, 
          opacity: 0.7,
          metalness: 0.6, 
          roughness: 0.05 
        })
      );
      counterGlass.position.set(0, 1.03, 1);
      group.add(counterGlass);

      // Bordure rouge agressive
      const counterEdge = new THREE.Mesh(
        new THREE.BoxGeometry(5.1, 0.05, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x8b0000, emissiveIntensity: 0.5 })
      );
      counterEdge.position.set(0, 1.07, 1.6);
      group.add(counterEdge);

      // ========== 6 ARMES EXPOSÉES SUR LE MUR ==========
      // Chaque arme est représentée par un groupe 3D simple, accroché au mur
      
      const createWeaponDisplay3D = (weaponId) => {
        const wg = new THREE.Group();
        if (weaponId === 'knife') {
          // Lame couteau
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.06, 0.015),
            new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.95, roughness: 0.1 })
          );
          wg.add(blade);
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.8 })
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.x = -0.35;
          wg.add(handle);
        } else if (weaponId === 'machete') {
          // Machette plus longue
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.12, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.15 })
          );
          wg.add(blade);
          const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a0a04, roughness: 0.9 })
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.x = -0.55;
          wg.add(handle);
        } else if (weaponId === 'gun') {
          // Glock stylisé
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.14, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
          );
          wg.add(body);
          const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.25, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6 })
          );
          grip.position.set(-0.1, -0.18, 0);
          grip.rotation.z = -0.15;
          wg.add(grip);
          const trigger = new THREE.Mesh(
            new THREE.TorusGeometry(0.04, 0.01, 6, 12),
            new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.7 })
          );
          trigger.position.set(-0.05, -0.08, 0);
          wg.add(trigger);
        } else if (weaponId === 'shotgun') {
          // Fusil long
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 1, 12),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 })
          );
          barrel.rotation.z = Math.PI / 2;
          wg.add(barrel);
          const stock = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 0.15, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.5 })
          );
          stock.position.set(-0.6, -0.05, 0);
          wg.add(stock);
          const pump = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.1, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.5 })
          );
          pump.position.set(0.1, -0.08, 0);
          wg.add(pump);
        } else if (weaponId === 'bazooka') {
          // Gros tube vert
          const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: 0x3a4a1a, roughness: 0.7 })
          );
          tube.rotation.z = Math.PI / 2;
          wg.add(tube);
          // Viseur
          const scope = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 })
          );
          scope.position.set(0.1, 0.2, 0);
          wg.add(scope);
          // Poignée
          const grip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
          );
          grip.position.set(-0.1, -0.2, 0);
          wg.add(grip);
        } else if (weaponId === 'flamethrower') {
          // Réservoir + canon
          const tank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.2, 0.5, 12),
            new THREE.MeshStandardMaterial({ color: 0x8a6820, metalness: 0.6, roughness: 0.4 })
          );
          tank.rotation.z = Math.PI / 2;
          tank.position.x = -0.3;
          wg.add(tank);
          const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.5, 10),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
          );
          barrel.rotation.z = Math.PI / 2;
          barrel.position.x = 0.25;
          wg.add(barrel);
          const nozzle = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 0.6 })
          );
          nozzle.rotation.z = -Math.PI / 2;
          nozzle.position.x = 0.55;
          wg.add(nozzle);
        }
        return wg;
      };

      // Positionner les 6 armes sur le mur (2 lignes de 3)
      const armList = ['knife', 'machete', 'gun', 'shotgun', 'bazooka', 'flamethrower'];
      armList.forEach((id, i) => {
        const weapon = createWeaponDisplay3D(id);
        const col = i % 3;
        const row = Math.floor(i / 3);
        weapon.position.set(-1.8 + col * 1.8, 2.8 - row * 1.4, -0.3);
        group.add(weapon);
        
        // Petit support sous l'arme
        const support = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.05, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7 })
        );
        support.position.set(-1.8 + col * 1.8, 2.55 - row * 1.4, -0.3);
        group.add(support);
        
        // Prix en dessous (texte sur plaque)
        const w = WEAPONS.find(x => x.id === id);
        const priceCanvas = document.createElement('canvas');
        priceCanvas.width = 256; priceCanvas.height = 64;
        const pctx = priceCanvas.getContext('2d');
        pctx.fillStyle = '#000';
        pctx.fillRect(0, 0, 256, 64);
        pctx.strokeStyle = '#ffd700';
        pctx.lineWidth = 3;
        pctx.strokeRect(2, 2, 252, 60);
        pctx.fillStyle = '#ffd700';
        pctx.font = 'bold 20px Georgia';
        pctx.textAlign = 'center';
        pctx.fillText(w ? w.name.split(' ')[0] : '?', 128, 26);
        pctx.font = 'bold 18px Georgia';
        pctx.fillText(w ? `${fmt(w.price)} $` : '', 128, 50);
        const priceTex = new THREE.CanvasTexture(priceCanvas);
        const priceLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 0.3),
          new THREE.MeshBasicMaterial({ map: priceTex, transparent: true })
        );
        priceLabel.position.set(-1.8 + col * 1.8, 2.4 - row * 1.4, -0.29);
        group.add(priceLabel);
      });

      // ========== ENSEIGNE ARMURERIE ==========
      const shopCanvas = document.createElement('canvas');
      shopCanvas.width = 1024; shopCanvas.height = 200;
      const sctx = shopCanvas.getContext('2d');
      // Fond noir
      sctx.fillStyle = '#000';
      sctx.fillRect(0, 0, 1024, 200);
      // Bordure rouge
      sctx.strokeStyle = '#ff0000';
      sctx.lineWidth = 8;
      sctx.strokeRect(10, 10, 1004, 180);
      // Texte
      sctx.shadowColor = '#ff0000';
      sctx.shadowBlur = 25;
      sctx.fillStyle = '#ff0000';
      sctx.font = 'bold 90px Georgia, serif';
      sctx.textAlign = 'center';
      sctx.fillText('🏎 GAMBLELIFE STORE', 512, 120);
      sctx.shadowBlur = 0;
      sctx.fillStyle = '#ffd700';
      sctx.font = 'italic 28px Georgia';
      sctx.fillText('« L\'arme qu\'il te faut »', 512, 165);
      const stex = new THREE.CanvasTexture(shopCanvas);
      const shopSign = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 1),
        new THREE.MeshBasicMaterial({ map: stex, transparent: true })
      );
      shopSign.position.set(0, 4.2, -0.2);
      group.add(shopSign);

      // Lumières
      const sLight = new THREE.PointLight(0xff0000, 1.2, 8);
      sLight.position.set(0, 3, 1.5);
      group.add(sLight);
      const sLight2 = new THREE.PointLight(0xffd700, 0.8, 6);
      sLight2.position.set(0, 1.5, 2);
      group.add(sLight2);

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'shop' };
      zone.position.set(0, 1, 2.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };

    const shopObj = createShop();

    // ========== ESPACE BENZBET MODERNE (4 totems rouge & blanc) ==========
    const createGambleBet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, -14);

      // Podium / dalle rouge laquée marquant la zone
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(9, 0.12, 5.5),
        new THREE.MeshStandardMaterial({ color: 0xe00e1a, metalness: 0.3, roughness: 0.25 })
      );
      podium.position.set(0, 0.06, 0);
      podium.receiveShadow = true;
      group.add(podium);

      // Bord blanc sur le podium (liseré)
      const podiumEdge = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 0.04, 5.7),
        new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.35 })
      );
      podiumEdge.position.set(0, 0.02, 0);
      group.add(podiumEdge);

      // Création d'un totem "haut écran LED, base rouge laquée" moderne
      const makeTotem = (x) => {
        const machine = new THREE.Group();
        machine.position.set(x, 0.12, -0.4);

        // ----- Base rouge laquée (pupitre incliné) -----
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 1.1, 0.75),
          new THREE.MeshStandardMaterial({ color: 0xcc0a18, metalness: 0.6, roughness: 0.15 })
        );
        base.position.y = 0.55;
        machine.add(base);

        // Liseré blanc horizontal
        const stripe = new THREE.Mesh(
          new THREE.BoxGeometry(0.97, 0.06, 0.77),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 })
        );
        stripe.position.y = 0.95;
        machine.add(stripe);

        // Plateau incliné (interface de pari)
        const consoleTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, 0.05, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x0d1117, metalness: 0.7, roughness: 0.3 })
        );
        consoleTop.position.set(0, 1.12, 0.05);
        consoleTop.rotation.x = -0.35;
        machine.add(consoleTop);

        // Écran tactile incliné (glow rouge léger)
        const touch = new THREE.Mesh(
          new THREE.PlaneGeometry(0.78, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xff2a38 })
        );
        touch.position.set(0, 1.15, 0.085);
        touch.rotation.x = -0.35 - Math.PI / 2 + Math.PI / 2; // aligné sur top incliné
        touch.rotation.x = -0.35;
        machine.add(touch);

        // Boutons colorés modernes sur la base
        const btnColors = [0xffffff, 0xe00e1a, 0xffd700];
        for (let b = 0; b < 3; b++) {
          const btn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.035, 18),
            new THREE.MeshStandardMaterial({
              color: btnColors[b], emissive: btnColors[b], emissiveIntensity: 0.6, roughness: 0.25,
            })
          );
          btn.rotation.x = Math.PI / 2;
          btn.position.set(-0.22 + b * 0.22, 0.7, 0.38);
          machine.add(btn);
        }

        // Fente tickets (imprimante)
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.45, 0.025, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x0d1117 })
        );
        slot.position.set(0, 0.35, 0.38);
        machine.add(slot);

        // Tige montante qui tient l'écran LED
        const pole = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.6, 0.12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.15 })
        );
        pole.position.set(0, 1.5, -0.25);
        machine.add(pole);

        // ----- Écran LED haut (grand panneau noir avec texture animée "cotes") -----
        const ledCanvas = document.createElement('canvas');
        ledCanvas.width = 512; ledCanvas.height = 256;
        const lctx = ledCanvas.getContext('2d');
        lctx.fillStyle = '#0d1117';
        lctx.fillRect(0, 0, 512, 256);
        // Bandeau GambleBet
        lctx.fillStyle = '#e00e1a';
        lctx.fillRect(0, 0, 512, 56);
        lctx.fillStyle = '#fff';
        lctx.font = 'bold 34px Georgia';
        lctx.textAlign = 'center';
        lctx.fillText('BENZBET', 256, 40);
        // Faux cotes LIVE
        lctx.fillStyle = '#ffd700';
        lctx.font = 'bold 20px monospace';
        lctx.textAlign = 'left';
        const odds = [
          ['PSG - Real', '2.10  3.40  2.85'],
          ['Celtics - Nuggets', '1.65  —   2.25'],
          ['Sinner - Alcaraz', '1.95  —   1.88'],
          ['Djokovic - Ruud', '1.45  —   2.70'],
        ];
        odds.forEach((row, i) => {
          lctx.fillStyle = i % 2 ? '#fff' : '#ff9aa2';
          lctx.fillText(row[0], 22, 100 + i * 36);
          lctx.fillStyle = '#ffd700';
          lctx.fillText(row[1], 280, 100 + i * 36);
        });
        // Pastille LIVE clignotante (statique image)
        lctx.fillStyle = '#e00e1a';
        lctx.beginPath(); lctx.arc(470, 30, 8, 0, Math.PI * 2); lctx.fill();
        lctx.fillStyle = '#fff';
        lctx.font = 'bold 12px Arial';
        lctx.fillText('LIVE', 448, 34);

        const ledTex = new THREE.CanvasTexture(ledCanvas);
        const led = new THREE.Mesh(
          new THREE.PlaneGeometry(1.4, 0.75),
          new THREE.MeshBasicMaterial({ map: ledTex })
        );
        led.position.set(0, 2.1, -0.24);
        machine.add(led);

        // Cadre blanc autour de l'écran
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.82, 0.06),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.25 })
        );
        frame.position.set(0, 2.1, -0.28);
        machine.add(frame);

        // Petit logo BB rouge au pied
        const footLogo = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.08, 0.02),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35 })
        );
        footLogo.position.set(0, 0.15, 0.38);
        machine.add(footLogo);

        return machine;
      };

      // 4 totems alignés le long du podium
      const xs = [-3.3, -1.1, 1.1, 3.3];
      xs.forEach(x => group.add(makeTotem(x)));

      // Comptoir bookmaker blanc laqué + liseré rouge
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.3 })
      );
      counter.position.set(0, 0.5, 2.2);
      group.add(counter);

      const counterStripe = new THREE.Mesh(
        new THREE.BoxGeometry(6.05, 0.1, 1.02),
        new THREE.MeshStandardMaterial({ color: 0xe00e1a, emissive: 0xe00e1a, emissiveIntensity: 0.25 })
      );
      counterStripe.position.set(0, 0.95, 2.2);
      group.add(counterStripe);

      // Bookmaker 3D (conservé)
      const bookmaker = createDealer3D({ skin: '#d4a888', hair: '#4a2818', eyes: '#2a1808', beard: false, glasses: true, gender: 'm' });
      bookmaker.position.set(0, 0, 3.0);
      bookmaker.rotation.y = Math.PI;
      group.add(bookmaker);

      // Grande enseigne LED BENZBET rouge & blanche suspendue
      const neonCanvas = document.createElement('canvas');
      neonCanvas.width = 1024; neonCanvas.height = 256;
      const nctx = neonCanvas.getContext('2d');
      nctx.fillStyle = '#0d1117';
      nctx.fillRect(0, 0, 1024, 256);
      // Halo rouge
      nctx.shadowColor = '#ff2a38';
      nctx.shadowBlur = 40;
      nctx.fillStyle = '#e00e1a';
      nctx.fillRect(40, 60, 944, 140);
      nctx.shadowBlur = 0;
      // Texte blanc
      nctx.fillStyle = '#fff';
      nctx.font = 'bold 130px Georgia';
      nctx.textAlign = 'center';
      nctx.fillText('GAMBLELIFE', 360, 170);
      // BET dans un box blanc/rouge inversé
      nctx.fillStyle = '#fff';
      nctx.fillRect(540, 70, 400, 140);
      nctx.fillStyle = '#e00e1a';
      nctx.fillText('BET', 740, 170);
      // Slogan
      nctx.fillStyle = '#ffd700';
      nctx.font = 'bold 28px Georgia';
      nctx.fillText('PARIS SPORTIFS · COTES EN DIRECT', 512, 235);

      const ntex = new THREE.CanvasTexture(neonCanvas);
      const neonSign = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 1.75),
        new THREE.MeshBasicMaterial({ map: ntex, transparent: true })
      );
      neonSign.position.set(0, 4.3, -0.3);
      group.add(neonSign);

      // Barres LED rouge & blanche décoratives au sol
      for (let i = 0; i < 4; i++) {
        const ledBar = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.04, 0.08),
          new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xe00e1a : 0xffffff,
            emissive: i % 2 === 0 ? 0xe00e1a : 0xffffff,
            emissiveIntensity: 0.55,
          })
        );
        ledBar.position.set(-3.3 + i * 2.2, 0.14, 1.3);
        group.add(ledBar);
      }

      // Lumières d'ambiance rouge / blanche
      const nlight1 = new THREE.PointLight(0xe00e1a, 1.2, 8);
      nlight1.position.set(-2.5, 3.2, 1);
      group.add(nlight1);
      const nlight2 = new THREE.PointLight(0xffffff, 0.9, 8);
      nlight2.position.set(2.5, 3.2, 1);
      group.add(nlight2);
      const nlight3 = new THREE.PointLight(0xffd700, 0.5, 6);
      nlight3.position.set(0, 4, 0);
      group.add(nlight3);

      // Zone d'interaction élargie (couvre les 4 totems)
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(4.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'benzbet' };
      zone.position.set(0, 1, 0.5);
      group.add(zone);

      scene.add(group);
      return { zone };
    };
    const benzBetObj = createGambleBet();

    // =========== SALLE ARCADE — 4 bornes côte à côte ===========
    // Tapis violet au sol pour délimiter la zone arcade
    const arcadeCarpet = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 3),
      new THREE.MeshStandardMaterial({
        color: 0x1a0d2a, roughness: 0.85, metalness: 0.1,
        emissive: 0x3a1a5a, emissiveIntensity: 0.15,
      })
    );
    arcadeCarpet.rotation.x = -Math.PI / 2;
    arcadeCarpet.position.set(10.5, 0.02, -10);
    arcadeCarpet.receiveShadow = true;
    arcadeCarpet.userData.isFloor = true;
    scene.add(arcadeCarpet);

    // Panneau "ARCADE" au-dessus de la zone
    const arcadeBanner = (() => {
      const cv = document.createElement('canvas');
      cv.width = 768; cv.height = 128;
      const cx = cv.getContext('2d');
      const g = cx.createLinearGradient(0, 0, 768, 0);
      g.addColorStop(0, '#0a0d20'); g.addColorStop(0.5, '#1a2540'); g.addColorStop(1, '#0a0d20');
      cx.fillStyle = g; cx.fillRect(0, 0, 768, 128);
      cx.strokeStyle = '#3fe6ff'; cx.lineWidth = 6; cx.strokeRect(8, 8, 752, 112);
      cx.fillStyle = '#3fe6ff';
      cx.font = 'bold 64px Georgia, serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.shadowColor = '#3fe6ff'; cx.shadowBlur = 24;
      cx.fillText('🎮 SALLE ARCADE 🎮', 384, 64);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 0.75),
        new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true })
      );
      m.position.set(10.5, 4.0, -11.4);
      m.rotation.y = -Math.PI / 12;
      scene.add(m);
      return m;
    })();

    // Matériaux partagés entre les 4 bornes (allocation 1 fois pour les 4)
    const sharedArcadeMats = {
      blackLac: new THREE.MeshPhysicalMaterial({
        color: 0x0a0a14, metalness: 0.6, roughness: 0.3,
        clearcoat: 1.0, clearcoatRoughness: 0.08,
      }),
      screenFrame: new THREE.MeshPhysicalMaterial({
        color: 0x1a1a22, metalness: 0.9, roughness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.06,
      }),
      stickBase: new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.6, roughness: 0.4 }),
      stick: new THREE.MeshStandardMaterial({ color: 0x111, metalness: 0.5, roughness: 0.6 }),
    };
    // Géométries partagées
    const sharedArcadeGeo = {
      base: roundedBox(1.5, 1.0, 0.95, 0.06, 3),
      pillar: roundedBox(1.5, 1.6, 0.3, 0.04, 3),
      screenFrame: roundedBox(1.4, 1.0, 0.08, 0.04, 3),
      screen: new THREE.PlaneGeometry(1.28, 0.88),
      stickBase: new THREE.CylinderGeometry(0.06, 0.08, 0.04, 12),
      stick: new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8),
      stickBall: new THREE.SphereGeometry(0.05, 12, 8),
      button: new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12),
      neon: new THREE.BoxGeometry(0.04, 1.5, 0.04),
      topBar: new THREE.BoxGeometry(1.55, 0.16, 0.18),
    };

    // Builder paramétrique : produit une borne arcade configurée pour un jeu
    const createArcadeKiosk = ({
      gameId, accentHex, accentEmissive, title, subtitle, emoji, x, z, rotY = 0,
    }) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotY;

      // Base
      const base = new THREE.Mesh(sharedArcadeGeo.base, sharedArcadeMats.blackLac);
      base.position.y = 0.5;
      group.add(base);

      // Pilier
      const pillar = new THREE.Mesh(sharedArcadeGeo.pillar, sharedArcadeMats.blackLac);
      pillar.position.set(0, 1.8, -0.32);
      group.add(pillar);

      // Frame écran
      const screenFrame = new THREE.Mesh(sharedArcadeGeo.screenFrame, sharedArcadeMats.screenFrame);
      screenFrame.position.set(0, 2.0, -0.18);
      screenFrame.rotation.x = -0.05;
      group.add(screenFrame);

      // Écran texturé spécifique au jeu
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 384;
      const cx = cv.getContext('2d');
      const grad = cx.createLinearGradient(0, 0, 0, 384);
      grad.addColorStop(0, '#0a0d18'); grad.addColorStop(0.5, '#181f2a'); grad.addColorStop(1, '#0a0d18');
      cx.fillStyle = grad; cx.fillRect(0, 0, 512, 384);
      const accentCss = '#' + accentHex.toString(16).padStart(6, '0');
      cx.strokeStyle = accentCss; cx.lineWidth = 4;
      cx.strokeRect(8, 8, 496, 368);
      // Emoji géant
      cx.font = 'bold 140px sans-serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.shadowColor = accentCss; cx.shadowBlur = 30;
      cx.fillStyle = '#fff';
      cx.fillText(emoji, 256, 130);
      // Titre
      cx.font = 'bold 56px Georgia, serif';
      cx.fillStyle = accentCss; cx.shadowBlur = 20;
      cx.fillText(title, 256, 250);
      // Sous-titre
      cx.font = '22px sans-serif';
      cx.fillStyle = '#ccc'; cx.shadowBlur = 0;
      cx.fillText(subtitle, 256, 310);
      cx.font = 'bold 16px sans-serif';
      cx.fillStyle = '#888';
      cx.fillText('— [E] / TAP POUR JOUER —', 256, 350);
      const screenTex = new THREE.CanvasTexture(cv);
      screenTex.colorSpace = THREE.SRGBColorSpace;
      const screen = new THREE.Mesh(
        sharedArcadeGeo.screen,
        new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
      );
      screen.position.set(0, 2.0, -0.135);
      screen.rotation.x = -0.05;
      group.add(screen);

      // Joystick (géométries partagées, matériaux partagés sauf la bille)
      const stickBaseM = new THREE.Mesh(sharedArcadeGeo.stickBase, sharedArcadeMats.stickBase);
      stickBaseM.position.set(0.4, 1.04, 0.1); group.add(stickBaseM);
      const stickM = new THREE.Mesh(sharedArcadeGeo.stick, sharedArcadeMats.stick);
      stickM.position.set(0.4, 1.15, 0.1); group.add(stickM);
      const stickBall = new THREE.Mesh(
        sharedArcadeGeo.stickBall,
        new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.25 })
      );
      stickBall.position.set(0.4, 1.26, 0.1); group.add(stickBall);

      // 2 boutons (1 mat accent + 1 mat or partagés par cette borne)
      const btnAccentMat = new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.3 });
      const btnGoldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.3 });
      [btnAccentMat, btnGoldMat].forEach((mat, i) => {
        const btn = new THREE.Mesh(sharedArcadeGeo.button, mat);
        btn.position.set(-0.4 + i * 0.25, 1.04, 0.25);
        btn.rotation.x = Math.PI / 2;
        group.add(btn);
      });

      // Néons verticaux : 1 matériau accent partagé entre les 2 néons
      const neonMat = new THREE.MeshBasicMaterial({ color: accentHex, toneMapped: false });
      for (let s = -1; s <= 1; s += 2) {
        const neon = new THREE.Mesh(sharedArcadeGeo.neon, neonMat);
        neon.position.set(s * 0.72, 1.8, -0.28);
        group.add(neon);
      }

      // Top bar accent emissive
      const topBar = new THREE.Mesh(
        sharedArcadeGeo.topBar,
        new THREE.MeshStandardMaterial({
          color: accentHex, metalness: 0.3, roughness: 0.2,
          emissive: accentEmissive ?? accentHex, emissiveIntensity: 1.2,
        })
      );
      topBar.position.set(0, 2.7, -0.28);
      group.add(topBar);
      // Pas de PointLight par borne (4 lights = trop coûteux). Une seule globale ajoutée plus bas.

      // Zone d'interaction
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: `arcade-${gameId}` };
      zone.position.set(0, 1, 1.0);
      group.add(zone);

      scene.add(group);
      return { zone, group };
    };

    // === 4 bornes alignées au centre du tapis arcade ===
    // Rangée à z=-10, espacement 2.0m sur x, toutes face au sud (+z)
    const arcadeBornes = [
      createArcadeKiosk({
        gameId: 'crash', accentHex: 0x3fe6ff, title: 'CRASH', subtitle: 'L\'avion décolle… cash out !',
        emoji: '🚀', x: 7.5, z: -10, rotY: 0,
      }),
      createArcadeKiosk({
        gameId: 'mines', accentHex: 0xff00aa, title: 'MINES', subtitle: 'Évite les bombes, multiplie',
        emoji: '💎', x: 9.5, z: -10, rotY: 0,
      }),
      createArcadeKiosk({
        gameId: 'dice', accentHex: 0xffd700, title: 'DICE', subtitle: 'High ou Low ? Gain × 1.95',
        emoji: '🎲', x: 11.5, z: -10, rotY: 0,
      }),
      createArcadeKiosk({
        gameId: 'coin', accentHex: 0xffa500, title: 'COIN FLIP', subtitle: 'Pile ou face, gain × 1.95',
        emoji: '🪙', x: 13.5, z: -10, rotY: 0,
      }),
    ];
    // === 1 seule lumière globale pour TOUTE la salle arcade ===
    // (au lieu de 4 PointLights par borne, coût ÷ 4)
    const arcadeRoomLight = new THREE.PointLight(0xb87aff, 1.2, 12);
    arcadeRoomLight.position.set(10.5, 3.0, -9);
    scene.add(arcadeRoomLight);

    // Liste globale des zones d'interaction
    const interactZones = [
      bj.zone, rl.zone, hc.zone, pk.zone,
      barObj.zone, toiletObj.zone, atmObj.zone, wheelObj.zone, shopObj.zone, benzBetObj.zone,
      ...arcadeBornes.map(b => b.zone),
    ];

    // ========== PORTE DE SORTIE 3D (retour à la rue) ==========
    // Positionnée près du spawn (z=14), face au joueur, encadrée or.
    const exitDoorGroup = new THREE.Group();
    exitDoorGroup.position.set(0, 0, 17.5);
    // Cadre doré (pilier gauche/droit + linteau)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.15, emissive: 0x2a1a00, emissiveIntensity: 0.3 });
    for (let s = -1; s <= 1; s += 2) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), doorFrameMat);
      pillar.position.set(s * 1.25, 1.7, 0);
      exitDoorGroup.add(pillar);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 0.22), doorFrameMat);
    lintel.position.set(0, 3.4, 0);
    exitDoorGroup.add(lintel);
    // Panneau de porte (bois + émissif léger pour signaler l'interaction)
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 3, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x6a3a1a, metalness: 0.2, roughness: 0.7, emissive: 0x3a1a00, emissiveIntensity: 0.25 })
    );
    doorPanel.position.set(0, 1.6, 0);
    exitDoorGroup.add(doorPanel);
    // Poignée dorée
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.15 })
    );
    handle.position.set(0.7, 1.6, 0.1);
    exitDoorGroup.add(handle);
    // Enseigne lumineuse "SORTIE" au-dessus
    const exitSignCvs = document.createElement('canvas');
    exitSignCvs.width = 512; exitSignCvs.height = 128;
    const escx = exitSignCvs.getContext('2d');
    escx.fillStyle = '#0a0f1a'; escx.fillRect(0, 0, 512, 128);
    escx.shadowColor = '#3fe6ff'; escx.shadowBlur = 30;
    escx.fillStyle = '#3fe6ff'; escx.font = 'bold 72px Georgia'; escx.textAlign = 'center';
    escx.fillText('SORTIE', 256, 86);
    escx.shadowBlur = 0;
    escx.fillStyle = '#fff'; escx.font = 'italic 22px Georgia';
    escx.fillText('← retour rue', 256, 118);
    const exitSignTex = new THREE.CanvasTexture(exitSignCvs);
    const exitSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.8),
      new THREE.MeshBasicMaterial({ map: exitSignTex, transparent: true })
    );
    exitSignMesh.position.set(0, 3.95, 0.01);
    exitDoorGroup.add(exitSignMesh);
    // Flèches verte clignotantes au sol
    const exitArrow = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.85, 24),
      new THREE.MeshBasicMaterial({ color: 0x3fe6ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    exitArrow.rotation.x = -Math.PI / 2;
    exitArrow.position.set(0, 0.04, 0.8);
    exitDoorGroup.add(exitArrow);
    exitDoorGroup.userData.__pulseArrow = exitArrow;
    scene.add(exitDoorGroup);
    // Zone d'interaction (invisible)
    const exitZone = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    exitZone.position.set(0, 1.5, 17.5);
    exitZone.userData = { zoneId: 'exit' };
    scene.add(exitZone);
    interactZones.push(exitZone);

    // Colonnes décoratives
    [[-10, 10], [10, 10], [-10, -10], [10, -10]].forEach(([x, z]) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      col.position.set(x, 3, z);
      col.castShadow = true;
      scene.add(col);
      // Cap décoratif
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.4, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
      );
      cap.position.set(x, 6.1, z);
      scene.add(cap);
    });

    // Bannières du pays sur les murs
    casino.flag.forEach((col, i) => {
      const colInt = parseInt(col.slice(1), 16);
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 3),
        new THREE.MeshStandardMaterial({ color: colInt, side: THREE.DoubleSide })
      );
      banner.position.set(-19.9, 3, -10 + i * 3);
      banner.rotation.y = Math.PI / 2;
      scene.add(banner);
      const banner2 = banner.clone();
      banner2.position.set(19.9, 3, -10 + i * 3);
      banner2.rotation.y = -Math.PI / 2;
      scene.add(banner2);
    });

    // ========== CONTRÔLES ==========
    const direction = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const SPEED = 0.11;
    // État assis (smooth) : 1.7 debout, 1.05 assis
    let camTargetY = 1.7;
    let camY = 1.7;
    const SIT_ZONES = new Set(['blackjack', 'roulette', 'highcard', 'poker']);
    const getSpeedMul = () => {
      const v = profile && profile.equippedVehicle;
      const def = VEHICLES.find(x => x.id === v);
      return def ? def.speedMul : 1;
    };
    const ROOM_HALF = 18;
    let isPointerLocked = false;

    // ========== COLLISION DETECTION ==========
    // Collect AABB (axis-aligned bounding boxes in XZ plane) of all significant
    // obstacles in the scene so the player can't walk through tables, slot
    // machines, counters, walls, etc.
    // Called once per animate frame (cheap – precomputed list).
    const colliders = [];
    const PLAYER_RADIUS = 0.2; // rayon de collision du joueur (réduit pour pouvoir s'approcher des tables)
    const collectColliders = () => {
      colliders.length = 0;
      const tmpBox = new THREE.Box3();
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        if (!obj.geometry) return;
        // Skip les meshes invisibles (zones de proximité, déclencheurs, etc.)
        if (obj.visible === false) return;
        if (obj.material && obj.material.visible === false) return;
        // Respect les flags explicites posés côté createTable/NPC/etc.
        // Remonte aussi la hiérarchie pour chercher un ancêtre marqué noCollide
        let ancestor = obj;
        while (ancestor) {
          if (ancestor.userData && ancestor.userData.noCollide) return;
          ancestor = ancestor.parent;
        }
        obj.updateWorldMatrix(true, false);
        tmpBox.setFromObject(obj);
        const sizeY = tmpBox.max.y - tmpBox.min.y;
        const sizeX = tmpBox.max.x - tmpBox.min.x;
        const sizeZ = tmpBox.max.z - tmpBox.min.z;
        // Skip ultra-plat (sols, tapis, decals)
        if (sizeY < 0.25) return;
        // Skip ce qui est au-dessus du torse (lustres, enseignes, plafond)
        if (tmpBox.min.y > 1.6) return;
        // Skip ce qui est au ras du sol
        if (tmpBox.max.y < 0.3) return;
        // Skip murs/plafonds/sols gigantesques (ils bloqueraient partout)
        if (sizeX > 40 || sizeZ > 40) return;
        // Skip plateaux de tables : larges mais fins en hauteur (sizeY < 0.4 et très large)
        if (sizeY < 0.4 && (sizeX > 1.5 || sizeZ > 1.5)) return;
        // Skip tout petit (cartes, balles, chips, jetons)
        if (sizeX < 0.25 && sizeZ < 0.25) return;
        colliders.push({
          minX: tmpBox.min.x - PLAYER_RADIUS,
          maxX: tmpBox.max.x + PLAYER_RADIUS,
          minZ: tmpBox.min.z - PLAYER_RADIUS,
          maxZ: tmpBox.max.z + PLAYER_RADIUS,
        });
      });
    };

    const pointInAnyCollider = (x, z) => {
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) return true;
      }
      return false;
    };

    // Si la cinématique d'arrivée est en cours et que le joueur tente de
    // bouger, on l'interrompt immédiatement pour rendre le contrôle.
    const skipArrivalIfNeeded = () => {
      if (arrivingRef.current) {
        arrivingRef.current = false;
        setArriving(false);
      }
    };

    const onKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = true; skipArrivalIfNeeded(); break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = true; skipArrivalIfNeeded(); break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = true; skipArrivalIfNeeded(); break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = true; skipArrivalIfNeeded(); break;
        case 'KeyE': case 'Space':
          if (nearZoneRef.current && zoneCallbacksRef.current[nearZoneRef.current]) {
            zoneCallbacksRef.current[nearZoneRef.current]();
          }
          break;
        case 'Escape':
          if (document.pointerLockElement) document.exitPointerLock();
          break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = false; break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = false; break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = false; break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = false; break;
      }
    };
    const onMouseMove = (e) => {
      if (!isPointerLocked) return;
      euler.setFromQuaternion(camera.quaternion);
      // Sensibilité boostée (avant 0.002 → 0.0038) pour rotation plus vive
      euler.y -= (e.movementX || 0) * 0.0038;
      euler.x -= (e.movementY || 0) * 0.0038;
      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
      camera.quaternion.setFromEuler(euler);
    };
    const onClick = (e) => {
      // Ne pas lock si on clique sur un bouton HUD
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      if (!isPointerLocked) renderer.domElement.requestPointerLock();
    };
    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
      if (isPointerLocked) setShowInstructions(false);
    };

    // Contrôles tactiles : glisser au doigt pour tourner la tête
    let touchLookId = null;
    let lastTouchX = 0, lastTouchY = 0;
    const onTouchStart = (e) => {
      setShowInstructions(false);
      // Ignorer si on touche un bouton
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.hud-control')) return;
      for (const t of e.changedTouches) {
        if (touchLookId === null) {
          touchLookId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
        }
      }
    };
    const onTouchMove = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.hud-control')) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === touchLookId) {
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          euler.setFromQuaternion(camera.quaternion);
          // Sensibilité touch boostée (avant 0.005 → 0.0085)
          euler.y -= dx * 0.0085;
          euler.x -= dy * 0.0085;
          euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
          camera.quaternion.setFromEuler(euler);
        }
      }
    };
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === touchLookId) touchLookId = null;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // LOOP
    let animFrameId;
    let wheelRot = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const k = keysRef.current;
      direction.z = Number(k.forward) - Number(k.backward);
      direction.x = Number(k.right) - Number(k.left);
      direction.normalize();

      if (direction.z !== 0 || direction.x !== 0) {
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, cameraDir).normalize();
        const movement = new THREE.Vector3();
        const speedMul = getSpeedMul();
        movement.add(cameraDir.multiplyScalar(direction.z * SPEED * speedMul));
        movement.add(right.multiplyScalar(-direction.x * SPEED * speedMul));

        // ===== Collision resolution (slide along axis) =====
        // Test each axis independently so the player can slide along walls/obstacles
        // instead of being stuck. We refresh colliders once the first time we move
        // (some meshes may have been added async after the initial scene build).
        if (colliders.length === 0) collectColliders();

        const startX = camera.position.x;
        const startZ = camera.position.z;

        // Anti-stuck : si le joueur est DÉJÀ à l'intérieur d'un collider (spawn
        // mal placé, prop ajouté autour de lui, etc.), on l'autorise à bouger
        // librement jusqu'à ce qu'il en sorte. Sans ça, il serait piégé pour
        // toujours car n'importe quelle nouvelle position est aussi dans le
        // même collider.
        const stuckInside = pointInAnyCollider(startX, startZ);

        // Try X movement
        const newX = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, startX + movement.x));
        if (stuckInside || !pointInAnyCollider(newX, startZ)) camera.position.x = newX;

        // Try Z movement
        const newZ = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, startZ + movement.z));
        if (stuckInside || !pointInAnyCollider(camera.position.x, newZ)) camera.position.z = newZ;
      }

      // ===== Animation s'asseoir près des tables de jeu =====
      // Désactivée en lobby : l'animation "sit" n'est déclenchée que quand le
      // joueur ouvre réellement le mini-jeu (pas juste en passant à côté).
      camTargetY = 1.7;
      camY += (camTargetY - camY) * 0.12;
      camera.position.y = camY;

      if (rl.wheel) rl.wheel.rotation.y += 0.012;
      if (wheelObj.wheelDisc) wheelObj.wheelDisc.rotation.z += 0.003;
      wheelRot += 0.02;

      // Horodatage pour toutes les animations suivantes
      const nowTime = Date.now();

      // ===== Animation bille de roulette (rouleau sur la piste) =====
      if (rl.ball) {
        rl.ball.userData.angle += rl.ball.userData.ballSpeed;
        const ba = rl.ball.userData.angle;
        const br = rl.ball.userData.radius;
        rl.ball.position.x = Math.cos(ba) * br;
        rl.ball.position.z = Math.sin(ba) * br;
        // Petit rebond vertical pour simuler le roulis
        rl.ball.position.y = 1.27 + Math.abs(Math.sin(ba * 6)) * 0.02;
        // Rotation sur elle-même
        rl.ball.rotation.x += 0.2;
        rl.ball.rotation.z += 0.15;
        // Ralentissement progressif puis repos dans une poche (cycle 12s)
        const cyc = (nowTime % 12000) / 12000;
        if (cyc < 0.7) {
          rl.ball.userData.ballSpeed = 0.08 * (1 - cyc / 0.7) + 0.015;
        } else {
          // Repos dans une poche: vitesse très faible = suit la rotation du disque
          rl.ball.userData.ballSpeed = 0.012;
          rl.ball.userData.radius = 0.95 + Math.sin(nowTime * 0.002) * 0.03;
        }
        if (cyc > 0.98) {
          // relancer au nouveau cycle
          rl.ball.userData.ballSpeed = 0.09;
          rl.ball.userData.radius = 1.25;
        }
      }

      // ===== Animation cartes distribuées (cycle permanent) =====
      allTables.forEach((tbl) => {
        if (!tbl.cards) return;
        const CYCLE = 8000; // redeal toutes les 8s
        const local = (nowTime - tbl.cards.userData.cycleStart) % CYCLE;
        tbl.cards.children.forEach((card) => {
          const ud = card.userData;
          const t = Math.max(0, Math.min(1, (local - ud.delay) / ud.duration));
          if (local < ud.delay) {
            // Avant deal : cachée dans le sabot du croupier
            card.position.copy(ud.startPos);
            card.visible = false;
          } else if (local < CYCLE - 1000) {
            card.visible = true;
            // Animation vol de carte avec arc
            card.position.lerpVectors(ud.startPos, ud.endPos, t);
            card.position.y += Math.sin(t * Math.PI) * 0.6;
            // Petit flip pendant le vol
            if (t < 1) card.rotation.x = t * Math.PI * 2;
            else card.rotation.x = 0;
          } else {
            // Fade-out fin de cycle
            card.visible = false;
          }
        });
      });

      // Animation balles en vol
      
      // Animer les TVs (moins souvent pour perf)
      if (nowTime % 100 < 17) {
        tvTexturesRef.forEach(tv => drawTVFrame(tv, nowTime));
      }
      
      // Animer les PNJ
      npcs.forEach((npcData, i) => {
        const { mesh, path, phase } = npcData;
        // Skip si mort : laisse la position actuelle
        if (mesh.userData.dead) return;
        const t = (Math.sin(nowTime * path.speed * 0.001 + phase) + 1) / 2;
        mesh.position.x = path.x0 + (path.x1 - path.x0) * t;
        mesh.position.z = path.z0 + (path.z1 - path.z0) * t;
        // Direction de marche
        const dx = path.x1 - path.x0;
        const dz = path.z1 - path.z0;
        const dir = Math.cos(nowTime * path.speed * 0.001 + phase);
        mesh.rotation.y = Math.atan2(dir > 0 ? dx : -dx, dir > 0 ? dz : -dz);
        // Petit bop de marche
        mesh.position.y = Math.abs(Math.sin(nowTime * 0.008 + i)) * 0.05;
        // Balancement des jambes/bras pour un mouvement réaliste
        const swing = Math.sin(nowTime * 0.01 + i) * 0.45;
        if (mesh.userData.legL) mesh.userData.legL.rotation.x = swing;
        if (mesh.userData.legR) mesh.userData.legR.rotation.x = -swing;
        if (mesh.userData.armL) mesh.userData.armL.rotation.x = -swing * 0.8;
        if (mesh.userData.armR) mesh.userData.armR.rotation.x = swing * 0.8;
      });
      
      bulletsRef.current = bulletsRef.current.filter(b => {
        const elapsed = nowTime - b.startTime;
        const t = Math.min(elapsed / b.duration, 1);
        if (b.onUpdate) {
          b.onUpdate(b.mesh, t);
        } else {
          b.mesh.position.lerpVectors(b.startPos, b.endPos, t);
        }
        if (t >= 1) {
          scene.remove(b.mesh);
          // Dispose geometries + materials pour éviter une fuite GPU sur les rockets/grenades répétés
          try {
            b.mesh.traverse((child) => {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(m => m && m.dispose && m.dispose());
              }
            });
          } catch (_e) { /* noop */ }
          return false;
        }
        return true;
      });

      // Animation flammes (lance-flammes)
      flamesRef.current.forEach(f => {
        const elapsed = nowTime - f.startTime;
        // Récupérer la position actuelle de la caméra (suit le joueur)
        const camPos = new THREE.Vector3();
        f.camera.getWorldPosition(camPos);
        const camDir = new THREE.Vector3();
        f.camera.getWorldDirection(camDir);
        const right = new THREE.Vector3().crossVectors(camDir, f.camera.up).normalize();
        const muzzlePos = camPos.clone()
          .add(camDir.clone().multiplyScalar(0.6))
          .add(right.clone().multiplyScalar(0.25))
          .add(new THREE.Vector3(0, -0.25, 0));
        
        f.particles.forEach(p => {
          const localElapsed = elapsed - p.startDelay;
          if (localElapsed < 0) {
            p.mesh.visible = false;
            return;
          }
          if (localElapsed > p.life || elapsed > f.duration + 500) {
            p.mesh.visible = false;
            return;
          }
          p.mesh.visible = true;
          // Position : va dans la direction de la caméra, de 0 à 3m
          const progress = localElapsed / p.life;
          const distance = progress * 3;
          const pos = muzzlePos.clone()
            .add(camDir.clone().multiplyScalar(distance))
            .add(right.clone().multiplyScalar(p.offsetX))
            .add(new THREE.Vector3(0, p.offsetY, 0));
          p.mesh.position.copy(pos);
          // Grossir puis rétrécir
          const scale = 1 + progress * 2;
          p.mesh.scale.set(scale, scale, scale);
          // Fade
          p.mesh.material.opacity = 0.9 * (1 - progress);
        });
      });

      // Animation sang (gravité)
      bloodRef.current.forEach(b => {
        const elapsed = nowTime - b.startTime;
        const dt = 0.016;
        b.drops.forEach(d => {
          if (!d.landed) {
            d.mesh.position.x += d.vx * dt;
            d.mesh.position.y += d.vy * dt;
            d.mesh.position.z += d.vz * dt;
            d.vy -= 9.8 * dt; // gravité
            if (d.mesh.position.y < -1.6) {
              d.mesh.position.y = -1.6;
              d.vx *= 0.3;
              d.vz *= 0.3;
              d.vy = 0;
              d.landed = true;
              d.mesh.scale.y = 0.2; // aplatir au sol
            }
          }
        });
      });

      // FOV dynamique pour visée 1ère personne
      const targetFov = isAimingRef.current ? 40 : 75;
      if (Math.abs(camera.fov - targetFov) > 0.5) {
        camera.fov += (targetFov - camera.fov) * 0.2;
        camera.updateProjectionMatrix();
      }

      // Proximité zones
      let closest = null;
      let closestDist = 4.2; // rayon proximité (augmenté pour que le bouton apparaisse même à distance)
      interactZones.forEach((zone) => {
        const worldPos = new THREE.Vector3();
        zone.getWorldPosition(worldPos);
        const dist = camera.position.distanceTo(worldPos);
        if (dist < closestDist) {
          closestDist = dist;
          closest = zone.userData.zoneId;
        }
      });
      if (closest !== nearZoneRef.current) {
        nearZoneRef.current = closest;
        setNearZone(closest);
      }

      // ========== Vue 3ème personne : avatar + caméra orbitale ==========
      const tps = viewModeRef.current === 'third' || arrivingRef.current;
      playerAvatar.visible = tps;
      // ========== ANIMATION D'ARRIVÉE — cinématique 3 s ==========
      if (arrivingRef.current) {
        const elapsed = performance.now() - arrivalStartRef.current; // ms
        const t = Math.min(1, elapsed / ARRIVAL_DURATION_MS);

        // Capture le spawn à la 1ère frame (sinon la caméra dérive car elle
        // relit camera.position chaque frame, qu'on a déjà muté la frame d'avant).
        if (!arrivalSpawnRef.current) {
          arrivalSpawnRef.current = { x: camera.position.x, z: camera.position.z };
        }
        const spawn = arrivalSpawnRef.current;

        // Sauvegarde la position "monde" du joueur pour la restaurer après render
        // → la cinématique ne déplace pas le joueur dans le niveau.
        const origPos = camera.position.clone();

        // Easings
        const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
        const easeOut = (x) => 1 - Math.pow(1 - x, 3);
        const e = easeInOut(t);
        const eO = easeOut(t);

        // Trajectoire caméra : spirale descendante qui se termine pile à la
        // position 1ère personne (œil à 1.7m, sur le spawn).
        // - angle : démarre à ~100° à droite du joueur, ferme jusqu'à 0°
        // - radius : 5 m → 0 m (atterrit sur la tête du joueur)
        // - height : 7 m → 1.7 m (œil)
        const angle = (Math.PI * 0.55) * (1 - e);
        const radius = 5 * (1 - eO);
        const height = 7 + (1.7 - 7) * e;

        camera.position.set(
          spawn.x + Math.sin(angle) * radius,
          height,
          spawn.z + Math.cos(angle) * radius
        );
        // Cible légèrement vers l'avant (-Z) pour finir orienté forward
        camera.lookAt(spawn.x, 1.7, spawn.z - 0.5);

        // Avatar : visible, posé sur le sol, oriente face -Z (par défaut joueur).
        // Effet "matérialisation" sur les 600 premières ms : scale 0.6 → 1, rise.
        playerAvatar.visible = true;
        playerAvatar.position.set(spawn.x, 0, spawn.z);
        playerAvatar.rotation.y = 0;
        if (elapsed < 600) {
          const m = elapsed / 600;
          playerAvatar.position.y = (1 - m) * 0.4;
          playerAvatar.scale.setScalar(0.6 + m * 0.4);
        } else {
          playerAvatar.position.y = 0;
          playerAvatar.scale.setScalar(1);
        }

        updateRemoteAvatars();
        renderer.render(scene, camera);

        // Restaure la position "monde" → le joueur reste pile au spawn pendant
        // toute la cinématique, et y est exactement à la sortie.
        if (t >= 1) {
          camera.position.set(spawn.x, 1.7, spawn.z);
          // Reset scale au cas où (sécurité)
          playerAvatar.scale.setScalar(1);
        } else {
          camera.position.copy(origPos);
        }
      } else if (tps) {
        // camera direction (horizontal)
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        // Position avatar devant la caméra (à l'emplacement que la caméra aurait en 1ère pers.)
        // Les `camera.position` continuent d'être mis à jour par les déplacements (WASD/joystick)
        // comme s'ils représentaient la tête du joueur — on garde la logique existante.
        playerAvatar.position.set(camera.position.x, 0, camera.position.z);
        // Orientation : regarde dans la même direction que la caméra
        playerAvatar.rotation.y = Math.atan2(camDir.x, camDir.z);

        // Met à jour l'arme + la chicha tenues (visibles en TPS)
        refreshAttachedWeapon();
        refreshAttachedHookah();

        // Léger balancement des bras/jambes si le joueur bouge
        const isMoving = keysRef.current.forward || keysRef.current.backward || keysRef.current.left || keysRef.current.right;
        const t = performance.now() * 0.008;
        const swing = isMoving ? Math.sin(t) * 0.3 : 0;
        if (playerAvatar.userData.leftArm)  playerAvatar.userData.leftArm.rotation.x = swing;
        // Bras droit : si arme équipée → tendu (visée). Si chicha en cours
        // d'utilisation → levé vers la bouche pour porter la chicha aux
        // lèvres. Sinon balancement de marche normal.
        if (playerAvatar.userData.rightArm) {
          if (selectedWeaponRef.current) {
            playerAvatar.userData.rightArm.rotation.x = -1.1;
          } else if (usingHookahRef.current) {
            // Bras plié à 90° vers la bouche
            playerAvatar.userData.rightArm.rotation.x = -2.4;
            playerAvatar.userData.rightArm.rotation.z = 0.3;
          } else {
            playerAvatar.userData.rightArm.rotation.x = -swing;
            playerAvatar.userData.rightArm.rotation.z = 0;
          }
        }
        if (playerAvatar.userData.leftLeg)  playerAvatar.userData.leftLeg.rotation.x = -swing;
        if (playerAvatar.userData.rightLeg) playerAvatar.userData.rightLeg.rotation.x = swing;
        // Avatar toujours au sol (plus de baisse auto près des tables)
        playerAvatar.position.y = 0;

        // === gta-mechanics : SpringArm avec raycast + lerp ===
        // Sauvegarde la position "tête" pour la restaurer après rendu
        const origPos = camera.position.clone();

        // 1) Position désirée : `TPS_DESIRED_DIST` derrière le joueur
        let desiredDist = TPS_DESIRED_DIST;

        // 2) anti-lag-multiplayer : 2D AABB raycast (5-10× plus rapide que
        //    intersectObjects sur scene.children avec 50 remote rigs)
        // Direction normalisée derrière le joueur dans le plan horizontal
        const dirLen = Math.hypot(camDir.x, camDir.z) || 1;
        const rdx = -camDir.x / dirLen;
        const rdz = -camDir.z / dirLen;
        let minDist = Infinity;
        for (let i = 0; i < colliders.length; i++) {
          const d = _slabRayAABB(origPos.x, origPos.z, rdx, rdz, colliders[i]);
          if (d < minDist) minDist = d;
        }
        if (minDist < TPS_DESIRED_DIST + 0.5) {
          desiredDist = Math.max(TPS_MIN_DIST, minDist - TPS_WALL_PAD);
        }

        tpsTargetPos.set(
          origPos.x - camDir.x * desiredDist,
          TPS_HEIGHT,
          origPos.z - camDir.z * desiredDist,
        );

        // 3) Lerp doux vers la cible (snap la 1ère frame pour éviter le pop)
        if (!tpsSmoothInit) {
          tpsSmoothPos.copy(tpsTargetPos);
          tpsSmoothInit = true;
        } else {
          tpsSmoothPos.lerp(tpsTargetPos, TPS_LERP);
        }

        camera.position.copy(tpsSmoothPos);

        // MP : mise à jour des avatars distants avant render
        updateRemoteAvatars();
        renderer.render(scene, camera);
        // Restore pour que la logique de mouvement suivante fonctionne normalement
        camera.position.copy(origPos);
      } else {
        // MP : mise à jour des avatars distants avant render
        updateRemoteAvatars();
        renderer.render(scene, camera);
      }

      // MP : matérialiser les tirs distants en balles visibles
      if (remoteShotsRef.current.length > 0) {
        const shots = remoteShotsRef.current.splice(0);
        shots.forEach(s => {
          // Créer une balle éphémère
          const from = s.from.clone();
          const to = s.to.clone();
          const geom = new THREE.SphereGeometry(0.08, 6, 6);
          const mat = new THREE.MeshBasicMaterial({ color: 0xffee55 });
          const b = new THREE.Mesh(geom, mat);
          b.position.copy(from);
          scene.add(b);
          const startTime = Date.now();
          const duration = 300;
          bulletsRef.current.push({
            mesh: b, startTime, duration,
            startPos: from, endPos: to, weaponType: s.weapon,
          });
        });
      }

      // MP : envoi pos plus rapide (90ms = 11Hz) — anti-lag perceived movement
      if (mpRef.current && nowTime - lastPosSentRef.current > 90 && !document.hidden) {
        const px = camera.position.x, pz = camera.position.z;
        const lp = mpLastSentPosRef.current;
        const dx = px - lp.x, dz = pz - lp.z;
        const moved = (dx * dx + dz * dz) > 0.002; // ~4.5 cm
        const rotChanged = Math.abs(camera.rotation.y - lp.rotY) > 0.02;
        const aged = nowTime - lastPosSentRef.current > 1500;
        if (moved || rotChanged || aged) {
          lp.x = px; lp.z = pz; lp.rotY = camera.rotation.y;
          lastPosSentRef.current = nowTime;
          mpRef.current.sendPos(
            px, camera.position.y, pz,
            camera.rotation.y,
            selectedWeaponRef.current,
            // skinPack a priorité (override hair/outfit/shoes côté remotes)
            { skin: profile?.skin, outfit: profile?.outfit, hair: profile?.hair, shoes: profile?.shoes, skinPack: profile?.equippedSkin }
          );
        }
      }
    };
    animate();

    const onResize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoneLabels = {
    blackjack: { icon: '🃏', name: 'BLACKJACK' },
    roulette: { icon: '🎡', name: 'ROULETTE' },
    highcard: { icon: '🎴', name: 'CARTE HAUTE' },
    poker: { icon: '♠', name: 'POKER HOLDEM' },
    bar: { icon: '🍸', name: 'BAR' },
    toilet: { icon: '🚻', name: 'TOILETTES' },
    atm: { icon: '🏧', name: 'DISTRIBUTEUR' },
    wheel: { icon: '🎡', name: 'ROUE FORTUNE' },
    shop: { icon: '🏎', name: 'GAMBLELIFE STORE' },
    benzbet: { icon: '🎟️', name: 'BENZBET' },
    'arcade-crash': { icon: '🚀', name: 'CRASH — ARCADE' },
    'arcade-mines': { icon: '💎', name: 'MINES — ARCADE' },
    'arcade-dice':  { icon: '🎲', name: 'DICE — ARCADE' },
    'arcade-coin':  { icon: '🪙', name: 'COIN FLIP — ARCADE' },
    exit: { icon: '🚪', name: 'SORTIE — VERS LA RUE' },
  };

  // Gestion tactile des flèches (hold-to-move)
  const setKey = (key, value) => {
    keysRef.current[key] = value;
    // Si la cinématique d'arrivée est en cours, on l'interrompt dès le 1er
    // input mobile pour rendre le contrôle au joueur immédiatement.
    if (value && arrivingRef.current) {
      arrivingRef.current = false;
      setArriving(false);
    }
  };

  // Refs pour le tir
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const allDealersRef = useRef([]);
  const allNpcsRef = useRef([]); // PNJ tuables
  const bulletsRef = useRef([]); // balles en vol
  const casingsRef = useRef([]); // douilles au sol
  const bloodRef = useRef([]); // particules de sang
  const flamesRef = useRef([]); // particules de flammes
  const [slashActive, setSlashActive] = useState(false); // animation slash armes blanches
  const [isAiming, setIsAiming] = useState(false); // visée 1ère personne
  const isAimingRef = useRef(false);
  useEffect(() => { isAimingRef.current = isAiming; }, [isAiming]);

  // Démarrer l'ambiance casino au montage
  useEffect(() => {
    try { sfx.startAmbience(); } catch (_e) { /* noop */ }
    return () => { try { sfx.stopAmbience(); } catch (_e) { /* noop */ } };
  }, []);

  // ===== MULTIJOUEUR : refs partagées =====
  const lastPosSentRef = useRef(0);
  const mpLastSentPosRef = useRef({ x: 0, z: 0, rotY: 0 });
  const selectedWeaponRef = useRef(null);
  useEffect(() => { selectedWeaponRef.current = selectedWeapon; }, [selectedWeapon]);
  // usingHookahRef pour que la boucle d'animation Three.js lise la valeur
  // courante sans dépendre du re-render React.
  const usingHookahRef = useRef(false);
  useEffect(() => { usingHookahRef.current = usingHookah; }, [usingHookah]);
  // Object pool pour les snapshots — on réutilise le MÊME objet et on
  // vide ses clés au lieu d'en créer un nouveau toutes les 120ms.
  const pendingRemoteUpdatesRef = useRef({});
  const _snapshotMapPool = useRef({});
  // Pool de player objects pour décompacter le protocole array sans GC
  const _playerObjPool = useRef([]);
  const _playerObjPoolIdxRef = useRef(0);
  const _getPooledPlayer = () => {
    const idx = _playerObjPoolIdxRef.current++;
    let obj = _playerObjPool.current[idx];
    if (!obj) {
      obj = {};
      _playerObjPool.current[idx] = obj;
    }
    return obj;
  };
  const remoteShotsRef = useRef([]); // tirs distants à animer
  // Pool de Vector3 pré-alloués pour les remote shots (évite 2 allocs/shot)
  const _shotVecPool = useRef({
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
  });

  // Construire un avatar basique pour un joueur distant
  const buildRemoteAvatar = (pdata) => {
    const scene = sceneRefLocal.current;
    if (!scene) return null;
    const group = new THREE.Group();
    // Perf : rig LITE pour remote (10 meshes vs 65 → -85% draw calls)
    // Garde les couleurs skin/outfit/hair/shoes pour reconnaissance visuelle.
    const rig = buildPlayerCharacterLite({
      skin: pdata.skin || '#e0b48a',
      outfit: pdata.outfit ?? 0,
      hair: pdata.hair ?? 0,
      shoes: pdata.shoes ?? 0,
    });
    group.add(rig);
    // Badge pseudo au-dessus (billboard)
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pdata.name || '?', 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    nameSprite.position.y = 2.4;
    nameSprite.scale.set(1.2, 0.3, 1);
    group.add(nameSprite);
    // fix-rendering : ombre de contact sous chaque remote player
    group.add(createContactShadow({ radius: 0.5, opacity: 0.5 }));
    group.position.set(pdata.x || 0, 0, pdata.z || 0);
    group.userData = {
      rig,
      legL: rig.userData?.leftLeg,
      legR: rig.userData?.rightLeg,
      armL: rig.userData?.leftArm,
      armR: rig.userData?.rightArm,
      nameSprite,
      lastPos: new THREE.Vector3(pdata.x, 0, pdata.z),
      // Apparence stockée pour détecter les changements
      skin: pdata.skin, outfit: pdata.outfit, hair: pdata.hair, shoes: pdata.shoes,
    };
    scene.add(group);
    return group;
  };

  // Si l'apparence change (le joueur s'est customisé), rebuild son rig
  const refreshRemoteAppearanceLobby = (entry, pd) => {
    const u = entry.mesh.userData;
    if (u.skin === pd.skin && u.outfit === pd.outfit && u.hair === pd.hair && u.shoes === pd.shoes && u.skinPack === pd.skinPack) return;
    if (u.rig) {
      entry.mesh.remove(u.rig);
      u.rig.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
    }
    const newRig = buildPlayerCharacterLite({
      skinPack: pd.skinPack,
      skin: pd.skin || '#e0b48a',
      outfit: pd.outfit ?? 0,
      hair: pd.hair ?? 0,
      shoes: pd.shoes ?? 0,
    });
    entry.mesh.add(newRig);
    u.rig = newRig;
    u.legL = newRig.userData?.leftLeg;
    u.legR = newRig.userData?.rightLeg;
    u.armL = newRig.userData?.leftArm;
    u.armR = newRig.userData?.rightArm;
    u.skin = pd.skin; u.outfit = pd.outfit; u.hair = pd.hair; u.shoes = pd.shoes;
    u.skinPack = pd.skinPack;
  };

  const removeRemoteAvatar = (id) => {
    const scene = sceneRefLocal.current;
    const entry = remotePlayersRef.current[id];
    if (entry && scene) {
      scene.remove(entry.mesh);
      entry.mesh.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material?.dispose) o.material.dispose();
      });
    }
    delete remotePlayersRef.current[id];
  };

  // === Perf : Vec3 réutilisé + Set réutilisé pour éviter le GC ===
  const _targetVec3 = new THREE.Vector3();
  const _aliveIdsSet = new Set();           // réutilisé chaque frame
  const _lastUpdateTimeRef = useRef(0);
  const updateRemoteAvatars = () => {
    const snap = pendingRemoteUpdatesRef.current;
    if (!snap) return;
    const myId = myIdRef.current;
    const tNow = performance.now();
    // Frame-rate independent lerp : factor = 1 - exp(-rate * dt)
    // rate ≈ 12 → time constant ~85ms (cohérent avec snapshot 120-250ms serveur)
    const dt = Math.min(0.1, (tNow - _lastUpdateTimeRef.current) / 1000);
    _lastUpdateTimeRef.current = tNow;
    // Rate boosté : 18/22 (vs 12/15) → time constant ~55ms, plus réactif
    const posFactor = 1 - Math.exp(-18 * dt);
    const rotFactor = 1 - Math.exp(-22 * dt);

    _aliveIdsSet.clear();
    // for...in itère sans créer d'array (Object.values en crée un)
    for (const id in snap) {
      const pd = snap[id];
      if (!pd || !pd.id) continue;
      _aliveIdsSet.add(pd.id);
      if (pd.id === myId) continue;
      let entry = remotePlayersRef.current[pd.id];
      if (!entry) {
        const mesh = buildRemoteAvatar(pd);
        if (!mesh) continue;
        entry = { mesh, data: pd };
        remotePlayersRef.current[pd.id] = entry;
      }
      entry.data = pd;
      refreshRemoteAppearanceLobby(entry, pd);
      const m = entry.mesh;
      _targetVec3.set(pd.x || 0, 0, pd.z || 0);
      m.position.x += (_targetVec3.x - m.position.x) * posFactor;
      m.position.z += (_targetVec3.z - m.position.z) * posFactor;
      // Rotation : shortest-path lerp (évite spin sur passage ±π)
      let targetRotY = pd.rotY || 0;
      const dRot = targetRotY - m.rotation.y;
      const wrappedDRot = dRot > Math.PI ? dRot - 2 * Math.PI : dRot < -Math.PI ? dRot + 2 * Math.PI : dRot;
      m.rotation.y += wrappedDRot * rotFactor;
      // Anim marche
      const moved = m.userData.lastPos.distanceTo(_targetVec3) > 0.005;
      const swing = moved ? Math.sin(tNow * 0.008) * 0.3 : 0;
      if (m.userData.legL) m.userData.legL.rotation.x = swing;
      if (m.userData.legR) m.userData.legR.rotation.x = -swing;
      if (m.userData.armL) m.userData.armL.rotation.x = -swing * 0.8;
      if (m.userData.armR) m.userData.armR.rotation.x = swing * 0.8;
      m.userData.lastPos.copy(_targetVec3);
      m.visible = (pd.hp || 100) > 0;
    }
    // Cleanup ghosts (iter via for...in pour éviter Object.keys array)
    for (const id in remotePlayersRef.current) {
      if (!_aliveIdsSet.has(id)) removeRemoteAvatar(id);
    }
  };

  // Connexion WebSocket au serveur multijoueur
  useEffect(() => {
    if (!mpOnline) return;
    const username = profile?.name || 'Anon';
    const client = new MPClient({
      serverId: mpServerId,
      username,
      onMessage: (msg) => {
        if (msg.type === 'welcome') {
          myIdRef.current = msg.you?.id;
          Object.keys(remotePlayersRef.current).forEach((id) => removeRemoteAvatar(id));
          // Object pooling : on REUSE la même map au lieu d'en créer une nouvelle
          const pool = _snapshotMapPool.current;
          for (const k in pool) delete pool[k];
          const players = msg.players || [];
          for (let i = 0; i < players.length; i++) pool[players[i].id] = players[i];
          pendingRemoteUpdatesRef.current = pool;
          setOnlinePlayersCount(players.length || 1);
          setChatMessages(msg.chat || []);
        } else if (msg.type === 'snapshot' || msg.t === 's') {
          // anti-lag-multiplayer : décode le format compact array
          // [id, x, y, z, rotY, hp, weapon, skin, outfit, hair, shoes]
          const compact = msg.t === 's';
          const players = compact ? (msg.p || []) : (msg.players || []);
          const pool = _snapshotMapPool.current;
          for (const k in pool) delete pool[k];
          _playerObjPoolIdxRef.current = 0;
          const myId = myIdRef.current;
          let myHp = null;
          for (let i = 0; i < players.length; i++) {
            const src = players[i];
            let p;
            if (compact) {
              p = _getPooledPlayer();
              p.id = src[0]; p.name = src[0];
              p.x = src[1]; p.y = src[2]; p.z = src[3];
              p.rotY = src[4]; p.hp = src[5];
              p.weapon = src[6] || null;
              p.skin = src[7]; p.outfit = src[8]; p.hair = src[9]; p.shoes = src[10];
              p.skinPack = src[11] || null;
            } else {
              p = src;
            }
            pool[p.id] = p;
            if (p.id === myId) myHp = p.hp;
          }
          pendingRemoteUpdatesRef.current = pool;
          setOnlinePlayersCount(players.length || 1);
          if (myHp !== null) setMyHp(myHp);
        } else if (msg.type === 'player_joined') {
          // Pas de set onlineCount manuel — la snapshot fait foi
          setChatMessages((prev) => [...prev, { from: 'SYSTÈME', text: `${msg.player.name} a rejoint.`, ts: Date.now() / 1000 }].slice(-30));
        } else if (msg.type === 'player_left') {
          removeRemoteAvatar(msg.id);
        } else if (msg.type === 'chat') {
          setChatMessages((prev) => [...prev, msg].slice(-30));
        } else if (msg.type === 'shot') {
          // Animer un tir distant
          remoteShotsRef.current.push({
            from: new THREE.Vector3(msg.x, msg.y, msg.z),
            to: new THREE.Vector3(msg.tx, msg.ty, msg.tz),
            weapon: msg.weapon,
            start: performance.now(),
          });
          try { sfx.play(msg.weapon || 'gun'); } catch (_e) { /* noop */ }
        } else if (msg.type === 'kill') {
          setKillFeed((prev) => [...prev, { ...msg, ts: Date.now() }].slice(-5));
          setTimeout(() => setKillFeed((prev) => prev.filter(k => Date.now() - k.ts < 5000)), 5500);
          try { sfx.play('explosion'); } catch (_e) { /* noop */ }
          // Système de vies — si c'est MOI qui meurs, décrémenter
          if (msg.victim === myIdRef.current) {
            setSessionLives((lives) => {
              const next = Math.max(0, lives - 1);
              if (next === 0) setSpectating(true);
              return next;
            });
          }
        } else if (msg.type === 'damage') {
          if (msg.target === myIdRef.current) {
            setMyHp(msg.hp);
          }
        } else if (msg.type === 'respawn') {
          // noop, snapshot suivant mettra à jour
        }
      },
      onOpen: () => {
        setChatMessages((prev) => [...prev, { from: 'SYSTÈME', text: `Connecté au serveur ${mpServerId.toUpperCase()}`, ts: Date.now() / 1000 }].slice(-30));
      },
      onClose: () => {
        // Tenter de rester silencieux, le client gère la reco
      },
    });
    mpRef.current = client;
    client.connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      client.close();
      mpRef.current = null;
      myIdRef.current = null;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const remoteSnap = remotePlayersRef.current;
      Object.keys(remoteSnap).forEach(removeRemoteAvatar);
      pendingRemoteUpdatesRef.current = {};
    };
  }, [mpOnline, mpServerId, profile?.name]);

  // Envoi chat
  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text || !mpRef.current) return;
    mpRef.current.sendChat(text);
    setChatInput('');
    setShowChatInput(false);
  };
  // Ouverture chat avec touche T
  useEffect(() => {
    if (!mpOnline) return;
    const onKey = (e) => {
      if (e.key === 't' || e.key === 'T') {
        if (!showChatInput) {
          e.preventDefault();
          setShowChatInput(true);
          setTimeout(() => chatInputRef.current?.focus(), 50);
        }
      } else if (e.key === 'Escape' && showChatInput) {
        setShowChatInput(false);
        setChatInput('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mpOnline, showChatInput]);

  // Créer une balle qui vole de l'arme vers l'impact
  const createBullet = (fromPos, toPos, weaponType) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Taille de la balle selon le type d'arme
    let bulletGeom, bulletMat;
    if (weaponType === 'rocket') {
      bulletGeom = new THREE.ConeGeometry(0.1, 0.4, 8);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    } else if (weaponType === 'flame') {
      bulletGeom = new THREE.SphereGeometry(0.15, 8, 8);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    } else {
      bulletGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6);
      bulletMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    }
    const bullet = new THREE.Mesh(bulletGeom, bulletMat);
    bullet.position.copy(fromPos);
    
    // Trainée de lumière pour balle
    if (weaponType !== 'flame' && weaponType !== 'rocket') {
      const trail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6),
        new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 })
      );
      bullet.add(trail);
    }
    
    scene.add(bullet);
    
    const startTime = Date.now();
    const duration = weaponType === 'rocket' ? 300 : weaponType === 'flame' ? 200 : 150;
    const startPos = fromPos.clone();
    const endPos = toPos.clone();
    
    // Orienter la balle vers la cible
    bullet.lookAt(endPos);
    bullet.rotateX(Math.PI / 2);
    
    bulletsRef.current.push({ mesh: bullet, startTime, duration, startPos, endPos, weaponType });
  };

  // Projectile lancé (couteau, grenade) — suit une trajectoire en arc
  const createThrowable = (fromPos, toPos, kind) => {
    const scene = sceneRef.current;
    if (!scene) return;
    let mesh;
    if (kind === 'grenade') {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a3a20, metalness: 0.5, roughness: 0.55 })
      );
      // Goupille
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.04, 6),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 })
      );
      pin.position.y = 0.09;
      mesh.add(pin);
    } else if (kind === 'bolt') {
      mesh = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a2a10 })
      );
      shaft.rotation.z = Math.PI / 2;
      mesh.add(shaft);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.9 })
      );
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.2;
      mesh.add(tip);
    } else {
      // Couteau de lancer: lame + manche
      mesh = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.04, 0.01),
        new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.95, roughness: 0.08 })
      );
      mesh.add(blade);
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.03, 0.025),
        new THREE.MeshStandardMaterial({ color: 0x1a0a00 })
      );
      handle.position.x = -0.18;
      mesh.add(handle);
    }
    mesh.position.copy(fromPos);
    scene.add(mesh);
    const startTime = Date.now();
    const duration = 500;
    const startPos = fromPos.clone();
    const endPos = toPos.clone();
    bulletsRef.current.push({
      mesh, startTime, duration, startPos, endPos, weaponType: 'throwable', kind,
      onUpdate: (m, t) => {
        m.position.lerpVectors(startPos, endPos, t);
        m.position.y += Math.sin(t * Math.PI) * 0.6;
        m.rotation.y += 0.6;
        m.rotation.z += 0.3;
      },
    });
  };

  // Explosion : sphère lumineuse + onde de choc
  const createExplosion = (pos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    // Throttle : si une explosion est créée < 80 ms après la dernière, on skip
    const now = Date.now();
    if (createExplosion._lastAt && (now - createExplosion._lastAt) < 80) return;
    createExplosion._lastAt = now;
    try { sfx.play('explosion'); } catch (_e) { /* noop */ }

    const group = new THREE.Group();
    group.position.copy(pos);

    // ===== Flash initial (blanc-jaune, courte durée) =====
    const flashGeo = new THREE.SphereGeometry(0.35, 12, 10);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffd0, transparent: true, opacity: 1 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    group.add(flash);

    // ===== Boule de feu principale =====
    const fireGeo = new THREE.SphereGeometry(0.55, 14, 12);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.95 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    group.add(fire);

    // ===== Onde de choc au sol =====
    const shockGeo = new THREE.RingGeometry(0.5, 0.85, 28);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.rotation.x = -Math.PI / 2;
    shock.position.y = -0.95;
    group.add(shock);

    // ===== 8 nuages de fumée gris qui montent =====
    const smokeMeshes = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const r = 0.4 + Math.random() * 0.4;
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.45 + Math.random() * 0.3, 10, 8),
        new THREE.MeshBasicMaterial({
          color: 0x6a6a6c, transparent: true, opacity: 0,
        }),
      );
      smoke.position.set(
        Math.cos(angle) * r,
        0.2 + Math.random() * 0.3,
        Math.sin(angle) * r,
      );
      smoke.userData.driftX = Math.cos(angle) * (0.6 + Math.random() * 0.6);
      smoke.userData.driftZ = Math.sin(angle) * (0.6 + Math.random() * 0.6);
      smoke.userData.driftY = 0.8 + Math.random() * 0.8;
      smoke.userData.delay = i * 0.04;
      group.add(smoke);
      smokeMeshes.push(smoke);
    }

    // ===== 16 fragments de debris (petits cubes/billes orangés) qui volent =====
    const debrisMeshes = [];
    for (let i = 0; i < 16; i++) {
      const debris = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? 0xffd860 : (i % 3 === 1 ? 0xff7a2a : 0x9a5a30),
        }),
      );
      const ang = (i / 16) * Math.PI * 2;
      const elev = 0.3 + Math.random() * 1.0;
      const speed = 2.5 + Math.random() * 3.5;
      debris.userData.velX = Math.cos(ang) * speed;
      debris.userData.velY = elev * 3.5;
      debris.userData.velZ = Math.sin(ang) * speed;
      debris.userData.rotSpeed = (Math.random() - 0.5) * 0.4;
      group.add(debris);
      debrisMeshes.push(debris);
    }

    // ===== Lumière ponctuelle intense =====
    const light = new THREE.PointLight(0xff8833, 3, 10);
    group.add(light);

    scene.add(group);

    // ===== Camera shake si la caméra est proche (≤ 8 m) =====
    const cam = cameraRef.current;
    if (cam) {
      const distToCam = cam.position.distanceTo(pos);
      if (distToCam <= 8) {
        const intensity = (1 - distToCam / 8) * 0.18;
        const shakeStart = Date.now();
        const shakeDuration = 350;
        const camOrigQuat = cam.quaternion.clone();
        const doShake = () => {
          const el = Date.now() - shakeStart;
          const t = Math.min(el / shakeDuration, 1);
          if (t < 1) {
            const decay = 1 - t;
            cam.quaternion.copy(camOrigQuat);
            cam.rotateZ((Math.random() - 0.5) * intensity * decay);
            cam.rotateX((Math.random() - 0.5) * intensity * decay * 0.5);
            requestAnimationFrame(doShake);
          } else {
            cam.quaternion.copy(camOrigQuat);
          }
        };
        doShake();
      }
    }

    const start = Date.now();
    const duration = 1200; // 700 → 1200 ms pour laisser la fumée vivre
    let cancelled = false;
    const cleanup = () => {
      if (cancelled) return;
      cancelled = true;
      scene.remove(group);
      group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        }
      });
    };
    const anim = () => {
      if (cancelled) return;
      const el = Date.now() - start;
      const t = Math.min(el / duration, 1);
      const dt = 0.016;

      // Flash : courte vie (~0.25 s)
      const flashT = Math.min(t * 4, 1);
      flash.scale.setScalar(1 + flashT * 5);
      flashMat.opacity = Math.max(0, 1 - flashT * 1.8);

      // Boule de feu : grandit + fade
      const fireT = Math.min(t * 1.8, 1);
      fire.scale.setScalar(1 + fireT * 7);
      fireMat.opacity = Math.max(0, 0.95 - fireT * 1.2);

      // Onde de choc : s'étend rapidement
      shock.scale.setScalar(1 + t * 7);
      shockMat.opacity = Math.max(0, 0.85 - t * 1.0);

      // Fumée : monte et grossit
      for (let i = 0; i < smokeMeshes.length; i++) {
        const s = smokeMeshes[i];
        const ud = s.userData;
        const localT = Math.max(0, t - ud.delay);
        s.position.x += ud.driftX * dt;
        s.position.z += ud.driftZ * dt;
        s.position.y += ud.driftY * dt;
        s.scale.setScalar(1 + localT * 3);
        s.material.opacity = Math.max(0, localT < 0.2 ? localT * 3 : 0.7 - (localT - 0.2) * 0.85);
      }

      // Debris : trajectoire balistique
      for (const d of debrisMeshes) {
        const ud = d.userData;
        d.position.x += ud.velX * dt;
        d.position.y += ud.velY * dt;
        d.position.z += ud.velZ * dt;
        ud.velY -= 9.8 * dt;
        d.rotation.x += ud.rotSpeed;
        d.rotation.z += ud.rotSpeed * 0.7;
        if (d.position.y < -1) d.position.y = -1;
        d.material.opacity = Math.max(0, 1 - t * 1.5);
        d.material.transparent = true;
      }

      // Lumière : décroissance
      light.intensity = Math.max(0, 5 * (1 - t * 1.2));

      if (t < 1) requestAnimationFrame(anim);
      else cleanup();
    };
    anim();
    setTimeout(cleanup, duration + 500);
  };

  // Rayon laser instantané
  const createLaserBeam = (fromPos, toPos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const dir = new THREE.Vector3().subVectors(toPos, fromPos);
    const length = dir.length();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, length, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0033, transparent: true, opacity: 0.95 })
    );
    const mid = fromPos.clone().add(toPos).multiplyScalar(0.5);
    beam.position.copy(mid);
    beam.lookAt(toPos);
    beam.rotateX(Math.PI / 2);
    scene.add(beam);
    const start = Date.now();
    const duration = 250;
    const anim = () => {
      const el = Date.now() - start;
      const t = Math.min(el / duration, 1);
      beam.material.opacity = 0.95 * (1 - t);
      beam.scale.x = beam.scale.z = 1 + t * 1.5;
      if (t < 1) requestAnimationFrame(anim);
      else scene.remove(beam);
    };
    anim();
  };

  
  // Créer une douille qui reste 20s
  const createCasing = (pos, weaponType) => {
    if (weaponType === 'rocket' || weaponType === 'flame' || weaponType === 'melee') return;
    const scene = sceneRef.current;
    if (!scene) return;
    
    const casingGroup = new THREE.Group();
    // Cylindre doré (douille)
    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.05, 6),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 })
    );
    casingGroup.add(casing);
    
    casingGroup.position.copy(pos);
    casingGroup.position.y = 0.02; // au sol
    casingGroup.rotation.z = Math.PI / 2; // couché
    casingGroup.rotation.y = Math.random() * Math.PI * 2;
    
    scene.add(casingGroup);
    
    const createdAt = Date.now();
    casingsRef.current.push({ mesh: casingGroup, createdAt, scene });
    
    // Retirer après 20s
    setTimeout(() => {
      scene.remove(casingGroup);
      casingsRef.current = casingsRef.current.filter(c => c.mesh !== casingGroup);
    }, 20000);
  };
  
  // Créer particules de sang qui giclent
  const createBloodSplash = (pos) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const bloodGroup = new THREE.Group();
    bloodGroup.position.copy(pos);
    scene.add(bloodGroup);
    
    // 8 gouttes (réduit de 15 pour alléger GPU pendant les AoE)
    const drops = [];
    const geos = [];
    const mats = [];
    for (let i = 0; i < 8; i++) {
      const g = new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 5, 4);
      const m = new THREE.MeshStandardMaterial({ 
        color: 0x8b0000, 
        emissive: 0x4a0000,
        emissiveIntensity: 0.3,
      });
      const drop = new THREE.Mesh(g, m);
      geos.push(g); mats.push(m);
      const vx = (Math.random() - 0.5) * 4;
      const vy = 2 + Math.random() * 3;
      const vz = (Math.random() - 0.5) * 4;
      bloodGroup.add(drop);
      drops.push({ mesh: drop, vx, vy, vz, landed: false });
    }
    
    const startTime = Date.now();
    bloodRef.current.push({ group: bloodGroup, drops, startTime, duration: 1500 });
    
    // Retirer après 5s et disposer les ressources GPU
    setTimeout(() => {
      scene.remove(bloodGroup);
      bloodRef.current = bloodRef.current.filter(b => b.group !== bloodGroup);
      geos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
    }, 5000);
  };

  // Tir avec effets visuels complets
  const doShoot = () => {
    if (!selectedWeapon) return;
    // Do not block on `shooting` state while in auto-fire mode
    onShoot && onShoot();
    // Son de l'arme
    try { sfx.play(selectedWeapon); } catch (_e) { /* noop */ }
    
    const camera = cameraRef.current;
    const dealers = allDealersRef.current;
    const npcs = allNpcsRef.current || [];
    const targets = [...dealers, ...npcs]; // tout ce qui est tuable
    
    if (!camera) { return; }
    
    const weaponDef = WEAPONS.find(w => w.id === selectedWeapon);
    const weaponType = weaponDef?.type || 'gun';
    
    const cameraPos = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    // ====== MP : détection PvP & broadcast ======
    if (mpRef.current) {
      const tip = cameraPos.clone().add(cameraDir.clone().multiplyScalar(30));
      mpRef.current.sendShot(cameraPos.x, cameraPos.y, cameraPos.z, tip.x, tip.y, tip.z, selectedWeapon);
      // Hit sur joueur distant : cône 30m, dot > 0.995 (précision au laser) sauf bazooka
      const isAoe = weaponType === 'rocket' || selectedWeapon === 'grenade';
      const dmg = weaponType === 'melee' ? 50 : weaponType === 'rocket' ? 100 : weaponType === 'laser' ? 60 : 25;
      Object.values(remotePlayersRef.current).forEach((entry) => {
        const pd = entry.data;
        if (!pd || pd.hp <= 0) return;
        const rp = new THREE.Vector3(pd.x, pd.y || 1.5, pd.z);
        const toT = new THREE.Vector3().subVectors(rp, cameraPos);
        const dist = toT.length();
        if (dist > 30) return;
        toT.normalize();
        const dotDir = cameraDir.dot(toT);
        const accept = weaponType === 'melee' ? (dist < 3 && dotDir > 0.5)
                     : isAoe ? dotDir > 0.88
                     : dotDir > 0.98;
        if (accept) {
          mpRef.current.sendHit(pd.id, selectedWeapon, dmg);
        }
      });
    }
    
    // ====== ARMES BLANCHES (couteau, machette) ======
    if (weaponType === 'melee') {
      setSlashActive(true);
      setTimeout(() => setSlashActive(false), 1000);
      
      // Trouver cible proche (3m)
      let hitTarget = null;
      let bestDist = 3;
      for (const t of targets) {
        if (t.userData.dead) continue;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > bestDist) continue;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.4) {
          hitTarget = t;
          bestDist = distance;
        }
      }
      
      if (hitTarget) {
        setTimeout(() => {
          const bp = new THREE.Vector3();
          hitTarget.getWorldPosition(bp);
          bp.y += 1.6;
          createBloodSplash(bp);
          if (!hitTarget.userData.dead) killTarget(hitTarget);
        }, 400);
      }
      
      setTimeout(() => setSlashActive(false), 700);
      return;
    }
    
    // ====== LANCE-FLAMMES ======
    if (weaponType === 'flame') {
      // Créer des flammes qui jaillissent pendant 2s
      createFlameStream(cameraPos, cameraDir, camera);
      
      // Touche tous les ennemis dans un cône de 3m
      targets.forEach(t => {
        if (t.userData.dead) return;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > 3.5) return;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.5) { // cône large
          setTimeout(() => {
            const bp = new THREE.Vector3();
            t.getWorldPosition(bp);
            bp.y += 1.6;
            createBloodSplash(bp);
            if (!t.userData.dead) killTarget(t);
          }, 500);
        }
      });
      
      // flame duration handled by flameStream lifecycle
      return;
    }

    // ====== ARMES LANCÉES (couteaux de lancer, grenades) ======
    if (weaponType === 'throwable') {
      const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
      const throwStart = cameraPos.clone()
        .add(cameraDir.clone().multiplyScalar(0.5))
        .add(right.clone().multiplyScalar(0.25))
        .add(new THREE.Vector3(0, -0.2, 0));

      // Lancer direct, cherche cible dans cône 15m
      let hitTarget = null;
      let bestDist = 15;
      for (const t of targets) {
        if (t.userData.dead) continue;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const distance = cameraPos.distanceTo(tp);
        if (distance > bestDist) continue;
        const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
        const dot = cameraDir.dot(toT);
        if (dot > 0.7) {
          hitTarget = t;
          bestDist = distance;
        }
      }
      const endPos = hitTarget
        ? hitTarget.getWorldPosition(new THREE.Vector3()).setY((hitTarget.getWorldPosition(new THREE.Vector3()).y) + 1.5)
        : cameraPos.clone().add(cameraDir.clone().multiplyScalar(12));

      createThrowable(throwStart, endPos, weaponDef?.projectile || 'blade');

      const flightTime = 500;
      if (weaponDef?.projectile === 'grenade') {
        // Grenade: explosion à l'impact avec AoE 3m
        setTimeout(() => {
          createExplosion(endPos);
          targets.forEach(t => {
            if (t.userData.dead) return;
            const tp = new THREE.Vector3();
            t.getWorldPosition(tp);
            const distToBlast = tp.distanceTo(endPos);
            if (distToBlast <= 3) {
              const bp = tp.clone(); bp.y += 1.6;
              createBloodSplash(bp);
              killTarget(t);
            }
          });
        }, flightTime);
      } else {
        // Couteau/carreau : dégât simple à l'impact
        if (hitTarget) {
          setTimeout(() => {
            if (!hitTarget.userData.dead) {
              const bp = new THREE.Vector3();
              hitTarget.getWorldPosition(bp);
              bp.y += 1.6;
              createBloodSplash(bp);
              killTarget(hitTarget);
            }
          }, flightTime);
        }
      }
      return;
    }

    // ====== LASER (fusil laser - rayon instantané) ======
    if (weaponType === 'laser') {
      const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
      const laserStart = cameraPos.clone()
        .add(cameraDir.clone().multiplyScalar(0.5))
        .add(right.clone().multiplyScalar(0.3))
        .add(new THREE.Vector3(0, -0.3, 0));
      const laserEnd = cameraPos.clone().add(cameraDir.clone().multiplyScalar(40));
      createLaserBeam(laserStart, laserEnd);
      // Traverse tout : kills TOUS les ennemis dans un cylindre fin de 40m
      targets.forEach(t => {
        if (t.userData.dead) return;
        const tp = new THREE.Vector3();
        t.getWorldPosition(tp);
        const toT = new THREE.Vector3().subVectors(tp, cameraPos);
        const along = toT.dot(cameraDir);
        if (along < 0 || along > 40) return;
        const proj = cameraPos.clone().add(cameraDir.clone().multiplyScalar(along));
        if (proj.distanceTo(tp) < 0.9) {
          const bp = tp.clone(); bp.y += 1.6;
          createBloodSplash(bp);
          killTarget(t);
        }
      });
      return;
    }
    
    // ====== ARMES À FEU (pistolet, fusil, bazooka) ======
    const right = new THREE.Vector3().crossVectors(cameraDir, camera.up).normalize();
    const gunPos = cameraPos.clone()
      .add(cameraDir.clone().multiplyScalar(0.5))
      .add(right.clone().multiplyScalar(0.3))
      .add(new THREE.Vector3(0, -0.3, 0));
    
    let targetPos = null;
    let hitTarget = null;
    
    for (const t of targets) {
      if (t.userData.dead) continue;
      const tp = new THREE.Vector3();
      t.getWorldPosition(tp);
      
      const distance = cameraPos.distanceTo(tp);
      if (distance > 25) continue;
      
      const toT = new THREE.Vector3().subVectors(tp, cameraPos).normalize();
      const dot = cameraDir.dot(toT);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      
      const toleranceBase = isAiming ? 0.08 : 0.2;
      const tolerance = Math.max(toleranceBase, 1.0 / distance);
      if (angle < tolerance) {
        targetPos = tp.clone();
        targetPos.y += 1.7;
        hitTarget = t;
        break;
      }
    }
    
    if (!targetPos) {
      targetPos = cameraPos.clone().add(cameraDir.clone().multiplyScalar(15));
    }
    
    createBullet(gunPos, targetPos, weaponType);
    
    // Éjecter douille
    setTimeout(() => {
      const casingPos = cameraPos.clone()
        .add(right.clone().multiplyScalar(0.5));
      casingPos.y = 0.05;
      createCasing(casingPos, weaponType);
    }, 100);
    
    if (hitTarget) {
      const flightTime = weaponType === 'rocket' ? 300 : 150;
      setTimeout(() => {
        if (weaponType === 'rocket') {
          // Bazooka: explosion au point d'impact, AoE 3m
          const blastCenter = targetPos.clone();
          createExplosion(blastCenter);
          targets.forEach(t => {
            if (t.userData.dead) return;
            const tp = new THREE.Vector3();
            t.getWorldPosition(tp);
            const distToBlast = tp.distanceTo(blastCenter);
            if (distToBlast <= 3) {
              const bp = tp.clone(); bp.y += 1.6;
              createBloodSplash(bp);
              killTarget(t);
            }
          });
        } else {
          if (!hitTarget.userData.dead) {
            const bloodPos = new THREE.Vector3();
            hitTarget.getWorldPosition(bloodPos);
            bloodPos.y += 1.6;
            createBloodSplash(bloodPos);
            killTarget(hitTarget);
          }
        }
      }, flightTime);
    } else if (weaponType === 'rocket') {
      // Tir de bazooka sans cible touchée : quand même explosion au bout de la trajectoire
      setTimeout(() => {
        const blastCenter = targetPos.clone();
        createExplosion(blastCenter);
        targets.forEach(t => {
          if (t.userData.dead) return;
          const tp = new THREE.Vector3();
          t.getWorldPosition(tp);
          if (tp.distanceTo(blastCenter) <= 3) {
            const bp = tp.clone(); bp.y += 1.6;
            createBloodSplash(bp);
            killTarget(t);
          }
        });
      }, 300);
    }
    
    // shooting state controlled by fire button press/release
  };
  
  // Créer un flux de flammes devant le joueur (lance-flammes)
  const createFlameStream = (origin, direction, camera) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const flameGroup = new THREE.Group();
    const flameCount = 30;
    const startTime = Date.now();
    const duration = 2000;
    
    const particles = [];
    for (let i = 0; i < flameCount; i++) {
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: Math.random() < 0.5 ? 0xff4400 : 0xffaa00,
          transparent: true,
          opacity: 0.8,
        })
      );
      flameGroup.add(flame);
      particles.push({
        mesh: flame,
        startDelay: (i / flameCount) * 500,
        offsetX: (Math.random() - 0.5) * 0.3,
        offsetY: (Math.random() - 0.5) * 0.3,
        life: 800 + Math.random() * 400,
      });
    }
    
    scene.add(flameGroup);
    flamesRef.current.push({
      group: flameGroup,
      particles,
      startTime,
      duration,
      origin: origin.clone(),
      direction: direction.clone(),
      camera,
    });
    
    // Retirer après durée + life max
    setTimeout(() => {
      scene.remove(flameGroup);
      flamesRef.current = flamesRef.current.filter(f => f.group !== flameGroup);
    }, duration + 1500);
  };
  
  const killTarget = (target) => {
    target.userData.dead = true;
    const originalRotation = target.rotation.z;
    const originalPosY = target.position.y;
    
    const startTime = Date.now();
    const fallDuration = 600;
    const fallAnim = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / fallDuration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      target.rotation.z = originalRotation + (Math.PI / 2) * eased;
      target.position.y = originalPosY - 0.8 * eased;
      if (t < 1) requestAnimationFrame(fallAnim);
    };
    fallAnim();
    
    setTimeout(() => {
      const respawnStart = Date.now();
      const respawnDuration = 500;
      const respawnAnim = () => {
        const elapsed = Date.now() - respawnStart;
        const t = Math.min(elapsed / respawnDuration, 1);
        target.rotation.z = originalRotation + (Math.PI / 2) * (1 - t);
        target.position.y = originalPosY - 0.8 * (1 - t);
        if (t < 1) requestAnimationFrame(respawnAnim);
        else {
          target.rotation.z = originalRotation;
          target.position.y = originalPosY;
          target.userData.dead = false;
        }
      };
      respawnAnim();
    }, 10000);
  };


  const nextTrophy = TROPHIES.find(t => t.threshold > (profile?.totalWinnings || 0));
  const earned = TROPHIES.filter(t => (profile?.totalWinnings || 0) >= t.threshold);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', touchAction: 'none' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* === ANIMATION D'ARRIVÉE — overlay 3 s === */}
      {arriving && (
        <div
          data-testid="casino-arrival-overlay"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            zIndex: 9999, overflow: 'hidden',
          }}
        >
          {/* Flash radial blanc → transparent (0–0.7s) */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0) 70%)',
            animation: 'gl-arrival-flash 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }} />

          {/* Vignette douce qui pulse (0–3s) — ramène l'œil au centre */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
            animation: 'gl-arrival-vignette 3s ease-out forwards',
          }} />

          {/* Carte d'identité du casino : drapeau + nom + tagline */}
          <div
            style={{
              position: 'absolute', top: '38%', left: '50%',
              transform: 'translate(-50%,-50%)',
              textAlign: 'center', color: '#fff',
              animation: 'gl-arrival-card 3s ease-out forwards',
              willChange: 'transform, opacity, filter',
            }}
          >
            <div style={{
              fontSize: 12, letterSpacing: 8, fontWeight: 600,
              color: casino?.primary || '#d4af37', opacity: 0.9, marginBottom: 14,
              textTransform: 'uppercase', textShadow: '0 0 20px rgba(0,0,0,0.6)',
            }}>
              Bienvenue à
            </div>
            <div style={{ fontSize: 84, lineHeight: 1, marginBottom: 12 }}>
              {casino?.country || '🎰'}
            </div>
            <div style={{
              fontSize: 56, fontWeight: 900, letterSpacing: 4,
              fontFamily: 'Georgia, "Playfair Display", serif',
              color: '#fff',
              textShadow: `0 0 28px rgba(255,255,255,0.85), 0 0 64px ${casino?.primary || '#3fe6ff'}, 0 4px 12px rgba(0,0,0,0.6)`,
            }}>
              {(casino?.name || 'CASINO').toUpperCase()}
            </div>
            {casino?.tagline && (
              <div style={{
                marginTop: 12, fontSize: 14, letterSpacing: 3,
                color: 'rgba(255,255,255,0.85)', fontStyle: 'italic',
                textShadow: '0 2px 8px rgba(0,0,0,0.7)',
              }}>
                « {casino.tagline} »
              </div>
            )}
          </div>

          {/* Barre de progression discrète en bas pour signaler la durée */}
          <div style={{
            position: 'absolute', bottom: 32, left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(280px, 50vw)', height: 2,
            background: 'rgba(255,255,255,0.15)', borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: `linear-gradient(90deg, ${casino?.primary || '#d4af37'}, ${casino?.accent || '#fff'})`,
              transformOrigin: 'left center',
              animation: 'gl-arrival-progress 3s linear forwards',
            }} />
          </div>

          <style>{`
            @keyframes gl-arrival-flash {
              0%   { opacity: 1; }
              100% { opacity: 0; }
            }
            @keyframes gl-arrival-vignette {
              0%   { opacity: 0; }
              25%  { opacity: 1; }
              80%  { opacity: 0.6; }
              100% { opacity: 0; }
            }
            @keyframes gl-arrival-card {
              0%   { transform: translate(-50%,-45%) scale(0.85); opacity: 0; filter: blur(14px); }
              22%  { transform: translate(-50%,-50%) scale(1.04); opacity: 1; filter: blur(0); }
              35%  { transform: translate(-50%,-50%) scale(1.0);  opacity: 1; }
              82%  { transform: translate(-50%,-50%) scale(1.0);  opacity: 1; }
              100% { transform: translate(-50%,-58%) scale(1.02); opacity: 0; filter: blur(2px); }
            }
            @keyframes gl-arrival-progress {
              0%   { transform: scaleX(0); }
              100% { transform: scaleX(1); }
            }
          `}</style>
        </div>
      )}

      {/* === MENU UNIVERSEL — seul menu du casino, accessible partout === */}
      <UniversalMenu
        profile={profile}
        balance={balance}
        deviceType={deviceType}
        onOpenTrophies={onOpenTrophies}
        onOpenQuests={onOpenQuests}
        onOpenShop={onOpenShop}
        onChangeDevice={() => { /* TODO bring back to deviceSelect */ }}
        position="top-right"
        extraItems={[
          { testId: 'menu-profile', icon: '🪪', label: 'Mon profil & bannière', onClick: () => onOpenProfile && onOpenProfile() },
          { testId: 'menu-leaderboard', icon: '🏆', label: 'Classement mondial', onClick: () => onOpenLeaderboard && onOpenLeaderboard() },
          { testId: 'menu-battlepass', icon: '⚔️', label: 'Battle Pass — Saison 1', onClick: () => onOpenBattlePass && onOpenBattlePass(), accent: '#ffd700' },
          { testId: 'menu-crash', icon: '🚀', label: 'Crash — mini-jeu', onClick: () => onOpenCrash && onOpenCrash(), accent: '#3fe6ff' },
          { testId: 'menu-character', icon: '👤', label: 'Personnaliser le personnage', onClick: () => onOpenCharacter && onOpenCharacter() },
          { testId: 'menu-controls', icon: '⌨️', label: 'Touches & contrôles', onClick: () => onOpenControls && onOpenControls() },
          { testId: 'menu-change-casino', icon: '🌍', label: 'Changer de casino', onClick: () => onChangeCasino && onChangeCasino() },
          { testId: 'menu-replay-tutorial', icon: '❔', label: 'Revoir le tutoriel', onClick: () => onReplayTutorial && onReplayTutorial(), accent: '#3fe6ff' },
          { testId: 'menu-exit-casino', icon: '🚪', label: 'Sortir du casino', onClick: () => onExitCasino && onExitCasino(), accent: '#ffd700' },
          { testId: 'menu-logout', icon: '⏻', label: 'Déconnexion', onClick: () => onLogout && onLogout(), accent: '#ff6666' },
        ]}
      />

      {/* HUD Haut */}
      <div className="hud-control" style={{
        position: 'absolute', top: 10, left: 10, right: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        pointerEvents: 'none', fontFamily: 'Georgia, serif', zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          border: `1px solid ${casino.primary}`,
          borderRadius: 8, padding: 8,
          color: '#fff', pointerEvents: 'auto', fontSize: 12,
        }}>
          <div style={{ color: '#cca366', fontSize: 10 }}>{profile.name} • {casino.country}</div>
          <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 'bold' }}>{fmt(balance)} $</div>
          {/* VIP badge: n skins luxe équipés → bonus de style */}
          {(() => {
            const H = HAIR_CATALOG[profile.hair ?? 0];
            const O = OUTFIT_CATALOG[profile.outfit ?? 0];
            const S = SHOES_CATALOG[profile.shoes ?? 0];
            const luxuryCount = (H && H.price >= 500000 ? 1 : 0) + (O && O.price >= 500000 ? 1 : 0) + (S && S.price >= 500000 ? 1 : 0);
            if (luxuryCount < 2) return null;
            const mul = luxuryCount >= 4 ? 1.75 : luxuryCount >= 3 ? 1.5 : 1.25;
            return (
              <div data-testid="vip-badge" style={{
                marginTop: 6, padding: '3px 8px',
                borderRadius: 14,
                background: luxuryCount >= 3 ? 'linear-gradient(90deg, #ffd700, #ff00cc)' : 'rgba(212,175,55,.25)',
                color: luxuryCount >= 3 ? '#000' : '#ffd700',
                fontSize: 10, fontWeight: 800, letterSpacing: 1,
                display: 'inline-block',
              }}>
                {luxuryCount >= 3 ? '⭐ VIP' : '✨ STYLE'} ×{mul}
              </div>
            );
          })()}
        </div>
        {/* Bouton MENU custom retiré : on utilise UniversalMenu (≡ MENU en haut à droite) */}
      </div>

      {/* CONTRÔLES MOBILE/HUD - Flèches en bas à gauche */}
      <div className="hud-control" style={{
        position: 'absolute', bottom: 20, left: 20,
        display: 'grid',
        gridTemplateColumns: '50px 50px 50px',
        gridTemplateRows: '50px 50px 50px',
        gap: 4, zIndex: 20, pointerEvents: 'auto',
      }}>
        <div />
        <ArrowButton dir="↑" onPress={(v) => setKey('forward', v)} />
        <div />
        <ArrowButton dir="←" onPress={(v) => setKey('left', v)} />
        <div />
        <ArrowButton dir="→" onPress={(v) => setKey('right', v)} />
        <div />
        <ArrowButton dir="↓" onPress={(v) => setKey('backward', v)} />
        <div />
      </div>

      {/* BOUTONS ACTION - Inventaire + Tir */}
      <div className="hud-control" style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 20, pointerEvents: 'auto',
      }}>
        {/* Bouton basculer vue 1ère / 3ème personne (au-dessus de l'inventaire) */}
        <button
          onClick={() => setViewMode(v => v === 'first' ? 'third' : 'first')}
          data-testid="view-toggle-btn"
          style={{
            width: 60, height: 44, borderRadius: 22,
            background: 'rgba(0,0,0,0.75)',
            border: `2px solid ${casino.secondary}`,
            color: casino.secondary,
            fontSize: 11, fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
          }}>
          {viewMode === 'first' ? '👁️ 1P' : '🧍 3P'}
        </button>
        {/* Bouton Monter / Descendre du véhicule (visible si possédé) */}
        {profile && (profile.vehicles || []).length > 0 && (
          <button
            onClick={() => {
              const owned = profile.vehicles || [];
              const current = profile.equippedVehicle;
              if (!current) { onToggleVehicle && onToggleVehicle(owned[0]); return; }
              const idx = owned.indexOf(current);
              const next = idx >= owned.length - 1 ? null : owned[idx + 1];
              onToggleVehicle && onToggleVehicle(next);
            }}
            data-testid="vehicle-toggle-btn"
            title={profile.equippedVehicle ? `Descendre / changer (${profile.equippedVehicle})` : 'Monter sur un véhicule'}
            style={{
              width: 60, height: 44, borderRadius: 22,
              background: profile.equippedVehicle
                ? `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`
                : 'rgba(0,0,0,0.75)',
              border: `2px solid ${casino.secondary}`,
              color: '#fff', fontSize: 20, cursor: 'pointer',
              boxShadow: profile.equippedVehicle ? '0 0 12px rgba(212,175,55,.4)' : '0 4px 10px rgba(0,0,0,0.6)',
            }}>
            {profile.equippedVehicle === 'skateboard' ? '🛹'
              : profile.equippedVehicle === 'bike' ? '🚴'
              : '🚶'}
          </button>
        )}
        <button onClick={() => setShowInventory(true)} style={{
          width: 60, height: 60, borderRadius: '50%',
          background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
          border: `2px solid ${casino.secondary}`,
          color: '#fff', fontSize: 28, cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
        }}>🎒</button>
        {selectedWeapon && (
          <button onClick={() => setIsAiming(a => !a)} style={{
            width: 60, height: 60, borderRadius: '50%',
            background: isAiming 
              ? 'radial-gradient(circle, #ffd700, #8b6914)'
              : 'rgba(0,0,0,0.7)',
            border: `2px solid ${isAiming ? '#fff' : '#ffd700'}`,
            color: isAiming ? '#000' : '#ffd700',
            fontSize: 11, fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: isAiming ? '0 0 20px #ffd700' : '0 4px 10px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 22 }}>🎯</div>
            <div style={{ fontSize: 8 }}>{isAiming ? 'VISE' : 'VISER'}</div>
          </button>
        )}
        {/* Bouton chicha retiré : utilisation via inventaire (parité armes) */}
        <button
          data-testid="lobby-fire-btn"
          onPointerDown={(e) => {
            e.preventDefault();
            if (!selectedWeapon) return;
            firingRef.current = true;
            setShooting(true);
            // Auto-fire loop
            const weaponDef = WEAPONS.find(w => w.id === selectedWeapon);
            const rpm = weaponDef?.type === 'gun' ? (selectedWeapon === 'shotgun' ? 90 : 300)
                      : weaponDef?.type === 'rocket' ? 40
                      : weaponDef?.type === 'flame' ? 600
                      : 180;
            const interval = Math.max(60, Math.floor(60000 / rpm));
            const fireOnce = () => {
              if (!firingRef.current) return;
              doShoot();
              // Spawn a visible bullet overlay (only while firing)
              const id = Date.now() + Math.random();
              setMuzzleKey(k => k + 1);
              setVisibleBullets(bs => [...bs, { id, startTime: Date.now() }]);
              setTimeout(() => setVisibleBullets(bs => bs.filter(b => b.id !== id)), 500);
            };
            fireOnce();
            const t = setInterval(fireOnce, interval);
            // Store interval on ref so we can clear
            firingRef.currentInterval = t;
          }}
          onPointerUp={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          onPointerLeave={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          onPointerCancel={() => {
            firingRef.current = false;
            if (firingRef.currentInterval) clearInterval(firingRef.currentInterval);
            firingRef.currentInterval = null;
            setShooting(false);
          }}
          disabled={!selectedWeapon}
          style={{
            width: 70, height: 70, borderRadius: '50%',
            background: selectedWeapon
              ? `radial-gradient(circle, #ff4444, #8b0000)`
              : '#555',
            border: '3px solid #ffd700',
            color: '#fff', fontSize: 14, fontWeight: 'bold',
            cursor: selectedWeapon ? 'pointer' : 'not-allowed',
            boxShadow: shooting ? '0 0 30px #ff8800' : (selectedWeapon ? '0 0 20px #ff4444' : 'none'),
            opacity: selectedWeapon ? 1 : 0.5,
            animation: shooting ? 'shootRecoil 0.12s infinite' : 'none',
            touchAction: 'none', userSelect: 'none',
          }}>
          <div style={{ fontSize: 22 }}>💥</div>
          <div style={{ fontSize: 9 }}>TIRER</div>
        </button>
        {selectedWeapon && (
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            border: `1px solid ${casino.secondary}`,
            borderRadius: 6, padding: 6,
            textAlign: 'center', fontSize: 10, color: '#fff',
            fontFamily: 'Georgia, serif',
          }}>
            <WeaponIcon id={selectedWeapon} size={32} />
            <div>{WEAPONS.find(w => w.id === selectedWeapon)?.name.split(' ')[0]}</div>
          </div>
        )}
      </div>

      {/* Réticule de visée au centre */}
      {selectedWeapon && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <div style={{
            width: isAiming ? 40 : 20,
            height: isAiming ? 40 : 20,
            border: `2px solid ${isAiming ? '#ff4444' : 'rgba(255,255,255,0.6)'}`,
            borderRadius: '50%',
            transition: 'all 0.3s',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: isAiming ? 4 : 3, height: isAiming ? 4 : 3,
              background: isAiming ? '#ff4444' : '#fff',
              borderRadius: '50%',
              transform: 'translate(-50%,-50%)',
            }} />
            {isAiming && (
              <>
                <div style={{
                  position: 'absolute', top: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1, height: 8, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', bottom: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1, height: 8, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: -10,
                  transform: 'translateY(-50%)',
                  width: 8, height: 1, background: '#ff4444',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', right: -10,
                  transform: 'translateY(-50%)',
                  width: 8, height: 1, background: '#ff4444',
                }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay vignette quand on vise (effet de lunette) */}
      {isAiming && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none', zIndex: 9,
        }} />
      )}

      {/* ====== CHICHA EN MAIN : visible UNIQUEMENT pendant l'utilisation ====== */}
      {hasHookah && viewMode === 'first' && usingHookah && (
        <FPHookahView hookahId={equippedHookah} isUsing={usingHookah} />
      )}

      {/* ====== ARME EN MAIN (1ère personne) ====== */}
      {selectedWeapon && viewMode === 'first' && (
        <div style={{
          position: 'absolute', right: '12%', bottom: -20,
          width: 360, pointerEvents: 'none', zIndex: 11,
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.6))',
          animation: shooting ? 'recoilAnim 0.12s infinite' : 'none',
        }}>
          <FPWeaponView id={selectedWeapon} />
        </div>
      )}

      {/* Overlay véhicule retiré sur demande user — il polluait l'écran en permanence
          dans le casino. Le véhicule reste équipé en jeu (visible en TPS dehors). */}

      {/* ====== PERSONNAGE (3ème personne) ====== */}
      {/* Vue 3ème personne : l'avatar 3D est maintenant rendu directement dans la scène Three.js,
          pas besoin de l'overlay SVG. Le FPWeaponView overlay ne s'affiche qu'en 1ère personne. */}
      {false && viewMode === 'third' && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 80,
          transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 11,
        }}>
          <TPPlayerView
            profile={profile}
            selectedWeapon={selectedWeapon}
            firing={shooting}
          />
        </div>
      )}

      {/* ====== BALLES VISIBLES (uniquement pendant le tir) ====== */}
      {visibleBullets.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          right: '20%',     // start position near weapon muzzle
          bottom: '25%',
          width: 8, height: 18,
          background: 'linear-gradient(180deg, #fffbe5, #ffae00)',
          borderRadius: 4,
          boxShadow: '0 0 12px #ffcd3c, 0 0 24px #ffae00',
          zIndex: 12, pointerEvents: 'none',
          animation: 'bulletFlyOverlay 0.5s linear forwards',
        }} />
      ))}

      {/* ====== MUZZLE FLASH ====== */}
      {shooting && selectedWeapon && viewMode === 'first' && (
        <div key={muzzleKey} style={{
          position: 'absolute',
          right: '22%', bottom: '28%',
          width: 100, height: 100,
          background: 'radial-gradient(circle, #fff8c0 0%, #ffb636 35%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 13,
          mixBlendMode: 'screen',
          animation: 'muzzleFlashAnim 0.1s ease-out',
        }} />
      )}

      {/* Animation SLASH pour couteau/machette (trait blanc de G à D) */}
      {slashActive && (
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none', zIndex: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '30%', left: '-20%',
            width: '140%', height: '40%',
            background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.95) 55%, transparent 80%)',
            transform: 'skewY(-8deg)',
            animation: 'slashAnim 1s ease-out forwards',
            filter: 'blur(2px)',
          }} />
          {/* Trait net au-dessus */}
          <div style={{
            position: 'absolute',
            top: '45%', left: '-10%',
            width: '120%', height: 4,
            background: 'linear-gradient(90deg, transparent 15%, rgba(255,255,255,1) 50%, transparent 85%)',
            transform: 'rotate(-8deg)',
            animation: 'slashAnim 1s ease-out forwards',
            boxShadow: '0 0 20px rgba(255,255,255,0.9)',
          }} />
        </div>
      )}

      {/* Flash de tir */}
      {shooting && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 85% 80%, rgba(255,200,0,0.4), transparent 40%)',
          pointerEvents: 'none', zIndex: 15,
          animation: 'muzzleFlash 0.3s ease-out',
        }} />
      )}

      {/* Indicateur proximité */}
      {nearZone && zoneLabels[nearZone] && (
        <div className="hud-control"
          data-testid={nearZone === 'exit' ? 'lobby-exit-label' : `lobby-zone-${nearZone}`}
          style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 12, padding: '10px 20px',
          color: '#fff', fontFamily: 'Georgia, serif',
          textAlign: 'center', zIndex: 20,
          animation: 'pulseGlow 1.5s ease-in-out infinite',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 16, color: casino.secondary, marginBottom: 4 }}>
            {zoneLabels[nearZone].icon} {zoneLabels[nearZone].name}
          </div>
          <button
            data-testid={nearZone === 'exit' ? 'lobby-exit-action-btn' : `lobby-zone-action-${nearZone}`}
            onClick={() => zoneCallbacksRef.current[nearZone] && zoneCallbacksRef.current[nearZone]()}
            style={{
              padding: '8px 18px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 6, color: '#fff',
              fontFamily: 'inherit', cursor: 'pointer', fontWeight: 'bold',
              fontSize: 14,
            }}>{nearZone === 'exit' ? 'SORTIR' : 'ENTRER'}</button>
          {/* Hint clavier PC : touche E (et espace) */}
          <div style={{
            marginTop: 6, fontSize: 10, color: casino.secondary,
            letterSpacing: 1, opacity: 0.85,
          }}>
            Appuie sur <b style={{ color: '#ffd700' }}>E</b> ou <b style={{ color: '#ffd700' }}>ESPACE</b>
          </div>
        </div>
      )}

      {/* Instructions démarrage */}
      {showInstructions && (
        <div className="hud-control" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,0.92)',
          border: `2px solid ${casino.secondary}`,
          borderRadius: 12, padding: 20,
          color: '#fff', fontFamily: 'Georgia, serif',
          textAlign: 'center', maxWidth: 360, zIndex: 30,
        }}>
          <div style={{ fontSize: 20, color: casino.secondary, marginBottom: 10, letterSpacing: 2 }}>
            BIENVENUE
          </div>
          <div style={{ fontSize: 13, color: '#cca366', marginBottom: 12, fontStyle: 'italic' }}>
            {casino.name} • {casino.tagline}
          </div>
          <div style={{ textAlign: 'left', fontSize: 13, lineHeight: 1.6 }}>
            <div>📱 <strong>Mobile :</strong></div>
            <div>• Flèches en bas à gauche = déplacement</div>
            <div>• Glisser au doigt = tourner la tête</div>
            <div>• 🎒 = inventaire armes</div>
            <div>• 🎯 = tirer avec l'arme sélectionnée</div>
            <br/>
            <div>💻 <strong>PC :</strong></div>
            <div>• ZQSD/WASD/Flèches = déplacement</div>
            <div>• Clic pour verrouiller la souris</div>
            <div>• E ou Espace = interagir</div>
          </div>
          <button onClick={() => setShowInstructions(false)}
            style={{
              marginTop: 16, padding: '10px 28px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 8, color: '#fff',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 'bold',
              cursor: 'pointer', letterSpacing: 2,
            }}>ENTRER</button>
        </div>
      )}

      {/* INVENTAIRE */}
      {showInventory && (
        <div className="hud-control" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            background: `linear-gradient(145deg, #1a0a0a, #0a0503)`,
            border: `2px solid ${casino.primary}`, borderRadius: 14,
            maxWidth: 500, width: '100%', padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: casino.secondary, margin: 0, letterSpacing: 2 }}>🎒 INVENTAIRE</h3>
              <button onClick={() => setShowInventory(false)} style={{
                background: 'transparent', border: `1px solid ${casino.secondary}`,
                color: casino.secondary, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            </div>
            {weapons.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: 30 }}>
                Pas d'arme dans l'inventaire. Visite l'armurerie !
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}>
                {weapons.map(wId => {
                  const w = WEAPONS.find(x => x.id === wId);
                  const isSelected = selectedWeapon === wId;
                  return (
                    <button key={wId}
                      onClick={() => { setSelectedWeapon(wId); setShowInventory(false); }}
                      style={{
                        padding: 12,
                        background: isSelected 
                          ? `linear-gradient(135deg, ${casino.secondary}33, ${casino.primary}33)` 
                          : 'rgba(0,0,0,0.4)',
                        border: `2px solid ${isSelected ? casino.secondary : '#444'}`,
                        borderRadius: 10, color: '#fff',
                        cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'center',
                      }}>
                      <WeaponIcon id={wId} size={50} />
                      <div style={{ fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{w.name}</div>
                      <div style={{ fontSize: 9, color: '#cca366' }}>{w.damage}</div>
                      {isSelected && (
                        <div style={{
                          fontSize: 10, color: casino.secondary, fontWeight: 'bold', marginTop: 4,
                        }}>✓ ÉQUIPÉE</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedWeapon && (
              <button onClick={() => { setSelectedWeapon(null); }}
                style={{
                  width: '100%', marginTop: 12, padding: 10,
                  background: 'transparent', border: '1px solid #888',
                  color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                }}>Déséquiper</button>
            )}
          </div>
        </div>
      )}

      {/* Legacy modal (gardé pour rétrocompat — accessible via menu universel) */}
      {showArcadeMenu && (
        <div
          data-testid="arcade-menu-modal"
          onClick={() => setShowArcadeMenu(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, backdropFilter: 'blur(10px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #0a1020, #050810)',
              border: '2px solid #3fe6ff', borderRadius: 18,
              maxWidth: 580, width: '100%', padding: 24, color: '#fff',
              boxShadow: '0 30px 80px rgba(0,0,0,0.75), 0 0 60px rgba(63,230,255,0.15)',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16, paddingBottom: 12,
              borderBottom: '1px solid rgba(63,230,255,0.2)',
            }}>
              <h3 style={{
                color: '#3fe6ff', margin: 0, letterSpacing: 3,
                fontFamily: 'Georgia, serif', fontSize: 22,
                textShadow: '0 0 12px rgba(63,230,255,0.5)',
              }}>🎮 ARCADE MINI-JEUX</h3>
              <button
                onClick={() => setShowArcadeMenu(false)}
                style={{
                  background: 'transparent', border: '1px solid #3fe6ff',
                  color: '#3fe6ff', width: 34, height: 34, borderRadius: 8,
                  cursor: 'pointer', fontWeight: 800, fontSize: 16,
                }}
              >✕</button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
            }}>
              {[
                {
                  id: 'crash',
                  emoji: '🚀',
                  title: 'CRASH',
                  desc: 'Prédis quand l\'avion va décoller. Multiplie ta mise mais cash out avant le crash !',
                  accent: '#3fe6ff',
                  ready: true,
                  onClick: () => {
                    setShowArcadeMenu(false);
                    onOpenCrash && onOpenCrash();
                  },
                },
                {
                  id: 'mines',
                  emoji: '💎',
                  title: 'MINES',
                  desc: 'Grille de 25 cases, évite les bombes. Plus tu cliques, plus tu multiplies.',
                  accent: '#ff00aa',
                  ready: false,
                },
                {
                  id: 'dice',
                  emoji: '🎲',
                  title: 'DÉ HIGH/LOW',
                  desc: 'Mise sur high (>50) ou low (≤50). Gain × 1.95.',
                  accent: '#ffd700',
                  ready: false,
                },
                {
                  id: 'coin',
                  emoji: '🪙',
                  title: 'PILE OU FACE',
                  desc: 'Mise sur pile ou face. Gain × 1.95. Best 5 streaks.',
                  accent: '#ffa500',
                  ready: false,
                },
              ].map((g) => (
                <button
                  key={g.id}
                  data-testid={`arcade-game-${g.id}`}
                  disabled={!g.ready}
                  onClick={g.onClick}
                  style={{
                    padding: 14, borderRadius: 12,
                    background: g.ready
                      ? `linear-gradient(135deg, ${g.accent}22, rgba(0,0,0,0.4))`
                      : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${g.ready ? g.accent : 'rgba(255,255,255,0.08)'}`,
                    color: '#fff', cursor: g.ready ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    opacity: g.ready ? 1 : 0.45,
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{g.emoji}</div>
                  <div style={{
                    fontSize: 14, fontWeight: 900, letterSpacing: 1.5,
                    color: g.ready ? g.accent : '#888', marginBottom: 4,
                  }}>{g.title}</div>
                  <div style={{
                    fontSize: 11, color: '#aaa', lineHeight: 1.35,
                  }}>{g.desc}</div>
                  {!g.ready && (
                    <div style={{
                      marginTop: 8, fontSize: 9, fontWeight: 800,
                      color: '#666', letterSpacing: 1.5,
                    }}>BIENTÔT</div>
                  )}
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 14, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(63,230,255,0.06)',
              border: '1px solid rgba(63,230,255,0.18)',
              fontSize: 11, color: '#aaa', textAlign: 'center',
            }}>
              🎯 Les autres jeux arrivent dans une prochaine mise à jour
            </div>
          </div>
        </div>
      )}

      {/* L'ancien menu plein écran a été retiré : UniversalMenu (≡ MENU) le remplace
          avec les mêmes options (trophées, quêtes, perso, changer casino, sortir, etc.). */}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.6); }
          50% { box-shadow: 0 0 40px rgba(255,215,0,0.9); }
        }
        @keyframes shootRecoil {
          0% { transform: scale(1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
        @keyframes muzzleFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes recoilAnim {
          0% { transform: translate(0,0) rotate(0); }
          50% { transform: translate(-10px, 8px) rotate(-3deg); }
          100% { transform: translate(0,0) rotate(0); }
        }
        @keyframes muzzleFlashAnim {
          0% { opacity: 1; transform: scale(0.6); }
          100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes bulletFlyOverlay {
          0% { right: 22%; bottom: 28%; opacity: 1; transform: scale(1); }
          100% { right: 50%; bottom: 50%; opacity: 0; transform: scale(0.3); }
        }
      `}</style>

      {/* ====== MULTIJOUEUR HUD ====== */}
      {mpOnline && (
        <>
          {/* Badge serveur + joueurs en ligne */}
          <div
            data-testid="mp-server-badge"
            style={{
              position: 'absolute', top: 10, left: 10, zIndex: 50,
              background: 'rgba(224,14,26,0.85)', color: '#fff',
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8,
              pointerEvents: 'none',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#7fff7f',
              boxShadow: '0 0 6px #7fff7f',
            }} />
            SERVEUR {mpServerId?.toUpperCase()} · {onlinePlayersCount} EN LIGNE
          </div>

          {/* Barre de vie + cœurs de session */}
          <div style={{
            position: 'absolute', top: 40, left: 10, zIndex: 50,
            width: 200, background: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8,
            border: '1px solid rgba(212,175,55,0.35)',
            pointerEvents: 'none', backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 10, color: '#fff', marginBottom: 4,
            }}>
              <span>HP : {myHp}/100</span>
              <span data-testid="mp-lives" style={{ fontSize: 14 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} style={{
                    marginLeft: 2,
                    color: i < sessionLives ? '#ff3a55' : '#3a3a40',
                    textShadow: i < sessionLives ? '0 0 6px rgba(255,58,85,0.7)' : 'none',
                  }}>❤</span>
                ))}
              </span>
            </div>
            <div style={{
              height: 8, background: '#333', borderRadius: 4, overflow: 'hidden',
            }}>
              <div
                data-testid="mp-hp-bar"
                style={{
                width: `${myHp}%`, height: '100%',
                background: myHp > 50 ? '#22c55e' : myHp > 25 ? '#f59e0b' : '#dc2626',
                transition: 'width .2s',
              }} />
            </div>
          </div>

          {/* Overlay spectateur (0 vies) */}
          {spectating && (
            <div
              data-testid="mp-spectator-overlay"
              style={{
                position: 'absolute', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: 'Georgia, serif',
                pointerEvents: 'auto',
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>💀</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#ff3a55', letterSpacing: 2, marginBottom: 8 }}>
                MODE SPECTATEUR
              </div>
              <div style={{ fontSize: 14, color: '#cca366', marginBottom: 24, maxWidth: 480, textAlign: 'center' }}>
                Tu as épuisé tes 3 vies pour cette session.<br />
                Reviens à la session prochaine ou continue à observer.
              </div>
              <button
                onClick={() => {
                  setSessionLives(3);
                  setSpectating(false);
                }}
                data-testid="mp-respawn-session"
                style={{
                  padding: '12px 24px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #b08000, #ffd700)',
                  border: 'none', color: '#111', fontWeight: 900,
                  fontSize: 14, letterSpacing: 1.5, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >🔄 RECOMMENCER (3 vies)</button>
            </div>
          )}

          {/* Kill feed */}
          {killFeed.length > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10, zIndex: 50,
              pointerEvents: 'none',
            }}>
              {killFeed.map((k, i) => (
                <div key={`${k.ts}-${i}`} style={{
                  background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 12px',
                  borderRadius: 4, fontSize: 12, marginBottom: 4, fontWeight: 700,
                }}>
                  <span style={{ color: '#7fff7f' }}>{k.killer}</span>
                  <span style={{ margin: '0 6px', color: '#f59e0b' }}>💀 {k.weapon}</span>
                  <span style={{ color: '#ff9090' }}>{k.victim}</span>
                </div>
              ))}
            </div>
          )}

          {/* Toggle chat : badge compact toujours visible, surtout mobile */}
          <button
            data-testid="mp-chat-toggle"
            onClick={() => setChatCollapsed(c => !c)}
            style={{
              position: 'absolute',
              bottom: chatCollapsed ? 110 : (deviceType === 'mobile' ? 230 : 340),
              left: 10, zIndex: 51,
              padding: '6px 10px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(20,15,30,0.92), rgba(0,0,0,0.92))',
              border: '1.5px solid rgba(212,175,55,0.5)',
              color: '#ffd700', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', letterSpacing: 0.5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.18s ease',
            }}
          >
            {chatCollapsed
              ? `💬 Chat${chatMessages.length > 0 ? ` (${chatMessages.length})` : ''}`
              : '— Réduire'}
          </button>

          {/* Chat fenêtre (bas gauche) — collapsible, mobile-aware */}
          {!chatCollapsed && (
          <div style={{
            position: 'absolute',
            bottom: 120, left: 10, zIndex: 50,
            width: deviceType === 'mobile' ? 'calc(100vw - 24px)' : 360,
            maxWidth: deviceType === 'mobile' ? 320 : 360,
            maxHeight: deviceType === 'mobile' ? 140 : 220,
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.7), rgba(15,5,25,0.65))',
            border: '1px solid rgba(212,175,55,0.35)',
            borderRadius: 10, padding: deviceType === 'mobile' ? 6 : 10,
            pointerEvents: 'none',
            fontSize: deviceType === 'mobile' ? 10 : 12,
            color: '#fff',
            backdropFilter: 'blur(6px)',
          }} data-testid="mp-chat-log">
            {chatMessages.length === 0 ? (
              <div style={{ color: '#9a8a6a', fontStyle: 'italic', fontSize: 11 }}>
                💬 Aucun message — {deviceType === 'mobile' ? 'tape pour discuter' : 'appuie sur T pour discuter'}
              </div>
            ) : (
              chatMessages.slice(-10).map((m, i) => {
                const isSystem = m.from === 'SYSTÈME';
                const isMine = !isSystem && myIdRef.current && m.from === myIdRef.current;
                const fromColor = isSystem ? '#ffd700' : isMine ? '#a8e88a' : '#7fceff';
                const bg = isMine ? 'rgba(72,180,72,0.10)' : 'transparent';
                // Heure HH:MM
                const d = new Date((m.ts || Date.now() / 1000) * 1000);
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return (
                  <div key={`${m.ts}-${i}`} style={{
                    marginBottom: 3, padding: '3px 6px', borderRadius: 4,
                    background: bg,
                    borderLeft: isSystem ? '2px solid #ffd700' : (isMine ? '2px solid #48a848' : '2px solid transparent'),
                  }}>
                    <span style={{ color: '#777', fontSize: 9, marginRight: 5 }}>
                      [{hh}:{mm}]
                    </span>
                    <b style={{ color: fromColor }}>
                      {isMine ? 'toi' : m.from}
                    </b>
                    <span style={{ color: '#888' }}>:</span>{' '}
                    <span style={{
                      color: isSystem ? '#ffd896' : '#e8e8ea',
                      fontStyle: isSystem ? 'italic' : 'normal',
                    }}>
                      {m.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          )}

          {/* Champ chat (activé par T) */}
          {showChatInput && (
            <div style={{
              position: 'absolute', bottom: 80, left: 10, zIndex: 60,
              width: 330, display: 'flex', gap: 6,
            }}>
              <input
                ref={chatInputRef}
                data-testid="mp-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendChatMessage();
                  if (e.key === 'Escape') { setShowChatInput(false); setChatInput(''); }
                }}
                placeholder="Message (Entrée pour envoyer)…"
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 4,
                  border: '1px solid #ffd700', background: 'rgba(0,0,0,0.8)',
                  color: '#fff', fontSize: 13,
                }}
              />
              <button
                data-testid="mp-chat-send"
                onClick={sendChatMessage}
                style={{
                  padding: '6px 12px', borderRadius: 4, border: 'none',
                  background: '#ffd700', color: '#000', fontWeight: 700,
                  cursor: 'pointer', fontSize: 12,
                }}
              >Envoyer</button>
            </div>
          )}

          {/* Bouton ouvrir chat (mobile) */}
          {!showChatInput && (
            <button
              data-testid="mp-chat-open"
              onClick={() => { setShowChatInput(true); setTimeout(() => chatInputRef.current?.focus(), 50); }}
              style={{
                position: 'absolute', bottom: 80, left: 10, zIndex: 55,
                padding: '6px 12px', borderRadius: 4, border: '1px solid #ffd700',
                background: 'rgba(0,0,0,0.6)', color: '#ffd700', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
              }}
            >💬 Chat (T)</button>
          )}
        </>
      )}
    </div>
  );
};

// Bouton fléché avec press/hold support

export default Lobby3D;
