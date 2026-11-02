import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Container,
  alpha,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { qrApi, participationsApi } from '../../api';
import { tokens } from '../../theme/theme';

type RegistrationStep = 'VERIFYING' | 'CLAIM_PROMPT' | 'CLAIMING' | 'FORM' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

export const JoinRegistrationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [step, setStep] = useState<RegistrationStep>('VERIFYING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [dayLabel, setDayLabel] = useState<string>('');

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Success Confirmation
  const [registeredRef, setRegisteredRef] = useState<string>('');
  const [registeredName, setRegisteredName] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setErrorMessage('Missing QR token');
      setStep('ERROR');
      return;
    }

    const verify = async () => {
      try {
        const res = await qrApi.verifyToken(token);
        if (res.isValid) {
          setDayLabel(res.dayLabel);
          setStep('CLAIM_PROMPT');
        } else {
          setErrorMessage(
            res.isExpired
              ? 'This QR code has expired. Please scan the latest code on the kiosk display.'
              : 'This QR code has already been claimed by another visitor. Please scan again.',
          );
          setStep('ERROR');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Unable to verify QR token');
        setStep('ERROR');
      }
    };

    verify();
  }, [token]);

  // Visitor clicks "Continue to Register"
  const handleClaim = async () => {
    if (!token) return;
    setStep('CLAIMING');
    try {
      const claimRes = await qrApi.claimToken(token);
      setSessionToken(claimRes.sessionToken);
      setDayLabel(claimRes.dayLabel);
      setStep('FORM');
    } catch (err: any) {
      setErrorMessage(
        err.message || 'This QR code was claimed just a moment ago. Please scan the code currently on screen.',
      );
      setStep('ERROR');
    }
  };

  // Visitor submits name & Sri Lankan mobile
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }

    // Clean phone input
    const cleanPhone = phone.replace(/[\s\-().]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setFormError('Please enter a valid Sri Lankan mobile number (e.g., 0771234567).');
      return;
    }

    setStep('SUBMITTING');
    try {
      const res = await participationsApi.register({
        sessionToken,
        name: cleanName,
        phone: cleanPhone,
      });

      setRegisteredRef(res.reference);
      setRegisteredName(res.visitorName);
      setStep('SUCCESS');
    } catch (err: any) {
      setFormError(err.message || 'Failed to complete registration. Please try again.');
      setStep('FORM');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: tokens.background,
        backgroundImage: `radial-gradient(circle at 50% 15%, ${tokens.accentGlow} 0%, #000000 60%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2.5,
      }}
    >
      <Container maxWidth="xs" sx={{ px: 0 }}>
        {/* Brand Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: tokens.heading,
            }}
          >
            MobiOs <span style={{ color: tokens.primary }}>Spin & Win</span>
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: tokens.secondary,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            INFOTEL Exhibition 2026 {dayLabel ? `• ${dayLabel}` : ''}
          </Typography>
        </Box>

        <Card
          sx={{
            backgroundColor: alpha(tokens.cardBg, 0.95),
            backdropFilter: 'blur(16px)',
            border: `1px solid ${tokens.border}`,
            borderRadius: 3.5,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            p: 1.5,
          }}
        >
          <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
            {/* STEP 1: VERIFYING */}
            {step === 'VERIFYING' && (
              <Box sx={{ py: 6 }}>
                <CircularProgress size={42} color="primary" sx={{ mb: 2.5 }} />
                <Typography variant="body1" sx={{ color: tokens.body, fontWeight: 600 }}>
                  Verifying QR Pass...
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.secondary }}>
                  Please hold on for a moment
                </Typography>
              </Box>
            )}

            {/* STEP 2: CLAIM PROMPT */}
            {(step === 'CLAIM_PROMPT' || step === 'CLAIMING') && (
              <Box sx={{ py: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: alpha(tokens.primary, 0.15),
                    color: tokens.primary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <QrCodeScannerIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.heading, mb: 1 }}>
                  Welcome to the Booth!
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.secondary, mb: 3.5, lineHeight: 1.6 }}>
                  You have scanned an active booth pass. Tap below to claim your ticket and join the queue.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleClaim}
                  disabled={step === 'CLAIMING'}
                  startIcon={step === 'CLAIMING' ? <CircularProgress size={18} color="inherit" /> : <HowToRegIcon />}
                  sx={{ py: 1.4, fontSize: '1rem', fontWeight: 700 }}
                >
                  {step === 'CLAIMING' ? 'Securing Pass...' : 'Continue to Register'}
                </Button>
              </Box>
            )}

            {/* STEP 3: REGISTRATION FORM */}
            {(step === 'FORM' || step === 'SUBMITTING') && (
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.heading, mb: 0.5, textAlign: 'center' }}>
                  Register to Spin
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.secondary, mb: 2.5, textAlign: 'center' }}>
                  Enter your details to receive your ticket number
                </Typography>

                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}

                <form onSubmit={handleSubmitForm}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    placeholder="e.g. Kamal Perera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    margin="normal"
                    disabled={step === 'SUBMITTING'}
                    autoFocus
                  />

                  <TextField
                    fullWidth
                    label="Sri Lankan Mobile Number"
                    placeholder="e.g. 077 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    margin="normal"
                    disabled={step === 'SUBMITTING'}
                    helperText="We support 07X XXX XXXX and +94 7X XXX XXXX"
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    type="submit"
                    disabled={step === 'SUBMITTING'}
                    startIcon={step === 'SUBMITTING' ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{ mt: 3, py: 1.3, fontSize: '1rem', fontWeight: 700 }}
                  >
                    {step === 'SUBMITTING' ? 'Submitting...' : 'Get Spin Ticket'}
                  </Button>
                </form>
              </Box>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {step === 'SUCCESS' && (
              <Box sx={{ py: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: alpha(tokens.success, 0.15),
                    color: tokens.success,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 800, color: tokens.heading, mb: 0.5 }}>
                  You are in the Queue!
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.secondary, mb: 3 }}>
                  Welcome, <b>{registeredName}</b>. Your ticket is registered.
                </Typography>

                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: alpha(tokens.surface, 0.9),
                    border: `1px solid ${tokens.border}`,
                    mb: 3,
                  }}
                >
                  <Typography variant="caption" sx={{ color: tokens.secondary, display: 'block', mb: 0.5 }}>
                    YOUR TICKET REFERENCE
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 800,
                      color: tokens.primary,
                      letterSpacing: '0.12em',
                    }}
                  >
                    {registeredRef}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: tokens.body, lineHeight: 1.6, px: 1 }}>
                  👀 Please watch the <b>Main Wheel Stage Screen</b>. When your reference is called, step up to the
                  wheel to spin!
                </Typography>
              </Box>
            )}

            {/* ERROR STATE */}
            {step === 'ERROR' && (
              <Box sx={{ py: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: alpha(tokens.error, 0.15),
                    color: tokens.error,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <ErrorOutlineIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: tokens.heading, mb: 1 }}>
                  Pass Unavailable
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.secondary, mb: 3, lineHeight: 1.6 }}>
                  {errorMessage}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  sx={{ borderColor: tokens.border }}
                >
                  Try Again
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Privacy notice */}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: tokens.secondary, mt: 3 }}>
          MobiOs Privacy: Your mobile number is used strictly for participant identification during INFOTEL 2026.
        </Typography>
      </Container>
    </Box>
  );
};
