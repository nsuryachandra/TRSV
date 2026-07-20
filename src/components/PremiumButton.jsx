import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * PremiumButton — 21st.dev-grade Component
 * Features:
 * - Shimmer sweep on hover (no magnetic translate)
 * - Colorful variant: conic-gradient rotating border
 * - Satoshi + Inter typography
 * - 5 variants: primary, secondary, glow, outline, colorful
 */
export default function PremiumButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  type = 'button',
  disabled = false,
}) {
  const [hovered, setHovered] = useState(false);

  /* ── Size Scales ── */
  const sizes = {
    sm: 'h-9 px-4 text-[13px] gap-1.5 rounded-[10px]',
    md: 'h-10 px-5 text-[14px] gap-2 rounded-[11px]',
    lg: 'h-12 px-7 text-[15px] gap-2.5 rounded-[12px]',
  };

  /* ── Variant Tokens ── */
  const variants = {
    primary: {
      base: `
        bg-blue-700 hover:bg-blue-800
        text-white font-medium tracking-tight
        border border-blue-600/40
        shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_2px_8px_rgba(29,78,216,0.3)]
        hover:shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_4px_14px_rgba(29,78,216,0.45)]
      `,
    },
    secondary: {
      base: `
        bg-white dark:bg-slate-800/80
        hover:bg-slate-50 dark:hover:bg-slate-800
        text-slate-800 dark:text-slate-100 font-medium tracking-tight
        border border-slate-200 dark:border-slate-700
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]
      `,
    },
    glow: {
      base: `
        bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400
        border border-blue-600/30 dark:border-blue-500/30
        hover:bg-blue-100/60 dark:hover:bg-blue-900/40
        hover:border-blue-600/50
        shadow-[0_0_10px_rgba(29,78,216,0.15)]
        font-medium tracking-tight
      `,
    },
    outline: {
      base: `
        bg-transparent text-slate-700 dark:text-slate-300
        border border-slate-200 dark:border-slate-700
        hover:bg-slate-50 dark:hover:bg-slate-800/50
        font-medium tracking-tight
      `,
    },
    colorful: {
      base: `text-slate-900 dark:text-white font-medium tracking-tight`,
    },
  };

  const isColorful = variant === 'colorful';

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center relative overflow-hidden isolate
        select-none focus:outline-none
        transition-all duration-200 ease-out
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${sizes[size]}
        ${!isColorful ? variants[variant]?.base : ''}
        ${className}
      `}
      style={{
        fontFamily: "'Poppins', sans-serif",
        ...(isColorful ? { padding: 0 } : {}),
      }}
    >
      {/* ── Colorful rotating conic border ── */}
      {isColorful && (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute inset-[-300%] z-0 block"
            style={{
              background: 'conic-gradient(from 0deg, #1d4ed8, #f59e0b, #2563eb, #d97706, #1d4ed8)',
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-[1.5px] z-0 bg-white dark:bg-slate-950 rounded-[9px]"
          />
          <span className={`relative z-10 flex items-center ${sizes[size]}`}>
            {icon && iconPosition === 'left' && <span className="flex items-center justify-center">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex items-center justify-center">{icon}</span>}
          </span>
        </>
      )}

      {/* ── Non-colorful variants ── */}
      {!isColorful && (
        <>
          {/* Shimmer sweep on hover */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0"
            style={{ skewX: '-12deg' }}
            animate={hovered ? { x: ['−100%', '200%'] } : { x: '-100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="block w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.span>

          {/* Button label */}
          <span className="relative z-10 flex items-center gap-2">
            {icon && iconPosition === 'left' && <span className="flex items-center">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex items-center">{icon}</span>}
          </span>

          {/* Primary: subtle top highlight strip */}
          {variant === 'primary' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-amber-400/50 blur-[1px]"
            />
          )}
        </>
      )}
    </motion.button>
  );
}
