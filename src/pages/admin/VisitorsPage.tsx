import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  alpha,
  Tooltip,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import RepeatIcon from '@mui/icons-material/Repeat';
import { participationsApi } from '../../api';
import { Participation } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { tokens } from '../../theme/theme';
import { useSocket } from '../../realtime/useSocket';

export const VisitorsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { onEvent } = useSocket();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const { data: queue = [], isLoading, refetch } = useQuery({
    queryKey: ['adminQueue', statusFilter, searchQuery],
    queryFn: () =>
      participationsApi.getQueue({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        limit: 100,
        order: 'desc',
      }),
    refetchInterval: 10000,
  });

  // Listen to realtime events
  React.useEffect(() => {
    const unsubReg = onEvent('visitor:registered', () => refetch());
    const unsubSelect = onEvent('visitor:selected', () => refetch());
    const unsubSpin = onEvent('spin:completed', () => refetch());
    return () => {
      unsubReg();
      unsubSelect();
      unsubSpin();
    };
  }, [onEvent, refetch]);

  const selectMutation = useMutation({
    mutationFn: (id: string) => participationsApi.select(id),
    onSuccess: (p) => {
      setFeedback({ message: `Visitor ${p.visitorName} armed on the Wheel Stage.`, severity: 'success' });
      refetch();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to select visitor', severity: 'error' });
    },
  });

  const skipMutation = useMutation({
    mutationFn: (id: string) => participationsApi.skip(id),
    onSuccess: () => {
      setFeedback({ message: 'Visitor participation skipped.', severity: 'success' });
      refetch();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to skip visitor', severity: 'error' });
    },
  });

  const requeueMutation = useMutation({
    mutationFn: (id: string) => participationsApi.requeue(id),
    onSuccess: () => {
      setFeedback({ message: 'Visitor requeued into active waiting list.', severity: 'success' });
      refetch();
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to requeue visitor', severity: 'error' });
    },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Visitor Registrations & Queue
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Live queue monitor, repeat visitor identification, and wheel spin dispatch controls.
          </Typography>
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

      {/* Filters Bar */}
      <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name or Sri Lankan phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: tokens.secondary, mr: 1 }} />,
            }}
          />

          <TextField
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
            label="Filter Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="WAITING">WAITING</MenuItem>
            <MenuItem value="SELECTED">SELECTED (Armed)</MenuItem>
            <MenuItem value="COMPLETED">COMPLETED</MenuItem>
            <MenuItem value="SKIPPED">SKIPPED</MenuItem>
            <MenuItem value="DAY_CLOSED">DAY_CLOSED</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
            }}
            sx={{ borderColor: tokens.border, color: tokens.secondary }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Visitors Table */}
      <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: tokens.primary }} />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                    <TableCell>Ref #</TableCell>
                    <TableCell>Visitor Name</TableCell>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>Registered At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Spin Outcome</TableCell>
                    <TableCell align="right">Staff Controls</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queue.map((p) => {
                    const isSelected = p.status === 'SELECTED';
                    const isWaiting = p.status === 'WAITING';
                    const isSkipped = p.status === 'SKIPPED';
                    const isRepeat = p.repeatStats?.isRepeatVisitor || p.isRepeatVisitor;

                    return (
                      <TableRow
                        key={p.id}
                        sx={{
                          '& td': { borderColor: tokens.border, color: tokens.body },
                          bgcolor: isSelected ? alpha(tokens.primary, 0.08) : 'transparent',
                          '&:hover': { bgcolor: alpha('#FFFFFF', 0.02) },
                        }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: isSelected ? tokens.primary : tokens.heading }}>
                          {p.readableRef || p.reference}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading }}>
                              {p.visitorName}
                            </Typography>
                            {isRepeat && (
                              <Tooltip title={`Repeat Visitor (${p.repeatStats?.totalRegistrations ?? 2} registrations)`}>
                                <Chip
                                  icon={<RepeatIcon sx={{ fontSize: '12px !important' }} />}
                                  label="Repeat"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: alpha('#2196F3', 0.15),
                                    color: '#2196F3',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {p.visitorPhoneMasked || p.visitorPhone}
                        </TableCell>

                        <TableCell sx={{ color: tokens.secondary, fontSize: '0.8rem' }}>
                          {new Date(p.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>

                        <TableCell>
                          {p.spin ? (
                            p.spin.isWin && p.spin.reward ? (
                              <Chip
                                label={p.spin.reward.name}
                                size="small"
                                sx={{
                                  bgcolor: alpha('#4CAF50', 0.15),
                                  color: '#4CAF50',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: tokens.secondary }}>
                                Better Luck Next Time
                              </Typography>
                            )
                          ) : (
                            <Typography variant="caption" sx={{ color: tokens.secondary }}>
                              —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {isWaiting && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => selectMutation.mutate(p.id)}
                                disabled={selectMutation.isPending}
                                sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.3 }}
                              >
                                Arm Spin
                              </Button>
                              <IconButton
                                size="small"
                                onClick={() => skipMutation.mutate(p.id)}
                                disabled={skipMutation.isPending}
                                sx={{ color: tokens.secondary }}
                              >
                                <SkipNextIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}

                          {isSkipped && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ReplayIcon />}
                              onClick={() => requeueMutation.mutate(p.id)}
                              disabled={requeueMutation.isPending}
                              sx={{ fontSize: '0.75rem', py: 0.3, borderColor: tokens.border, color: tokens.body }}
                            >
                              Requeue
                            </Button>
                          )}

                          {isSelected && (
                            <Chip
                              label="Armed on Wheel"
                              size="small"
                              sx={{ bgcolor: tokens.primary, color: '#FFFFFF', fontWeight: 800 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {queue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: tokens.secondary }}>
                        <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography variant="body1">No visitor participations found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
