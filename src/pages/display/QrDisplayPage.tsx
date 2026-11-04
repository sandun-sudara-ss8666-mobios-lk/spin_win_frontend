import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { qrApi } from '../../api';
import { useSocket } from '../../realtime/useSocket';
import { tokens } from '../../theme/theme';
import { DisplayBrandHeader } from '../../components/common/DisplayBrandHeader';

export const QrDisplayPage: React.FC = () => {
  const [tokenData, setTokenData] = useState<{
    token: string;
    expiresAt: string;
    ttlSeconds: number;
    dayNumber: number;
    dayLabel: string;
  } | null>(null);

  const [remainingTime, setRemainingTime] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isConnected, on } = useSocket({ room: 'room:qr-display' });

  const fetchToken = async () => {
    try {
      setError(null);
      const data = await qrApi.getCurrentToken();
      setTokenData(data);
      setRemainingTime(data.ttlSeconds || 15);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active QR token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();

    // Listen to real-time server rotation events
    const unsub = on('qr:rotated', (data) => {
      setTokenData(data);
      setRemainingTime(data.ttlSeconds || 15);
    });

    return () => unsub();
  }, [on]);

  // Local tick countdown
  useEffect(() => {
    if (!tokenData) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tokenData?.token]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const registrationUrl = tokenData ? `${currentUrl}/join/${tokenData.token}` : '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: tokens.background,
        backgroundImage: `radial-gradient(circle at 50% 30%, ${tokens.accentGlow} 0%, #000000 70%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top Floating Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          left: 28,
          right: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            size="small"
            icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: `${isConnected ? tokens.success : tokens.warning} !important` }} />}
            label={isConnected ? 'LIVE' : 'CONNECTING...'}
            sx={{
              backgroundColor: alpha(isConnected ? tokens.success : tokens.warning, 0.12),
              color: isConnected ? tokens.success : tokens.warning,
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
          {tokenData && (
            <Chip
              size="small"
              label={`Day ${tokenData.dayNumber}`}
              sx={{
                backgroundColor: alpha(tokens.secondary, 0.12),
                color: tokens.secondary,
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Force Refresh">
            <IconButton onClick={fetchToken} sx={{ color: tokens.secondary }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle Fullscreen">
            <IconButton onClick={toggleFullscreen} sx={{ color: tokens.secondary }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Kiosk Card */}
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: alpha(tokens.cardBg, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${tokens.border}`,
          borderRadius: 4,
          boxShadow: `0 30px 80px rgba(0,0,0,0.9), 0 0 40px ${tokens.accentGlow}`,
          textAlign: 'center',
          p: { xs: 3, sm: 5 },
        }}
      >
        {/* Brand Header shared with the wheel display */}
        <Box sx={{ mb: 4 }}>
          <DisplayBrandHeader />
        </Box>

        {/* QR Code Container */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            backgroundColor: '#FFFFFF',
            borderRadius: 3,
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            mb: 3.5,
            position: 'relative',
          }}
        >
          {isLoading ? (
            <Box sx={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={40} color="primary" />
            </Box>
          ) : error ? (
            <Box sx={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
              <Typography variant="body2" sx={{ color: tokens.error }}>
                {error}
              </Typography>
            </Box>
          ) : (
            <QRCodeSVG
              value={registrationUrl}
              size={240}
              level="H"
              includeMargin={false}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          )}
        </Box>

        {/* Instructions */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: tokens.heading,
            letterSpacing: '-0.01em',
            mb: 1,
          }}
        >
          Scan to Step Up & Spin
        </Typography>

        <Typography variant="body2" sx={{ color: tokens.secondary, mb: 3, px: 2 }}>
          Open your mobile camera or QR scanner. Scan the code to register your participation ticket.
        </Typography>

        {/* Dynamic Rotation Progress Indicator */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2.5,
            py: 1,
            borderRadius: 20,
            backgroundColor: alpha('#000000', 0.6),
            border: `1px solid ${tokens.borderSubtle}`,
          }}
        >
          <CircularProgress
            variant="determinate"
            value={(remainingTime / 15) * 100}
            size={18}
            thickness={5}
            sx={{ color: tokens.primary }}
          />
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              color: tokens.secondary,
            }}
          >
            Refreshes in {remainingTime}s
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
