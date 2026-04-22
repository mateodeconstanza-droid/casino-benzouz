import React, { useState, useEffect } from 'react';
import { WEAPONS, VEHICLES, CASINOS, TROPHIES, FOUR_HOURS, DEALER_PROFILES, fmt } from '@/game/constants';
import LoginScreen from '@/game/Login';
import CharacterScreen from '@/game/Character';
import Lobby3D from '@/game/Lobby3D';
import BlackjackGame from '@/game/Blackjack';
import RouletteGame from '@/game/Roulette';
import HighCardGame from '@/game/HighCard';
import PokerGame from '@/game/Poker';
import Shop from '@/game/Shop';
import ATM from '@/game/ATM';
import { BarScreen, ToiletScreen } from '@/game/Bar';
import BenzBetScreen from '@/game/BenzBet';
import { TrophyScreen, TrophyUnlock } from '@/game/Trophies';
import { ChangeCasinoScreen, TableSelector } from '@/game/ChangeCasino';
import FortuneWheel3D from '@/game/Wheel';
export default function Casino() {
  const [screen, setScreen] = useState('loading');
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [casino, setCasino] = useState(CASINOS.vegas);
  const [balance, setBalance] = useState(500);
  const [minBet, setMinBet] = useState(20);
  const [showWheel, setShowWheel] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showATM, setShowATM] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [showToilet, setShowToilet] = useState(false);
  const [showBenzBet, setShowBenzBet] = useState(false);
  const [showChangeCasino, setShowChangeCasino] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [unlockedTrophy, setUnlockedTrophy] = useState(null);
  const [dealerSplats, setDealerSplats] = useState([]);
  const [flyingProjectile, setFlyingProjectile] = useState(null);
  const [dealerDead, setDealerDead] = useState(false);
  const [dealerShot, setDealerShot] = useState(false);
  const [bloodStreams, setBloodStreams] = useState([]);
  const [currentDealer, setCurrentDealer] = useState(DEALER_PROFILES[0]);

  // Charger profils
  useEffect(() => {
    (async () => {
      try {
        const profiles = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('profile:')) {
            try {
              const value = localStorage.getItem(key);
              if (value) profiles.push(JSON.parse(value));
            } catch (e) {}
          }
        }
        setSavedProfiles(profiles);
      } catch (e) {}
      setScreen('login');
    })();
  }, []);

  const saveProfile = async (p) => {
    try {
      localStorage.setItem(`profile:${p.name}`, JSON.stringify(p));
    } catch (e) {}
  };

  const handleLogin = async (name, isNew, casinoId) => {
    let p;
    if (isNew) {
      p = {
        name, casino: casinoId,
        balance: 500, totalWinnings: 0, sessions: 0,
        createdAt: Date.now(), unlockedTrophies: [],
        weapons: [],
        vehicles: [], equippedVehicle: null,
        ownedHair: [0,1,2], ownedOutfit: [0,1,2], ownedShoes: [0,1,2],
        hair: 0, outfit: 0, shoes: 0, skin: '#e0b48a',
        customized: false,
        lastWheelSpin: 0, lastWithdraw: 0,
      };
    } else {
      p = savedProfiles.find(s => s.name === name);
    }
    p.sessions = (p.sessions || 0) + 1;
    setCasino(CASINOS[p.casino] || CASINOS.vegas);
    setProfile(p);
    setBalance(p.balance || 500);
    await saveProfile(p);
    // Nouveau joueur non-personnalisé -> écran de personnalisation
    if (isNew || !p.customized) {
      setScreen('character');
    } else {
      setScreen('lobby');
      // Ouvre la roue à la connexion si disponible
      if (canSpinWheel(p)) {
        setTimeout(() => setShowWheel(true), 500);
      }
    }
  };

  const canSpinWheel = (p) => !p.lastWheelSpin || (Date.now() - p.lastWheelSpin >= FOUR_HOURS);
  const canWithdraw = (p) => !p.lastWithdraw || (Date.now() - p.lastWithdraw >= FOUR_HOURS);

  const handleLogout = async () => {
    if (profile) {
      const p = { ...profile, balance };
      await saveProfile(p);
    }
    setProfile(null);
    setScreen('login');
    try {
      const profiles = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('profile:')) {
          try {
            const value = localStorage.getItem(key);
            if (value) profiles.push(JSON.parse(value));
          } catch (e) {}
        }
      }
      setSavedProfiles(profiles);
    } catch (e) {}
  };

  const handleWheelComplete = async (value) => {
    const newBalance = balance + value;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      totalWinnings: profile.totalWinnings + value,
      lastWheelSpin: Date.now(),
    };
    if (value > 0) await checkTrophies(newProfile);
    setProfile(newProfile);
    await saveProfile(newProfile);
    setShowWheel(false);
  };

  const handleWithdraw = async () => {
    const newBalance = balance + 15000;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      lastWithdraw: Date.now(),
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
    setShowATM(false);
  };

  const handleBuyWeapon = async (weapon) => {
    if (balance < weapon.price) return;
    const newBalance = balance - weapon.price;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      weapons: [...(profile.weapons || []), weapon.id],
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const handleBuyVehicle = async (vehicle) => {
    if (balance < vehicle.price) return;
    if ((profile.vehicles || []).includes(vehicle.id)) return;
    const newBalance = balance - vehicle.price;
    setBalance(newBalance);
    const newProfile = {
      ...profile,
      balance: newBalance,
      vehicles: [...(profile.vehicles || []), vehicle.id],
      equippedVehicle: vehicle.id, // auto-equip on purchase
    };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const handleEquipVehicle = async (vehicleId) => {
    const newProfile = { ...profile, equippedVehicle: vehicleId };
    setProfile(newProfile);
    await saveProfile(newProfile);
  };

  const checkTrophies = async (p) => {
    const current = p.unlockedTrophies || [];
    for (const t of TROPHIES) {
      if (p.totalWinnings >= t.threshold && !current.includes(t.name)) {
        p.unlockedTrophies = [...current, t.name];
        p.balance = (p.balance || 0) + t.reward;
        p.totalWinnings = p.totalWinnings + t.reward;
        setBalance(p.balance);
        setUnlockedTrophy(t);
        setTimeout(() => setUnlockedTrophy(null), 5000);
        break; // Un à la fois pour ne pas spammer
      }
    }
  };

  const handleBalanceChange = async (newBalOrFn) => {
    const newBal = typeof newBalOrFn === 'function' ? newBalOrFn(balance) : newBalOrFn;
    const diff = newBal - balance;
    setBalance(newBal);
    if (diff > 0 && profile) {
      const newProfile = {
        ...profile,
        balance: newBal,
        totalWinnings: profile.totalWinnings + diff,
      };
      await checkTrophies(newProfile);
      setProfile(newProfile);
      await saveProfile(newProfile);
    } else if (profile) {
      const newProfile = { ...profile, balance: newBal };
      setProfile(newProfile);
      await saveProfile(newProfile);
    }
  };

  // Quand le joueur clique sur une table dans le lobby 3D, on ouvre le modal de choix VIP
  const [pendingGame, setPendingGame] = useState(null);
  
  const handleSelectGame = (game, vip, minBetVal) => {
    // Si on passe juste le game, on ouvre le modal de sélection
    if (vip === undefined && minBetVal === undefined) {
      setPendingGame(game);
      return;
    }
    if (balance < minBetVal) {
      alert(`Solde insuffisant. Minimum requis : ${fmt(minBetVal)} B`);
      return;
    }
    setMinBet(minBetVal);
    setScreen(game);
    resetDealer();
    setPendingGame(null);
  };

  const resetDealer = () => {
    setDealerSplats([]);
    setDealerDead(false);
    setDealerShot(false);
    setBloodStreams([]);
    setCurrentDealer(DEALER_PROFILES[Math.floor(Math.random() * DEALER_PROFILES.length)]);
  };

  const handleExitGame = async () => {
    // Save
    if (profile) {
      const p = { ...profile, balance };
      await saveProfile(p);
      setProfile(p);
    }
    setScreen('lobby');
    resetDealer();
  };

  const handleProjectile = (type) => {
    if (flyingProjectile || dealerDead) return;
    setFlyingProjectile({
      type,
      onComplete: () => {
        const x = 30 + Math.random() * 40;
        const y = 25 + Math.random() * 30;
        setDealerSplats((prev) => [...prev, { id: Date.now() + Math.random(), type, x, y }]);
        // Ajout de gouttes de sang réalistes
        setBloodStreams((prev) => [
          ...prev,
          { x: x - 2 + Math.random() * 4, y: y + 5, width: 3 + Math.random() * 3, height: 30 + Math.random() * 30, duration: 1.5 + Math.random(), delay: 0.2 },
          { x: x + Math.random() * 6, y: y + 8, width: 2 + Math.random() * 3, height: 20 + Math.random() * 25, duration: 1.8, delay: 0.4 },
        ]);
        setFlyingProjectile(null);
      },
    });
  };

  const handleUseWeapon = (weaponId) => {
    if (flyingProjectile || dealerDead) return;
    const projType = weaponId === 'gun' || weaponId === 'shotgun' ? (weaponId === 'shotgun' ? 'shotgun_shot' : 'bullet')
                   : weaponId === 'bazooka' ? 'rocket'
                   : weaponId;
    
    setFlyingProjectile({
      type: projType,
      onComplete: () => {
        setFlyingProjectile(null);
        
        // Impact selon arme
        if (weaponId === 'bazooka') {
          setDealerSplats(prev => [...prev, 
            { id: Date.now(), type: 'explosion', x: 50, y: 50 },
          ]);
        } else {
          setDealerShot(true);
          setDealerSplats(prev => [...prev, 
            { id: Date.now(), type: 'wound', x: 50, y: 38 },
          ]);
        }
        
        // Gros flots de sang
        setBloodStreams([
          { x: 40 + Math.random() * 20, y: 40, width: 5, height: 60, duration: 2, delay: 0.1 },
          { x: 35 + Math.random() * 30, y: 42, width: 4, height: 50, duration: 2.5, delay: 0.3 },
          { x: 45 + Math.random() * 15, y: 45, width: 6, height: 70, duration: 3, delay: 0.5 },
          { x: 38 + Math.random() * 25, y: 48, width: 3, height: 45, duration: 2.2, delay: 0.7 },
        ]);
        
        setDealerDead(true);
        
        // Nouveau croupier après 3s
        setTimeout(() => {
          resetDealer();
        }, 3000);
      },
    });
  };

  if (screen === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ffd700', fontFamily: 'Georgia, serif', fontSize: 24,
      }}>Chargement du casino...</div>
    );
  }

  const wheelReady = profile && canSpinWheel(profile);
  const withdrawReady = profile && canWithdraw(profile);
  const nextWheelTime = profile ? (profile.lastWheelSpin || 0) + FOUR_HOURS : 0;
  const nextWithdrawTime = profile ? (profile.lastWithdraw || 0) + FOUR_HOURS : 0;

  const gameProps = {
    balance, setBalance: handleBalanceChange, minBet,
    onExit: handleExitGame, casino,
    chooseWeapon: handleUseWeapon,
    dealerProfile: currentDealer,
    dealerSplats, flyingProjectile, bloodStreams,
    dealerDead, dealerShot,
    onProjectile: handleProjectile,
    weapons: profile ? profile.weapons || [] : [],
  };

  return (
    <>
      <style>{`
        @keyframes cardDeal {
          from { transform: translate(-300px, -200px) rotate(-360deg); opacity: 0; }
          to { transform: translate(0,0) rotate(0); opacity: 1; }
        }
        @keyframes throwProjectile {
          0% { bottom: 20px; left: 50%; transform: translateX(-50%) rotate(0deg) scale(1); opacity: 1; }
          50% { bottom: 50%; transform: translateX(-50%) rotate(360deg) scale(1.3); opacity: 1; }
          100% { bottom: 75%; left: 50%; transform: translateX(-50%) rotate(720deg) scale(0.3); opacity: 0; }
        }
        @keyframes bulletFly {
          0% { bottom: 40px; transform: translateX(-50%); opacity: 1; }
          100% { bottom: 70%; transform: translateX(-50%) scale(0.3); opacity: 0; }
        }
        @keyframes rocketFly {
          0% { bottom: 20px; transform: translateX(-50%); opacity: 1; }
          90% { bottom: 65%; transform: translateX(-50%); opacity: 1; }
          100% { bottom: 70%; transform: translateX(-50%) scale(2); opacity: 0; }
        }
        @keyframes knifeFly {
          0% { bottom: 20px; transform: translateX(-50%) rotate(0deg); opacity: 1; }
          100% { bottom: 72%; transform: translateX(-50%) rotate(1080deg) scale(0.3); opacity: 0; }
        }
        @keyframes splatGrow {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes explosion {
          0% { transform: scale(0.1); opacity: 1; }
          50% { transform: scale(2); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes bloodFlow {
          0% { height: 0; opacity: 1; transform: scaleY(0); transform-origin: top; }
          100% { height: var(--final-height); opacity: 0.85; transform: scaleY(1); }
        }
        @keyframes messagePulse {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes chipDrop {
          from { transform: translateY(-20px) scale(0); }
          to { transform: translateY(0) scale(1); }
        }
        @keyframes prizeReveal {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes trophyPop {
          0% { transform: translateX(-50%) scale(0) rotate(-20deg); }
          70% { transform: translateX(-50%) scale(1.1) rotate(5deg); }
          100% { transform: translateX(-50%) scale(1) rotate(0); }
        }
        @keyframes tableShimmer {
          0% { left: -100%; }
          100% { left: 150%; }
        }
        @keyframes spinLights {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 1; box-shadow: 0 0 15px #ffd700, 0 0 30px #ff8; }
          50% { opacity: 0.6; box-shadow: 0 0 8px #ffd700; }
        }
        @keyframes peeDrop {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes peeStream {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.7; }
        }
        @keyframes drinkPose {
          0% { transform: translateX(-50%) rotate(0deg); }
          40% { transform: translateX(-50%) rotate(-40deg); }
          70% { transform: translateX(-50%) rotate(-50deg); }
          100% { transform: translateX(-50%) rotate(-20deg); }
        }
        @keyframes canThrow {
          0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(0) translateY(-200px) rotate(720deg); opacity: 0; }
        }
        @keyframes neonPulse {
          0%, 100% { text-shadow: 0 0 20px #ff00aa, 0 0 40px #ff00aa; }
          50% { text-shadow: 0 0 30px #ff00aa, 0 0 60px #ff00aa, 0 0 80px #ff00aa; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slashAnim {
          0% { transform: translateX(-20%) rotate(-8deg) skewY(-8deg); opacity: 0; }
          15% { opacity: 1; }
          70% { transform: translateX(20%) rotate(-8deg) skewY(-8deg); opacity: 1; }
          100% { transform: translateX(40%) rotate(-8deg) skewY(-8deg); opacity: 0; }
        }
      `}</style>

      {screen === 'login' && (
        <LoginScreen onLogin={handleLogin} savedProfiles={savedProfiles} />
      )}

      {screen === 'character' && profile && (
        <CharacterScreen
          profile={profile}
          balance={balance}
          setBalance={handleBalanceChange}
          saveProfile={saveProfile}
          setProfile={setProfile}
          casino={casino}
          onDone={async () => {
            const p = { ...profile, customized: true };
            setProfile(p);
            await saveProfile(p);
            setScreen('lobby');
            if (canSpinWheel(p)) setTimeout(() => setShowWheel(true), 500);
          }}
        />
      )}

      {pendingGame && (
        <TableSelector
          gameId={pendingGame}
          balance={balance}
          casino={casino}
          onCancel={() => setPendingGame(null)}
          onChoose={(min) => handleSelectGame(pendingGame, min >= 5000, min)}
        />
      )}

      {screen === 'lobby' && profile && (
        <Lobby3D
          profile={profile}
          casino={casino}
          casinoId={profile.casino}
          balance={balance}
          onSelectGame={(tableId) => handleSelectGame(tableId)}
          onLogout={handleLogout}
          onOpenTrophies={() => setShowTrophies(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenATM={() => setShowATM(true)}
          onOpenWheel={() => setShowWheel(true)}
          onOpenBar={() => setShowBar(true)}
          onOpenToilet={() => setShowToilet(true)}
          onOpenBenzBet={() => setShowBenzBet(true)}
          walletReady={withdrawReady}
          wheelReady={wheelReady}
          weapons={profile.weapons || []}
          selectedWeapon={selectedWeapon}
          setSelectedWeapon={setSelectedWeapon}
          onShoot={() => {}}
          onChangeCasino={() => setShowChangeCasino(true)}
          onOpenCharacter={() => setScreen('character')}
          onToggleVehicle={handleEquipVehicle}
        />
      )}

      {screen === 'blackjack' && <BlackjackGame {...gameProps} />}
      {screen === 'roulette' && <RouletteGame {...gameProps} />}
      {screen === 'highcard' && <HighCardGame {...gameProps} />}
      {screen === 'poker' && <PokerGame {...gameProps} />}

      {showWheel && (
        <FortuneWheel3D 
          onComplete={handleWheelComplete} 
          onClose={() => setShowWheel(false)}
          canSpin={wheelReady}
          nextSpinTime={nextWheelTime}
          casino={casino}
        />
      )}

      {showTrophies && profile && (
        <TrophyScreen profile={profile} casino={casino} onClose={() => setShowTrophies(false)} />
      )}

      {showShop && profile && (
        <Shop profile={profile} balance={balance} casino={casino}
          onBuy={handleBuyWeapon}
          onBuyVehicle={handleBuyVehicle}
          onEquipVehicle={handleEquipVehicle}
          onClose={() => setShowShop(false)} />
      )}

      {showATM && profile && (
        <ATM profile={profile} balance={balance} setBalance={handleBalanceChange}
          saveProfile={saveProfile} setProfile={setProfile}
          casino={casino} onClose={() => setShowATM(false)} />
      )}

      {showBar && profile && (
        <BarScreen balance={balance} setBalance={handleBalanceChange}
          onExit={() => setShowBar(false)} casino={casino} />
      )}

      {showToilet && (
        <ToiletScreen onExit={() => setShowToilet(false)} casino={casino} />
      )}

      {showBenzBet && profile && (
        <BenzBetScreen
          balance={balance}
          setBalance={handleBalanceChange}
          weapons={profile.weapons || []}
          username={profile.name}
          onExit={() => setShowBenzBet(false)}
          casino={casino}
        />
      )}

      {showChangeCasino && profile && (
        <ChangeCasinoScreen
          currentCasino={profile.casino}
          onChoose={async (newCasinoId) => {
            const updated = { ...profile, casino: newCasinoId, balance };
            setProfile(updated);
            setCasino(CASINOS[newCasinoId]);
            await saveProfile(updated);
            setShowChangeCasino(false);
          }}
          onCancel={() => setShowChangeCasino(false)}
        />
      )}

      {unlockedTrophy && (
        <TrophyUnlock trophy={unlockedTrophy} onClose={() => setUnlockedTrophy(null)} />
      )}
    </>
  );
}
