import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * GlassCard — Elite 2025 Glassmorphism with:
 * - Precision 3D magnetic tilt (spring-physics, no jitter)
 * - Spotlight radial gradient that follows cursor
 * - Subtle grain texture overlay on hover
 * - Framer Motion entrance animation (once-per-viewport)
 */
export default function GlassCard({ 
  children, 
  className = '', 
  contentClassName = '',
  hoverEffect = true,
  delay = 0,
  onClick,
  spotlight = true
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const rafRef = useRef(null);

  // Extract layout/alignment classes to apply to inner container
  const layoutClasses = className
    .split(/\s+/)
    .filter(c => 
      c.startsWith('items-') || 
      c.startsWith('justify-') || 
      c.startsWith('text-center') || 
      c.startsWith('text-left') || 
      c.startsWith('text-right') || 
      c.startsWith('gap-')
    )
    .join(' ');

  const cardVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 18,
        delay: delay
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!hoverEffect || !cardRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      // Subtle 8-degree max tilt — feels premium, not toy-like
      setTilt({ x: -dy * 8, y: dx * 8 });

      // Spotlight position
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      setGlare({ x: px, y: py, opacity: 1 });
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTilt({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      whileTap={hoverEffect ? { scale: 0.985 } : {}}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        rotateX: hoverEffect ? tilt.x : 0,
        rotateY: hoverEffect ? tilt.y : 0,
        perspective: 1200,
      }}
      className={`
        rounded-2xl transition-colors duration-200 group
        glass-panel-light dark:glass-panel-dark
        glass-card-border-light dark:glass-card-border-dark
        shadow-premium-light dark:shadow-premium-dark
        relative overflow-hidden isolate
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Spotlight glare — follows cursor */}
      {hoverEffect && spotlight && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: glare.opacity * 0.12,
            background: `radial-gradient(320px circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.9) 0%, rgba(6,182,212,0.2) 40%, transparent 70%)`
          }}
        />
      )}

      {/* Subtle top edge highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px z-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          opacity: 0.7
        }}
      />

      <div className={`relative z-10 w-full h-full flex flex-col ${layoutClasses} ${contentClassName}`}>
        {children}
      </div>
    </motion.div>
  );
}
