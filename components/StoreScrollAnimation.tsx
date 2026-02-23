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
    const desktopVideoUrl = '/IMG_9541.mp4';
    const xhr = new XMLHttpRequest();
    xhr.open('GET', desktopVideoUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status === 200) {
        setBlobUrl(URL.createObjectURL(xhr.response));
      }
    };
    xhr.send();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
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
      state.current.currentTime +=
        (state.current.targetTime - state.current.currentTime) * lerpFactor;

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
            trigger: isBackground ? 'html' : containerRef.current,
            start: 'top top',
            end: isBackground ? 'bottom bottom' : '+=300%',
            pin: !isBackground,
            scrub: true,
            onUpdate: (self) => {
              state.current.targetTime = self.progress * (state.current.vDur - 0.1);
            },
          },
        });

        if (!isBackground) {
          const [slide1, slide2, slide3] = contentRefs.current;
          if (slide1 && slide2 && slide3) {
            gsap.set([slide1, slide2, slide3], { opacity: 0, scale: 0.9, y: 40 });

            // Apple-style Sequence
            // Slide 1 In
            tl.to(slide1, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 0.2);
            // Slide 1 Out
            tl.to(slide1, { opacity: 0, scale: 1.1, y: -40, duration: 0.8 }, 1.0);

            // Slide 2 In
            tl.to(slide2, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 1.3);
            // Slide 2 Out
            tl.to(slide2, { opacity: 0, scale: 1.1, y: -40, duration: 0.8 }, 2.1);

            // Slide 3 In
            tl.to(slide3, { opacity: 1, scale: 1, y: 0, duration: 0.8 }, 2.4);
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

      {/* Dynamic Overlay Gradient - More subtle & premium */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-[1] pointer-events-none" />

      {!isBackground && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
            <div className="w-[1px] h-16 bg-gradient-to-b from-white via-white/50 to-transparent" />
            <span className="text-[8px] uppercase tracking-[0.8em] text-white rotate-90 origin-left ml-1 translate-y-4">SCROLL</span>
          </div>
        </div>
      )}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="w-16 h-16 border-[1px] border-white/5 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-t-[1px] border-red-600 rounded-full animate-spin" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.8em] text-white/20 animate-pulse">ZenZebra India</span>
          </div>
        </div>
      )}
    </div>
  );
}
