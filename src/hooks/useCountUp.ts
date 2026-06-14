import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useCountUp(target: number, duration = 900): number {
  // Inicia já no alvo quando há redução de movimento (ou SSR); caso contrário
  // parte do zero — evita o flash de valor cheio antes da animação no mount.
  const [displayed, setDisplayed] = useState(() =>
    prefersReducedMotion() || typeof window === 'undefined' ? target : 0,
  );
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
      setDisplayed(target);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(target * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return displayed;
}
