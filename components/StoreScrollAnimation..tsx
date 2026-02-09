'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import MobileStoreScroll from './MobileStoreScroll';

gsap.registerPlugin(ScrollTrigger);

export default function StoreScrollAnimation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Detect mobile on client side
  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render mobile component if on mobile
  if (isClient && isMobile) {
    return <MobileStoreScroll />;
  }

  // Desktop component continues below
  return <DesktopStoreScroll />;
}

function DesktopStoreScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // 1. Fetch Desktop Video as Blob
  useEffect(() => {
    const desktopVideoUrl = "/WhatsApp%20Video%202026-02-09%20at%201.18.17%20PM.mp4";

    const xhr = new XMLHttpRequest();
    xhr.open('GET', desktopVideoUrl, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setLoadingProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    };

    xhr.send();

    return () => {
      xhr.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, []);

  // 2. Setup Animation once Video is Ready
  useEffect(() => {
    if (!blobUrl || !containerRef.current || !canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Setup video source from blob
    video.src = blobUrl;
    video.load();

    const onLoadedMetadata = () => {
      setIsReady(true);
      // Determine efficient dimensions
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render(); // Initial Frame
      initScrollAnimation();
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);

    // -- Render Loop --
    const render = () => {
      if (!ctx || !video) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;

      // Desktop: Contain (Show full context, avoid zoom/crop)
      const scale = Math.min(w / vw, h / vh);

      // Optional: If 'contain' leaves too much black space, we can manually scale up slightly
      // But user complained about "too zoomed", so pure contain is safest.

      const rw = vw * scale;
      const rh = vh * scale;

      const cx = (w - rw) / 2;
      const cy = (h - rh) / 2;

      ctx.drawImage(video, cx, cy, rw, rh);
    };

    // -- GSAP Setup --
    let ctxGsap: gsap.Context;

    const initScrollAnimation = () => {
      ctxGsap = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=1500%',
            scrub: 1,
            pin: true,
          },
        });

        // Robust duration check
        const vDur = (isFinite(video.duration) && video.duration > 0) ? video.duration : 20;

        // --- Video Scrubbing ---
        tl.to(video, {
          currentTime: vDur - 0.05,
          duration: vDur,
          ease: 'none',
          onUpdate: render,
        }, 0);

        // --- Content Sync ---
        const [slide1, slide2, slide3] = contentRefs.current;

        if (slide1 && slide2 && slide3) {
          gsap.set([slide1, slide2, slide3], { autoAlpha: 0, y: 30 });

          // Intro (0% - 20%)
          tl.to(slide1, { autoAlpha: 1, y: 0, duration: vDur * 0.1 }, 0)
            .to(slide1, { autoAlpha: 0, y: -30, duration: vDur * 0.1 }, vDur * 0.2);

          // ZenZebra Air (30% - 60%)
          tl.to(slide2, { autoAlpha: 1, y: 0, duration: vDur * 0.1 }, vDur * 0.3)
            .to(slide2, { autoAlpha: 0, y: -30, duration: vDur * 0.1 }, vDur * 0.6);

          // Outro (75% - 100%)
          tl.to(slide3, { autoAlpha: 1, y: 0, duration: vDur * 0.1 }, vDur * 0.75);
        }

      }, containerRef);
    };

    // Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      window.removeEventListener('resize', handleResize);
      if (ctxGsap) ctxGsap.revert();
    };
  }, [blobUrl]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">

      {/* Hidden Video Source */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* Minimal Loading Overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full object-cover" />

      {/* Content Layers */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* SLIDE 1: INTRO */}
        <div
          ref={(el) => { contentRefs.current[0] = el; }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 opacity-0 will-change-transform"
        >
          <h1 className="text-6xl md:text-9xl font-medium tracking-tighter text-white mb-4 drop-shadow-2xl">
            IMMERSIVE
          </h1>
          <p className="text-xl text-white/70 font-light tracking-widest uppercase">
            The New Standard
          </p>
        </div>

        {/* SLIDE 2: PRODUCT A */}
        <div
          ref={(el) => { contentRefs.current[1] = el; }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 opacity-0 will-change-transform"
        >
          <h2 className="text-5xl md:text-8xl font-medium text-white mb-8 tracking-tight">
            ZenZebra Air
          </h2>
          <button className="pointer-events-auto px-10 py-4 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform">
            Shop Now
          </button>
        </div>

        {/* SLIDE 3: OUTRO */}
        <div
          ref={(el) => { contentRefs.current[2] = el; }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 opacity-0 will-change-transform"
        >
          <h2 className="text-5xl md:text-8xl font-medium text-white mb-8 tracking-tight">
            The Future
          </h2>
          <button className="pointer-events-auto px-10 py-4 border border-white text-white text-lg font-bold rounded-full hover:bg-white hover:text-black transition-colors">
            Watch Film
          </button>
        </div>

      </div>
    </div>
  );
}
