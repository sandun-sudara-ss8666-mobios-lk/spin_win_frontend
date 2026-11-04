import { Box, Typography } from '@mui/material';
import { tokens } from '../../theme/theme';

export function DisplayBrandHeader() {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        component="h1"
        variant="h3"
        sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: tokens.heading, mb: 0.5,
          fontSize: { xs: '1.75rem', sm: '3rem' } }}
      >
        MobiOs <span style={{ color: tokens.primary }}>Spin & Win</span>
      </Typography>
      <Typography variant="subtitle1" sx={{ color: tokens.secondary, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.85rem' }}>
        INFOTEL Exhibition 2026
      </Typography>
    </Box>
  );
}
