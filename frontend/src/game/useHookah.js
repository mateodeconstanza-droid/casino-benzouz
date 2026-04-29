import { useState, useCallback } from 'react';

// ============================================================
// useHookah — hook custom partagé entre Casino/Ville/Maison
// Encapsule l'état d'utilisation de la chicha (3s tube + 4s fumée = 7s total)
// ============================================================
export const useHookah = (profile) => {
  const equippedHookah = profile?.equippedHookah;
  const hasHookah = !!equippedHookah && (profile?.hookahs || []).includes(equippedHookah);
  const [usingHookah, setUsingHookah] = useState(false);
  const useHookah = useCallback(() => {
    if (!hasHookah || usingHookah) return;
    setUsingHookah(true);
    setTimeout(() => setUsingHookah(false), 7000);
  }, [hasHookah, usingHookah]);
  return { equippedHookah, hasHookah, usingHookah, useHookah };
};

export default useHookah;
