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

    let cachedScale = 1, cachedCx = 0, cachedCy = 0, cachedRw = 0, cachedRh = 0;

    const updateIOSSize = () => {
      if (!canvas || !video) return;
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);

      const w = canvas.width;
      const h = canvas.height;
      const vw = video.videoWidth || 1080;
      const vh = video.videoHeight || 1920;

      const containScale = Math.min(w / vw, h / vh);
      const coverScale = Math.max(w / vw, h / vh);
      cachedScale = containScale + (coverScale - containScale) * 0.2;

      cachedRw = vw * cachedScale;
      cachedRh = vh * cachedScale;
      cachedCx = (w - cachedRw) / 2;
      cachedCy = (h - cachedRh) / 2;
    };

    const render = () => {
      if (!ctx || !video || !isIOS || !canvas || video.readyState < 2) return;

      const lerpFactor = 0.06;
      state.current.currentTime +=
        (state.current.targetTime - state.current.currentTime) * lerpFactor;

      // Higher threshold to reduce lag on mobile
      if (Math.abs(state.current.currentTime - state.current.lastAppliedTime) > 0.05) {
        video.currentTime = state.current.currentTime;
        state.current.lastAppliedTime = state.current.currentTime;
      }

      ctx.drawImage(video, cachedCx, cachedCy, cachedRw, cachedRh);
    };

    const initIOS = () => {
      updateIOSSize();
      setIsReady(true);

      ctxGsap = gsap.context(() => {
        const vDur = video.duration || 6;
        ScrollTrigger.create({
          trigger: isBackground ? 'html' : containerRef.current,
          start: 'top top',
          end: isBackground ? 'bottom bottom' : '+=100%',
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
      // Content removed as per user request

      video.play().catch(() => { });
    };

    const onLoaded = () => {
      if (isIOS) initIOS();
      else initAndroid();
    };

    video.addEventListener('loadedmetadata', onLoaded);
    window.addEventListener('resize', updateIOSSize);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      window.removeEventListener('resize', updateIOSSize);
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
            objectFit: 'contain', // Changed to contain to avoid cropping
            display: isIOS ? 'none' : 'block',
          }}
        />
      </div>

      {!isIOS && <div className="absolute inset-0 bg-black/40 z-[1]" />}
      {isIOS && <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />}

      {/* Overlays removed as per user request */}

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
            {/* Loader text removed as per user request */}
          </div>
        </div>
      )}
    </div>
  );
}
