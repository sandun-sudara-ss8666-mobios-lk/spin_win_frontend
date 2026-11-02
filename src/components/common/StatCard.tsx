import React from 'react';
import { Card, CardContent, Typography, Box, alpha } from '@mui/material';
import { tokens } from '../../theme/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  color?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  color,
  trend,
}) => {
  const activeColor = accentColor || color || tokens.primary;
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${tokens.border}`,
        backgroundColor: tokens.cardBg,
        '&:hover': {
          borderColor: alpha(activeColor, 0.4),
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 15px ${alpha(activeColor, 0.15)}`,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: activeColor,
        }}
      />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="caption" sx={{ color: tokens.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          {icon && (
            <Box
              sx={{
                p: 0.8,
                borderRadius: 1.5,
                backgroundColor: alpha(activeColor, 0.12),
                color: activeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading, my: 0.5 }}>
          {value}
        </Typography>

        {(subtitle || trend) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {trend && (
              <Typography variant="caption" sx={{ color: tokens.success, fontWeight: 600 }}>
                {trend}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" sx={{ color: tokens.secondary }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
