import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { rewardsApi, exhibitionsApi } from '../../api';
import { tokens } from '../../theme/theme';

export const DistributionPage: React.FC = () => {
  const { data: rewards = [], isLoading: isRewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => rewardsApi.list(true),
  });

  const { data: currentExhibition, isLoading: isExhibitionLoading } = useQuery({
    queryKey: ['currentExhibition'],
    queryFn: () => exhibitionsApi.getCurrent(),
  });

  const activeDay = currentExhibition?.days?.find((d) => d.status === 'IN_PROGRESS');
  const days = currentExhibition?.days || [];
  const limitedRewards = rewards.filter((r) => r.inventoryMode === 'LIMITED');

  if (isRewardsLoading || isExhibitionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.primary }} />
      </Box>
    );
  }

  // Calculate pacing progress percentage for the active day
  let pacingPercent = 0;
  if (activeDay && activeDay.actualStartedAt) {
    const now = new Date().getTime();
    const start = new Date(activeDay.actualStartedAt).getTime();
    // Pacing end reference
    const [endH, endM] = activeDay.pacingEndTime.split(':').map(Number);
    const end = new Date(activeDay.actualStartedAt);
    end.setHours(endH, endM, 0, 0);
    const endMs = end.getTime();

    if (now >= endMs) {
      pacingPercent = 100;
    } else if (now <= start) {
      pacingPercent = 0;
    } else {
      pacingPercent = Math.min(100, Math.round(((now - start) / (endMs - start)) * 100));
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
          Distribution & Daily Pacing
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
          Time-based inventory pacing release curves, daily quota distribution, and carry-forward allocations.
        </Typography>
      </Box>

      {/* Real-time Pacing Engine Banner */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon sx={{ color: tokens.primary }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                    Dynamic Pacing Engine
                  </Typography>
                </Box>
                <Chip
                  label={activeDay ? `${activeDay.label}: ${pacingPercent}% Elapsed` : 'Standby'}
                  size="small"
                  sx={{
                    bgcolor: activeDay ? alpha(tokens.primary, 0.15) : alpha(tokens.border, 0.4),
                    color: activeDay ? tokens.primary : tokens.secondary,
                    fontWeight: 700,
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: tokens.body, mb: 2 }}>
                {activeDay ? (
                  <>
                    Active day started at{' '}
                    <strong>{new Date(activeDay.actualStartedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.
                    Pacing reference window: <strong>{activeDay.pacingStartTime} – {activeDay.pacingEndTime} (Asia/Colombo)</strong>.
                    Physical stock for today is released continuously over time to prevent early depletion.
                  </>
                ) : (
                  'Start an exhibition day to activate time-based inventory pacing.'
                )}
              </Typography>

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: tokens.secondary }}>
                    Day Start ({activeDay?.pacingStartTime || '09:00'})
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.primary, fontWeight: 700 }}>
                    {pacingPercent}% Released
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.secondary }}>
                    Pacing Target ({activeDay?.pacingEndTime || '21:00'})
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pacingPercent}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha(tokens.border, 0.5),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: tokens.primary,
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: tokens.secondary, mt: 1, display: 'block' }}>
                Note: Past {activeDay?.pacingEndTime || '21:00'}, 100% of today's allocation is eligible for winning until the admin explicitly clicks 'End Day'.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon sx={{ color: '#4CAF50' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Carry-Forward Logic
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: tokens.body, fontSize: '0.85rem', mb: 2 }}>
                When an exhibition day ends, unawarded stock for rewards with <strong>Carry-Forward ON</strong> is automatically merged into the remaining exhibition days.
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
                <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block' }}>
                  If Carry-Forward is <strong>OFF</strong>, unused daily quota is retained in physical warehouse inventory but is not auto-released onto subsequent days.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Day Hourly Quota Monitor */}
      {activeDay && (
        <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Active Day Hourly Quotas & Real-Time Pacing ({activeDay.label})
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.secondary }}>
                  Daily stock divided across {activeDay.pacingStartTime} – {activeDay.pacingEndTime}. Equal weights guarantee random winning among currently eligible prizes.
                </Typography>
              </Box>
              <Chip
                label={`${pacingPercent}% of Day Elapsed`}
                size="small"
                sx={{ bgcolor: alpha(tokens.primary, 0.15), color: tokens.primary, fontWeight: 700 }}
              />
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                    <TableCell>Reward Name</TableCell>
                    <TableCell align="right">Today's Target</TableCell>
                    <TableCell align="right">Hourly Quota Rate</TableCell>
                    <TableCell align="right">Currently Unlocked</TableCell>
                    <TableCell align="right">Won Today</TableCell>
                    <TableCell align="right">Paced Buffer</TableCell>
                    <TableCell align="center">Wheel Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {limitedRewards.map((reward) => {
                    const alloc = reward.dailyAllocations?.find((a) => a.exhibitionDayId === activeDay.id);
                    const dailyTarget = (alloc?.allocatedQuantity || 0) + (alloc?.carriedForwardQuantity || 0);
                    const [sH, sM] = (activeDay.pacingStartTime || '09:00').split(':').map(Number);
                    const [eH, eM] = (activeDay.pacingEndTime || '21:00').split(':').map(Number);
                    const totalHours = Math.max(1, (eH * 60 + (eM || 0) - (sH * 60 + (sM || 0))) / 60);
                    const hourlyRate = (dailyTarget / totalHours).toFixed(1);
                    const unlocked = pacingPercent >= 100 ? dailyTarget : Math.max(1, Math.floor((pacingPercent / 100) * dailyTarget));
                    const awarded = alloc?.awardedQuantity || 0;
                    const buffer = Math.max(0, unlocked - awarded);
                    const isExhaustedPhysical = reward.availablePhysicalStock <= 0;
                    const isPacingHold = awarded >= unlocked && pacingPercent < 100;

                    return (
                      <TableRow key={reward.id} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                        <TableCell sx={{ fontWeight: 700, color: tokens.heading }}>{reward.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{dailyTarget}</TableCell>
                        <TableCell align="right" sx={{ color: tokens.secondary }}>~{hourlyRate} / hr</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: tokens.primary }}>{unlocked}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{awarded}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: buffer > 0 ? '#4CAF50' : '#FF9800' }}>
                          {buffer} left
                        </TableCell>
                        <TableCell align="center">
                          {isExhaustedPhysical ? (
                            <Chip label="Stock Depleted" size="small" sx={{ bgcolor: alpha('#F44336', 0.15), color: '#F44336', fontSize: '0.7rem' }} />
                          ) : isPacingHold ? (
                            <Chip label="Paced (Hold till next hr)" size="small" sx={{ bgcolor: alpha('#FF9800', 0.15), color: '#FF9800', fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="Eligible to Win" size="small" sx={{ bgcolor: alpha('#4CAF50', 0.15), color: '#4CAF50', fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily Allocation Matrix */}
      <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading, mb: 2 }}>
            Limited Rewards Daily Quotas
          </Typography>

          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                  <TableCell>Reward Name</TableCell>
                  <TableCell>Strategy</TableCell>
                  <TableCell align="right">Physical Total</TableCell>
                  {days.map((d) => (
                    <TableCell align="right" key={d.id}>
                      Day {d.dayNumber} ({d.status})
                    </TableCell>
                  ))}
                  <TableCell align="right">Available Stock</TableCell>
                  <TableCell align="center">Carry-Forward</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {limitedRewards.map((reward) => (
                  <TableRow key={reward.id} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                    <TableCell sx={{ fontWeight: 700, color: tokens.heading }}>{reward.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={reward.distributionStrategy}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 22, bgcolor: alpha(tokens.border, 0.4), color: tokens.body }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {reward.totalPhysicalStock}
                    </TableCell>
                    {days.map((d) => {
                      const alloc = reward.dailyAllocations?.find((a) => a.exhibitionDayId === d.id);
                      return (
                        <TableCell align="right" key={d.id} sx={{ color: d.status === 'IN_PROGRESS' ? tokens.primary : tokens.body, fontWeight: 600 }}>
                          {alloc ? `${alloc.awardedQuantity} / ${alloc.allocatedQuantity}` : '—'}
                        </TableCell>
                      );
                    })}
                    <TableCell align="right" sx={{ fontWeight: 800, color: reward.availablePhysicalStock === 0 ? '#FF5252' : tokens.heading }}>
                      {reward.availablePhysicalStock}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={reward.carryForward ? 'Enabled' : 'Disabled'}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: reward.carryForward ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.4),
                          color: reward.carryForward ? '#4CAF50' : tokens.secondary,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {limitedRewards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5 + days.length} align="center" sx={{ py: 4, color: tokens.secondary }}>
                      No limited rewards found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
