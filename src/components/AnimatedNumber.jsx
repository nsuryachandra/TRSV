import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * AnimatedNumber — Elite counting animation with spring easing
 * Counts up from 0 → value when it enters the viewport
 */
export default function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '', 
  duration = 1200,
  className = '',
  decimals = 0
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [display, setDisplay] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isInView) return;

    const target = typeof value === 'number' ? value : parseFloat(value) || 0;

    const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplay(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isInView, value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.floor(display).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
