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
  Divider,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublishIcon from '@mui/icons-material/Publish';
import BlockIcon from '@mui/icons-material/Block';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
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

  const activeList = priorityLists.find((pl: any) => pl.isActive);

  // Local ranking state
  const [rankedItems, setRankedItems] = useState<Array<{ rewardId: string; rank: number }>>([]);
  const [listName, setListName] = useState('Exhibition Main Priority Matrix');
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Initialize ranked items
  useEffect(() => {
    if (activeList && activeList.items?.length > 0) {
      setRankedItems(
        [...activeList.items].sort((a: any, b: any) => a.rank - b.rank).map((i: any, idx: number) => ({
          rewardId: i.rewardId,
          rank: idx + 1,
        }))
      );
      setListName(activeList.name);
    } else if (rewards.length > 0 && rankedItems.length === 0) {
      // Default initial order
      setRankedItems(
        rewards.map((r, idx) => ({
          rewardId: r.id,
          rank: idx + 1,
        }))
      );
    }
  }, [activeList, rewards]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankedItems.length) return;

    const copy = [...rankedItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Re-assign 1-based ranks
    setRankedItems(copy.map((item, idx) => ({ ...item, rank: idx + 1 })));
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      // Create new list and publish it
      const created = await wheelApi.createPriorityList({
        name: listName,
        items: rankedItems,
      });
      return wheelApi.publishPriorityList(created.id);
    },
    onSuccess: () => {
      setFeedback({ message: 'Priority matrix published and active!', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['priorityLists'] });
      refetchPreview();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to publish priority matrix', severity: 'error' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => wheelApi.deactivatePriorityList(id),
    onSuccess: () => {
      setFeedback({ message: 'Priority list deactivated. Wheel reverted to base slice weights.', severity: 'success' });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Strict Priority Ranking & Probabilities
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Establish hierarchical monotonic probability curves for eligible rewards with stock.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {activeList && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<BlockIcon />}
              onClick={() => deactivateMutation.mutate(activeList.id)}
              disabled={deactivateMutation.isPending}
              sx={{ fontWeight: 600 }}
            >
              Deactivate
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
            Publish Priority Matrix
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

      {/* Monotonic Curve Explanation */}
      <Box
        sx={{
          p: 2.5,
          mb: 4,
          borderRadius: 2,
          bgcolor: alpha(tokens.primary, 0.08),
          border: `1px solid ${alpha(tokens.primary, 0.25)}`,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <FormatListNumberedIcon sx={{ color: tokens.primary, fontSize: 32 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.heading }}>
            Monotonic Priority Evaluation Logic
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.body, display: 'block', mt: 0.5 }}>
            When an active priority list exists, the backend evaluates eligible rewards that currently have remaining released stock. Higher ranks (Rank 1 = Highest) are assigned higher weight along a steep monotonic curve (W = 1000 * exp(-0.4 * (rank - 1))), ensuring premium prizes take priority when stock is available without violating physical quotas.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Priority Hierarchy Editor */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Reward Priority Order (1 = Highest)
                </Typography>
                <Chip
                  label={activeList ? 'Custom Ranking Active' : 'Base Weights Default'}
                  size="small"
                  sx={{
                    bgcolor: activeList ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.4),
                    color: activeList ? '#4CAF50' : tokens.secondary,
                    fontWeight: 700,
                  }}
                />
              </Box>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                      <TableCell sx={{ width: 60 }}>Rank</TableCell>
                      <TableCell>Reward Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Reorder</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rankedItems.map((item, idx) => {
                      const reward = rewards.find((r) => r.id === item.rewardId);
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
                              label={reward?.type || 'LIMITED'}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 22, bgcolor: alpha(tokens.border, 0.4), color: tokens.body }}
                            />
                          </TableCell>

                          <TableCell align="right">
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Probability Preview */}
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
                        <TableCell align="right">Probability</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {probabilityPreview?.slices?.map((slice: any) => (
                        <TableRow key={slice.sliceIndex} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                          <TableCell sx={{ fontWeight: 700, color: tokens.secondary }}>
                            #{slice.sliceIndex}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>
                            {slice.label}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: (slice.probabilityPercent ?? slice.effectiveProbabilityPercent ?? 0) > 0 ? tokens.primary : tokens.secondary }}>
                            {slice.probabilityPercent ?? slice.effectiveProbabilityPercent ?? 0}%
                          </TableCell>
                        </TableRow>
                      ))}

                      {(!probabilityPreview?.slices || probabilityPreview.slices.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3, color: tokens.secondary }}>
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
