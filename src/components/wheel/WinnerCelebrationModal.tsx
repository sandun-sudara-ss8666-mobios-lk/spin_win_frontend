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
import { tokens } from '../../theme/theme';
import { SpinResult } from '../../types';
import { audioEngine } from './AudioEngine';
import { RewardWinVideo } from './RewardWinVideo';

interface WinnerCelebrationModalProps {
  open: boolean;
  result: SpinResult | null;
  onClose: () => void;
  video?: HTMLVideoElement | null;
  muted?: boolean;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  open,
  result,
  onClose,
  video,
  muted = false,
}) => {
  const [failedSpinId, setFailedSpinId] = useState<string>();
  const showVideo = !!(open && result?.reward?.isVideoShow && video && failedSpinId !== result.spinId);
  useEffect(() => {
    if (!open || !result || showVideo) return;
    if (!result.isWin) audioEngine.playNoWinChime();
    else audioEngine.playWinFanfare();
  }, [open, result?.spinId, result?.isWin, showVideo]);

  useEffect(() => {
    if (open && result) {
      if (result.isWin) {
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
  }, [open, result?.spinId, result?.isWin]);

  if (!result) return null;

  const isWin = result.isWin && result.reward;
  const merchant = result.reward?.merchant;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: tokens.cardBg,
          border: `2px solid ${isWin ? tokens.primary : tokens.border}`,
          borderRadius: 4,
          boxShadow: isWin
            ? `0 24px 60px rgba(0,0,0,0.9), 0 0 50px ${tokens.accentGlow}`
            : '0 24px 60px rgba(0,0,0,0.9)',
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
            backgroundColor: isWin ? alpha(tokens.primary, 0.15) : alpha(tokens.secondary, 0.12),
            color: isWin ? tokens.primary : tokens.secondary,
            mb: showVideo ? 1 : 2.5,
            boxShadow: isWin ? `0 0 25px ${tokens.accentGlow}` : 'none',
          }}
        >
          {isWin ? <EmojiEventsIcon sx={{ fontSize: 40 }} /> : <SentimentSatisfiedAltIcon sx={{ fontSize: 40 }} />}
        </Box>

        {/* Status Heading */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.5rem', sm: showVideo ? '2rem' : '3rem' },
            color: isWin ? tokens.heading : tokens.secondary,
            mb: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {isWin ? 'CONGRATULATIONS!' : 'BETTER LUCK NEXT TIME!'}
        </Typography>

        <Typography variant="body1" sx={{ color: tokens.secondary, mb: showVideo ? 1.5 : 3 }}>
          {isWin
            ? `${result.visitorName} has won an exclusive prize!`
            : `Thank you for participating with MobiOs at INFOTEL, ${result.visitorName}.`}
        </Typography>

        {showVideo && video && <RewardWinVideo key={result.spinId} video={video} muted={muted}
          onFailure={() => setFailedSpinId(result.spinId)} />}

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
      </DialogActions>
    </Dialog>
  );
};
