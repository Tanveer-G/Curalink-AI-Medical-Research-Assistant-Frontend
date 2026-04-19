import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 → target over `duration` ms using easeOutExpo.
 * Returns the current display value.
 */
export function useCountUp(target: number, duration = 900, delay = 0): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let startTime: number | null = null;
    const start = 0;

    const delayTimer = setTimeout(() => {
      const animate = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setValue(Math.round(start + (target - start) * eased));
        if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(rafRef.current);
      setValue(0);
    };
  }, [target, duration, delay]);

  return value;
}
