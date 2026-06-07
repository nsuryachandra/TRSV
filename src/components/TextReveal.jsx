import React from 'react';
import { motion } from 'framer-motion';

export default function TextReveal({ text, className = '' }) {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 16,
        stiffness: 100
      }
    },
    hidden: {
      opacity: 0,
      y: 25
    }
  };

  return (
    <motion.span
      style={{ display: 'inline-flex', flexWrap: 'wrap' }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.25em] py-1">
          <motion.span
            variants={child}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
