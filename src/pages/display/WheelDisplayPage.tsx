import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SpaceBarIcon from '@mui/icons-material/SpaceBar';
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
import { audioEngine } from '../../components/wheel/AudioEngine';
import { AppNavbar } from '../../components/common/AppNavbar';

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
  const [selectedParticipation, setSelectedParticipation] = useState<Participation | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [activeDay, setActiveDay] = useState<ExhibitionDay | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSpinSubmitting, setIsSpinSubmitting] = useState<boolean>(false);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(audioEngine.getMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const { rotation, isSpinning, spinTo } = useWheelAnimation();
  const { isConnected, on } = useSocket({ room: 'room:wheel' });
  const spinInProgressRef = useRef<boolean>(false);

  // Load Initial Snapshot
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [config, queueData, exhibitionData] = await Promise.all([
        wheelApi.getActiveDisplay(),
        participationsApi.getQueue({ status: 'WAITING,SELECTED', limit: 30 }),
        exhibitionsApi.getCurrent(),
      ]);

      setWheelConfig(config);
      setQueue(queueData);

      // Check for an already selected participation in the queue
      const currentlySelected = queueData.find((p) => p.status === 'SELECTED') || null;
      setSelectedParticipation(currentlySelected);

      const active = exhibitionData.days.find((d) => d.status === 'IN_PROGRESS') || null;
      setActiveDay(active);
      setIsPaused(exhibitionData.isPaused);
    } catch (err: any) {
      console.error('Failed to load wheel stage data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Real-time Event Listeners
  useEffect(() => {
    const unsubQueue = on('queue:updated', () => {
      participationsApi.getQueue({ limit: 30 }).then(setQueue).catch(() => {});
    });

    const unsubSelected = on('participation:selected', (data: Participation) => {
      setSelectedParticipation(data);
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
  }, [on]);

  // Execute Spin Action (Authoritative Backend)
  const handleTriggerSpin = useCallback(async () => {
    if (isSpinning || isSpinSubmitting || spinInProgressRef.current) return;
    if (!selectedParticipation) return;
    if (!activeDay) {
      setSpinError('No exhibition day is currently active.');
      return;
    }
    if (isPaused) {
      setSpinError('Exhibition is currently paused by administrator.');
      return;
    }

    setSpinError(null);
    setIsSpinSubmitting(true);
    spinInProgressRef.current = true;

    try {
      const idempotencyKey = generateUUID();
      const result = await spinsApi.execute(selectedParticipation.id, idempotencyKey);
      setSpinResult(result);

      // Launch high-precision GSAP wheel motion
      const sliceCount = wheelConfig?.sliceCount || 12;
      spinTo({
        sliceCount,
        targetSliceIndex: result.sliceIndex,
        onComplete: () => {
          spinInProgressRef.current = false;
          setIsCelebrationOpen(true);
          // Refetch queue to reflect completed status
          participationsApi.getQueue({ limit: 30 }).then(setQueue).catch(() => {});
        },
      });
    } catch (err: any) {
      spinInProgressRef.current = false;
      setSpinError(err.message || 'Failed to execute spin. Please try again.');
    } finally {
      setIsSpinSubmitting(false);
    }
  }, [isSpinning, isSpinSubmitting, selectedParticipation, activeDay, isPaused, wheelConfig?.sliceCount, spinTo]);

  // Spacebar Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        // Ignore if user is typing in an input or modal is open
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
          return;
        }

        if (isCelebrationOpen) {
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

  // Staff Selects Participant
  const handleSelectParticipant = async (p: Participation) => {
    if (isSpinning) return;
    try {
      const updated = await participationsApi.select(p.id);
      setSelectedParticipation(updated);
      audioEngine.playArmedChime();
      participationsApi.getQueue({ limit: 30 }).then(setQueue).catch(() => {});
    } catch (err: any) {
      setSpinError(err.message || 'Failed to select participant');
    }
  };

  // Staff Skips Participant
  const handleSkipParticipant = async (id: string) => {
    try {
      await participationsApi.skip(id);
      if (selectedParticipation?.id === id) {
        setSelectedParticipation(null);
      }
      participationsApi.getQueue({ limit: 30 }).then(setQueue).catch(() => {});
    } catch (err: any) {
      setSpinError(err.message || 'Failed to skip participant');
    }
  };

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
        minHeight: '100vh',
        backgroundColor: tokens.background,
        backgroundImage: `radial-gradient(circle at 40% 50%, ${tokens.accentGlow} 0%, #000000 70%)`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppNavbar activeDay={activeDay} isConnected={isConnected} />

      {/* Main Wheel Stage Canvas Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px', xl: '1fr 440px' },
          gap: 3,
          p: { xs: 2, sm: 3, lg: 4 },
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Left: Wheel & Prompt Arena */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: 520, lg: 'calc(100vh - 120px)' },
            position: 'relative',
          }}
        >
          {/* Wheel Controls Header */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={isMuted ? 'Unmute Audio' : 'Mute Audio'}>
                <IconButton onClick={toggleSound} sx={{ color: tokens.secondary }}>
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen Mode">
                <IconButton onClick={toggleFullscreen} sx={{ color: tokens.secondary }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            {isPaused && (
              <Alert severity="warning" sx={{ py: 0.2, px: 2, fontWeight: 700 }}>
                EXHIBITION PAUSED
              </Alert>
            )}
          </Box>

          {/* Interactive Wheel Graphic */}
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
              size={580}
              isSpinning={isSpinning}
            />
          ) : (
            <Typography variant="body1" sx={{ color: tokens.error }}>
              No active wheel configuration available.
            </Typography>
          )}

          {/* Spacebar microanimation call-to-action */}
          <Box sx={{ mt: 3, textAlign: 'center', zIndex: 5 }}>
            {spinError && (
              <Alert severity="error" sx={{ mb: 2, maxWidth: 420 }} onClose={() => setSpinError(null)}>
                {spinError}
              </Alert>
            )}

            {selectedParticipation ? (
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
                  disabled={isSpinning || isSpinSubmitting}
                  onClick={handleTriggerSpin}
                  startIcon={
                    isSpinSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <PlayArrowRoundedIcon sx={{ fontSize: 32 }} />
                    )
                  }
                  sx={{
                    px: 5,
                    py: 1.8,
                    fontSize: '1.25rem',
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
                  {isSpinning ? 'SPINNING WHEEL...' : isSpinSubmitting ? 'COMMITTING...' : 'SPIN WHEEL (OR PRESS SPACE)'}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: tokens.heading, fontWeight: 700 }}>
                    Ready for: <span style={{ color: tokens.primary }}>{selectedParticipation.visitorName}</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.secondary, fontFamily: 'monospace' }}>
                    ({selectedParticipation.readableRef})
                  </Typography>
                </Box>
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
                  Select a visitor from the queue to arm the wheel
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right: Real-time Visitor Queue Side Panel */}
        <Box sx={{ height: { xs: 460, lg: 'calc(100vh - 120px)' }, width: '100%' }}>
          <LiveQueuePanel
            queue={queue}
            selectedParticipation={selectedParticipation}
            isLoading={isLoading}
            isSpinning={isSpinning}
            onSelect={handleSelectParticipant}
            onSkip={handleSkipParticipant}
            onRefresh={() => participationsApi.getQueue({ limit: 30 }).then(setQueue)}
          />
        </Box>
      </Box>

      {/* Winner Celebration Modal */}
      <WinnerCelebrationModal
        open={isCelebrationOpen}
        result={spinResult}
        onClose={() => {
          setIsCelebrationOpen(false);
          setSelectedParticipation(null);
        }}
      />
    </Box>
  );
};
