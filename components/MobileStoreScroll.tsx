'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function MobileStoreScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isIOS, setIsIOS] = useState(false);

    // Detect iOS
    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(ua);
        setIsIOS(isIosDevice);
    }, []);

    // 1. Fetch Video Source
    useEffect(() => {
        const videoUrl = "/WhatsApp%20Video%202026-02-09%20at%201.18.17%20PM(2).mp4";

        if (isIOS) {
            // iOS: Fetch as Blob for smooth seeking on canvas
            const xhr = new XMLHttpRequest();
            xhr.open('GET', videoUrl, true);
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
        } else {
            // Android/Desktop: Use direct URL for native streaming (smoothest)
            setBlobUrl(videoUrl);
            setIsReady(true);
        }
    }, [isIOS]);

    // 2. Setup Animation
    useEffect(() => {
        if (!blobUrl || !containerRef.current || !videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current; // might be null on non-iOS
        let ctx: CanvasRenderingContext2D | null = null;

        if (isIOS && canvas) {
            ctx = canvas.getContext('2d');
        }

        video.src = blobUrl;
        video.load();

        let ctxGsap: gsap.Context;

        // Render function (iOS only)
        const render = () => {
            if (!ctx || !video || !isIOS || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = canvas.width;
            const h = canvas.height;
            const vw = video.videoWidth || 1080;
            const vh = video.videoHeight || 1920;

            const scale = Math.max(w / vw, h / vh);
            const rw = vw * scale;
            const rh = vh * scale;
            const cx = (w - rw) / 2;
            const cy = (h - rh) / 2;

            ctx.drawImage(video, cx, cy, rw, rh);
        };

        const initScrollAnimation = () => {
            ScrollTrigger.config({
                ignoreMobileResize: true,
                autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
            });

            ctxGsap = gsap.context(() => {
                const vDur = (isFinite(video.duration) && video.duration > 0) ? video.duration : 20;

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top top',
                        end: '+=5000',
                        scrub: 1.5,
                        pin: true,
                        invalidateOnRefresh: true,
                    },
                });

                tl.to(video, {
                    currentTime: vDur - 0.1,
                    duration: 1,
                    ease: 'none',
                    onUpdate: render,
                });

            }, containerRef);

            ScrollTrigger.refresh();
        };

        const onLoadedMetadata = () => {
            setIsReady(true);

            if (isIOS && canvas && ctx) {
                // iOS: Setup Canvas and Scroll Animation
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                render();
                initScrollAnimation();
            } else {
                // Android/Desktop: Native Loop (Start -> End)
                // Reverse playback (yoyo) creates lag on mobile due to keyframe decoding
                // So we stick to a smooth forward native loop for best performance
                video.play().catch(e => console.log('Autoplay blocked', e));
            }
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);

        const handleResize = () => {
            if (isIOS && canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                render();
                ScrollTrigger.refresh();
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (ctxGsap) ctxGsap.revert();
        };
    }, [blobUrl, isIOS]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-[100dvh] bg-black ${isIOS ? 'overflow-y-scroll' : 'overflow-hidden'}`}
            style={isIOS ? {
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch'
            } : undefined}
        >
            {/* Video Source - Visible on Non-iOS */}
            <video
                ref={videoRef}
                muted
                playsInline
                preload="auto"
                loop={!isIOS} // Enable native loop for non-iOS
                autoPlay={!isIOS} // Enable native autoplay for non-iOS
                className={isIOS ? "hidden" : "absolute inset-0 w-full h-full object-cover"}
                style={isIOS ? { display: 'none' } : undefined}
            />

            {/* Loading Overlay */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mb-4" />
                        <p className="text-white/50 text-sm">{loadingProgress}%</p>
                    </div>
                </div>
            )}

            {/* Canvas - Only for iOS Scroll Animation */}
            {isIOS && (
                <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
            )}
        </div>
    );
}
