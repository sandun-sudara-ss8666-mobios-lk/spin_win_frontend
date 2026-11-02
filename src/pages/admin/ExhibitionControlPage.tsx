import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  alpha,
  Tooltip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { exhibitionsApi } from '../../api';
import { ExhibitionDay } from '../../types';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { tokens } from '../../theme/theme';

export const ExhibitionControlPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: exhibition, isLoading, refetch } = useQuery({
    queryKey: ['currentExhibition'],
    queryFn: () => exhibitionsApi.getCurrent(),
  });

  // Start Day Dialog State
  const [startConfirmDay, setStartConfirmDay] = useState<ExhibitionDay | null>(null);

  // End Day Dialog State
  const [endConfirmDay, setEndConfirmDay] = useState<ExhibitionDay | null>(null);

  // Edit Pacing Dialog State
  const [editDay, setEditDay] = useState<ExhibitionDay | null>(null);
  const [pacingStartTime, setPacingStartTime] = useState('09:00');
  const [pacingEndTime, setPacingEndTime] = useState('21:00');
  const [dayLabel, setDayLabel] = useState('');

  // Notifications
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Mutations
  const startDayMutation = useMutation({
    mutationFn: (dayId: string) => exhibitionsApi.startDay(dayId),
    onSuccess: (data) => {
      setFeedback({ message: data.message || 'Day started successfully!', severity: 'success' });
      setStartConfirmDay(null);
      queryClient.invalidateQueries({ queryKey: ['currentExhibition'] });
      queryClient.invalidateQueries({ queryKey: ['activeDay'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to start day', severity: 'error' });
    },
  });

  const endDayMutation = useMutation({
    mutationFn: (dayId: string) => exhibitionsApi.endDay(dayId),
    onSuccess: (data) => {
      setFeedback({
        message: `${data.message} (${data.closedParticipationsCount ?? 0} registrations finalized into DAY_CLOSED).`,
        severity: 'success',
      });
      setEndConfirmDay(null);
      queryClient.invalidateQueries({ queryKey: ['currentExhibition'] });
      queryClient.invalidateQueries({ queryKey: ['activeDay'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to end day', severity: 'error' });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => exhibitionsApi.pauseExhibition(id),
    onSuccess: () => {
      setFeedback({ message: 'Exhibition paused. Queue and spins are held.', severity: 'success' });
      refetch();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to pause exhibition', severity: 'error' });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => exhibitionsApi.resumeExhibition(id),
    onSuccess: () => {
      setFeedback({ message: 'Exhibition resumed successfully.', severity: 'success' });
      refetch();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to resume exhibition', severity: 'error' });
    },
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: any }) => exhibitionsApi.updateDay(dayId, data),
    onSuccess: () => {
      setFeedback({ message: 'Pacing schedule updated successfully.', severity: 'success' });
      setEditDay(null);
      refetch();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to update schedule', severity: 'error' });
    },
  });

  const handleOpenEdit = (day: ExhibitionDay) => {
    setEditDay(day);
    setDayLabel(day.label);
    setPacingStartTime(day.pacingStartTime);
    setPacingEndTime(day.pacingEndTime);
  };

  const handleSaveEdit = () => {
    if (!editDay) return;
    updateDayMutation.mutate({
      dayId: editDay.id,
      data: {
        label: dayLabel,
        pacingStartTime,
        pacingEndTime,
      },
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: tokens.primary }} />
      </Box>
    );
  }

  const days = exhibition?.days || [];
  const anyDayInProgress = days.some((d) => d.status === 'IN_PROGRESS');

  return (
    <Box>
      {/* Title & Exhibition Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Exhibition Lifecycle & Pacing
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Manage the 3 exhibition days, trigger atomic Start/End transitions, and control emergency pause.
          </Typography>
        </Box>

        {/* Global Pause / Resume Control */}
        {exhibition && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {exhibition.isPaused ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayCircleIcon />}
                onClick={() => resumeMutation.mutate(exhibition.id)}
                disabled={resumeMutation.isPending}
                sx={{ fontWeight: 700 }}
              >
                Resume Exhibition
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<PauseCircleIcon />}
                onClick={() => pauseMutation.mutate(exhibition.id)}
                disabled={pauseMutation.isPending}
                sx={{ fontWeight: 700 }}
              >
                Pause Exhibition
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Feedback Banner */}
      {feedback && (
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback(null)}
          sx={{ mb: 3, fontWeight: 600 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Important Lifecycle Banner */}
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
        <WarningAmberIcon sx={{ color: tokens.primary, fontSize: 32 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.heading }}>
            Exhibition Operational Directives
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.body, display: 'block', mt: 0.5 }}>
            • Exactly <strong>one day</strong> can be active at a time. Starting a day opens QR token generation and live spins.
            <br />
            • Ending a day automatically transitions all waiting, selected, and skipped visitor tickets to <code>DAY_CLOSED</code>, calculates carry-forward for eligible rewards, and permanently finalizes the day.
            <br />
            • The wheel continues operating past the configured reference closing time indefinitely until an admin explicitly clicks <strong>End Day</strong>.
          </Typography>
        </Box>
      </Box>

      {/* 3 Day Cards Grid */}
      <Grid container spacing={3}>
        {days.map((day) => {
          const isUpcoming = day.status === 'UPCOMING';
          const isInProgress = day.status === 'IN_PROGRESS';
          const isCompleted = day.status === 'COMPLETED';

          return (
            <Grid item xs={12} md={4} key={day.id}>
              <Card
                sx={{
                  bgcolor: tokens.surface,
                  border: `1px solid ${isInProgress ? tokens.primary : tokens.border}`,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isInProgress ? `0 0 20px ${tokens.accentGlow}` : 'none',
                  transition: 'border-color 0.2s',
                }}
              >
                <CardContent sx={{ p: 3, flex: 1 }}>
                  {/* Status header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: tokens.secondary, letterSpacing: '0.1em' }}>
                      Day {day.dayNumber} of 3
                    </Typography>
                    <Chip
                      label={day.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: isInProgress
                          ? alpha('#4CAF50', 0.15)
                          : isCompleted
                          ? alpha(tokens.border, 0.4)
                          : alpha('#2196F3', 0.15),
                        color: isInProgress ? '#4CAF50' : isCompleted ? tokens.secondary : '#2196F3',
                        border: `1px solid ${isInProgress ? '#4CAF50' : isCompleted ? tokens.border : '#2196F3'}`,
                      }}
                    />
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.heading, mb: 1 }}>
                    {day.label}
                  </Typography>

                  <Typography variant="body2" sx={{ color: tokens.secondary, mb: 2.5 }}>
                    Date: {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>

                  <Divider sx={{ borderColor: tokens.border, mb: 2.5 }} />

                  {/* Pacing Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: tokens.secondary }} />
                        <Typography variant="caption" sx={{ color: tokens.secondary }}>
                          Pacing Reference Window:
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.heading }}>
                        {day.pacingStartTime} – {day.pacingEndTime}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: tokens.secondary }}>
                        Actual Start:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: day.actualStartedAt ? '#4CAF50' : tokens.secondary }}>
                        {day.actualStartedAt ? new Date(day.actualStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not started'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: tokens.secondary }}>
                        Actual End:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: day.actualEndedAt ? tokens.secondary : 'Active / Pending' }}>
                        {day.actualEndedAt ? new Date(day.actualEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Typography>
                    </Box>
                  </Box>

                  {!isCompleted && (
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEdit(day)}
                      sx={{ color: tokens.secondary, fontSize: '0.75rem', p: 0 }}
                    >
                      Edit Pacing Window
                    </Button>
                  )}
                </CardContent>

                {/* Action Buttons */}
                <CardActions sx={{ p: 2.5, pt: 0, borderTop: `1px solid ${tokens.border}` }}>
                  {isUpcoming && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      disabled={anyDayInProgress || startDayMutation.isPending}
                      onClick={() => setStartConfirmDay(day)}
                      sx={{ fontWeight: 700 }}
                    >
                      {anyDayInProgress ? 'Another Day In Progress' : 'Start Day'}
                    </Button>
                  )}

                  {isInProgress && (
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        bgcolor: '#D32F2F',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#B71C1C' },
                      }}
                      startIcon={<StopIcon />}
                      disabled={endDayMutation.isPending}
                      onClick={() => setEndConfirmDay(day)}
                    >
                      End Day
                    </Button>
                  )}

                  {isCompleted && (
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled
                      startIcon={<CheckCircleIcon />}
                      sx={{ borderColor: tokens.border, color: tokens.secondary }}
                    >
                      Day Completed
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Start Day Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(startConfirmDay)}
        title={`Confirm Start of ${startConfirmDay?.label}`}
        message={`Are you sure you want to start ${startConfirmDay?.label}? This will immediately activate daily inventory allocations, enable rotating QR kiosk registration, and allow the wheel to execute spins.`}
        confirmText="Start Day Now"
        confirmColor="primary"
        isLoading={startDayMutation.isPending}
        onConfirm={() => {
          if (startConfirmDay) {
            startDayMutation.mutate(startConfirmDay.id);
          }
        }}
        onCancel={() => setStartConfirmDay(null)}
      />

      {/* End Day Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(endConfirmDay)}
        title={`Finalize & End ${endConfirmDay?.label}?`}
        message={`WARNING: Ending ${endConfirmDay?.label} will immediately stop new registrations and wheel spins. All existing WAITING, SELECTED, and SKIPPED participations will be finalized into DAY_CLOSED. Unused inventory will be processed for carry-forward. This action is PERMANENT and CANNOT be undone.`}
        confirmText="Confirm End Day"
        confirmColor="error"
        isLoading={endDayMutation.isPending}
        onConfirm={() => {
          if (endConfirmDay) {
            endDayMutation.mutate(endConfirmDay.id);
          }
        }}
        onCancel={() => setEndConfirmDay(null)}
      />

      {/* Edit Pacing Window Dialog */}
      <Dialog
        open={Boolean(editDay)}
        onClose={() => setEditDay(null)}
        PaperProps={{ sx: { bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, minWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: tokens.heading }}>
          Edit Day Pacing Window
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Day Label"
            value={dayLabel}
            onChange={(e) => setDayLabel(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Pacing Start Time (HH:mm)"
            value={pacingStartTime}
            onChange={(e) => setPacingStartTime(e.target.value)}
            fullWidth
            size="small"
            helperText="e.g. 09:00 (Colombo Time)"
          />
          <TextField
            label="Pacing End Time (HH:mm)"
            value={pacingEndTime}
            onChange={(e) => setPacingEndTime(e.target.value)}
            fullWidth
            size="small"
            helperText="e.g. 21:00 (Colombo Time)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${tokens.border}` }}>
          <Button onClick={() => setEditDay(null)} sx={{ color: tokens.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEdit}
            disabled={updateDayMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            Save Pacing
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
