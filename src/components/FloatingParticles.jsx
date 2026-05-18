import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function FloatingParticles() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    const maxParticles = 65; // Sparse, clean density that doesn't clutter the UI

    const mouse = {
      x: null,
      y: null,
      radius: 140, // Small local influence area for cursor connections
      active: false
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    handleResize();

    class CleanParticle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speedX = (Math.random() * 0.3 - 0.15); // Extremely slow, gentle drift
        this.speedY = (Math.random() * 0.3 - 0.15);
        this.size = Math.random() * 1.5 + 0.5; // Very tiny dots
        this.alpha = Math.random() * 0.12 + 0.05; // Faint, subtle opacities
      }

      update() {
        // Slow gentle float
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen boundaries gently
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Subtle mouse pull
        if (mouse.active && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 0.2;
            this.y += (dy / dist) * force * 0.2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Single curated clean color theme based on light/dark modes
        if (isDark) {
          ctx.fillStyle = `rgba(34, 211, 238, ${this.alpha})`; // Faint cyan
        } else {
          ctx.fillStyle = `rgba(14, 165, 233, ${this.alpha})`; // Faint sky-blue
        }
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new CleanParticle());
      }
    };

    const animate = () => {
      // Clear canvas fully to prevent paint streak buildup or heavy lines
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Update and draw particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // 2. Draw subtle, elegant cursor constellation line connections
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        particles.forEach((p) => {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius) {
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            
            // Faint, clean, extremely low-intensity connecting lines
            const lineAlpha = ((mouse.radius - dist) / mouse.radius) * (isDark ? 0.08 : 0.06);
            ctx.strokeStyle = isDark ? `rgba(34, 211, 238, ${lineAlpha})` : `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.lineWidth = 0.5; // Very fine line
            ctx.stroke();
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full"
    />
  );
}
