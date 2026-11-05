import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { playRewardVideo } from './reward-video-playback';

interface Props {
  video: HTMLVideoElement;
  muted: boolean;
  onFailure: () => void;
}

export function RewardWinVideo({ video, muted, onFailure }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const failure = useRef(onFailure);
  failure.current = onFailure;

  useEffect(() => { video.muted = muted; }, [video, muted]);

  useLayoutEffect(() => {
    const host = container.current;
    if (!host) return;
    video.setAttribute('aria-label', 'Reward celebration video');
    video.style.cssText = 'display:block;width:100%;max-height:30dvh;object-fit:contain;border-radius:8px;background:#000';
    video.muted = muted;
    host.appendChild(video);
    const stop = playRewardVideo(video, () => failure.current());
    return () => {
      stop();
      if (video.parentNode === host) host.removeChild(video);
    };
  }, [video]);

  return <Box ref={container} sx={{ mb: 2 }} />;
}
