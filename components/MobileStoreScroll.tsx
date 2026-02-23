'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function MobileStoreScroll({ isBackground }: { isBackground: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  const state = useRef({
    targetTime: 0,
    currentTime: 0,
    lastAppliedTime: -1,
  });

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);
  }, []);

  useEffect(() => {
    const videoUrl = 'IMG_9541.mp4';

    if (isIOS) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', videoUrl, true);
      xhr.responseType = 'blob';
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          setLoadingProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          setBlobUrl(URL.createObjectURL(xhr.response));
        }
      };
      xhr.send();
      return () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      };
    } else {
      setBlobUrl(videoUrl);
      setIsReady(true);
    }
  }, [isIOS]);

  useEffect(() => {
    if (!blobUrl || !containerRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = isIOS && canvas ? canvas.getContext('2d', { alpha: false }) : null;

    video.src = blobUrl;
    video.load();

    let ctxGsap: gsap.Context;
    let frameId: number;

    const render = () => {
      if (!ctx || !video || !isIOS || !canvas || video.readyState < 2) return;

      const lerpFactor = 0.06;
      state.current.currentTime +=
        (state.current.targetTime - state.current.currentTime) * lerpFactor;

      if (Math.abs(state.current.currentTime - state.current.lastAppliedTime) > 0.03) {
        video.currentTime = state.current.currentTime;
        state.current.lastAppliedTime = state.current.currentTime;
      }

      const w = canvas.width;
      const h = canvas.height;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // SMART SCALE: A balanced compromise between "contain" and "cover"
      // It zooms in enough to reduce empty space but doesn't crop the subject
      const containScale = Math.min(w / vw, h / vh);
      const coverScale = Math.max(w / vw, h / vh);
      const scale = containScale + (coverScale - containScale) * 0.4; // 40% zoom towards cover

      const rw = vw * scale;
      const rh = vh * scale;
      const cx = (w - rw) / 2;
      const cy = (h - rh) / 2;

      ctx.drawImage(video, cx, cy, rw, rh);
    };

    const initIOS = () => {
      canvas!.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas!.height = window.innerHeight * (window.devicePixelRatio || 1);
      setIsReady(true);

      ctxGsap = gsap.context(() => {
        const vDur = video.duration || 6;
        ScrollTrigger.create({
          trigger: isBackground ? 'html' : containerRef.current,
          start: 'top top',
          end: isBackground ? 'bottom bottom' : '+=1500',
          pin: !isBackground,
          scrub: true,
          onUpdate: (self) => {
            state.current.targetTime = self.progress * (vDur - 0.1);
          },
        });

        const tick = () => {
          render();
          frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);
      }, containerRef);
    };

    const initAndroid = () => {
      ctxGsap = gsap.context(() => {
        const tl = gsap.timeline({ repeat: -1 });
        const slides = contentRefs.current;
        gsap.set(slides, { autoAlpha: 0, y: 20 });
        slides.forEach((slide, i) => {
          if (!slide) return;
          tl.to(slide, { autoAlpha: 1, y: 0, duration: 0.8 }).to(
            slide,
            { autoAlpha: 0, y: -20, duration: 0.8 },
            '+=1.5',
          );
        });
      }, containerRef);
      video.play().catch(() => { });
    };

    const onLoaded = () => {
      if (isIOS) initIOS();
      else initAndroid();
    };

    video.addEventListener('loadedmetadata', onLoaded);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      if (ctxGsap) ctxGsap.revert();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [blobUrl, isIOS]);

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] bg-black overflow-hidden">
      {/*
                For Android, we use a custom scale wrapper to mimic the "Smart Scale"
                since CSS object-fit doesn't support interpolating between contain and cover
            */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${isIOS ? 'hidden' : 'block'}`}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          loop={!isIOS}
          autoPlay={!isIOS}
          className="w-full h-full"
          style={{
            objectFit: 'cover',
            // We scale the video component itself down slightly if it's too cropped
            transform: 'scale(0.85)',
            display: isIOS ? 'none' : 'block',
          }}
        />
      </div>

      {!isIOS && <div className="absolute inset-0 bg-black/40 z-[1]" />}
      {isIOS && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />}

      {!isBackground && !isIOS && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pointer-events-none">
          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-30">
            <div className="w-[1px] h-8 bg-gradient-to-b from-white to-transparent" />
            <span className="text-[7px] uppercase tracking-[0.5em] text-white">SCROLL</span>
          </div>
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">ZenZebra...</span>
          </div>
        </div>
      )}
    </div>
  );
}
