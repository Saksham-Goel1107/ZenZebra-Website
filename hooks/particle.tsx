'use client'
import { useCallback, useRef } from "react";
import { useCanvas } from "./useCanvas";

class Particle {

    x: number;
    y: number;
    velocity: {x:number, y:number};
    radius: number;
    color: string

    constructor(ctx:CanvasRenderingContext2D){
        this.x = Math.random() * ctx.canvas.width;
        this.y = Math.random() * ctx.canvas.height;
        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
        }
        this.radius = Math.random() * 3 + 1.5;
        this.color = `rgba(${Math.random()*100 + 155}, ${Math.random()*100 + 155}, ${Math.random()*100 + 155}, 
        0.9)`  // 'a' refers to alpha which represents the opacity of color
    }

    //to update positions
    update(ctx:CanvasRenderingContext2D){
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if(this.x<0 || this.x>ctx.canvas.width) this.velocity.x *= -1;
        if(this.y<0 || this.y>ctx.canvas.height) this.velocity.y *= -1;

    }

    //to draw new particles
    draw(ctx:CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

//to render a new particle to canvas

export function ParticleCanvas() {
  const particles = useRef<Particle[]>([]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Initialize particles - reduced count for performance
    if (particles.current.length === 0) {
      // Use fewer particles on mobile/smaller screens if possible, 
      // but hard to detect here without resize listener. 
      // Safe default: 35 instead of 50
      particles.current = Array.from({ length: 35 }, () => new Particle(ctx));
    }

    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.06)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Update and draw particles
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    particles.current.forEach(particle => {
      // Pass dimensions explicitly to avoid property access overhead
      particle.update(ctx); 
      particle.draw(ctx);
    });

    // Create gradient connection lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < particles.current.length; i++) {
      for (let j = i; j < particles.current.length; j++) {
        const dx = particles.current[i].x - particles.current[j].x;
        const dy = particles.current[i].y - particles.current[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(particles.current[i].x, particles.current[i].y);
          ctx.lineTo(particles.current[j].x, particles.current[j].y);
          ctx.stroke();
        }
      }
    }
  }, []);

  const canvasRef = useCanvas(draw);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
    />
  );
}