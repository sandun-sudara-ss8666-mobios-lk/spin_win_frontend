import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  Tooltip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PublishIcon from '@mui/icons-material/Publish';
import BlockIcon from '@mui/icons-material/Block';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { wheelApi, rewardsApi } from '../../api';
import { ProbabilityPreviewResponse, Reward } from '../../types';
import { tokens } from '../../theme/theme';

export const PriorityRankingPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading: isRewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => rewardsApi.list(true),
  });

  const { data: priorityLists = [], isLoading: isListsLoading } = useQuery({
    queryKey: ['priorityLists'],
    queryFn: () => wheelApi.listPriorityLists(),
  });

  const { data: probabilityPreview, isLoading: isPreviewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['probabilityPreview'],
    queryFn: () => wheelApi.getProbabilityPreview(),
    refetchInterval: 15000,
  });

  const activeList = priorityLists.find((pl: any) => pl.status === 'PUBLISHED' || pl.isActive);

  // Local ranking state: only rewards explicitly added to the priority list
  const [rankedItems, setRankedItems] = useState<Array<{ rewardId: string; rank: number }>>([]);
  const [listName, setListName] = useState('Exhibition Main Priority Matrix');
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Initialize ranked items
  useEffect(() => {
    if (rewards.length === 0) return;
    if (isDirty) return; // Prevent overwriting user's unsaved reordering on background refetches

    const sourceList = activeList || priorityLists[0];
    if (sourceList && sourceList.items?.length > 0) {
      // Only load the rewards that were explicitly in the saved priority list!
      const sortedSourceItems = [...sourceList.items]
        .sort((a: any, b: any) => a.rank - b.rank)
        .filter((item: any) => rewards.some((r) => r.id === item.rewardId));

      const items: Array<{ rewardId: string; rank: number }> = sortedSourceItems.map((i: any, idx: number) => ({
        rewardId: i.rewardId,
        rank: idx + 1,
      }));

      setRankedItems(items);
      setListName(sourceList.name || 'Exhibition Main Priority Matrix');
    } else {
      // By default when creating from scratch, start empty so user can add one by one
      setRankedItems([]);
    }
  }, [activeList, priorityLists, rewards, isDirty]);

  // Derived unranked rewards (all rewards not in rankedItems)
  const rankedIds = new Set(rankedItems.map((i) => i.rewardId));
  const unrankedRewards = rewards.filter((r) => !rankedIds.has(r.id));

  const addRewardToPriority = (rewardId: string) => {
    setIsDirty(true);
    setRankedItems((prev) => [
      ...prev,
      { rewardId, rank: prev.length + 1 },
    ]);
  };

  const removeRewardFromPriority = (rewardId: string) => {
    setIsDirty(true);
    setRankedItems((prev) => {
      const filtered = prev.filter((item) => item.rewardId !== rewardId);
      return filtered.map((item, idx) => ({ ...item, rank: idx + 1 }));
    });
  };

  const clearAllRankings = () => {
    setIsDirty(true);
    setRankedItems([]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankedItems.length) return;

    const copy = [...rankedItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    setIsDirty(true);
    setRankedItems(copy.map((item, idx) => ({ ...item, rank: idx + 1 })));
  };

  const resetToSaved = () => {
    setIsDirty(false);
    const sourceList = activeList || priorityLists[0];
    if (sourceList && sourceList.items?.length > 0) {
      const sortedSourceItems = [...sourceList.items]
        .sort((a: any, b: any) => a.rank - b.rank)
        .filter((item: any) => rewards.some((r) => r.id === item.rewardId));

      setRankedItems(
        sortedSourceItems.map((i: any, idx: number) => ({
          rewardId: i.rewardId,
          rank: idx + 1,
        }))
      );
    } else {
      setRankedItems([]);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (rankedItems.length === 0) {
        throw new Error(
          'Please add at least one reward to the priority list before publishing. If you want all prizes to have equal odds, click "Disable Priority List" instead.'
        );
      }
      // Create new list with current contiguous order and publish it
      const created = await wheelApi.createPriorityList({
        name: listName,
        items: rankedItems,
      });
      return wheelApi.publishPriorityList(created.id);
    },
    onSuccess: () => {
      setIsDirty(false);
      setFeedback({
        message: `Priority matrix published and active on live spins! (${rankedItems.length} rewards prioritized, unranked rewards have equal baseline priority)`,
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['priorityLists'] });
      refetchPreview();
    },
    onError: (err: any) => {
      setFeedback({
        message: err?.message || err?.response?.data?.message || 'Failed to publish priority matrix',
        severity: 'error',
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => wheelApi.deactivatePriorityList(id),
    onSuccess: () => {
      setIsDirty(false);
      setFeedback({
        message: 'Priority list deactivated. Wheel reverted to pure base slice weights (equal odds for all eligible rewards).',
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['priorityLists'] });
      refetchPreview();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to deactivate priority matrix', severity: 'error' });
    },
  });

  if (isRewardsLoading || isListsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
              Strict Priority Ranking & Probabilities
            </Typography>
            <Chip
              label={activeList ? `● Priority Ranking Active (v${activeList.version})` : '○ Priority Ranking Disabled'}
              size="small"
              sx={{
                bgcolor: activeList ? alpha('#4CAF50', 0.15) : alpha('#FF9800', 0.15),
                color: activeList ? '#4CAF50' : '#FF9800',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: tokens.secondary }}>
            Add specific rewards to the priority list to boost them 1..N. Any unranked rewards share equal baseline priority.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isDirty && (
            <Button
              variant="text"
              color="inherit"
              onClick={resetToSaved}
              sx={{ fontWeight: 600, color: tokens.secondary }}
            >
              Discard Changes
            </Button>
          )}
          {activeList && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<BlockIcon />}
              onClick={() => deactivateMutation.mutate(activeList.id)}
              disabled={deactivateMutation.isPending}
              sx={{ fontWeight: 600 }}
            >
              Disable Priority List
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            {activeList ? (isDirty ? 'Publish & Update Matrix *' : 'Republish Matrix') : 'Publish & Enable Matrix'}
          </Button>
        </Box>
      </Box>

      {feedback && (
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback(null)}
          sx={{ mb: 3, fontWeight: 600 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Evaluation Logic Banner */}
      <Box
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 2,
          bgcolor: activeList ? alpha(tokens.primary, 0.08) : alpha('#FF9800', 0.08),
          border: `1px solid ${activeList ? alpha(tokens.primary, 0.25) : alpha('#FF9800', 0.25)}`,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <FormatListNumberedIcon sx={{ color: activeList ? tokens.primary : '#FF9800', fontSize: 32 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.heading }}>
            {activeList
              ? `Monotonic Priority Curve Active (${activeList.items?.length || 0} Ranked Items)`
              : 'Pure Base Weight Distribution (Priority Ranking Disabled)'}
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.body, display: 'block', mt: 0.5 }}>
            {activeList
              ? `Ranked items receive strictly decreasing priority multipliers (Rank 1 highest). Rewards NOT in the priority list are treated with equal baseline priority (1.0x multiplier) after all ranked items whenever eligible.`
              : 'Priority ranking is currently DISABLED. Wheel spins use pure baseline weights without rank multipliers. Because prizes have equal baseline weight, each eligible slice has uniform random odds within its pacing release window.'}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Priority Ranked List & Unranked Available Rewards */}
        <Grid item xs={12} md={7}>
          {/* Priority Ranked Items Card */}
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                    Priority Ranked Rewards (1 = Highest)
                  </Typography>
                  <Chip
                    label={`${rankedItems.length} Ranked`}
                    size="small"
                    sx={{
                      bgcolor: rankedItems.length > 0 ? alpha(tokens.primary, 0.15) : alpha(tokens.border, 0.4),
                      color: rankedItems.length > 0 ? tokens.primary : tokens.secondary,
                      fontWeight: 700,
                    }}
                  />
                  {isDirty && (
                    <Chip label="Unsaved Changes" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                  )}
                </Box>
                {rankedItems.length > 0 && (
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<ClearAllIcon fontSize="small" />}
                    onClick={clearAllRankings}
                    sx={{ color: tokens.secondary, fontSize: '0.75rem' }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>

              <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mb: 2 }}>
                Only the rewards listed below receive priority rank boosts. Unranked rewards share equal base odds.
              </Typography>

              {rankedItems.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: `1px dashed ${tokens.border}`,
                    borderRadius: 2,
                    bgcolor: alpha(tokens.cardBg, 0.5),
                  }}
                >
                  <Typography variant="body2" sx={{ color: tokens.secondary, mb: 1, fontWeight: 600 }}>
                    No rewards in the priority list
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.body, display: 'block' }}>
                    Click <strong>"+ Add to Priority"</strong> on any available reward below to prioritize it above the rest.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                        <TableCell sx={{ width: 60 }}>Rank</TableCell>
                        <TableCell>Reward Name</TableCell>
                        <TableCell>Boost Preview</TableCell>
                        <TableCell align="center">Reorder</TableCell>
                        <TableCell align="right">Remove</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rankedItems.map((item, idx) => {
                        const reward = rewards.find((r) => r.id === item.rewardId);
                        const totalRanked = rankedItems.length;
                        const slope = (totalRanked - item.rank + 1) / totalRanked;
                        const boostMultiplier = Math.round((1.0 + slope * 2.0) * 10) / 10;

                        return (
                          <TableRow
                            key={item.rewardId}
                            sx={{
                              '& td': { borderColor: tokens.border, color: tokens.body },
                              '&:hover': { bgcolor: alpha('#FFFFFF', 0.02) },
                            }}
                          >
                            <TableCell>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  bgcolor: idx === 0 ? tokens.primary : alpha(tokens.border, 0.5),
                                  color: idx === 0 ? '#FFFFFF' : tokens.heading,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {item.rank}
                              </Box>
                            </TableCell>

                            <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>
                              {reward?.name || item.rewardId}
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={`${boostMultiplier}x Boost${idx === 0 ? ' (Highest)' : ''}`}
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 22,
                                  bgcolor: idx === 0 ? alpha(tokens.primary, 0.2) : alpha(tokens.border, 0.4),
                                  color: idx === 0 ? tokens.primary : tokens.heading,
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => moveItem(idx, 'up')}
                                disabled={idx === 0}
                                sx={{ color: tokens.secondary }}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => moveItem(idx, 'down')}
                                disabled={idx === rankedItems.length - 1}
                                sx={{ color: tokens.secondary }}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </TableCell>

                            <TableCell align="right">
                              <Tooltip title="Remove from priority list (returns to unranked)">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeRewardFromPriority(item.rewardId)}
                                  sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Available / Unranked Rewards Card */}
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                    Available Rewards (Unranked - Equal Priority)
                  </Typography>
                  <Chip
                    label={`${unrankedRewards.length} Unranked`}
                    size="small"
                    sx={{ bgcolor: alpha(tokens.border, 0.4), color: tokens.secondary, fontWeight: 700 }}
                  />
                </Box>
              </Box>

              <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mb: 2 }}>
                These rewards are not in the priority list. They share equal baseline priority (1.0x multiplier) after all ranked items.
              </Typography>

              {unrankedRewards.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center', color: tokens.secondary }}>
                  <Typography variant="body2">All rewards have been added to the priority list.</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                        <TableCell>Reward Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Base Weight</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unrankedRewards.map((reward) => (
                        <TableRow
                          key={reward.id}
                          sx={{
                            '& td': { borderColor: tokens.border, color: tokens.body },
                            '&:hover': { bgcolor: alpha('#FFFFFF', 0.02) },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>
                            {reward.name}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={reward.type}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20, bgcolor: alpha(tokens.border, 0.4), color: tokens.secondary }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: tokens.secondary, fontSize: '0.8rem' }}>
                            Base {reward.baselineWeight || 3} (1.0x)
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<AddCircleOutlineIcon />}
                              onClick={() => addRewardToPriority(reward.id)}
                              sx={{ fontSize: '0.75rem', py: 0.4, px: 1.5, fontWeight: 600 }}
                            >
                              Add to Priority
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Live Probability Preview */}
        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Live Probability Preview
                </Typography>
                <Chip
                  label="Authoritative"
                  size="small"
                  sx={{ bgcolor: alpha(tokens.primary, 0.15), color: tokens.primary, fontWeight: 700, fontSize: '0.7rem' }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: tokens.secondary, mb: 2, fontSize: '0.85rem' }}>
                Real-time calculated probability distribution across all wheel slices for the currently armed visitor:
              </Typography>

              {isPreviewLoading ? (
                <CircularProgress size={24} sx={{ color: tokens.primary, my: 2 }} />
              ) : (
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                        <TableCell>Slice</TableCell>
                        <TableCell>Prize</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell align="right">Probability</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {probabilityPreview?.slices?.map((slice: any) => {
                        const hasRank = slice.rank && slice.rank > 0;
                        return (
                          <TableRow key={slice.sliceIndex} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                            <TableCell sx={{ fontWeight: 700, color: tokens.secondary }}>
                              #{slice.sliceIndex}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>
                              {slice.label}
                            </TableCell>
                            <TableCell>
                              {hasRank ? (
                                <Chip
                                  label={`#${slice.rank} (${slice.priorityMultiplier}x)`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    bgcolor: alpha(tokens.primary, 0.2),
                                    color: tokens.primary,
                                    fontWeight: 700,
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Unranked (1.0x)"
                                  size="small"
                                  sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    bgcolor: alpha(tokens.border, 0.4),
                                    color: tokens.secondary,
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: (slice.probabilityPercent ?? slice.effectiveProbabilityPercent ?? 0) > 0 ? tokens.primary : tokens.secondary }}>
                              {slice.probabilityPercent ?? slice.effectiveProbabilityPercent ?? 0}%
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {(!probabilityPreview?.slices || probabilityPreview.slices.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3, color: tokens.secondary }}>
                            No active wheel slices configured.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
