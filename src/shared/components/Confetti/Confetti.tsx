import { useEffect, useRef } from "react";

const COLORS = ["#c9a227", "#f0c040", "#e05252", "#3aaa6e", "#6eb5ff", "#d478ff"];
const PARTICLE_COUNT = 72;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  color: string;
  w: number;
  h: number;
  alpha: number;
}

function makeParticle(canvasW: number): Particle {
  return {
    x: Math.random() * canvasW,
    y: -10 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    w: 6 + Math.random() * 8,
    h: 4 + Math.random() * 6,
    alpha: 1,
  };
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      makeParticle(canvas.offsetWidth),
    );

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      let alive = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.rot += p.rotV;
        if (p.y > canvas.offsetHeight * 0.7) p.alpha = Math.max(0, p.alpha - 0.015);

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (alive) raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 w-full h-full z-50"
      aria-hidden="true"
    />
  );
}
