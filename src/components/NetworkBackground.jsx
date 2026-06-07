import React, { useEffect, useRef } from 'react';

export default function NetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const particleCount = Math.min(60, Math.floor((width * height) / 20000));
    const connectionDistance = 120;
    const mouse = { x: null, y: null, radius: 180 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce borders
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Mouse attraction / push
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.hypot(dx, dy);
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Theme aware dynamic color resolver
        const isDark = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.45)' : 'rgba(2, 132, 199, 0.3)';
        ctx.fill();
      }
    }

    // Init
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const drawConnections = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const lineColor = isDark ? 'rgba(6, 182, 212, 0.07)' : 'rgba(2, 132, 199, 0.05)';
      const mouseLineColor = isDark ? 'rgba(6, 182, 212, 0.18)' : 'rgba(2, 132, 199, 0.12)';

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Connect to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor.replace('0.07', alpha * 0.1 + '');
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect to mouse
        if (mouse.x !== null && mouse.y !== null) {
          const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (mouseDist < mouse.radius) {
            const alpha = (1 - mouseDist / mouse.radius) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = mouseLineColor.replace('0.18', alpha * 0.2 + '');
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawConnections();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
