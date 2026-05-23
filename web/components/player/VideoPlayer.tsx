'use client';

import { useEffect, useRef } from 'react';

interface Props {
  src?: string;
  poster?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

const isHls = (src?: string) => !!src && /\.m3u8(\?|$)/i.test(src);

export default function VideoPlayer({ src, poster, onProgress, onEnded }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  // Attach HLS.js if the source is an HLS playlist and the browser can't play it natively (e.g. Chrome).
  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    let hls: any = null;

    if (isHls(src)) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        (async () => {
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
          } else {
            video.src = src;
          }
        })();
      }
    } else {
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => onProgress?.(v.currentTime, v.duration);
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
      poster={poster}
      controls
      playsInline
      onEnded={onEnded}
      className="w-full rounded-lg bg-black"
    />
  );
}
