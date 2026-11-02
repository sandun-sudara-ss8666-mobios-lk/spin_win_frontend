import React from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  alpha,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { tokens } from '../../theme/theme';
import { Participation } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface LiveQueuePanelProps {
  queue: Participation[];
  selectedParticipation: Participation | null;
  isLoading?: boolean;
  isSpinning?: boolean;
  onSelect: (participation: Participation) => void;
  onSkip?: (participationId: string) => void;
  onRefresh?: () => void;
  isStaffMode?: boolean;
}

export const LiveQueuePanel: React.FC<LiveQueuePanelProps> = ({
  queue,
  selectedParticipation,
  isLoading = false,
  isSpinning = false,
  onSelect,
  onSkip,
  onRefresh,
  isStaffMode = true,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: alpha(tokens.cardBg, 0.95),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${tokens.border}`,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${tokens.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: tokens.surface,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
            Visitor Queue
          </Typography>
          <Chip
            size="small"
            label={`${queue.filter((q) => q.status === 'WAITING' || q.status === 'SELECTED').length} Waiting`}
            sx={{
              backgroundColor: alpha(tokens.primary, 0.15),
              color: tokens.primary,
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        {onRefresh && (
          <Tooltip title="Refresh Queue">
            <IconButton size="small" onClick={onRefresh} disabled={isLoading} sx={{ color: tokens.secondary }}>
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Currently Selected Participant Banner */}
      {selectedParticipation && (
        <Box
          sx={{
            p: 2,
            backgroundColor: alpha(tokens.primary, 0.1),
            borderBottom: `1px solid ${alpha(tokens.primary, 0.3)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: tokens.primary, fontWeight: 700, letterSpacing: '0.08em' }}>
              CURRENTLY AT THE WHEEL
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: tokens.heading, lineHeight: 1.2 }}>
              {selectedParticipation.visitorName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: tokens.secondary,
                fontWeight: 600,
              }}
            >
              {selectedParticipation.readableRef}
            </Typography>
          </Box>
          <StatusBadge status="SELECTED" />
        </Box>
      )}

      {/* Queue List */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {isLoading && queue.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
            <CircularProgress size={32} color="primary" />
          </Box>
        ) : queue.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: tokens.secondary }}>
            <Typography variant="body2">No participants waiting in queue.</Typography>
            <Typography variant="caption">Visitors can scan the QR code to step up!</Typography>
          </Box>
        ) : (
          queue.map((item) => {
            const isSelected = selectedParticipation?.id === item.id;
            const isWaiting = item.status === 'WAITING';

            return (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: isSelected
                    ? alpha(tokens.primary, 0.12)
                    : isWaiting
                    ? alpha(tokens.surface, 0.7)
                    : alpha('#000000', 0.4),
                  border: `1px solid ${isSelected ? tokens.primary : tokens.borderSubtle}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  opacity: item.status === 'COMPLETED' || item.status === 'DAY_CLOSED' ? 0.6 : 1,
                  '&:hover': {
                    borderColor: isSelected ? tokens.primary : alpha(tokens.secondary, 0.4),
                  },
                }}
              >
                {/* Left: Participant Info */}
                <Box sx={{ minWidth: 0, pr: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: tokens.heading,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.visitorName}
                    </Typography>

                    {item.repeatStats?.isRepeatVisitor && (
                      <Tooltip title={`Repeat visitor (${item.repeatStats.totalRegistrations} registrations)`}>
                        <Chip
                          size="small"
                          icon={<RepeatRoundedIcon sx={{ fontSize: '12px !important' }} />}
                          label="Repeat"
                          sx={{
                            height: 18,
                            fontSize: '9px',
                            backgroundColor: alpha(tokens.info, 0.15),
                            color: tokens.info,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        color: tokens.primary,
                      }}
                    >
                      {item.readableRef}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.secondary }}>
                      {new Date(item.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: Actions / Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
                  <StatusBadge status={item.status} size="small" />

                  {isStaffMode && isWaiting && !isSpinning && (
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      startIcon={<PlayArrowRoundedIcon sx={{ fontSize: 16 }} />}
                      onClick={() => onSelect(item)}
                      sx={{
                        py: 0.4,
                        px: 1.2,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      Select
                    </Button>
                  )}

                  {isStaffMode && isWaiting && onSkip && (
                    <Tooltip title="Skip participant">
                      <IconButton size="small" onClick={() => onSkip(item.id)} sx={{ color: tokens.secondary }}>
                        <SkipNextRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );
};
