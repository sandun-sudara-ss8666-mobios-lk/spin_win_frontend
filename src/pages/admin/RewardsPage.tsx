import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  alpha,
  Tooltip,
  Grid,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { rewardsApi, merchantsApi, exhibitionsApi } from '../../api';
import { Reward, Merchant, RewardType, InventoryMode, DistributionStrategy } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RewardVideoUpload } from '../../components/common/RewardVideoUpload';
import { tokens } from '../../theme/theme';

export const RewardsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: rewards = [], isLoading: isRewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => rewardsApi.list(true),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantsApi.list(true),
  });

  const { data: currentExhibition } = useQuery({
    queryKey: ['currentExhibition'],
    queryFn: () => exhibitionsApi.getCurrent(),
  });

  // Create / Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Stock Adjustment Dialog State
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockReward, setStockReward] = useState<Reward | null>(null);
  const [quantityDelta, setQuantityDelta] = useState<number>(0);
  const [stockNotes, setStockNotes] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [shortLabel, setShortLabel] = useState('');
  const [description, setDescription] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [type, setType] = useState<RewardType>('PHYSICAL');
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>('LIMITED');
  const [distributionStrategy, setDistributionStrategy] = useState<DistributionStrategy>('AUTO_DAILY');
  const [totalPhysicalStock, setTotalPhysicalStock] = useState<number>(50);
  const [customDayAllocations, setCustomDayAllocations] = useState<{ [dayId: string]: number }>({});
  const [carryForward, setCarryForward] = useState(true);
  const [colorHex, setColorHex] = useState('#2A2A2E');
  const [baselineWeight, setBaselineWeight] = useState(3);
  const [isActive, setIsActive] = useState(true);
  const [video, setVideo] = useState<File>();
  const [removeVideo, setRemoveVideo] = useState(false);
  const [isVideoShow, setIsVideoShow] = useState(false);
  const [isVideoValidating, setIsVideoValidating] = useState(false);

  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const openCreateDialog = () => {
    setFeedback(null);
    setVideo(undefined);
    setRemoveVideo(false);
    setIsVideoShow(false);
    setIsVideoValidating(false);
    setEditingReward(null);
    setName('');
    setShortLabel('');
    setDescription('');
    setMerchantId(merchants[0]?.id || '');
    setType('PHYSICAL');
    setInventoryMode('LIMITED');
    setDistributionStrategy('AUTO_DAILY');
    setTotalPhysicalStock(50);
    setCarryForward(true);
    setColorHex('#2A2A2E');
    setBaselineWeight(3);
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (reward: Reward) => {
    setFeedback(null);
    setVideo(undefined);
    setRemoveVideo(false);
    setIsVideoShow(reward.isVideoShow ?? false);
    setIsVideoValidating(false);
    setEditingReward(reward);
    setName(reward.name);
    setShortLabel(reward.shortLabel || reward.wheelLabel || '');
    setDescription(reward.description || '');
    setMerchantId(reward.merchantId || '');
    setType(reward.type);
    setInventoryMode(reward.inventoryMode);
    setDistributionStrategy(reward.distributionStrategy);
    setTotalPhysicalStock(reward.totalPhysicalStock);
    setCarryForward(reward.carryForward);
    setColorHex(reward.colorHex || '#2A2A2E');
    setBaselineWeight(reward.baselineWeight || 3);
    setIsActive(reward.isActive);
    setDialogOpen(true);
  };

  const openStockDialog = (reward: Reward) => {
    setStockReward(reward);
    setQuantityDelta(0);
    setStockNotes('');
    setStockDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => rewardsApi.create(data, video),
    onSuccess: () => {
      setFeedback({ message: 'Reward created successfully.', severity: 'success' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err.message || 'Failed to create reward', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rewardsApi.update(id, data, video),
    onSuccess: () => {
      setFeedback({ message: 'Reward updated successfully.', severity: 'success' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err.message || 'Failed to update reward', severity: 'error' });
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantityDelta: number; notes: string } }) =>
      rewardsApi.adjustStock(id, data),
    onSuccess: () => {
      setFeedback({ message: 'Physical stock adjusted and audited in ledger.', severity: 'success' });
      setStockDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to adjust stock', severity: 'error' });
    },
  });

  const handleSaveReward = () => {
    if (isVideoValidating || createMutation.isPending || updateMutation.isPending) return;
    if (isVideoShow && !video && (removeVideo || !editingReward?.videoUrl)) {
      setFeedback({ message: 'Upload a video before enabling Show video on win.', severity: 'error' });
      return;
    }
    if (!name.trim()) {
      setFeedback({ message: 'Reward name is required.', severity: 'error' });
      return;
    }

    const payload: any = {
      name: name.trim(),
      shortLabel: (shortLabel.trim() || name.trim()).slice(0, 24),
      description: description.trim() || undefined,
      merchantId: merchantId || undefined,
      type,
      inventoryMode,
      distributionStrategy,
      totalPhysicalStock: inventoryMode === 'LIMITED' ? Number(totalPhysicalStock) : 0,
      carryForward,
      colorHex,
      baselineWeight: Number(baselineWeight) || 3,
      isActive,
      isVideoShow,
    };

    if (inventoryMode === 'LIMITED' && distributionStrategy === 'CUSTOM_DAILY') {
      payload.customDailyAllocations = customDayAllocations;
    }

    if (editingReward) {
      payload.removeVideo = removeVideo;
      updateMutation.mutate({ id: editingReward.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleStockAdjustment = () => {
    if (!stockReward) return;
    if (quantityDelta === 0) {
      setFeedback({ message: 'Delta must be non-zero.', severity: 'error' });
      return;
    }
    if (!stockNotes.trim()) {
      setFeedback({ message: 'Audit note is required for stock adjustments.', severity: 'error' });
      return;
    }

    adjustStockMutation.mutate({
      id: stockReward.id,
      data: {
        quantityDelta: Number(quantityDelta),
        notes: stockNotes.trim(),
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Rewards & Inventory
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Configure prize catalog, physical inventory allocations, daily carry-forward, and stock auditing.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ fontWeight: 700 }}
        >
          Create Reward
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

      {isRewardsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: tokens.primary }} />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: 3,
            boxShadow: 'none',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { borderColor: tokens.border, color: tokens.secondary, fontWeight: 700 } }}>
                <TableCell>Reward & Slice Label</TableCell>
                <TableCell>Merchant / Sponsor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell align="right">Physical Total</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="center">Carry-Forward</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow
                  key={reward.id}
                  sx={{
                    '& td': { borderColor: tokens.border, color: tokens.body },
                    '&:hover': { bgcolor: alpha('#FFFFFF', 0.02) },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: reward.colorHex || tokens.primary,
                          border: `1px solid ${tokens.border}`,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading }}>
                          {reward.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: tokens.secondary }}>
                          Slice: "{reward.shortLabel}"
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    {reward.merchant ? (
                      <Chip
                        label={reward.merchant.name}
                        size="small"
                        sx={{
                          bgcolor: alpha(reward.merchant.primaryColor || reward.merchant.brandColor || tokens.border, 0.15),
                          color: reward.merchant.primaryColor || reward.merchant.brandColor || tokens.heading,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: tokens.secondary }}>
                        MobiOs Direct
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={reward.type} />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={reward.inventoryMode} />
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.secondary }}>
                      {reward.distributionStrategy}
                    </Typography>
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {reward.inventoryMode === 'LIMITED' ? reward.totalPhysicalStock : '∞'}
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 800, color: reward.availablePhysicalStock === 0 ? '#FF5252' : tokens.heading }}>
                    {reward.inventoryMode === 'LIMITED' ? reward.availablePhysicalStock : '∞'}
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={reward.carryForward ? 'ON' : 'OFF'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: reward.carryForward ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.4),
                        color: reward.carryForward ? '#4CAF50' : tokens.secondary,
                      }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={reward.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: reward.isActive ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.4),
                        color: reward.isActive ? '#4CAF50' : tokens.secondary,
                      }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    {reward.inventoryMode === 'LIMITED' && (
                      <Tooltip title="Audit & Adjust Stock">
                        <IconButton
                          size="small"
                          onClick={() => openStockDialog(reward)}
                          sx={{ color: tokens.secondary, '&:hover': { color: tokens.primary } }}
                        >
                          <TuneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit Details">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(reward)}
                        sx={{ color: tokens.secondary, '&:hover': { color: tokens.heading } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {rewards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: tokens.secondary }}>
                    <CardGiftcardIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body1">No rewards configured yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Reward Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { if (!createMutation.isPending && !updateMutation.isPending && !isVideoValidating) setDialogOpen(false); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: tokens.surface, border: `1px solid ${tokens.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: tokens.heading }}>
          {editingReward ? 'Edit Reward' : 'Create New Reward'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, '&&': { pt: 2 } }}>
          {feedback?.severity === 'error' && <Alert severity="error">{feedback.message}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Reward Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                required
                placeholder="e.g. Wireless Power Bank 10000mAh"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Wheel Slice Label *"
                value={shortLabel}
                onChange={(e) => setShortLabel(e.target.value)}
                fullWidth
                size="small"
                inputProps={{ maxLength: 24 }}
                helperText="Max 24 chars for radial slice"
              />
            </Grid>
          </Grid>

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />

          {dialogOpen && <RewardVideoUpload
            file={video} savedUrl={editingReward?.videoUrl} removed={removeVideo} enabled={isVideoShow}
            disabled={createMutation.isPending || updateMutation.isPending}
            onChange={(file, removed) => { setVideo(file); setRemoveVideo(removed); }}
            onEnabledChange={setIsVideoShow} onValidatingChange={setIsVideoValidating}
          />}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Sponsor Merchant"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">
                  <em>MobiOs Direct (No sponsor)</em>
                </MenuItem>
                {merchants.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Reward Type *"
                value={type}
                onChange={(e) => setType(e.target.value as RewardType)}
                fullWidth
                size="small"
              >
                <MenuItem value="PHYSICAL">PHYSICAL (Hardware gift)</MenuItem>
                <MenuItem value="VOUCHER">VOUCHER (Promo / Discount)</MenuItem>
                <MenuItem value="MERCHANDISE">MERCHANDISE (Branded gear)</MenuItem>
                <MenuItem value="NO_WIN">NO_WIN (Non-winning)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Inventory Mode *"
                value={inventoryMode}
                onChange={(e) => setInventoryMode(e.target.value as InventoryMode)}
                fullWidth
                size="small"
              >
                <MenuItem value="LIMITED">LIMITED (Physical stock cap)</MenuItem>
                <MenuItem value="UNLIMITED">UNLIMITED (Infinite pool)</MenuItem>
                <MenuItem value="NO_WIN">NO_WIN (No win outcome)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          {inventoryMode === 'LIMITED' && (
            <Box sx={{ p: 2, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.heading, mb: 1.5 }}>
                Inventory & Daily Pacing Strategy
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Total Physical Stock *"
                    type="number"
                    value={totalPhysicalStock}
                    onChange={(e) => setTotalPhysicalStock(Math.max(1, parseInt(e.target.value) || 0))}
                    fullWidth
                    size="small"
                    inputProps={{ min: 1 }}
                    helperText="Hard physical stock cap for entire exhibition"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Distribution Strategy"
                    value={distributionStrategy}
                    onChange={(e) => setDistributionStrategy(e.target.value as DistributionStrategy)}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="AUTO_DAILY">AUTO_DAILY (Even split across remaining days)</MenuItem>
                    <MenuItem value="CUSTOM_DAILY">CUSTOM_DAILY (Manual allocation per day)</MenuItem>
                    <MenuItem value="EXHIBITION_WIDE">EXHIBITION_WIDE (Single pool, no daily caps)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {distributionStrategy === 'CUSTOM_DAILY' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: tokens.secondary, mb: 1, display: 'block' }}>
                    Custom Day Allocations (Day ID to quantity)
                  </Typography>
                  <Grid container spacing={2}>
                    {currentExhibition?.days?.map((d) => (
                      <Grid item xs={4} key={d.id}>
                        <TextField
                          label={`Day ${d.dayNumber} Stock`}
                          type="number"
                          size="small"
                          value={customDayAllocations[d.id] || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCustomDayAllocations((prev) => ({ ...prev, [d.id]: val }));
                          }}
                          inputProps={{ min: 0 }}
                          fullWidth
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={carryForward}
                      onChange={(e) => setCarryForward(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Carry-Forward Enabled (Unused daily quota rolls forward)"
                />
              </Box>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Theme Color (Hex)"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: colorHex, mr: 1 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Baseline Selection Weight (1-5)"
                type="number"
                value={baselineWeight}
                onChange={(e) => setBaselineWeight(parseInt(e.target.value) || 3)}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 10 }}
                helperText="Baseline probability weight before priority multipliers"
              />
            </Grid>
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="primary"
              />
            }
            label="Active (Available for Wheel Assignment)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${tokens.border}` }}>
          <Button onClick={() => setDialogOpen(false)} disabled={isVideoValidating || createMutation.isPending || updateMutation.isPending} sx={{ color: tokens.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveReward}
            disabled={isVideoValidating || createMutation.isPending || updateMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            {editingReward ? 'Update Reward' : 'Create Reward'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: tokens.surface, border: `1px solid ${tokens.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: tokens.heading }}>
          Adjust Physical Inventory
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ p: 1.5, bgcolor: tokens.cardBg, borderRadius: 2, border: `1px solid ${tokens.border}` }}>
            <Typography variant="caption" sx={{ color: tokens.secondary }}>
              Reward: <strong>{stockReward?.name}</strong>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.heading, mt: 0.5 }}>
              Physical Stock: {stockReward?.totalPhysicalStock} (Available: {stockReward?.availablePhysicalStock})
            </Typography>
          </Box>

          <TextField
            label="Stock Delta (+/-)"
            type="number"
            value={quantityDelta}
            onChange={(e) => setQuantityDelta(parseInt(e.target.value) || 0)}
            fullWidth
            size="small"
            helperText="Positive to add stock (e.g. +20), negative to safely reduce stock (e.g. -5)"
          />

          <TextField
            label="Audit Notes / Reason *"
            value={stockNotes}
            onChange={(e) => setStockNotes(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            required
            placeholder="e.g. Received +20 additional units from sponsor at stall"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${tokens.border}` }}>
          <Button onClick={() => setStockDialogOpen(false)} sx={{ color: tokens.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStockAdjustment}
            disabled={adjustStockMutation.isPending || quantityDelta === 0 || !stockNotes.trim()}
            sx={{ fontWeight: 700 }}
          >
            Commit Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
