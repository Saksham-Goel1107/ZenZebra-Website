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

    let cachedScale = 1, cachedCx = 0, cachedCy = 0, cachedRw = 0, cachedRh = 0;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const cw = canvas.width;
      const ch = canvas.height;
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;

      const containScale = Math.min(cw / vw, ch / vh);
      const coverScale = Math.max(cw / vw, ch / vh);
      cachedScale = containScale + (coverScale - containScale) * 0.2;

      cachedRw = vw * cachedScale;
      cachedRh = vh * cachedScale;
      cachedCx = (cw - cachedRw) / 2;
      cachedCy = (ch - cachedRh) / 2;
    };

    const render = () => {
      if (!ctx || !video || video.readyState < 2) return;

      const lerpFactor = 0.08;
      state.current.currentTime +=
        (state.current.targetTime - state.current.currentTime) * lerpFactor;

      // Higher threshold to reduce lag from excessive seeking
      if (Math.abs(state.current.currentTime - state.current.lastAppliedTime) > 0.04) {
        video.currentTime = state.current.currentTime;
        state.current.lastAppliedTime = state.current.currentTime;
      }

      ctx.drawImage(video, cachedCx, cachedCy, cachedRw, cachedRh);
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

        // Content removed as per user request to not display text on top


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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Dynamic Overlay Gradient - More subtle & premium */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-[1] pointer-events-none" />

      {/* Overlays removed as per user request */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="w-16 h-16 border-[1px] border-white/5 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-t-[1px] border-red-600 rounded-full animate-spin" />
            </div>
            {/* Loader text removed as per user request */}
          </div>
        </div>
      )}
    </div>
  );
}
