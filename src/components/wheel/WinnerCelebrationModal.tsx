import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
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

interface WinnerCelebrationModalProps {
  open: boolean;
  result: SpinResult | null;
  onClose: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  open,
  result,
  onClose,
}) => {
  useEffect(() => {
    if (open && result) {
      if (result.isWin) {
        audioEngine.playWinFanfare();

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
      } else {
        audioEngine.playNoWinChime();
      }
    }
  }, [open, result]);

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
      <DialogContent sx={{ py: 3, px: 2 }}>
        {/* Header Icon Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: isWin ? alpha(tokens.primary, 0.15) : alpha(tokens.secondary, 0.12),
            color: isWin ? tokens.primary : tokens.secondary,
            mb: 2.5,
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
            color: isWin ? tokens.heading : tokens.secondary,
            mb: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {isWin ? 'CONGRATULATIONS!' : 'BETTER LUCK NEXT TIME!'}
        </Typography>

        <Typography variant="body1" sx={{ color: tokens.secondary, mb: 3 }}>
          {isWin
            ? `${result.visitorName} has won an exclusive prize!`
            : `Thank you for participating with MobiOs at INFOTEL, ${result.visitorName}.`}
        </Typography>

        {/* Prize Showcase Card */}
        {isWin && (
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: alpha(tokens.surface, 0.8),
              border: `1px solid ${alpha(tokens.primary, 0.3)}`,
              mb: 3,
            }}
          >
            <Typography variant="overline" sx={{ color: tokens.secondary, letterSpacing: '0.1em' }}>
              PRIZE REVEAL
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.primary, my: 1 }}>
              {result.reward?.name || result.sliceLabel}
            </Typography>
            {merchant && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                {merchant.logoUrl && (
                  <Box
                    component="img"
                    key={merchant.logoUrl}
                    src={merchant.logoUrl}
                    alt=""
                    onError={(event) => { event.currentTarget.hidden = true; }}
                    sx={{ width: 56, height: 40, objectFit: 'contain' }}
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

        {/* Participant Reference & Instructions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mb: 0.5 }}>
            PARTICIPATION REFERENCE
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              color: tokens.heading,
              letterSpacing: '0.1em',
            }}
          >
            {result.readableRef}
          </Typography>
        </Box>

        {/* Close Button */}
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
      </DialogContent>
    </Dialog>
  );
};
