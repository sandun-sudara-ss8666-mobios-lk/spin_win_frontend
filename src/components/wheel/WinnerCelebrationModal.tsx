import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Chip,
  alpha,
} from '@mui/material';
import confetti from 'canvas-confetti';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { tokens } from '../../theme/theme';
import { SpinResult } from '../../types';
import { audioEngine } from './AudioEngine';
import { RewardWinVideo } from './RewardWinVideo';

interface WinnerCelebrationModalProps {
  open: boolean;
  result: SpinResult | null;
  onClose: () => void;
  onSpinAgain?: () => void;
  video?: HTMLVideoElement | null;
  muted?: boolean;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  open,
  result,
  onClose,
  onSpinAgain,
  video,
  muted = false,
}) => {
  const [failedSpinId, setFailedSpinId] = useState<string>();
  const [videoEnded, setVideoEnded] = useState(false);
  const isSpinAgain = !!result?.isSpinAgain;
  const isWin = !!(result?.isWin && result.reward && !isSpinAgain);
  const showVideo = !!(open && result?.reward?.isVideoShow && video && failedSpinId !== result.spinId && !isSpinAgain && !videoEnded);

  // Reset videoEnded when modal opens or spinId changes
  useEffect(() => {
    setVideoEnded(false);
  }, [result?.spinId, open]);

  // Handle video naturally ending
  useEffect(() => {
    if (!video || !open) return;
    const handleEnded = () => {
      setVideoEnded(true);
    };
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [video, open]);

  // Spacebar key listener: when video is playing, pressing spacebar ends the video!
  useEffect(() => {
    if (!open || !showVideo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (video) {
          video.pause();
          try {
            video.currentTime = 0;
          } catch {}
        }
        setVideoEnded(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [open, showVideo, video]);

  useEffect(() => {
    if (!open || !result || showVideo) return;
    if (result.isSpinAgain) audioEngine.playBonusSpinChime();
    else if (!result.isWin) audioEngine.playNoWinChime();
    else audioEngine.playWinFanfare();
  }, [open, result?.spinId, result?.isWin, result?.isSpinAgain, showVideo]);

  useEffect(() => {
    if (open && result) {
      if (result.isSpinAgain) {
        // Playful cyan & gold burst for bonus spin
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#FFFFFF', '#38BDF8', '#F59E0B'],
        });
      } else if (result.isWin) {
        // High-end dual confetti cannon burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF2600', '#FFFFFF', '#FFD700', '#FF5C39'],
        });

        const timer = setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FF2600', '#FFD700'],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FF2600', '#FFD700'],
          });
        }, 300);

        return () => clearTimeout(timer);
      }
    }
  }, [open, result?.spinId, result?.isWin, result?.isSpinAgain]);

  if (!result) return null;

  const merchant = result.reward?.merchant;
  const modalBorderColor = isSpinAgain
    ? '#06B6D4'
    : isWin
    ? tokens.primary
    : tokens.border;

  const modalShadow = isSpinAgain
    ? '0 24px 60px rgba(0,0,0,0.9), 0 0 50px rgba(6, 182, 212, 0.4)'
    : isWin
    ? `0 24px 60px rgba(0,0,0,0.9), 0 0 50px ${tokens.accentGlow}`
    : '0 24px 60px rgba(0,0,0,0.9)';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: tokens.cardBg,
          border: `2px solid ${modalBorderColor}`,
          borderRadius: 4,
          boxShadow: modalShadow,
          textAlign: 'center',
          p: 2,
        },
      }}
    >
      <DialogContent sx={{ py: showVideo ? 1.5 : 3, px: 2 }}>
        {/* Header Icon Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: showVideo ? 48 : 72,
            height: showVideo ? 48 : 72,
            borderRadius: '50%',
            backgroundColor: isSpinAgain
              ? alpha('#06B6D4', 0.15)
              : isWin
              ? alpha(tokens.primary, 0.15)
              : alpha(tokens.secondary, 0.12),
            color: isSpinAgain
              ? '#06B6D4'
              : isWin
              ? tokens.primary
              : tokens.secondary,
            mb: showVideo ? 1 : 2.5,
            boxShadow: isSpinAgain
              ? '0 0 25px rgba(6, 182, 212, 0.5)'
              : isWin
              ? `0 0 25px ${tokens.accentGlow}`
              : 'none',
          }}
        >
          {isSpinAgain ? (
            <AutoAwesomeIcon sx={{ fontSize: 40 }} />
          ) : isWin ? (
            <EmojiEventsIcon sx={{ fontSize: 40 }} />
          ) : (
            <SentimentSatisfiedAltIcon sx={{ fontSize: 40 }} />
          )}
        </Box>

        {/* Status Heading */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.5rem', sm: showVideo ? '2rem' : '3rem' },
            color: isSpinAgain ? '#06B6D4' : isWin ? tokens.heading : tokens.secondary,
            mb: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {isSpinAgain
            ? 'BONUS SPIN!'
            : isWin
            ? 'CONGRATULATIONS!'
            : 'BETTER LUCK NEXT TIME!'}
        </Typography>

        <Typography variant="body1" sx={{ color: tokens.secondary, mb: showVideo ? 1.5 : 3 }}>
          {isSpinAgain
            ? `${result.visitorName}, you got another chance to spin the wheel!`
            : isWin
            ? `${result.visitorName} has won an exclusive prize!`
            : `Thank you for participating with MobiOs at INFOTEL, ${result.visitorName}.`}
        </Typography>

        {showVideo && video && (
          <Box sx={{ mb: 2 }}>
            <RewardWinVideo
              key={result.spinId}
              video={video}
              muted={muted}
              onFailure={() => setFailedSpinId(result.spinId)}
            />
            <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mt: -1, mb: 1, fontStyle: 'italic' }}>
              Press SPACE to skip video
            </Typography>
          </Box>
        )}

        {/* Spin Again Showcase Card */}
        {isSpinAgain && (
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: alpha(tokens.surface, 0.8),
              border: '1px solid rgba(6, 182, 212, 0.4)',
              mb: 3,
            }}
          >
            <Typography variant="overline" sx={{ color: '#06B6D4', letterSpacing: '0.12em', fontWeight: 800 }}>
              ANOTHER CHANCE EARNED
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', my: 1 }}>
              Free Re-Spin!
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.secondary, mb: 2 }}>
              Press SPACE on your keyboard or tap below to spin again!
            </Typography>
            <Chip
              label="SPIN AGAIN"
              size="small"
              sx={{
                backgroundColor: alpha('#06B6D4', 0.15),
                color: '#06B6D4',
                fontWeight: 800,
                border: '1px solid rgba(6, 182, 212, 0.4)',
              }}
            />
          </Box>
        )}

        {/* Prize Showcase Card */}
        {isWin && (
          <Box
            sx={{
              p: showVideo ? 1.5 : 3,
              borderRadius: 3,
              backgroundColor: alpha(tokens.surface, 0.8),
              border: `1px solid ${alpha(tokens.primary, 0.3)}`,
              mb: showVideo ? 1.5 : 3,
            }}
          >
            <Typography variant="overline" sx={{ color: tokens.secondary, letterSpacing: '0.1em' }}>
              PRIZE REVEAL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.primary, my: 1 }}>
              {result.reward?.name || result.sliceLabel}
            </Typography>
            {result.reward?.description && (
              <Typography
                variant="body1"
                sx={{
                  color: tokens.body,
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  mt: 1,
                  mb: 2,
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  fontWeight: 500,
                  maxWidth: 440,
                  mx: 'auto',
                }}
              >
                {result.reward.description}
              </Typography>
            )}
            {merchant && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 2, mb: 2 }}>
                {merchant.logoUrl && (
                  <Box
                    component="img"
                    key={merchant.logoUrl}
                    src={merchant.logoUrl}
                    alt=""
                    onError={(event) => { event.currentTarget.hidden = true; }}
                    sx={{ width: { xs: 200, sm: 260 }, maxWidth: '100%', height: { xs: 96, sm: 120 }, objectFit: 'contain' }}
                  />
                )}
                <Typography variant="body1">{merchant.name}</Typography>
              </Box>
            )}
            <Chip
              label={result.reward?.type || 'PRIZE'}
              size="small"
              sx={{
                backgroundColor: alpha(tokens.primary, 0.12),
                color: tokens.primary,
                fontWeight: 700,
                border: `1px solid ${alpha(tokens.primary, 0.25)}`,
              }}
            />
          </Box>
        )}

      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2, pt: 1 }}>
        {/* Keep this action visible even when the video/details need scrolling. */}
        {isSpinAgain ? (
          <Button
            variant="contained"
            size="large"
            onClick={onSpinAgain || onClose}
            startIcon={<PlayArrowRoundedIcon sx={{ fontSize: 28 }} />}
            sx={{
              px: 5,
              py: 1.4,
              fontSize: '1.1rem',
              fontWeight: 800,
              backgroundColor: '#06B6D4',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.5), 0 8px 20px rgba(6, 182, 212, 0.3)',
              '&:hover': {
                backgroundColor: '#0891B2',
                boxShadow: '0 0 35px rgba(6, 182, 212, 0.8)',
              },
            }}
          >
            Spin Again (SPACE)
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onClose}
            sx={{
              px: 4,
              py: 1.2,
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            Next Visitor
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
