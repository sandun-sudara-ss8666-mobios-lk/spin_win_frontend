import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { wheelApi, participationsApi, spinsApi, exhibitionsApi } from '../../api';
import { useSocket } from '../../realtime/useSocket';
import { WheelConfigDisplay, Participation, SpinResult, ExhibitionDay } from '../../types';
import { tokens } from '../../theme/theme';
import { WheelCanvas } from '../../components/wheel/WheelCanvas';
import { useWheelAnimation } from '../../components/wheel/useWheelAnimation';
import { WinnerCelebrationModal } from '../../components/wheel/WinnerCelebrationModal';
import { LiveQueuePanel } from '../../components/queue/LiveQueuePanel';
import { useQueueSelection } from '../../components/queue/useQueueSelection';
import { loadSpinQueue } from '../../components/queue/load-spin-queue';
import { audioEngine } from '../../components/wheel/AudioEngine';
import { RewardVideoCache } from '../../components/wheel/reward-video-cache';
import { API_BASE_URL } from '../../api/client';
import { DisplayBrandHeader } from '../../components/common/DisplayBrandHeader';

// Safe UUID generator that works on both HTTPS and non-secure HTTP LAN IP contexts
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const WheelDisplayPage: React.FC = () => {
  const [wheelConfig, setWheelConfig] = useState<WheelConfigDisplay | null>(null);
  const [queue, setQueue] = useState<Participation[]>([]);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [celebrationVideo, setCelebrationVideo] = useState<HTMLVideoElement | null>(null);
  const [videoCache] = useState(() => new RewardVideoCache(API_BASE_URL, window.location.origin));
  const [activeDay, setActiveDay] = useState<ExhibitionDay | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const queueRequestRef = useRef(0);
  const [isSpinSubmitting, setIsSpinSubmitting] = useState<boolean>(false);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(audioEngine.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const { rotation, isSpinning, spinTo } = useWheelAnimation();
  const { isConnected, on } = useSocket({ room: 'room:wheel' });
  const spinInProgressRef = useRef<boolean>(false);
  const scrollingRef = useRef(false);
  const spinQueueRef = useRef<Participation[]>([]);
  const [isQueueScrolling, setIsQueueScrolling] = useState(false);
  const queueLocked = isSpinning || isSpinSubmitting || isCelebrationOpen;
  useEffect(() => {
    // Preserve a prepared video through a spin and its popup even if metadata changes.
    if (!queueLocked) void videoCache.sync(wheelConfig?.slices ?? []);
  }, [videoCache, wheelConfig, queueLocked]);
  useEffect(() => () => videoCache.dispose(), [videoCache]);
  const eligibleQueue = queue.filter((item) => item.status === 'WAITING' || item.status === 'SELECTED');
  const { focused, selected: selectedParticipation, isSelecting, selectParticipant, syncSelection } =
    useQueueSelection(eligibleQueue, queueLocked, setSpinError);
  const selectionReady = !!focused && focused.id === selectedParticipation?.id && !isSelecting && !isQueueScrolling
    && eligibleQueue.some((item) => item.id === focused.id);

  const refreshQueue = useCallback(async () => {
    const request = ++queueRequestRef.current;
    setIsQueueLoading(true);
    try {
      const next = await loadSpinQueue(participationsApi.getQueue);
      if (request === queueRequestRef.current) setQueue(next);
    } finally {
      if (request === queueRequestRef.current) setIsQueueLoading(false);
    }
  }, []);

  const handleScrollingChange = useCallback((scrolling: boolean) => {
    scrollingRef.current = scrolling;
    setIsQueueScrolling(scrolling);
  }, []);

  // Catch registrations missed while disconnected, including the initial room join.
  useEffect(() => {
    if (isConnected) {
      refreshQueue().catch((error: Error) => setSpinError(error.message));
    }
  }, [isConnected, refreshQueue]);

  // Load Initial Snapshot
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [config, , exhibitionData] = await Promise.all([
        wheelApi.getActiveDisplay(),
        refreshQueue(),
        exhibitionsApi.getCurrent(),
      ]);

      setWheelConfig(config);

      const active = exhibitionData.days.find((d) => d.status === 'IN_PROGRESS') || null;
      setActiveDay(active);
      setIsPaused(exhibitionData.isPaused);
    } catch (err: any) {
      setSpinError(err.message || 'Failed to load wheel stage data. Refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshQueue]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Real-time Event Listeners
  useEffect(() => {
    const unsubQueue = on('queue:updated', () => {
      refreshQueue().catch((error: Error) => setSpinError(error.message));
    });

    const unsubSelected = on('participation:selected', (data: Participation) => {
      if (scrollingRef.current) return;
      syncSelection(data);
      audioEngine.playArmedChime();
    });

    const unsubWheel = on('wheel:config_updated', () => {
      wheelApi.getActiveDisplay().then(setWheelConfig).catch(() => {});
    });

    const unsubLifecycle = on('day:lifecycle_changed', () => {
      exhibitionsApi.getCurrent().then((ex) => {
        const active = ex.days.find((d) => d.status === 'IN_PROGRESS') || null;
        setActiveDay(active);
        setIsPaused(ex.isPaused);
      }).catch(() => {});
    });

    return () => {
      unsubQueue();
      unsubSelected();
      unsubWheel();
      unsubLifecycle();
    };
  }, [on, refreshQueue, syncSelection]);

  // Execute Spin Action (Authoritative Backend)
  const handleTriggerSpin = useCallback(async () => {
    if (isSpinning || isSpinSubmitting || spinInProgressRef.current) return;
    if (!selectedParticipation || !selectionReady || scrollingRef.current || isCelebrationOpen) return;
    if (!activeDay) {
      setSpinError('No exhibition day is currently active.');
      return;
    }
    if (isPaused) {
      setSpinError('Exhibition is currently paused by administrator.');
      return;
    }

    setSpinError(null);
    spinQueueRef.current = eligibleQueue;
    setIsSpinSubmitting(true);
    spinInProgressRef.current = true;

    try {
      const idempotencyKey = generateUUID();
      const result = await spinsApi.execute(selectedParticipation.id, idempotencyKey);
      setSpinResult(result);
      setQueue((current) => current.filter((item) => item.id !== selectedParticipation.id));

      // Launch high-precision GSAP wheel motion
      const sliceCount = wheelConfig?.sliceCount || 12;
      spinTo({
        sliceCount,
        targetSliceIndex: result.sliceIndex,
        onComplete: () => {
          spinInProgressRef.current = false;
          // Choose once at wheel stop: never insert a late video into an open popup.
          setCelebrationVideo(videoCache.get(result.reward));
          setIsCelebrationOpen(true);
          // Refetch queue to reflect completed status
          refreshQueue().catch((error: Error) => setSpinError(error.message));
        },
      });
    } catch (err: any) {
      spinInProgressRef.current = false;
      setSpinError(err.message || 'Failed to execute spin. Please try again.');
    } finally {
      setIsSpinSubmitting(false);
    }
  }, [isSpinning, isSpinSubmitting, selectedParticipation, activeDay, isPaused, wheelConfig?.sliceCount, spinTo, selectionReady, isCelebrationOpen, refreshQueue, eligibleQueue, videoCache]);

  // Spacebar Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        if (e.repeat) { e.preventDefault(); return; }
        // Ignore if user is typing in an input or modal is open
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || (document.activeElement as HTMLElement)?.isContentEditable) {
          return;
        }

        if (isCelebrationOpen) {
          e.preventDefault();
          setIsCelebrationOpen(false);
          return;
        }

        e.preventDefault();
        handleTriggerSpin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerSpin, isCelebrationOpen]);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    audioEngine.setMuted(nextState);
  };


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        '@media (min-height: 1000px)': { height: '100dvh', minHeight: 0 },
        overflowX: 'clip',
        backgroundColor: tokens.background,
        backgroundImage: `radial-gradient(circle at 40% 50%, ${tokens.accentGlow} 0%, #000000 70%)`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box component="header" sx={{ width: '100%', maxWidth: 1600, mx: 'auto', px: { xs: 1.5, sm: 3, lg: 4 }, pt: 3, flexShrink: 0,
        '@media (min-height: 1000px)': { pt: 2 },
      }}>
        <Box sx={{ display: 'grid', alignItems: 'center', gap: { xs: 1, sm: 2 },
          gridTemplateColumns: { xs: '64px minmax(0, 1fr) 64px', sm: 'minmax(0, 1fr) auto minmax(0, 1fr)' } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap',
            alignItems: 'flex-start', gap: 1, minWidth: 0, '& .MuiChip-root': { maxWidth: '100%' } }}>
            <Chip size="small"
              icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: `${isConnected ? tokens.success : tokens.warning} !important` }} />}
              label={isConnected ? 'LIVE' : 'CONNECTING...'}
              sx={{ backgroundColor: alpha(isConnected ? tokens.success : tokens.warning, 0.12),
                color: isConnected ? tokens.success : tokens.warning, fontWeight: 700, fontSize: '0.75rem' }} />
            {activeDay && <Chip size="small" label={`Day ${activeDay.dayNumber}`}
              sx={{ backgroundColor: alpha(tokens.secondary, 0.12), color: tokens.secondary, fontWeight: 600 }} />}
          </Box>
          <Box sx={{ minWidth: 0,
            '& h1': { fontSize: 'clamp(0.875rem, 2.5vw, 2rem)', whiteSpace: 'nowrap' },
            '& .MuiTypography-subtitle1': { fontSize: 'clamp(0.5rem, 1vw, 0.85rem)', letterSpacing: '0.08em' },
          }}>
            <DisplayBrandHeader />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, justifySelf: 'end' }}>
            <Tooltip title={isMuted ? 'Unmute audio' : 'Mute audio'}>
              <IconButton aria-label={isMuted ? 'Unmute audio' : 'Mute audio'} onClick={toggleSound} sx={{ color: tokens.secondary }}>
                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Force refresh">
              <IconButton aria-label="Refresh wheel stage" onClick={loadInitialData} disabled={queueLocked || isLoading} sx={{ color: tokens.secondary }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle fullscreen">
              <IconButton aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={toggleFullscreen} sx={{ color: tokens.secondary }}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {isPaused && <Alert severity="warning" sx={{ mt: 2, mx: 'auto', maxWidth: 420, fontWeight: 700 }}>EXHIBITION PAUSED</Alert>}
      </Box>

      {/* Main Wheel Stage Canvas Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          width: '100%',
          maxWidth: 1600,
          mx: 'auto',
          '@media (min-width: 1200px) and (orientation: landscape)': {
            gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.6fr)',
          },
          gap: { xs: 3, md: 4 },
          p: { xs: 1.5, sm: 3, lg: 4 },
          alignItems: 'center',
          position: 'relative',
          // Fit tall displays using the actual remaining height after the header.
          '@media (min-height: 1000px)': {
            flex: '1 1 0%', minHeight: 0, p: 2, gap: 2, alignItems: 'stretch',
            gridTemplateRows: 'minmax(0, 1fr) clamp(300px, 28dvh, 360px)',
          },
          '@media (min-height: 1000px) and (min-width: 1200px) and (orientation: landscape)': {
            gridTemplateRows: 'minmax(0, 1fr)',
          },
        }}
      >
        {/* Left: Wheel & Prompt Arena */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            width: '100%',
            pt: 1,
            pb: 1,
            '@media (min-width: 1200px) and (orientation: landscape)': { minHeight: 'calc(100dvh - 160px)' },
            '@media (min-height: 1000px)': {
              display: 'grid', gridTemplateRows: 'minmax(0, 1fr) auto',
              gridTemplateColumns: 'minmax(0, 1fr)', justifyContent: 'stretch',
              minHeight: 0, height: '100%', py: 0, gap: 2,
            },
            position: 'relative',
          }}
        >
          {/* The size container keeps the wheel circular within both available dimensions. */}
          <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', minWidth: 0,
            '@media (min-height: 1000px)': {
              height: '100%', minHeight: 0, containerType: 'size',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            },
          }}>
            <Box sx={{ width: '100%', '@media (min-height: 1000px)': { width: 'min(100cqw, 100cqh)' } }}>
              {isLoading && !wheelConfig ? (
                <Box sx={{ py: 12, textAlign: 'center' }}>
                  <CircularProgress size={48} color="primary" />
                  <Typography variant="body2" sx={{ color: tokens.secondary, mt: 2 }}>
                    Loading Wheel Stage...
                  </Typography>
                </Box>
              ) : wheelConfig ? (
                <WheelCanvas
                  slices={wheelConfig.slices}
                  rotation={rotation}
                  size={900}
                  isSpinning={isSpinning}
                />
              ) : (
                <Typography variant="body1" sx={{ color: tokens.error }}>
                  No active wheel configuration available.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Spacebar microanimation call-to-action */}
          <Box sx={{ mt: 3, textAlign: 'center', zIndex: 5, width: '100%', maxWidth: 620,
            justifySelf: 'center', '@media (min-height: 1000px)': { mt: 0 },
          }}>
            {spinError && (
              <Alert severity="error" sx={{ mb: 2, maxWidth: 420 }} onClose={() => setSpinError(null)}>
                {spinError}
              </Alert>
            )}

            {focused ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={queueLocked || !selectionReady || !activeDay || isPaused}
                  onClick={handleTriggerSpin}
                  startIcon={
                    isSpinSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <PlayArrowRoundedIcon sx={{ fontSize: 32 }} />
                    )
                  }
                  sx={{
                    my: 3,
                    px: { xs: 2, sm: 5 },
                    width: '100%',
                    minHeight: 56,
                    py: 1.8,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: 3,
                    boxShadow: `0 0 25px ${tokens.accentGlow}, 0 8px 20px rgba(255, 38, 0, 0.4)`,
                    '&:hover': {
                      boxShadow: `0 0 35px ${tokens.primary}, 0 10px 25px rgba(255, 38, 0, 0.6)`,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSpinning ? 'SPINNING…' : isSpinSubmitting ? 'STARTING…' : !selectionReady ? 'CHOOSING VISITOR…' : 'SPIN WHEEL · SPACE'}
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  backgroundColor: alpha(tokens.cardBg, 0.8),
                  border: `1px solid ${tokens.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <PlayCircleOutlineIcon sx={{ color: tokens.secondary }} />
                <Typography variant="subtitle2" sx={{ color: tokens.secondary, fontWeight: 600 }}>
                  Waiting for visitors to join the queue
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right: Real-time Visitor Queue Side Panel */}
        <Box sx={{ height: { xs: 440, sm: 520 }, width: '100%', minWidth: 0,
          '@media (min-width: 900px) and (orientation: portrait)': { height: 'clamp(520px, 34dvh, 760px)' },
          '@media (min-width: 1200px) and (orientation: landscape)': { height: 'min(740px, calc(100dvh - 160px))', minHeight: 440 },
          '@media (min-height: 1000px)': {
            height: '100%', minHeight: 0, '--queue-header-padding': '8px', '--queue-hint-display': 'none',
          },
        }}>
          <LiveQueuePanel
            queue={queueLocked ? spinQueueRef.current : eligibleQueue}
            selectedParticipation={focused}
            isLoading={isLoading || isQueueLoading}
            isSpinning={queueLocked}
            onSelect={(visitor) => { setSpinError(null); selectParticipant(visitor); }}
            onScrollingChange={handleScrollingChange}
            onRefresh={() => refreshQueue().catch((error: Error) => setSpinError(error.message))}
          />
        </Box>
      </Box>

      {/* Winner Celebration Modal */}
      <WinnerCelebrationModal
        open={isCelebrationOpen}
        result={spinResult}
        video={celebrationVideo}
        muted={isMuted}
        onClose={() => {
          setIsCelebrationOpen(false);
        }}
      />
    </Box>
  );
};
