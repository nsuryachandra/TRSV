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
        bg-gradient-to-b from-sky-500 to-blue-600
        hover:from-sky-400 hover:to-blue-500
        text-white font-semibold tracking-tight
        border border-sky-400/40
        shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_-1px_0_rgba(0,0,0,0.15)_inset,0_4px_12px_-2px_rgba(14,165,233,0.45)]
        hover:shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_-1px_0_rgba(0,0,0,0.15)_inset,0_8px_24px_-4px_rgba(14,165,233,0.6)]
      `,
    },
    secondary: {
      base: `
        bg-white/80 dark:bg-slate-900/60
        hover:bg-white dark:hover:bg-slate-800/80
        text-slate-800 dark:text-slate-100 font-medium tracking-tight
        border border-slate-200/80 dark:border-slate-700/60
        shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_2px_8px_-2px_rgba(0,0,0,0.08)]
        hover:shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_-1px_0_rgba(0,0,0,0.04)_inset,0_4px_16px_-4px_rgba(0,0,0,0.12)]
        backdrop-blur-sm
      `,
    },
    glow: {
      base: `
        bg-transparent text-cyan-600 dark:text-cyan-400
        border border-cyan-400/40 dark:border-cyan-500/30
        hover:bg-cyan-500/8 dark:hover:bg-cyan-500/10
        hover:border-cyan-400/70
        shadow-[0_0_12px_-4px_rgba(6,182,212,0.3)]
        hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.5)]
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
      base: `text-slate-800 dark:text-white font-semibold tracking-tight`,
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
        fontFamily: "'Satoshi', 'Inter', sans-serif",
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
              background: 'conic-gradient(from 0deg, #06b6d4, #6366f1, #f43f5e, #f59e0b, #06b6d4)',
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
            <span className="block w-1/3 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </motion.span>

          {/* Button label */}
          <span className="relative z-10 flex items-center gap-2">
            {icon && iconPosition === 'left' && <span className="flex items-center">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex items-center">{icon}</span>}
          </span>

          {/* Primary: subtle bottom glow strip */}
          {variant === 'primary' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-cyan-200/60 blur-[1px]"
            />
          )}
        </>
      )}
    </motion.button>
  );
}
