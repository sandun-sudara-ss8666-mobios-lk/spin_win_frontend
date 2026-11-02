import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  alpha,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import CachedIcon from '@mui/icons-material/Cached';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { reportsApi, exhibitionsApi, rewardsApi } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { tokens } from '../../theme/theme';
import { useSocket } from '../../realtime/useSocket';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { onEvent } = useSocket();

  const { data: dashboard, isLoading: isDashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => reportsApi.getDashboard(),
    refetchInterval: 10000,
  });

  const { data: currentExhibition, isLoading: isExhibitionLoading, refetch: refetchExhibition } = useQuery({
    queryKey: ['currentExhibition'],
    queryFn: () => exhibitionsApi.getCurrent(),
    refetchInterval: 15000,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => rewardsApi.list(true),
  });

  // Listen to realtime spin completions and registration events to trigger quick refresh
  React.useEffect(() => {
    const unsubSpin = onEvent('spin:completed', () => {
      refetchDashboard();
    });
    const unsubReg = onEvent('visitor:registered', () => {
      refetchDashboard();
    });
    const unsubDay = onEvent('day:started', () => {
      refetchDashboard();
      refetchExhibition();
    });
    const unsubDayEnd = onEvent('day:ended', () => {
      refetchDashboard();
      refetchExhibition();
    });

    return () => {
      unsubSpin();
      unsubReg();
      unsubDay();
      unsubDayEnd();
    };
  }, [onEvent, refetchDashboard, refetchExhibition]);

  if (isDashboardLoading || isExhibitionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: tokens.primary }} />
      </Box>
    );
  }

  const activeDay = currentExhibition?.days?.find((d) => d.status === 'IN_PROGRESS');
  const kpis = dashboard?.kpis;

  const totalRemainingStock = rewards
    .filter((r) => r.inventoryMode === 'LIMITED')
    .reduce((acc, r) => acc + (r.availablePhysicalStock ?? 0), 0);

  return (
    <Box>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading, letterSpacing: '-0.02em' }}>
            Event Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Real-time exhibition performance, live queue status, and inventory tracking.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CachedIcon />}
            onClick={() => window.open('/display/wheel', '_blank')}
            sx={{ fontWeight: 700 }}
          >
            Open Wheel Display
          </Button>
        </Box>
      </Box>

      {/* Paused Banner if applicable */}
      {currentExhibition?.isPaused && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            bgcolor: alpha('#FF9800', 0.1),
            color: '#FFB74D',
            border: '1px solid #FF9800',
            fontWeight: 600,
          }}
        >
          Exhibition is currently PAUSED. New registrations and spins are temporarily held until resumed.
        </Alert>
      )}

      {/* Top Metric KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Registrations"
            value={kpis?.totalRegistrationsAllTime ?? 0}
            subtitle={activeDay ? `${kpis?.totalRegistrationsToday ?? 0} registered today` : 'All 3 Days'}
            icon={<PeopleIcon />}
            color={tokens.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Spins Completed"
            value={kpis?.totalSpinsAllTime ?? 0}
            subtitle={`Queue: ${kpis?.waitingQueueCount ?? 0} waiting`}
            icon={<CachedIcon />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Prizes Won Today"
            value={kpis?.totalWinsToday ?? 0}
            subtitle={`Win Rate: ${kpis?.winRatePercent ?? 0}%`}
            icon={<EmojiEventsIcon />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Physical Stock Remaining"
            value={totalRemainingStock}
            subtitle={`${kpis?.activeRewardsCount ?? 0} active rewards configured`}
            icon={<Inventory2Icon />}
            color="#FF9800"
          />
        </Grid>
      </Grid>

      {/* Active Day & Live Queue Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Active Exhibition Day Card */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              bgcolor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="overline" sx={{ color: tokens.secondary, fontWeight: 700, letterSpacing: '0.1em' }}>
                  Current Day Lifecycle
                </Typography>
                {activeDay ? (
                  <Chip
                    label="LIVE IN PROGRESS"
                    size="small"
                    sx={{
                      bgcolor: alpha('#4CAF50', 0.15),
                      color: '#4CAF50',
                      border: '1px solid #4CAF50',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  />
                ) : (
                  <Chip
                    label="STANDBY / NO ACTIVE DAY"
                    size="small"
                    sx={{
                      bgcolor: alpha(tokens.border, 0.4),
                      color: tokens.secondary,
                      border: `1px solid ${tokens.border}`,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.heading, mb: 1 }}>
                {activeDay ? activeDay.label : 'Exhibition Awaiting Day Start'}
              </Typography>

              <Typography variant="body2" sx={{ color: tokens.body, mb: 2 }}>
                {activeDay
                  ? `Reference pacing window: ${activeDay.pacingStartTime} – ${activeDay.pacingEndTime}. Started at ${new Date(activeDay.actualStartedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                  : 'Start Day 1, 2, or 3 from the Exhibition Control center to enable QR registration and allow the wheel to spin.'}
              </Typography>

              <Box sx={{ p: 2, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}`, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: tokens.secondary }}>
                    Exhibition Days
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.heading, fontWeight: 600 }}>
                    {currentExhibition?.days?.length ?? 3} Configured
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {currentExhibition?.days?.map((d) => (
                    <Box
                      key={d.id}
                      sx={{
                        flex: 1,
                        p: 1,
                        borderRadius: 1.5,
                        textAlign: 'center',
                        bgcolor: d.status === 'IN_PROGRESS' ? alpha(tokens.primary, 0.15) : tokens.surface,
                        border: `1px solid ${d.status === 'IN_PROGRESS' ? tokens.primary : tokens.border}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: d.status === 'IN_PROGRESS' ? tokens.primary : tokens.heading }}>
                        Day {d.dayNumber}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: tokens.secondary }}>
                        {d.status}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>

            <Box sx={{ p: 2.5, pt: 0, borderTop: `1px solid ${tokens.border}`, mt: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/admin/exhibition')}
                sx={{ borderColor: tokens.border, color: tokens.heading, fontWeight: 600 }}
              >
                Manage Days & Pacing
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Live Queue Breakdown */}
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Queue & Activity Status
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/admin/visitors')}
                  sx={{ color: tokens.primary, fontWeight: 600 }}
                >
                  Full Visitor List
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ p: 2, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}`, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFB74D' }}>
                      {kpis?.waitingQueueCount ?? 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 600 }}>
                      WAITING IN QUEUE
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ p: 2, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}`, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#4CAF50' }}>
                      {kpis?.totalSpinsToday ?? 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 600 }}>
                      SPINS TODAY
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}`, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.primary }}>
                      {kpis?.totalWinsToday ?? 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 600 }}>
                      WINS TODAY
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Quick Queue Operations Banner */}
              <Box sx={{ mt: 3, p: 2, bgcolor: alpha(tokens.primary, 0.05), borderRadius: 2, border: `1px dashed ${tokens.border}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.heading, mb: 0.5 }}>
                  Active Operational Rule
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.body }}>
                  Visitors register dynamically via rotating QR kiosk. Waiting registrations from ended days never carry over automatically. Pressing Space on the Wheel Stage executes the spin authoritatively.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Prizes & Reward Inventory */}
      <Grid container spacing={3}>
        {/* Top Awarded Rewards Today */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Top Prizes Won Today
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/admin/awards')}
                  sx={{ color: tokens.primary, fontWeight: 600 }}
                >
                  Awards Desk
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 600 } }}>
                      <TableCell>Prize Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Wins Today</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard?.topPrizesToday?.map((p) => (
                      <TableRow key={p.rewardId} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                        <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>{p.rewardName}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.type} />
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#4CAF50', fontWeight: 700 }}>{p.count}</TableCell>
                      </TableRow>
                    ))}
                    {(!dashboard?.topPrizesToday || dashboard.topPrizesToday.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: tokens.secondary }}>
                          No prizes awarded yet today.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Reward Catalog Summary */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Reward Inventory Overview
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/admin/rewards')}
                  sx={{ color: tokens.primary, fontWeight: 600 }}
                >
                  Manage Rewards
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 600 } }}>
                      <TableCell>Reward Name</TableCell>
                      <TableCell>Mode</TableCell>
                      <TableCell align="right">Physical Total</TableCell>
                      <TableCell align="right">Available</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rewards.slice(0, 5).map((r) => (
                      <TableRow key={r.id} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                        <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>{r.name}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.inventoryMode} />
                        </TableCell>
                        <TableCell align="right">{r.inventoryMode === 'LIMITED' ? r.totalPhysicalStock : '∞'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: r.availablePhysicalStock === 0 ? '#FF5252' : tokens.heading }}>
                          {r.inventoryMode === 'LIMITED' ? r.availablePhysicalStock : '∞'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {rewards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: tokens.secondary }}>
                          No rewards configured yet.
                        </TableCell>
                      </TableRow>
                    )}
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
