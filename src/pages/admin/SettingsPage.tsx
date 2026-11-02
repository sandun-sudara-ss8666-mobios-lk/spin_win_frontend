import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  Tooltip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/Key';
import { authApi, exhibitionsApi } from '../../api';
import { tokens } from '../../theme/theme';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['staffUsers'],
    queryFn: () => authApi.listUsers(),
  });

  const { data: exhibition } = useQuery({
    queryKey: ['currentExhibition'],
    queryFn: () => exhibitionsApi.getCurrent(),
  });

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const displayToken = 'mobios-display-screen-auth-token-key-2026';

  const createUserMutation = useMutation({
    mutationFn: (data: { email: string; name: string; password: string }) => authApi.createUser(data),
    onSuccess: () => {
      setFeedback({ message: 'New staff user created successfully.', severity: 'success' });
      setCreateUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      queryClient.invalidateQueries({ queryKey: ['staffUsers'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to create staff account', severity: 'error' });
    },
  });

  const handleCopyToken = () => {
    navigator.clipboard.writeText(displayToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setFeedback({ message: 'All fields are required.', severity: 'error' });
      return;
    }
    createUserMutation.mutate({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            System Settings & Staff Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Configure exhibition environment, manage staff credentials, and retrieve kiosk display tokens.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => setCreateUserOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          Add Staff Account
        </Button>
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Exhibition Config */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SettingsIcon sx={{ color: tokens.primary }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Exhibition Configuration
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: tokens.secondary }}>Event Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading }}>{exhibition?.name || 'MobiOs Spin & Win — INFOTEL'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: tokens.secondary }}>Timezone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading }}>{exhibition?.timezone || 'Asia/Colombo (UTC+05:30)'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: tokens.secondary }}>Configured Days</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading }}>{exhibition?.days?.length ?? 3} Days</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: tokens.secondary }}>Status</Typography>
                  <Chip
                    label={exhibition?.isPaused ? 'PAUSED' : 'OPERATIONAL'}
                    size="small"
                    sx={{
                      bgcolor: exhibition?.isPaused ? alpha('#FF9800', 0.15) : alpha('#4CAF50', 0.15),
                      color: exhibition?.isPaused ? '#FF9800' : '#4CAF50',
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Kiosk Display Token */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <KeyIcon sx={{ color: '#2196F3' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading }}>
                  Kiosk Display Screen Token
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: tokens.body, mb: 2, fontSize: '0.85rem' }}>
                Unattended stall hardware (large wheel projection, QR tablet stands) authenticates via this static header key (<code>x-display-token</code>):
              </Typography>

              <Box
                sx={{
                  p: 1.5,
                  bgcolor: tokens.cardBackground,
                  borderRadius: 2,
                  border: `1px solid ${tokens.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: tokens.primary, fontWeight: 700, wordBreak: 'break-all' }}>
                  {displayToken}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyToken}
                  sx={{ borderColor: tokens.border, color: tokens.body, flexShrink: 0 }}
                >
                  {copiedToken ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Staff Accounts Table */}
      <Card sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.heading, mb: 2 }}>
            Authorized Staff Accounts
          </Typography>

          {isUsersLoading ? (
            <CircularProgress sx={{ color: tokens.primary, my: 2 }} />
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Email / Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} sx={{ '& td': { borderColor: tokens.border, color: tokens.body } }}>
                      <TableCell sx={{ fontWeight: 700, color: tokens.heading }}>{u.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{u.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role || 'ADMIN'}
                          size="small"
                          sx={{ bgcolor: alpha(tokens.primary, 0.15), color: tokens.primary, fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="ACTIVE"
                          size="small"
                          sx={{ bgcolor: alpha('#4CAF50', 0.15), color: '#4CAF50', fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Staff User Dialog */}
      <Dialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: tokens.surface, border: `1px solid ${tokens.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: tokens.heading }}>
          Create Staff Account
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Full Name *"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Email Address *"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Temporary Password *"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            fullWidth
            size="small"
            required
            helperText="Minimum 8 characters"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${tokens.border}` }}>
          <Button onClick={() => setCreateUserOpen(false)} sx={{ color: tokens.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            Create Staff User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
