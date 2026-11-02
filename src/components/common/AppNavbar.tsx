import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  alpha,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import CachedIcon from '@mui/icons-material/Cached';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { tokens } from '../../theme/theme';
import { ExhibitionDay } from '../../types';

interface AppNavbarProps {
  activeDay?: ExhibitionDay | null;
  isConnected?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeDay,
  isConnected = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const token = localStorage.getItem('mobios_staff_token');
  const userJson = localStorage.getItem('mobios_user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('mobios_staff_token');
    localStorage.removeItem('mobios_user');
    setAnchorEl(null);
    navigate('/login');
  };

  const navLinks = [
    { label: 'Wheel Stage', path: '/display/wheel', icon: <CachedIcon fontSize="small" /> },
    { label: 'QR Kiosk', path: '/display/qr', icon: <QrCode2Icon fontSize="small" /> },
    { label: 'Admin Panel', path: '/admin/overview', icon: <DashboardIcon fontSize="small" /> },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: alpha(tokens.surface, 0.9),
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tokens.border}`,
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
        {/* Brand Logo & Event Header */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
          onClick={() => navigate('/display/wheel')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: tokens.primary,
                boxShadow: `0 0 10px ${tokens.primary}`,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: tokens.heading,
              }}
            >
              MobiOs <span style={{ color: tokens.primary }}>Spin & Win</span>
            </Typography>
          </Box>
          <Chip
            size="small"
            label="INFOTEL 2026"
            sx={{
              backgroundColor: alpha(tokens.secondary, 0.12),
              color: tokens.secondary,
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        </Box>

        {/* Center: Active Day & WebSocket Status */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          {activeDay ? (
            <Chip
              size="small"
              icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: `${tokens.success} !important` }} />}
              label={`Active: Day ${activeDay.dayNumber} (${activeDay.label})`}
              sx={{
                backgroundColor: alpha(tokens.success, 0.12),
                color: tokens.success,
                fontWeight: 600,
                border: `1px solid ${alpha(tokens.success, 0.3)}`,
              }}
            />
          ) : (
            <Chip
              size="small"
              label="No Active Exhibition Day"
              sx={{
                backgroundColor: alpha(tokens.secondary, 0.12),
                color: tokens.secondary,
                fontWeight: 500,
              }}
            />
          )}

          <Tooltip title={isConnected ? 'Live WebSocket Connected' : 'Reconnecting to Server...'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: isConnected ? tokens.success : tokens.warning,
                  boxShadow: isConnected ? `0 0 8px ${tokens.success}` : `0 0 8px ${tokens.warning}`,
                }}
              />
              <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 500 }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Right: Quick Links & User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Button
                key={link.path}
                size="small"
                startIcon={link.icon}
                onClick={() => navigate(link.path)}
                variant={isActive ? 'contained' : 'text'}
                color={isActive ? 'primary' : 'inherit'}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: { xs: link.path.includes('admin') ? 'none' : 'flex', sm: 'flex' },
                }}
              >
                {link.label}
              </Button>
            );
          })}

          {token && (
            <>
              <Tooltip title={user?.name || 'Account'}>
                <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: tokens.heading }}>
                  <AccountCircleIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    backgroundColor: tokens.cardBg,
                    border: `1px solid ${tokens.border}`,
                    minWidth: 160,
                  },
                }}
              >
                <MenuItem disabled sx={{ opacity: '0.8 !important' }}>
                  <Typography variant="caption" sx={{ color: tokens.secondary }}>
                    Signed in as <b>{user?.name || user?.email}</b>
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/overview'); }}>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: tokens.error }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          )}

          {!token && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 600, fontSize: '0.8125rem' }}
            >
              Staff Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
