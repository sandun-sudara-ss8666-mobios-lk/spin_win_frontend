import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Slider,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  Divider,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PublishIcon from '@mui/icons-material/Publish';
import SaveIcon from '@mui/icons-material/Save';
import { wheelApi, rewardsApi } from '../../api';
import { WheelCanvas } from '../../components/wheel/WheelCanvas';
import { WheelSliceVisual, Reward } from '../../types';
import { tokens } from '../../theme/theme';

export const WheelDesignerPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: activeWheel, isLoading: isActiveWheelLoading } = useQuery({
    queryKey: ['activeWheel'],
    queryFn: () => wheelApi.getActiveDisplay(),
  });

  const { data: configs = [], isLoading: isConfigsLoading } = useQuery({
    queryKey: ['wheelConfigs'],
    queryFn: () => wheelApi.listConfigs(),
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => rewardsApi.list(true),
  });

  // Local Editor State
  const [sliceCount, setSliceCount] = useState<number>(12);
  const [configName, setConfigName] = useState<string>('INFOTEL Wheel Configuration');
  const [slices, setSlices] = useState<
    Array<{
      sliceIndex: number;
      rewardId: string;
      label: string;
      backgroundColor: string;
      textColor: string;
      isNoWin: boolean;
    }>
  >([]);

  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Sync with active wheel or initialize slices
  useEffect(() => {
    if (activeWheel && activeWheel.slices?.length > 0) {
      setSliceCount(activeWheel.sliceCount || activeWheel.slices.length);
      setConfigName(activeWheel.name || 'INFOTEL Exhibition Wheel');
      setSlices(
        activeWheel.slices.map((s) => ({
          sliceIndex: s.sliceIndex,
          rewardId: s.rewardId || '',
          label: s.label,
          backgroundColor: s.backgroundColor || '#2A2A2E',
          textColor: s.textColor || '#FFFFFF',
          isNoWin: s.isNoWin,
        }))
      );
    } else if (rewards.length > 0 && slices.length === 0) {
      rebuildSlices(12);
    }
  }, [activeWheel, rewards]);

  const rebuildSlices = (count: number) => {
    setSliceCount(count);
    const newSlices = [];
    const colors = [
      tokens.primary,
      '#1E1E24',
      '#FF4526',
      '#282830',
      '#E62300',
      '#18181E',
      '#CC1E00',
      '#30303A',
    ];

    for (let i = 0; i < count; i++) {
      const reward = rewards[i % rewards.length] || null;
      newSlices.push({
        sliceIndex: i,
        rewardId: reward ? reward.id : '',
        label: reward ? (reward.shortLabel || reward.name) : `Prize ${i + 1}`,
        backgroundColor: reward?.colorHex || colors[i % colors.length],
        textColor: '#FFFFFF',
        isNoWin: reward?.type === 'NO_WIN',
      });
    }
    setSlices(newSlices);
  };

  const handleSliceCountChange = (_: any, value: number | number[]) => {
    const count = value as number;
    if (count === sliceCount) return;

    if (count > sliceCount) {
      const extra: typeof slices = [];
      for (let i = sliceCount; i < count; i++) {
        const reward = rewards[i % rewards.length] || null;
        extra.push({
          sliceIndex: i,
          rewardId: reward ? reward.id : '',
          label: reward ? (reward.shortLabel || reward.name) : `Slice ${i + 1}`,
          backgroundColor: i % 2 === 0 ? tokens.primary : '#1E1E24',
          textColor: '#FFFFFF',
          isNoWin: reward?.type === 'NO_WIN',
        });
      }
      setSlices([...slices, ...extra]);
    } else {
      setSlices(slices.slice(0, count));
    }
    setSliceCount(count);
  };

  const handleUpdateSlice = (index: number, field: string, value: any) => {
    const updated = [...slices];
    if (field === 'rewardId') {
      const selectedReward = rewards.find((r) => r.id === value);
      updated[index] = {
        ...updated[index],
        rewardId: value,
        label: selectedReward ? (selectedReward.shortLabel || selectedReward.name) : updated[index].label,
        backgroundColor: selectedReward?.colorHex || updated[index].backgroundColor,
        isNoWin: selectedReward?.type === 'NO_WIN',
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSlices(updated);
  };

  // Fallback assertion check: at least one slice must be NO_WIN or UNLIMITED
  const hasFallbackSlice = slices.some((s) => {
    const reward = rewards.find((r) => r.id === s.rewardId);
    return reward && (reward.type === 'NO_WIN' || reward.inventoryMode === 'UNLIMITED');
  });

  const createConfigMutation = useMutation({
    mutationFn: (data: any) => wheelApi.createConfig(data),
    onSuccess: () => {
      setFeedback({ message: 'Configuration saved as draft.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['wheelConfigs'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to save configuration', severity: 'error' });
    },
  });

  const publishConfigMutation = useMutation({
    mutationFn: (configId: string) => wheelApi.publishConfig(configId),
    onSuccess: () => {
      setFeedback({ message: 'Configuration published successfully! Live wheel updated.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['activeWheel'] });
      queryClient.invalidateQueries({ queryKey: ['wheelConfigs'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to publish configuration', severity: 'error' });
    },
  });

  const handleSaveDraft = () => {
    if (!hasFallbackSlice) {
      setFeedback({
        message: 'Fallback assertion failed: At least one slice must be NO_WIN or UNLIMITED.',
        severity: 'error',
      });
      return;
    }

    createConfigMutation.mutate({
      name: configName,
      sliceCount,
      slices: slices.map((s) => ({
        sliceIndex: s.sliceIndex,
        rewardId: s.rewardId || undefined,
        isNoWin: s.isNoWin,
        label: s.label,
        backgroundColor: s.backgroundColor,
        textColor: s.textColor,
      })),
    });
  };

  const handlePublishNow = async () => {
    if (!hasFallbackSlice) {
      setFeedback({
        message: 'Fallback assertion failed: At least one slice must be NO_WIN or UNLIMITED.',
        severity: 'error',
      });
      return;
    }

    try {
      const created = await wheelApi.createConfig({
        name: configName,
        sliceCount,
        slices: slices.map((s) => ({
          sliceIndex: s.sliceIndex,
          rewardId: s.rewardId || undefined,
          isNoWin: s.isNoWin,
          label: s.label,
          backgroundColor: s.backgroundColor,
          textColor: s.textColor,
        })),
      });

      await publishConfigMutation.mutateAsync(created.id);
    } catch (err: any) {
      setFeedback({ message: err?.response?.data?.message || 'Failed to publish', severity: 'error' });
    }
  };

  // Convert editor slices to WheelSliceVisual format for Canvas preview
  const previewSlices: WheelSliceVisual[] = slices.map((s) => {
    const reward = rewards.find((r) => r.id === s.rewardId);
    return {
      sliceIndex: s.sliceIndex,
      rewardId: s.rewardId,
      label: s.label,
      backgroundColor: s.backgroundColor,
      textColor: s.textColor,
      isNoWin: s.isNoWin,
      merchant: reward?.merchant ? {
        name: reward.merchant.name,
        logoUrl: reward.merchant.logoUrl,
        primaryColor: reward.merchant.primaryColor || reward.merchant.brandColor,
      } : null,
    };
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Wheel Designer & Slice Customizer
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Configure 2–16 equal radial slices, custom branding, and enforce fallback prize integrity.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleSaveDraft}
            disabled={createConfigMutation.isPending}
            sx={{ borderColor: tokens.border, color: tokens.heading }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PublishIcon />}
            onClick={handlePublishNow}
            disabled={publishConfigMutation.isPending || !hasFallbackSlice}
            sx={{ fontWeight: 700 }}
          >
            Publish Live
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

      {/* Fallback Assertion Warning Banner */}
      {!hasFallbackSlice ? (
        <Alert
          severity="error"
          icon={<WarningAmberIcon />}
          sx={{
            mb: 3,
            bgcolor: alpha('#D32F2F', 0.1),
            color: '#FF5252',
            border: '1px solid #D32F2F',
            fontWeight: 700,
          }}
        >
          CRITICAL INTEGRITY CHECK FAILED: The wheel configuration must contain at least one NO_WIN or UNLIMITED reward slice as a fallback.
        </Alert>
      ) : (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{
            mb: 3,
            bgcolor: alpha('#4CAF50', 0.1),
            color: '#4CAF50',
            border: '1px solid #4CAF50',
            fontWeight: 600,
          }}
        >
          Fallback Integrity Verified: Wheel has guaranteed fallback slices for when limited inventories deplete.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Live Wheel Preview Panel */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              bgcolor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 3,
              position: 'sticky',
              top: 90,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 3,
            }}
          >
            <Typography variant="overline" sx={{ fontWeight: 700, color: tokens.secondary, letterSpacing: '0.1em', mb: 2 }}>
              Live SVG Canvas Preview
            </Typography>

            <Box sx={{ width: '100%', maxWidth: 360, aspectRatio: '1/1', my: 'auto' }}>
              <WheelCanvas
                slices={previewSlices}
                rotation={0}
                size={360}
                isSpinning={false}
              />
            </Box>

            <Box sx={{ mt: 3, width: '100%', p: 2, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
              <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block' }}>
                Active Wheel Status:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading }}>
                {activeWheel ? `${activeWheel.name} (${activeWheel.sliceCount || activeWheel.slices.length} slices)` : 'No active configuration published'}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* Slice Configuration Editor */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading, mb: 2.5 }}>
                Wheel Properties
              </Typography>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Configuration Name"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mb: 0.5 }}>
                      Slice Count: <strong>{sliceCount}</strong> (2–16)
                    </Typography>
                    <Slider
                      value={sliceCount}
                      min={2}
                      max={16}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={handleSliceCountChange}
                      sx={{ color: tokens.primary }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: tokens.border, mb: 2.5 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.heading, mb: 2 }}>
                Configure Individual Slices ({slices.length} Total)
              </Typography>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                      <TableCell sx={{ width: 60 }}>#</TableCell>
                      <TableCell>Prize Reward</TableCell>
                      <TableCell>Slice Label</TableCell>
                      <TableCell sx={{ width: 80 }}>Color</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slices.map((slice, idx) => (
                      <TableRow key={idx} sx={{ '& td': { borderColor: tokens.border } }}>
                        <TableCell sx={{ fontWeight: 700, color: tokens.secondary }}>
                          {slice.sliceIndex}
                        </TableCell>

                        <TableCell>
                          <TextField
                            select
                            value={slice.rewardId}
                            onChange={(e) => handleUpdateSlice(idx, 'rewardId', e.target.value)}
                            size="small"
                            fullWidth
                            sx={{ minWidth: 160 }}
                          >
                            {rewards.map((r) => (
                              <MenuItem key={r.id} value={r.id}>
                                {r.name} ({r.type})
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>

                        <TableCell>
                          <TextField
                            value={slice.label}
                            onChange={(e) => handleUpdateSlice(idx, 'label', e.target.value)}
                            size="small"
                            inputProps={{ maxLength: 24 }}
                            sx={{ minWidth: 120 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '6px',
                                bgcolor: slice.backgroundColor,
                                border: `1px solid ${tokens.border}`,
                                flexShrink: 0,
                              }}
                            />
                            <TextField
                              value={slice.backgroundColor}
                              onChange={(e) => handleUpdateSlice(idx, 'backgroundColor', e.target.value)}
                              size="small"
                              sx={{ width: 90 }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Historical Configurations */}
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading, mb: 2 }}>
                Configuration History
              </Typography>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Slices</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {configs.map((c: any) => (
                      <TableRow key={c.id} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                        <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>{c.name}</TableCell>
                        <TableCell>{c.sliceCount || c.slices?.length}</TableCell>
                        <TableCell sx={{ color: tokens.secondary, fontSize: '0.75rem' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.isPublished ? 'Active' : 'Draft / Archived'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: c.isPublished ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.4),
                              color: c.isPublished ? '#4CAF50' : tokens.secondary,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {!c.isPublished && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => publishConfigMutation.mutate(c.id)}
                              disabled={publishConfigMutation.isPending}
                              sx={{ fontSize: '0.75rem', py: 0.2, borderColor: tokens.border }}
                            >
                              Publish
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
