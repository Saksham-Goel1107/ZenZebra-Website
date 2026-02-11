'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import MobileStoreScroll from './MobileStoreScroll';

gsap.registerPlugin(ScrollTrigger);

export default function StoreScrollAnimation({ isBackground = false }: { isBackground?: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isClient && isMobile) {
    return <MobileStoreScroll isBackground={isBackground} />;
  }

  return <DesktopStoreScroll isBackground={isBackground} />;
}

function DesktopStoreScroll({ isBackground }: { isBackground: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [isReady, setIsReady] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const state = useRef({
    targetTime: 0,
    currentTime: 0,
    vDur: 0,
    lastAppliedTime: -1,
  });

  useEffect(() => {
    const desktopVideoUrl = "/IMG_9541.mp4";
    const xhr = new XMLHttpRequest();
    xhr.open('GET', desktopVideoUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status === 200) {
        setBlobUrl(URL.createObjectURL(xhr.response));
      }
    };
    xhr.send();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, []);

  useEffect(() => {
    if (!blobUrl || !containerRef.current || !canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    video.src = blobUrl;
    video.load();

    let ctxGsap: gsap.Context;
    let frameId: number;

    const updateSize = () => {
      // 1:1 pixel mapping is smoothest, higher resolution is just overhead
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const render = () => {
      if (!ctx || !video || video.readyState < 2) return;

      // Increased lerpFactor for snappier response
      const lerpFactor = 0.08;
      state.current.currentTime += (state.current.targetTime - state.current.currentTime) * lerpFactor;

      // Threshold check: Don't seek unless the change is at least roughly 1 frame
      if (Math.abs(state.current.currentTime - state.current.lastAppliedTime) > 0.02) {
        video.currentTime = state.current.currentTime;
        state.current.lastAppliedTime = state.current.currentTime;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const scale = Math.max(cw / vw, ch / vh);
      const rw = vw * scale;
      const rh = vh * scale;
      const cx = (cw - rw) / 2;
      const cy = (ch - rh) / 2;

      ctx.drawImage(video, cx, cy, rw, rh);
    };

    const init = () => {
      updateSize();
      state.current.vDur = video.duration || 6;
      setIsReady(true);

      ctxGsap = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: isBackground ? "html" : containerRef.current,
            start: "top top",
            end: isBackground ? "bottom bottom" : "+=300%",
            pin: !isBackground,
            scrub: true,
            onUpdate: (self) => {
              state.current.targetTime = self.progress * (state.current.vDur - 0.1);
            }
          }
        });

        if (!isBackground) {
          const [slide1, slide2, slide3] = contentRefs.current;
          if (slide1 && slide2 && slide3) {
            gsap.set([slide1, slide2, slide3], { autoAlpha: 0, y: 30 });
            tl.to(slide1, { autoAlpha: 1, y: 0, duration: 1 }, 0.1)
              .to(slide1, { autoAlpha: 0, y: -30, duration: 1 }, 0.8);
            tl.to(slide2, { autoAlpha: 1, y: 0, duration: 1 }, 1.2)
              .to(slide2, { autoAlpha: 0, y: -30, duration: 1 }, 2.0);
            tl.to(slide3, { autoAlpha: 1, y: 0, duration: 1 }, 2.4);
          }
        }

        const tick = () => {
          render();
          frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
      });
    };

    video.addEventListener('loadedmetadata', init);
    window.addEventListener('resize', updateSize);
    document.documentElement.style.scrollBehavior = 'auto';

    return () => {
      video.removeEventListener('loadedmetadata', init);
      window.removeEventListener('resize', updateSize);
      if (ctxGsap) ctxGsap.revert();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [blobUrl]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">
      <video ref={videoRef} muted playsInline className="hidden" style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />
      {!isBackground && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div ref={el => { contentRefs.current[0] = el; }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-5xl md:text-8xl font-bold text-white mb-4 uppercase italic">Revolutionizing</h2>
            <p className="text-xl md:text-2xl text-white/80 uppercase tracking-widest">The Retail Experience</p>
          </div>
          <div ref={el => { contentRefs.current[1] = el; }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-5xl md:text-8xl font-bold text-white mb-4 uppercase italic">Curated Spaces</h2>
            <p className="text-xl md:text-2xl text-white/80 uppercase tracking-widest">Modernity Meets Zebra</p>
          </div>
          <div ref={el => { contentRefs.current[2] = el; }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-5xl md:text-8xl font-bold text-white mb-6 uppercase italic">Join the Stripe</h2>
            {/* <Link href="/catalogue" className="pointer-events-auto px-12 py-4 bg-white text-black font-bold rounded-full">Explore Collection</Link> */}
          </div>
        </div>
      )}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
