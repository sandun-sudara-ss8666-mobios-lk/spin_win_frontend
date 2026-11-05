import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline, Box, Button, Typography, Alert, TextField, MenuItem } from '@mui/material';
import { theme } from './src/theme/theme';
import { wheelApi, rewardsApi } from './src/api';
import { API_BASE_URL } from './src/api/client';
import { RewardVideoCache } from './src/components/wheel/reward-video-cache';
import { WinnerCelebrationModal } from './src/components/wheel/WinnerCelebrationModal';
import type { SpinResult, WheelSliceVisual } from './src/types';

function VideoPopupTest() {
  const [cache] = useState(() => new RewardVideoCache(API_BASE_URL, window.location.origin));
  const [slices, setSlices] = useState<WheelSliceVisual[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [result, setResult] = useState<SpinResult | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState('Fetching the active wheel…');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    wheelApi.getActiveDisplay().then(config => {
      if (!active) return;
      const enabled = Array.from(new Map(config.slices
        .filter(slice => slice.isVideoShow && slice.videoUrl && slice.rewardId)
        .map(slice => [slice.rewardId!, slice])).values());
      if (!enabled.length) throw new Error('No reward with an enabled video is configured.');
      setSlices(enabled);
      setSelectedRewardId((enabled.find(slice => slice.isNoWin) || enabled[0]).rewardId!);
    }).catch(err => { if (active) setError(err.message || 'Could not load the active wheel.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => () => cache.dispose(), [cache]);
  useEffect(() => {
    const slice = slices.find(item => item.rewardId === selectedRewardId);
    if (!slice?.rewardId) return;
    let active = true;
    let prepared: HTMLVideoElement | null = null;
    const playing = () => { if (active) setStatus('PASS: video is playing with audio inside the selected outcome popup.'); };
    const paused = () => { if (active) setStatus('Video paused. The cached clip is ready to replay.'); };
    setVideo(null);
    setResult(null);
    setError('');
    setStatus(`Downloading and preparing ${slice.label} video…`);
    (async () => {
      const reward = await rewardsApi.getById(slice.rewardId!);
      if (!active) return;
      await cache.sync([reward]);
      if (!active) return;
      prepared = cache.get(reward);
      if (!prepared) throw new Error('The video could not be downloaded or prepared.');
      prepared.addEventListener('playing', playing);
      prepared.addEventListener('pause', paused);
      setVideo(prepared);
      setResult({ spinId: `local-popup-preview-${reward.id}`, participationId: 'preview-only', readableRef: 'VIDEO-TEST', visitorName: 'Test Visitor', sliceIndex: slice.sliceIndex, sliceLabel: slice.label, isWin: !slice.isNoWin, reward, completedAt: new Date().toISOString(), isReplay: false });
      setStatus('PASS: complete video downloaded and decoded. Ready to open the popup.');
    })().catch(err => { if (active) setError(err instanceof Error ? err.message : 'Video test failed.'); });
    return () => {
      active = false;
      prepared?.removeEventListener('playing', playing);
      prepared?.removeEventListener('pause', paused);
    };
  }, [cache, slices, selectedRewardId]);
  return <ThemeProvider theme={theme}><CssBaseline />
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>Reward video popup test</Typography>
      <Typography sx={{ mb: 2 }}>Uses the live wheel configuration and real popup components. No spin, stock change, or award is created.</Typography>
      {slices.length > 0 && <TextField select fullWidth label="Reward to preview" value={selectedRewardId}
        onChange={event => { setVideo(null); setSelectedRewardId(event.target.value); }} sx={{ mb: 2 }}>
        {slices.map(slice => <MenuItem key={slice.rewardId} value={slice.rewardId}>{slice.label}{slice.isNoWin ? ' — non-winning outcome' : ' — winning outcome'}</MenuItem>)}
      </TextField>}
      <Alert severity={error ? 'error' : video ? 'success' : 'info'} sx={{ mb: 2 }}>{error || status}</Alert>
      {result && <Typography sx={{ mb: 2 }}>Reward: {result.reward?.name}</Typography>}
      <Button variant="contained" disabled={!video} onClick={() => { setResult(current => current && ({ ...current, spinId: `local-popup-preview-${Date.now()}` })); setOpen(true); }}>Open selected outcome popup</Button>
      <WinnerCelebrationModal open={open} result={result} video={video} muted={false} onClose={() => setOpen(false)} />
    </Box>
  </ThemeProvider>;
}
createRoot(document.getElementById('root')!).render(<VideoPopupTest />);
