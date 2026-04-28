// =============================================================
// useLookControls — pointer lock PC + touch drag mobile
// =============================================================
// Utilisation : appeler ce hook dans une scène 3D (Street3D, Lobby3D).
// - Sur PC : un click sur le canvas active le pointer lock, mousemove tourne la caméra
// - Sur mobile : drag tactile (1 doigt) sur le canvas tourne la caméra
// - Met à jour stateRef.current.player.rotY directement
//
// Paramètres :
// - mountRef : ref vers le div container du canvas
// - stateRef : ref qui contient { player: { rotY } }
// - sensitivity : { mouse: 0.0025, touch: 0.005 } (par défaut)
// - excludeSelectors : tableau de sélecteurs CSS où le drag ne doit PAS rotater (ex. boutons HUD)
//
// Retour : { isLocked } pour afficher un indicateur visuel
import { useEffect, useState } from 'react';

export const useLookControls = (mountRef, stateRef, opts = {}) => {
  const sensitivity = opts.sensitivity || { mouse: 0.0025, touch: 0.006 };
  const excludeSelectors = opts.excludeSelectors || ['button', '[data-no-look]', '.hud-control', '[data-testid$="-modal"]'];
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;

    // Helper : check si target est dans une zone d'exclusion (HUD, boutons)
    const isExcluded = (target) => {
      if (!target) return false;
      for (const sel of excludeSelectors) {
        if (target.closest && target.closest(sel)) return true;
      }
      return false;
    };

    // === POINTER LOCK PC (mouse) ===
    const onClick = (e) => {
      if (isExcluded(e.target)) return;
      // Demande le pointer lock sur le container
      if (el.requestPointerLock) {
        try { el.requestPointerLock(); } catch (_e) { /* ignore */ }
      }
    };
    const onLockChange = () => {
      setIsLocked(document.pointerLockElement === el);
    };
    const onMouseMove = (e) => {
      if (document.pointerLockElement !== el) return;
      const dx = e.movementX || 0;
      if (stateRef.current?.player) {
        // Rotation horizontale uniquement (yaw)
        stateRef.current.player.rotY -= dx * sensitivity.mouse;
      }
    };

    // === TOUCH DRAG MOBILE ===
    let lastTouchX = null;
    let touchId = null;
    const onTouchStart = (e) => {
      if (isExcluded(e.target)) return;
      // Premier doigt qui touche dans la zone de la caméra
      const t = e.touches[0];
      if (!t) return;
      touchId = t.identifier;
      lastTouchX = t.clientX;
    };
    const onTouchMove = (e) => {
      if (touchId === null) return;
      // Cherche le doigt suivi
      let touch = null;
      for (const t of e.touches) {
        if (t.identifier === touchId) { touch = t; break; }
      }
      if (!touch) return;
      const dx = touch.clientX - lastTouchX;
      lastTouchX = touch.clientX;
      if (stateRef.current?.player) {
        stateRef.current.player.rotY -= dx * sensitivity.touch;
      }
    };
    const onTouchEnd = (e) => {
      // Si le doigt suivi se lève, on reset
      let stillThere = false;
      for (const t of e.touches) {
        if (t.identifier === touchId) { stillThere = true; break; }
      }
      if (!stillThere) {
        touchId = null; lastTouchX = null;
      }
    };

    el.addEventListener('click', onClick);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onLockChange);

    return () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      if (document.pointerLockElement === el && document.exitPointerLock) {
        try { document.exitPointerLock(); } catch (_e) { /* ignore */ }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountRef, stateRef, sensitivity.mouse, sensitivity.touch]);

  return { isLocked };
};
