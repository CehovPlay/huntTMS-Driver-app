import { useEffect, useRef, useState } from 'react';

// Eases a number from 0 → target once on mount (easeOutCubic). Cross-platform
// (rAF-driven), cheap — a handful of re-renders over `duration`ms.
export function useCountUp(target: number, duration = 700): number {
  const [v, setV] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setV(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return v;
}
