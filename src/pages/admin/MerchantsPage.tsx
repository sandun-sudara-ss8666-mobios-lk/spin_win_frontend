import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  Avatar,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { merchantsApi } from '../../api';
import { Merchant } from '../../types';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { tokens } from '../../theme/theme';

export const MerchantsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => merchantsApi.list(true),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Merchant | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandColor, setBrandColor] = useState('#FF2600');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const openCreateDialog = () => {
    setEditingMerchant(null);
    setName('');
    setDescription('');
    setBrandColor('#FF2600');
    setLogoUrl('');
    setContactEmail('');
    setContactPhone('');
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setName(merchant.name);
    setDescription(merchant.description || '');
    setBrandColor(merchant.brandColor || '#FF2600');
    setLogoUrl(merchant.logoUrl || '');
    setContactEmail(merchant.contactEmail || '');
    setContactPhone(merchant.contactPhone || '');
    setIsActive(merchant.isActive);
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Merchant>) => merchantsApi.create(data),
    onSuccess: () => {
      setFeedback({ message: 'Merchant created successfully.', severity: 'success' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to create merchant', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Merchant> }) => merchantsApi.update(id, data),
    onSuccess: () => {
      setFeedback({ message: 'Merchant updated successfully.', severity: 'success' });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to update merchant', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => merchantsApi.delete(id),
    onSuccess: () => {
      setFeedback({ message: 'Merchant deleted successfully.', severity: 'success' });
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: (err: any) => {
      setFeedback({ message: err?.response?.data?.message || 'Failed to delete merchant', severity: 'error' });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setFeedback({ message: 'Merchant name is required', severity: 'error' });
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      brandColor,
      logoUrl: logoUrl.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      isActive,
    };

    if (editingMerchant) {
      updateMutation.mutate({ id: editingMerchant.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: tokens.heading }}>
            Merchants & Sponsors
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.secondary, mt: 0.5 }}>
            Manage exhibiting partner brands, corporate sponsor profiles, and brand theming.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ fontWeight: 700 }}
        >
          Add Merchant
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

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: tokens.primary }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {merchants.map((merchant) => (
            <Grid item xs={12} sm={6} md={4} key={merchant.id}>
              <Card
                sx={{
                  bgcolor: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: merchant.brandColor || tokens.primary,
                  },
                }}
              >
                <CardContent sx={{ p: 3, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={merchant.logoUrl || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(merchant.primaryColor || merchant.brandColor || tokens.primary, 0.2),
                        color: merchant.primaryColor || merchant.brandColor || tokens.primary,
                        fontWeight: 700,
                        border: `1px solid ${tokens.border}`,
                      }}
                    >
                      {merchant.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: tokens.heading }}>
                        {merchant.name}
                      </Typography>
                      <Chip
                        label={merchant.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: merchant.isActive ? alpha('#4CAF50', 0.15) : alpha(tokens.border, 0.5),
                          color: merchant.isActive ? '#4CAF50' : tokens.secondary,
                        }}
                      />
                    </Box>
                  </Box>

                  {merchant.description && (
                    <Typography variant="body2" sx={{ color: tokens.body, mb: 2, minHeight: 40, fontSize: '0.85rem' }}>
                      {merchant.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 'auto' }}>
                    {merchant.contactEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 14, color: tokens.secondary }} />
                        <Typography variant="caption" noWrap sx={{ color: tokens.secondary }}>
                          {merchant.contactEmail}
                        </Typography>
                      </Box>
                    )}
                    {merchant.contactPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 14, color: tokens.secondary }} />
                        <Typography variant="caption" sx={{ color: tokens.secondary }}>
                          {merchant.contactPhone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0, borderTop: `1px solid ${tokens.border}`, justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={() => openEditDialog(merchant)}
                    sx={{ color: tokens.secondary, '&:hover': { color: tokens.heading } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteConfirm(merchant)}
                    sx={{ color: tokens.secondary, '&:hover': { color: '#FF5252' } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {merchants.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, color: tokens.secondary }}>
                <StorefrontIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6">No merchants found</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Click 'Add Merchant' to create sponsor partners.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: tokens.surface, border: `1px solid ${tokens.border}` } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: tokens.heading }}>
          {editingMerchant ? 'Edit Merchant' : 'Create Merchant'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Merchant Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Brand Color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '4px',
                        bgcolor: brandColor,
                        mr: 1,
                        border: `1px solid ${tokens.border}`,
                      }}
                    />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Contact Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                fullWidth
                size="small"
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
            label="Active Merchant"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${tokens.border}` }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: tokens.secondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            sx={{ fontWeight: 700 }}
          >
            {editingMerchant ? 'Update Merchant' : 'Create Merchant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={Boolean(deleteConfirm)}
        title={`Delete ${deleteConfirm?.name}?`}
        message="Are you sure you want to delete this merchant? Merchants associated with active rewards cannot be removed."
        confirmText="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteMutation.mutate(deleteConfirm.id);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};
