import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, FormControlLabel, Switch, Typography } from '@mui/material';
import { API_BASE_URL } from '../../api/client';
import { getRewardVideoUrl, validateVideoUpload } from '../wheel/reward-video';
import { tokens } from '../../theme/theme';

interface Props {
  file?: File;
  savedUrl?: string | null;
  removed: boolean;
  enabled: boolean;
  disabled: boolean;
  onChange: (file: File | undefined, removed: boolean) => void;
  onEnabledChange: (enabled: boolean) => void;
  onValidatingChange: (validating: boolean) => void;
}

export function RewardVideoUpload({ file, savedUrl, removed, enabled, disabled, onChange, onEnabledChange, onValidatingChange }: Props) {
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const [validating, setValidating] = useState(false);
  const request = useRef(0);

  useEffect(() => () => { request.current++; }, []);
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    try { setPreview(!removed && savedUrl ? getRewardVideoUrl(savedUrl, API_BASE_URL, window.location.origin) : undefined); }
    catch { setPreview(undefined); }
  }, [file, savedUrl, removed]);

  const choose = async (selected?: File) => {
    if (!selected) return;
    const id = ++request.current;
    setError(undefined);
    setValidating(true);
    onValidatingChange(true);
    try {
      await validateVideoUpload(selected);
      if (id === request.current) onChange(selected, false);
    } catch (error) {
      if (id === request.current) setError(error instanceof Error ? error.message : 'Video could not be validated');
    } finally {
      if (id === request.current) { setValidating(false); onValidatingChange(false); }
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: tokens.cardBg, border: `1px solid ${tokens.border}`, borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Win celebration video</Typography>
      <Typography variant="body2" sx={{ color: tokens.secondary, mb: 1.5 }}>
        MP4 with H.264 video and AAC audio. Maximum 10 seconds, 15 MB, and 1080p.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
      {preview && <Box component="video" key={preview} src={preview} controls playsInline preload="metadata"
        aria-label="Reward video preview" sx={{ display: 'block', width: '100%', maxHeight: 220, bgcolor: '#000', borderRadius: 1, mb: 1.5 }} />}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Button component="label" variant="outlined" disabled={disabled || validating}>
          {preview ? 'Replace video' : 'Upload video'}
          <input type="file" accept=".mp4,video/mp4" hidden disabled={disabled || validating}
            onChange={(event) => { const selected = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void choose(selected); }} />
        </Button>
        {preview && <Button color="error" disabled={disabled || validating} onClick={() => {
          onChange(undefined, true); onEnabledChange(false); setError(undefined);
        }}>Remove video</Button>}
        {validating && <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={18} /><Typography variant="caption">Checking video…</Typography>
        </Box>}
        {file && <Typography variant="caption" sx={{ color: tokens.secondary, overflowWrap: 'anywhere' }}>{file.name}</Typography>}
      </Box>
      <FormControlLabel sx={{ mt: 1 }} label="Show video on win"
        control={<Switch checked={enabled} disabled={disabled || validating || !preview}
          onChange={(event) => onEnabledChange(event.target.checked)} />} />
    </Box>
  );
}
