import React from 'react';
import { Chip, ChipProps, alpha } from '@mui/material';
import { tokens } from '../../theme/theme';

export type BadgeStatus =
  | 'UPCOMING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'WAITING'
  | 'SELECTED'
  | 'SPINNING'
  | 'SKIPPED'
  | 'DAY_CLOSED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'CANCELLED'
  | 'LIMITED'
  | 'UNLIMITED'
  | 'NO_WIN';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: BadgeStatus | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'small', sx, ...props }) => {
  let color = tokens.secondary;
  let bg = alpha(tokens.secondary, 0.12);
  let displayLabel = label || status.replace('_', ' ');

  switch (status) {
    case 'IN_PROGRESS':
    case 'ACTIVE':
    case 'SELECTED':
      color = tokens.primary;
      bg = alpha(tokens.primary, 0.15);
      break;
    case 'COMPLETED':
      color = tokens.success;
      bg = alpha(tokens.success, 0.15);
      break;
    case 'UPCOMING':
    case 'WAITING':
      color = tokens.info;
      bg = alpha(tokens.info, 0.15);
      break;
    case 'SPINNING':
      color = '#A855F7';
      bg = alpha('#A855F7', 0.18);
      break;
    case 'SKIPPED':
    case 'DAY_CLOSED':
    case 'CANCELLED':
    case 'INACTIVE':
      color = tokens.secondary;
      bg = alpha(tokens.secondary, 0.12);
      break;
    case 'LIMITED':
      color = tokens.warning;
      bg = alpha(tokens.warning, 0.15);
      break;
    case 'UNLIMITED':
      color = tokens.info;
      bg = alpha(tokens.info, 0.15);
      break;
    case 'NO_WIN':
      color = '#71717A';
      bg = alpha('#71717A', 0.15);
      break;
  }

  return (
    <Chip
      size={size}
      label={displayLabel}
      sx={{
        color,
        backgroundColor: bg,
        fontWeight: 600,
        letterSpacing: '0.03em',
        border: `1px solid ${alpha(color, 0.3)}`,
        ...sx,
      }}
      {...props}
    />
  );
};
