'use client';

import { useEffect, useRef } from 'react';

interface Props {
  src?: string;
  poster?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export default function VideoPlayer({ src, poster, onProgress, onEnded }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => {
      onProgress?.(v.currentTime, v.duration);
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [onProgress]);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-900 text-gray-400">
        No video available
      </div>
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      controls
      playsInline
      onEnded={onEnded}
      className="w-full rounded-lg bg-black"
    />
  );
}
