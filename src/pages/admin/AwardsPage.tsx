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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  alpha,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { rewardsApi } from '../../api';
import { Award } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { tokens } from '../../theme/theme';

export const AwardsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: awards = [], isLoading } = useQuery({
    queryKey: ['awards'],
    queryFn: () => rewardsApi.listAwards(),
    refetchInterval: 10000,
  });

  const [cancelModalAward, setCancelModalAward] = useState<Award | null>(null);
  const [resolution, setResolution] = useState<string>('IMMEDIATE_RETURN');
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const cancelMutation = useMutation({
    mutationFn: ({ awardId, data }: { awardId: string; data: { resolution: string; reason: string } }) =>
      rewardsApi.cancelAward(awardId, data),
    onSuccess: (data) => {
      setFeedback({ message: data.message || 'Award cancelled and inventory updated.', severity: 'success' });
      setCancelModalAward(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['awards'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to cancel award', severity: 'error' });
    },
  });

  const handleCancelSubmit = () => {
    if (!cancelModalAward) return;
    if (!reason.trim()) {
      setFeedback({ message: 'Cancellation reason is required.', severity: 'error' });
      return;
    }
    cancelMutation.mutate({
      awardId: cancelModalAward.id,
      data: {
        resolution,
        reason: reason.trim(),
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Awards & Stall Handover Desk
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Verify winning participant tickets, mark physical gifts as handed over, or process audited prize cancellations.
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
                    <TableCell>Winner Name</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Reward Won</TableCell>
                    <TableCell>Merchant Sponsor</TableCell>
                    <TableCell>Awarded Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Desk Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {awards.map((award) => {
                    const isCancelled = award.status === 'CANCELLED';

                    return (
                      <TableRow
                        key={award.id}
                        sx={{
                          '& td': { borderColor: tokens.border, color: tokens.body },
                          '&:hover': { bgcolor: alpha('#FFFFFF', 0.02) },
                        }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: tokens.primary }}>
                          {award.participation?.readableRef || award.id.slice(0, 8)}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700, color: tokens.heading }}>
                          {award.participation?.visitorName || 'Visitor'}
                        </TableCell>

                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {award.participation?.visitorPhone || '—'}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>
                          {award.reward?.name}
                        </TableCell>

                        <TableCell>
                          {award.reward?.merchant ? (
                            <Chip
                              label={award.reward.merchant.name}
                              size="small"
                              sx={{
                                bgcolor: alpha(award.reward.merchant.primaryColor || award.reward.merchant.brandColor || tokens.border, 0.15),
                                color: award.reward.merchant.primaryColor || award.reward.merchant.brandColor || tokens.heading,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: tokens.secondary }}>
                              MobiOs Direct
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ color: tokens.secondary, fontSize: '0.8rem' }}>
                          {new Date(award.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={award.status} />
                        </TableCell>

                        <TableCell align="right">
                          {!isCancelled && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setCancelModalAward(award);
                                  setResolution('IMMEDIATE_RETURN');
                                  setReason('');
                                }}
                                sx={{ fontSize: '0.75rem', py: 0.3 }}
                              >
                                Cancel Award
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {awards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: tokens.secondary }}>
                        <EmojiEventsIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <Typography variant="body1">No prize awards recorded yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Cancel Award Resolution Dialog */}
      <Dialog
        open={Boolean(cancelModalAward)}
        onClose={() => setCancelModalAward(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: tokens.surface, border: `1px solid ${tokens.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: tokens.heading }}>
          Cancel Prize Award
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
            <Typography variant="caption" sx={{ color: tokens.secondary }}>
              Winner: <strong>{cancelModalAward?.participation?.visitorName}</strong> ({cancelModalAward?.participation?.readableRef})
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading, mt: 0.5 }}>
              Prize: {cancelModalAward?.reward?.name}
            </Typography>
          </Box>

          <TextField
            select
            label="Inventory Resolution *"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="IMMEDIATE_RETURN">
              IMMEDIATE_RETURN (Return stock to active pool)
            </MenuItem>
            <MenuItem value="RETURN_TO_PACING">
              RETURN_TO_PACING (Return to daily pacing pool)
            </MenuItem>
            <MenuItem value="RETIRE">
              RETIRE (Stock broken/lost, permanently retire)
            </MenuItem>
          </TextField>

          <TextField
            label="Reason for Cancellation *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            required
            placeholder="e.g. Visitor left exhibition stall without claiming"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${tokens.border}` }}>
          <Button onClick={() => setCancelModalAward(null)} sx={{ color: tokens.secondary }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubmit}
            disabled={cancelMutation.isPending || !reason.trim()}
            sx={{ fontWeight: 700 }}
          >
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
