import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  alpha,
  TextField,
  MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { reportsApi, exhibitionsApi } from '../../api';
import { tokens } from '../../theme/theme';

export const ReportsPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');

  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => reportsApi.getDashboard(),
  });

  const { data: currentExhibition } = useQuery({
    queryKey: ['currentExhibition'],
    queryFn: () => exhibitionsApi.getCurrent(),
  });

  const { data: auditLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['auditLogs', actionFilter],
    queryFn: () => reportsApi.getAuditLogs(100, actionFilter || undefined),
    refetchInterval: 15000,
  });

  if (isDashboardLoading || isLogsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: tokens.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
          Reports & Immutable Audit Trail
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
          Event analytics, daily breakdown, and cryptographically verified administrative audit records.
        </Typography>
      </Box>

      {/* Analytics Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, p: 2.5 }}>
            <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 700 }}>
              TOTAL REGISTRATIONS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: tokens.heading, my: 0.5 }}>
              {dashboard?.totalRegistrations ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.secondary }}>
              Across all exhibition days
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, p: 2.5 }}>
            <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 700 }}>
              TOTAL SPINS COMPLETED
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#2196F3', my: 0.5 }}>
              {dashboard?.totalSpins ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.secondary }}>
              Conversion rate: {dashboard?.totalRegistrations ? Math.round(((dashboard.totalSpins ?? 0) / dashboard.totalRegistrations) * 100) : 0}%
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, p: 2.5 }}>
            <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 700 }}>
              PRIZES WON
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#4CAF50', my: 0.5 }}>
              {dashboard?.totalWins ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.secondary }}>
              Win rate: {dashboard?.winRatePercent ?? '0%'}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, p: 2.5 }}>
            <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 700 }}>
              BETTER LUCK OUTCOMES
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: tokens.secondary, my: 0.5 }}>
              {dashboard?.totalNoWins ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.secondary }}>
              Controlled non-winning results
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Audit Logs Table */}
      <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ color: tokens.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                Administrative Audit Ledger
              </Typography>
            </Box>

            <TextField
              select
              size="small"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              sx={{ minWidth: 200 }}
              label="Filter Action Type"
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="DAY_STARTED">DAY_STARTED</MenuItem>
              <MenuItem value="DAY_ENDED">DAY_ENDED</MenuItem>
              <MenuItem value="STOCK_ADJUSTED">STOCK_ADJUSTED</MenuItem>
              <MenuItem value="AWARD_CANCELLED">AWARD_CANCELLED</MenuItem>
              <MenuItem value="CONFIG_PUBLISHED">CONFIG_PUBLISHED</MenuItem>
            </TextField>
          </Box>

          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Staff Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Audit Details & Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                    <TableCell sx={{ color: tokens.secondary, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, color: tokens.heading }}>
                      {log.user?.name || log.user?.email || 'System'}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: alpha(tokens.primary, 0.12),
                          color: tokens.primary,
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      {log.notes || (log.details ? JSON.stringify(log.details) : '—')}
                    </TableCell>
                  </TableRow>
                ))}

                {auditLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: tokens.secondary }}>
                      <HistoryEduIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                      <Typography variant="body1">No audit log records found.</Typography>
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
