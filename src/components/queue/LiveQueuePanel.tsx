import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, IconButton, Tooltip, CircularProgress, alpha } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import { tokens } from '../../theme/theme';
import { Participation } from '../../types';

interface LiveQueuePanelProps {
  queue: Participation[];
  selectedParticipation: Participation | null;
  isLoading?: boolean;
  isSpinning?: boolean;
  onSelect: (participation: Participation) => void;
  onRefresh?: () => void;
  onScrollingChange: (scrolling: boolean) => void;
}

export const LiveQueuePanel: React.FC<LiveQueuePanelProps> = ({
  queue, selectedParticipation, isLoading = false, isSpinning = false,
  onSelect, onRefresh, onScrollingChange,
}) => {
  const viewport = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const frame = useRef<number>();
  const [position, setPosition] = useState(0);
  const [metrics, setMetrics] = useState({ height: 360, row: 128 });
  const visitors = queue.filter((item) => item.status === 'WAITING' || item.status === 'SELECTED');
  const ids = visitors.map((item) => item.id).join(',');
  const callbacks = useRef({ onSelect, onScrollingChange, visitors, isSpinning });
  callbacks.current = { onSelect, onScrollingChange, visitors, isSpinning };

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const row = element.querySelector<HTMLElement>('[role="option"]')?.offsetHeight || 128;
      setMetrics({ height: element.clientHeight, row });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ids]);

  useEffect(() => {
    const index = visitors.findIndex((item) => item.id === selectedParticipation?.id);
    if (index < 0 || !viewport.current) return;
    viewport.current.scrollTo({ top: index * metrics.row, behavior: 'instant' });
    setPosition(index);
  }, [selectedParticipation?.id, ids, metrics.row, metrics.height]);

  useEffect(() => () => {
    clearTimeout(timer.current);
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
  }, []);

  const handleScroll = useCallback(() => {
    if (callbacks.current.isSpinning) return;
    callbacks.current.onScrollingChange(true);
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setPosition((viewport.current?.scrollTop || 0) / metrics.row);
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const index = Math.round((viewport.current?.scrollTop || 0) / metrics.row);
      const visitor = callbacks.current.visitors[index];
      if (!callbacks.current.isSpinning && visitor) callbacks.current.onSelect(visitor);
      callbacks.current.onScrollingChange(false);
    }, 180);
  }, [metrics.row]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: alpha(tokens.cardBg, 0.95),
      border: `1px solid ${tokens.border}`, borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: { xs: 2, sm: 3 }, paddingBlock: 'var(--queue-header-padding, 16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' }, color: tokens.heading }}>
            Up next <Box component="span" sx={{ color: tokens.primary, ml: 1 }}>{visitors.length}</Box>
          </Typography>
          <Typography sx={{ color: tokens.secondary, fontSize: '0.75rem', mt: 0.5 }}>
            {isSpinning ? 'Visitor locked · wheel in progress' : 'Scroll to choose your visitor'}
          </Typography>
        </Box>
        {onRefresh && (
          <Tooltip title="Refresh queue">
            <IconButton aria-label="Refresh queue" onClick={onRefresh} disabled={isLoading || isSpinning}
              sx={{ color: tokens.secondary, width: 44, height: 44 }}><RefreshRoundedIcon /></IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', perspective: '800px' }}>
        {visitors.length > 0 && (
          <Box aria-hidden sx={{ position: 'absolute', top: '50%', left: 1, right: 1, height: metrics.row,
            transform: 'translateY(-50%)', borderBlock: `1px solid ${alpha(tokens.primary, 0.6)}`,
            background: `linear-gradient(90deg, ${alpha(tokens.primary, 0.03)}, ${alpha(tokens.primary, 0.13)}, ${alpha(tokens.primary, 0.03)})`,
            boxShadow: `0 0 40px ${alpha(tokens.primary, 0.08)}`, pointerEvents: 'none' }} />
        )}
        <Box ref={viewport} role="listbox" aria-label="Visitor queue. Use arrow keys to choose, Space to spin."
          aria-orientation="vertical" aria-disabled={isSpinning} aria-busy={isLoading} tabIndex={0}
          aria-activedescendant={visitors.length ? `queue-visitor-${visitors[Math.max(0, Math.min(visitors.length - 1, Math.round(position)))]?.id}` : undefined}
          onScroll={handleScroll}
          onKeyDown={(event) => {
            const keys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            if (isSpinning) return;
            const current = Math.round((viewport.current?.scrollTop || 0) / metrics.row);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? visitors.length - 1 : current + (event.key === 'ArrowDown' ? 1 : -1);
            viewport.current?.scrollTo({ top: Math.max(0, Math.min(visitors.length - 1, next)) * metrics.row,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
          }}
          sx={{ height: '100%', overflowY: isSpinning ? 'hidden' : 'auto', overflowX: 'hidden',
            overscrollBehaviorY: 'contain', scrollSnapType: 'y mandatory', scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }, outlineOffset: '-3px',
            '&:focus-visible': { outline: `2px solid ${tokens.primary}` },
            maskImage: visitors.length ? 'linear-gradient(transparent, black 12%, black 88%, transparent)' : 'none' }}>
          {visitors.length ? (
            <>
              <Box aria-hidden sx={{ height: Math.max(0, (metrics.height - metrics.row) / 2) }} />
              {visitors.map((visitor, index) => {
                const distance = Math.abs(index - position);
                const emphasis = Math.max(0, 1 - distance / 2.5);
                const centered = index === Math.round(position);
                const phone = (visitor.visitorPhoneMasked || visitor.visitorPhone || '').replace(/\D/g, '').slice(-4);
                return (
                  <Box id={`queue-visitor-${visitor.id}`} key={visitor.id} role="option" aria-selected={centered}
                    sx={{ height: 'clamp(128px, 11vw, 176px)', scrollSnapAlign: 'center', scrollSnapStop: 'always',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                    <Box sx={{ width: '100%', textAlign: 'center', opacity: 0.35 + emphasis * 0.65,
                      transform: `scale(${0.72 + emphasis * 0.28}) rotateX(${Math.max(-20, Math.min(20, (index - position) * -10))}deg)`,
                      transition: 'transform 100ms ease-out, opacity 100ms ease-out',
                      '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' } }}>
                      <Typography sx={{ color: tokens.heading, fontWeight: 800, fontSize: 'clamp(1.25rem, 2.7vw, 2.5rem)',
                        lineHeight: 1.15, overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {visitor.visitorName}
                      </Typography>
                      <Typography sx={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                        fontSize: 'clamp(1.1rem, 2.2vw, 2rem)', color: centered ? tokens.primary : tokens.heading,
                        letterSpacing: '0.06em', lineHeight: 1.2, mt: 0.5 }}>{phone ? `******${phone}` : 'Phone unavailable'}</Typography>
                      <Typography sx={{ fontSize: 'clamp(0.7rem, 1.1vw, 1rem)', color: tokens.secondary, mt: 0.5,
                        fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>{visitor.readableRef}</Typography>
                    </Box>
                  </Box>
                );
              })}
              <Box aria-hidden sx={{ height: Math.max(0, (metrics.height - metrics.row) / 2) }} />
            </>
          ) : (
            <Box role="status" sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3, gap: 2 }}>
              {isLoading && <CircularProgress size={32} />}
              <Typography sx={{ color: tokens.secondary, textAlign: 'center' }}>{isLoading ? 'Loading visitors…' : 'Waiting for the next visitor'}</Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'var(--queue-hint-display, flex)', justifyContent: 'center', alignItems: 'center', gap: 0.5, py: 1.5, color: tokens.secondary }}>
        <UnfoldMoreRoundedIcon sx={{ fontSize: 18,
          animation: isSpinning ? 'none' : 'queue-hint 2s ease-in-out infinite',
          '@keyframes queue-hint': { '0%, 100%': { transform: 'translateY(-2px)' }, '50%': { transform: 'translateY(2px)' } },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }} />
        <Typography sx={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}>SCROLL · CENTER · PRESS SPACE</Typography>
      </Box>
    </Card>
  );
};
