"use client";

import { useEffect, useRef, useState } from "react";

type LazyVideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
};

export default function LazyVideo({ src, className, ...props }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const loadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            loadObserver.disconnect();
          }
        });
      },
      { rootMargin: "400px" } 
    );

    const playObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {
            });
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.1 }
    );

    loadObserver.observe(videoEl);
    playObserver.observe(videoEl);

    return () => {
      loadObserver.disconnect();
      playObserver.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={shouldLoad ? src : undefined} 
      className={className}
      muted
      loop
      playsInline
      preload={shouldLoad ? "auto" : "none"}
      {...props}
    />
  );
}
