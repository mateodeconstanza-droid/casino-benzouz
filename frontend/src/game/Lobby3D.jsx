import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { WEAPONS, VEHICLES, CASINO_3D_COLORS, HAIR_CATALOG, OUTFIT_CATALOG, SHOES_CATALOG, fmt } from '@/game/constants';
import { ArrowButton, Dealer, WeaponIcon, menuBtnStyle } from '@/game/ui';
import { FPWeaponView, TPPlayerView } from '@/game/FPWeapon';
import { VehicleGraphic } from '@/game/ui';
// ============== SCÈNE 3D THREE.JS - LOBBY COMPLET V4 ==============
const Lobby3D = ({ profile, casino, casinoId, onSelectGame, onLogout, onOpenTrophies, onOpenShop, onOpenATM, onOpenWheel, walletReady, wheelReady, balance, onOpenBar, onOpenToilet, onOpenBenzBet, weapons, selectedWeapon, setSelectedWeapon, onShoot, onChangeCasino, onOpenCharacter, onToggleVehicle }) => {
  const mountRef = useRef(null);
  const [nearZone, setNearZone] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [viewMode, setViewMode] = useState('first'); // 'first' | 'third'
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
    benzbet: () => onOpenBenzBet(),
  };
  
  // État touches pour mobile
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false });

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

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, 1.7, 14);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

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

    // ========== MURS ==========
    const wallMat = new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.8 });
    const wallHi = new THREE.MeshStandardMaterial({ color: primaryHex, roughness: 0.7, metalness: 0.3 });
    
    // Mur arrière (30)
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallBack.position.set(0, 3, -20);
    wallBack.receiveShadow = true;
    scene.add(wallBack);
    // Bande décorative
    const wallBackBand = new THREE.Mesh(new THREE.PlaneGeometry(40, 0.5), wallHi);
    wallBackBand.position.set(0, 4, -19.95);
    scene.add(wallBackBand);
    
    // Mur avant (30) avec porte ouverte
    const wallFrontL = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    wallFrontL.position.set(-12, 3, 20);
    wallFrontL.rotation.y = Math.PI;
    scene.add(wallFrontL);
    const wallFrontR = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    wallFrontR.position.set(12, 3, 20);
    wallFrontR.rotation.y = Math.PI;
    scene.add(wallFrontR);
    const wallFrontTop = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.5), wallMat);
    wallFrontTop.position.set(0, 5.25, 20);
    wallFrontTop.rotation.y = Math.PI;
    scene.add(wallFrontTop);
    
    // Murs latéraux
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallL.position.set(-20, 3, 0);
    wallL.rotation.y = Math.PI / 2;
    scene.add(wallL);
    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), wallMat);
    wallR.position.set(20, 3, 0);
    wallR.rotation.y = -Math.PI / 2;
    scene.add(wallR);

    // ========== LUMIÈRES ==========
    scene.add(new THREE.AmbientLight(0xfff4dc, 1.0));
    const hemi = new THREE.HemisphereLight(0xfff4dc, 0xffd700, 0.6);
    scene.add(hemi);
    
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
          envMapIntensity: 2,
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
      npc.userData = { isNpc: true, dead: false };
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
      if (id === 'roulette') {
        rouletteWheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 0.1, 37),
          new THREE.MeshStandardMaterial({ color: 0x3a2010, metalness: 0.7 })
        );
        rouletteWheel.position.set(0, 1.05, 0);
        group.add(rouletteWheel);
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 })
        );
        ball.position.set(0.45, 1.15, 0);
        group.add(ball);
      } else if (id === 'blackjack') {
        for (let i = 0; i < 3; i++) {
          const card = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.02, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
          );
          card.position.set(-0.5 + i * 0.4, 1.0, 0.3);
          card.rotation.y = (Math.random() - 0.5) * 0.2;
          group.add(card);
        }
      } else if (id === 'highcard') {
        const cardMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.55), cardMat);
        c1.position.set(-0.6, 1.0, 0);
        group.add(c1);
        const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.55), cardMat);
        c2.position.set(0.6, 1.0, 0);
        group.add(c2);
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
      dealer.userData = { isDealer: true, dead: false };
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
      return { wheel: rouletteWheel, zone, dealer };
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

      // ========== VERRES EN RÉSERVE ==========
      for (let g = 0; g < 6; g++) {
        const glass = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.04, 0.1, 8),
          new THREE.MeshStandardMaterial({ 
            color: 0xccddff, 
            transparent: true, 
            opacity: 0.4,
            roughness: 0.05,
          })
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
        pctx.fillText(w ? `${fmt(w.price)} B` : '', 128, 50);
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
      sctx.fillText('🏎 BENZ BOUTIQUE', 512, 120);
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

    // ========== KIOSQUE BENZBET ==========
    const createBenzBet = () => {
      const group = new THREE.Group();
      group.position.set(13, 0, -14);
      
      // 2 machines BenzBet identiques
      for (let m = 0; m < 2; m++) {
        const machine = new THREE.Group();
        machine.position.set(-1.2 + m * 2.4, 0, 0);
        
        // Corps
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1, 2.4, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.5 })
        );
        body.position.y = 1.2;
        machine.add(body);
        
        // Écran bleu-violet
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 0.9),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        screen.position.set(0, 1.6, 0.41);
        machine.add(screen);
        
        // Lumière écran
        const screenGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.75, 0.85),
          new THREE.MeshBasicMaterial({ color: 0xff00aa })
        );
        screenGlow.position.set(0, 1.6, 0.42);
        machine.add(screenGlow);
        
        // Label BENZBET
        const bbCanvas = document.createElement('canvas');
        bbCanvas.width = 256; bbCanvas.height = 128;
        const bbctx = bbCanvas.getContext('2d');
        bbctx.fillStyle = '#000';
        bbctx.fillRect(0, 0, 256, 128);
        bbctx.fillStyle = '#ff00aa';
        bbctx.font = 'bold 44px Georgia';
        bbctx.textAlign = 'center';
        bbctx.fillText('BENZ', 128, 55);
        bbctx.fillStyle = '#ffd700';
        bbctx.fillText('BET', 128, 100);
        const bbtex = new THREE.CanvasTexture(bbCanvas);
        const bbLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7, 0.4),
          new THREE.MeshBasicMaterial({ map: bbtex, transparent: true })
        );
        bbLabel.position.set(0, 2.2, 0.42);
        machine.add(bbLabel);
        
        // Fente ticket
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.03, 0.03),
          new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        slot.position.set(0, 0.6, 0.41);
        machine.add(slot);
        
        // Boutons colorés
        const btnColors = [0xff0000, 0x00ff00, 0xffff00];
        for (let b = 0; b < 3; b++) {
          const btn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12),
            new THREE.MeshStandardMaterial({ color: btnColors[b], emissive: btnColors[b], emissiveIntensity: 0.5 })
          );
          btn.rotation.x = Math.PI / 2;
          btn.position.set(-0.15 + b * 0.15, 1.05, 0.42);
          machine.add(btn);
        }
        
        group.add(machine);
      }
      
      // Comptoir du bookmaker
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x4a2a4a, roughness: 0.7 })
      );
      counter.position.set(0, 0.5, 2.5);
      group.add(counter);
      
      // Bookmaker 3D
      const bookmaker = createDealer3D({ skin: '#d4a888', hair: '#4a2818', eyes: '#2a1808', beard: false, glasses: true, gender: 'm' });
      bookmaker.position.set(0, 0, 3.3);
      bookmaker.rotation.y = Math.PI;
      group.add(bookmaker);
      
      // Enseigne néon BENZBET géante
      const neonCanvas = document.createElement('canvas');
      neonCanvas.width = 1024; neonCanvas.height = 256;
      const nctx = neonCanvas.getContext('2d');
      nctx.fillStyle = '#000';
      nctx.fillRect(0, 0, 1024, 256);
      nctx.shadowColor = '#ff00aa';
      nctx.shadowBlur = 30;
      nctx.fillStyle = '#ff00aa';
      nctx.font = 'bold 120px Georgia';
      nctx.textAlign = 'center';
      nctx.fillText('BENZ', 360, 160);
      nctx.fillStyle = '#ffd700';
      nctx.fillText('BET', 720, 160);
      nctx.fillStyle = '#fff';
      nctx.font = '30px Georgia';
      nctx.fillText('PARIS SPORTIFS', 512, 220);
      const ntex = new THREE.CanvasTexture(neonCanvas);
      const neonSign = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 1.25),
        new THREE.MeshBasicMaterial({ map: ntex, transparent: true })
      );
      neonSign.position.set(0, 4.2, 0);
      group.add(neonSign);
      
      // Lumières néon
      const nlight1 = new THREE.PointLight(0xff00aa, 1, 6);
      nlight1.position.set(-1, 3, 1);
      group.add(nlight1);
      const nlight2 = new THREE.PointLight(0xffd700, 1, 6);
      nlight2.position.set(1, 3, 1);
      group.add(nlight2);
      
      const zone = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      zone.userData = { zoneId: 'benzbet' };
      zone.position.set(0, 1, 1.5);
      group.add(zone);
      
      scene.add(group);
      return { zone };
    };
    const benzBetObj = createBenzBet();

    // Liste globale des zones d'interaction
    const interactZones = [
      bj.zone, rl.zone, hc.zone, pk.zone,
      barObj.zone, toiletObj.zone, atmObj.zone, wheelObj.zone, shopObj.zone, benzBetObj.zone,
    ];

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
    const getSpeedMul = () => {
      const v = profile && profile.equippedVehicle;
      const def = VEHICLES.find(x => x.id === v);
      return def ? def.speedMul : 1;
    };
    const ROOM_HALF = 18;
    let isPointerLocked = false;

    const onKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': case 'KeyZ': keysRef.current.forward = true; break;
        case 'ArrowDown': case 'KeyS': keysRef.current.backward = true; break;
        case 'ArrowLeft': case 'KeyA': case 'KeyQ': keysRef.current.left = true; break;
        case 'ArrowRight': case 'KeyD': keysRef.current.right = true; break;
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
      euler.y -= (e.movementX || 0) * 0.002;
      euler.x -= (e.movementY || 0) * 0.002;
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
          euler.y -= dx * 0.005;
          euler.x -= dy * 0.005;
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
        camera.position.add(movement);
        camera.position.x = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, camera.position.x));
        camera.position.z = Math.max(-ROOM_HALF, Math.min(ROOM_HALF, camera.position.z));
        camera.position.y = 1.7;
      }

      if (rl.wheel) rl.wheel.rotation.y += 0.008;
      if (wheelObj.wheelDisc) wheelObj.wheelDisc.rotation.z += 0.003;
      wheelRot += 0.02;

      // Animation balles en vol
      const nowTime = Date.now();
      
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
      });
      
      bulletsRef.current = bulletsRef.current.filter(b => {
        const elapsed = nowTime - b.startTime;
        const t = Math.min(elapsed / b.duration, 1);
        b.mesh.position.lerpVectors(b.startPos, b.endPos, t);
        if (t >= 1) {
          scene.remove(b.mesh);
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
      let closestDist = 3;
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

      renderer.render(scene, camera);
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
    shop: { icon: '🏎', name: 'BENZ BOUTIQUE' },
    benzbet: { icon: '🎟️', name: 'BENZBET' },
  };

  // Gestion tactile des flèches (hold-to-move)
  const setKey = (key, value) => {
    keysRef.current[key] = value;
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
    
    // 15 gouttes de sang
    const drops = [];
    for (let i = 0; i < 15; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.05, 6, 6),
        new THREE.MeshStandardMaterial({ 
          color: 0x8b0000, 
          emissive: 0x4a0000,
          emissiveIntensity: 0.3,
        })
      );
      // Vélocité aléatoire pour gicler
      const vx = (Math.random() - 0.5) * 4;
      const vy = 2 + Math.random() * 3;
      const vz = (Math.random() - 0.5) * 4;
      bloodGroup.add(drop);
      drops.push({ mesh: drop, vx, vy, vz, landed: false });
    }
    
    const startTime = Date.now();
    bloodRef.current.push({ group: bloodGroup, drops, startTime, duration: 1500 });
    
    // Retirer après 5s
    setTimeout(() => {
      scene.remove(bloodGroup);
      bloodRef.current = bloodRef.current.filter(b => b.group !== bloodGroup);
    }, 5000);
  };

  // Tir avec effets visuels complets
  const doShoot = () => {
    if (!selectedWeapon) return;
    // Do not block on `shooting` state while in auto-fire mode
    onShoot && onShoot();
    
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
        if (!hitTarget.userData.dead) {
          const bloodPos = new THREE.Vector3();
          hitTarget.getWorldPosition(bloodPos);
          bloodPos.y += 1.6;
          createBloodSplash(bloodPos);
          killTarget(hitTarget);
        }
      }, flightTime);
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


  const nextTrophy = TROPHIES.find(t => t.threshold > profile.totalWinnings);
  const earned = TROPHIES.filter(t => profile.totalWinnings >= t.threshold);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', touchAction: 'none' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

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
          <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 'bold' }}>{fmt(balance)} B</div>
        </div>
        <button onClick={() => setShowMenu(true)}
          style={{
            background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
            border: `1px solid ${casino.secondary}`,
            color: '#fff', borderRadius: 8, padding: '8px 14px',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
            pointerEvents: 'auto', fontSize: 13,
          }}>☰ MENU</button>
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

      {/* ====== VÉHICULE SOUS LES PIEDS (1ère personne) ====== */}
      {profile && profile.equippedVehicle && viewMode === 'first' && (
        <div style={{
          position: 'absolute', left: '50%', bottom: -40,
          transform: 'translateX(-50%)',
          width: 260, pointerEvents: 'none', zIndex: 11,
          filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.7))',
          opacity: 0.95,
        }}>
          <VehicleGraphic id={profile.equippedVehicle} />
        </div>
      )}

      {/* ====== PERSONNAGE (3ème personne) ====== */}
      {viewMode === 'third' && (
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
        <div className="hud-control" style={{
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
          <button onClick={() => zoneCallbacksRef.current[nearZone] && zoneCallbacksRef.current[nearZone]()}
            style={{
              padding: '8px 18px',
              background: `linear-gradient(135deg, ${casino.primary}, ${casino.accent})`,
              border: 'none', borderRadius: 6, color: '#fff',
              fontFamily: 'inherit', cursor: 'pointer', fontWeight: 'bold',
              fontSize: 14,
            }}>ENTRER</button>
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

      {/* MENU */}
      {showMenu && (
        <div className="hud-control" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, overflowY: 'auto', fontFamily: 'Georgia, serif',
        }}>
          <div style={{
            background: `linear-gradient(145deg, #1a0a0a, #0a0503)`,
            border: `2px solid ${casino.primary}`, borderRadius: 14,
            maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: `1px solid ${casino.primary}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{ color: casino.secondary, fontSize: 18, fontWeight: 'bold' }}>
                {casino.country} {casino.name}
              </div>
              <button onClick={() => setShowMenu(false)} style={{
                background: 'transparent', border: `1px solid ${casino.secondary}`,
                color: casino.secondary, padding: '6px 12px', borderRadius: 6,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8, marginBottom: 16,
              }}>
                <StatCard label="Solde" value={fmt(balance) + ' B'} color="#ffd700" />
                <StatCard label="Gains cum." value={fmt(profile.totalWinnings) + ' B'} color="#00ff88" />
                <StatCard label="Trophées" value={`${earned.length}/${TROPHIES.length}`} color="#ff6b9d" />
                <StatCard label="Armes" value={weapons.length} color={casino.primary} />
              </div>

              {nextTrophy && (
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${nextTrophy.color}`,
                  borderRadius: 8, padding: 10, marginBottom: 12,
                }}>
                  <div style={{ color: nextTrophy.color, fontSize: 11, marginBottom: 4 }}>
                    Prochain : {nextTrophy.icon} {nextTrophy.name}
                  </div>
                  <div style={{ background: '#333', height: 5, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (profile.totalWinnings / nextTrophy.threshold) * 100)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${nextTrophy.color}, #fff)`,
                    }} />
                  </div>
                </div>
              )}

              <div style={{ color: '#cca366', fontSize: 12, marginBottom: 10, textAlign: 'center', fontStyle: 'italic' }}>
                💡 Déplace-toi dans le casino pour accéder aux jeux, bar, WC, ATM, roue, boutique et BenzBet
              </div>

              <button onClick={() => { setShowMenu(false); onOpenTrophies(); }} style={menuBtnStyle('#ff6b9d')}>
                🏆 Voir tous les trophées
              </button>

              <button onClick={() => { setShowMenu(false); onOpenCharacter && onOpenCharacter(); }}
                data-testid="menu-character-btn"
                style={{ ...menuBtnStyle('#b48cff'), marginTop: 10 }}>
                👤 Personnaliser le personnage
              </button>

              <button onClick={() => { setShowMenu(false); onChangeCasino && onChangeCasino(); }} style={{
                ...menuBtnStyle(casino.accent),
                marginTop: 10,
              }}>
                🌍 Changer de casino
              </button>

              <button onClick={() => { setShowMenu(false); onLogout(); }} style={{
                width: '100%', marginTop: 10, padding: 10,
                background: 'rgba(180,40,40,0.3)',
                border: '1px solid #aa3030', color: '#ff7777',
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              }}>Déconnexion</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

// Bouton fléché avec press/hold support

export default Lobby3D;
