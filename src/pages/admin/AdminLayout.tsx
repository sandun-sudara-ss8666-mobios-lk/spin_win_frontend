import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip,
  Button,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import TimelineIcon from '@mui/icons-material/Timeline';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CachedIcon from '@mui/icons-material/Cached';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useQuery } from '@tanstack/react-query';
import { exhibitionsApi } from '../../api';
import { tokens } from '../../theme/theme';
import { useSocket } from '../../realtime/useSocket';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Overview', path: '/admin/overview', icon: <DashboardIcon /> },
  { label: 'Exhibition Control', path: '/admin/exhibition', icon: <CalendarMonthIcon /> },
  { label: 'Merchants', path: '/admin/merchants', icon: <StorefrontIcon /> },
  { label: 'Rewards & Stock', path: '/admin/rewards', icon: <CardGiftcardIcon /> },
  { label: 'Distribution & Pacing', path: '/admin/distribution', icon: <TimelineIcon /> },
  { label: 'Wheel Designer', path: '/admin/wheel-designer', icon: <DonutLargeIcon /> },
  { label: 'Priority Ranking', path: '/admin/priority', icon: <FormatListNumberedIcon /> },
  { label: 'Visitors & Queue', path: '/admin/visitors', icon: <PeopleIcon /> },
  { label: 'Awards & Handover', path: '/admin/awards', icon: <EmojiEventsIcon /> },
  { label: 'Reports & Audit', path: '/admin/reports', icon: <AssessmentIcon /> },
  { label: 'Settings & Staff', path: '/admin/settings', icon: <SettingsIcon /> },
];

export const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { isConnected } = useSocket();

  const { data: activeDay } = useQuery({
    queryKey: ['activeDay'],
    queryFn: () => exhibitionsApi.getActiveDay(),
    refetchInterval: 15000,
  });

  const userJson = localStorage.getItem('mobios_user');
  const user = userJson ? JSON.parse(userJson) : null;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('mobios_staff_token');
    localStorage.removeItem('mobios_user');
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: tokens.surface }}>
      {/* Brand Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: tokens.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            color: '#FFFFFF',
            boxShadow: `0 0 15px ${tokens.accentGlow}`,
          }}
        >
          M
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: tokens.heading }}>
            MobiOs
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.secondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            INFOTEL Exhibition
          </Typography>
        </Box>
      </Box>

      {/* Quick Launch Buttons */}
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<CachedIcon />}
          onClick={() => window.open('/display/wheel', '_blank')}
          sx={{
            borderColor: tokens.border,
            color: tokens.body,
            fontSize: '0.75rem',
            py: 0.6,
            '&:hover': {
              borderColor: tokens.primary,
              bgcolor: alpha(tokens.primary, 0.08),
            },
          }}
        >
          Wheel Stage
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<QrCode2Icon />}
          onClick={() => window.open('/display/qr', '_blank')}
          sx={{
            borderColor: tokens.border,
            color: tokens.body,
            fontSize: '0.75rem',
            py: 0.6,
            '&:hover': {
              borderColor: tokens.primary,
              bgcolor: alpha(tokens.primary, 0.08),
            },
          }}
        >
          QR Kiosk
        </Button>
      </Box>

      <Divider sx={{ borderColor: tokens.border }} />

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin/overview' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  px: 1.5,
                  color: isActive ? tokens.heading : tokens.secondary,
                  bgcolor: isActive ? alpha(tokens.primary, 0.12) : 'transparent',
                  border: isActive ? `1px solid ${alpha(tokens.primary, 0.3)}` : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? alpha(tokens.primary, 0.16) : alpha('#FFFFFF', 0.04),
                    color: tokens.heading,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? tokens.primary : tokens.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: tokens.border }} />

      {/* Current Active Day Status Footer */}
      <Box sx={{ p: 2, bgcolor: tokens.cardBg }}>
        <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mb: 0.5 }}>
          Event Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            size="small"
            label={activeDay ? `${activeDay.label}: Live` : 'No Active Day'}
            color={activeDay ? 'success' : 'default'}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: activeDay ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.5),
              color: activeDay ? '#4CAF50' : tokens.secondary,
              border: `1px solid ${activeDay ? '#4CAF50' : tokens.border}`,
            }}
          />
          <Tooltip title={isConnected ? 'Realtime Connected' : 'Reconnecting...'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FiberManualRecordIcon
                sx={{
                  fontSize: 10,
                  color: isConnected ? '#4CAF50' : '#FF9800',
                  filter: isConnected ? 'drop-shadow(0 0 4px #4CAF50)' : 'none',
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: tokens.secondary }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: tokens.background }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: alpha(tokens.surface, 0.92),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' }, color: tokens.heading }}>
              Admin Portal
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {activeDay && (
              <Chip
                label={`Day ${activeDay.dayNumber} Active`}
                size="small"
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  bgcolor: alpha(tokens.primary, 0.15),
                  color: tokens.primary,
                  border: `1px solid ${tokens.primary}`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}

            <Button
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                textTransform: 'none',
                color: tokens.heading,
                gap: 1,
                p: 0.5,
                borderRadius: 2,
                '&:hover': { bgcolor: alpha('#FFFFFF', 0.05) },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: tokens.primary,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.name || 'Administrator'}
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.secondary, fontSize: '0.7rem' }}>
                  {user?.email || 'admin@mobios.lk'}
                </Typography>
              </Box>
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  bgcolor: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  minWidth: 180,
                  mt: 1,
                },
              }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/settings'); }}>
                <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: tokens.secondary }} />
                Settings
              </MenuItem>
              <Divider sx={{ borderColor: tokens.border }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#FF5252' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#FF5252' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${tokens.border}`,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${tokens.border}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8, // Header offset
          minHeight: '100vh',
          bgcolor: tokens.background,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
