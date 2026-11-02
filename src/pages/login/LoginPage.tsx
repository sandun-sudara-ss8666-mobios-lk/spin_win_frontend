import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authApi } from '../../api';
import { tokens } from '../../theme/theme';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@mobios.lk');
  const [password, setPassword] = useState('AdminPassword@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/admin/overview';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(email.trim(), password);
      localStorage.setItem('mobios_staff_token', response.accessToken);
      localStorage.setItem('mobios_user', JSON.stringify(response.user));
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.background,
        backgroundImage: `radial-gradient(circle at 50% 20%, ${tokens.accentGlow} 0%, transparent 60%)`,
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card
          sx={{
            p: 2,
            backgroundColor: tokens.cardBg,
            border: `1px solid ${tokens.border}`,
            borderRadius: 3,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            {/* Header Icon */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: tokens.accentGlow,
                color: tokens.primary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LockOutlinedIcon />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.heading, mb: 0.5 }}>
              Staff Authentication
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.secondary, mb: 3 }}>
              MobiOs Spin & Win Management Portal
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Staff Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
                autoComplete="email"
                autoFocus
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
                autoComplete="current-password"
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={isLoading}
                sx={{ mt: 3, py: 1.2, fontWeight: 700 }}
                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                Sign In to Portal
              </Button>
            </form>

            <Typography variant="caption" sx={{ display: 'block', color: tokens.secondary, mt: 3 }}>
              Authorized personnel only • INFOTEL Exhibition 2026
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
