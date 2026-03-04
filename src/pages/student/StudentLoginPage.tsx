import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, LogIn, KeyRound, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  studentAuthAPI,
  saveStudentSession,
  getStudentSession,
} from '@/api/studentAuthApi';

type Step = 'id-entry' | 'create-pin' | 'enter-pin';

interface LookupResult {
  studentId: string;
  fullName: string;
  roomName: string | null;
  pinStatus: 'NOT_SET' | 'SET' | 'RESET_REQUIRED';
}

const StudentLoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('id-entry');
  const [studentPublicId, setStudentPublicId] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check existing session on mount
  useEffect(() => {
    const token = getStudentSession();
    if (token) {
      navigate('/student/home');
    }
  }, [navigate]);

  const handleLookup = async () => {
    if (!studentPublicId.trim()) {
      setError('Please enter your Student ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await studentAuthAPI.lookup(studentPublicId.trim());
      setLookupResult(result);

      if (result.pinStatus === 'NOT_SET' || result.pinStatus === 'RESET_REQUIRED') {
        setStep('create-pin');
      } else {
        setStep('enter-pin');
      }
    } catch (err: any) {
      setError(err.message || 'Student ID not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await studentAuthAPI.setPin(studentPublicId.trim(), pin);
      saveStudentSession(result.sessionToken, result.expiresAt, studentPublicId.trim().toUpperCase());
      toast.success('PIN created! Welcome to BrightMinds! 🎉');
      navigate('/student/home');
    } catch (err: any) {
      setError(err.message || 'Failed to create PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await studentAuthAPI.loginPin(studentPublicId.trim(), pin);
      saveStudentSession(result.sessionToken, result.expiresAt, studentPublicId.trim().toUpperCase());

      if (result.accessToken) {
        localStorage.setItem('student_presigned_token', result.accessToken);
      }

      const redirectUrl = result.accessUrl || (result.accessToken
        ? `/student-portal?token=${encodeURIComponent(result.accessToken)}`
        : '/student/home');

      toast.success('Welcome back! 🎉');

      if (redirectUrl.startsWith('http')) {
        window.location.replace(redirectUrl);
      } else {
        navigate(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('id-entry');
    setPin('');
    setConfirmPin('');
    setError('');
    setLookupResult(null);
  };

  const handlePinInput = (value: string, setter: (v: string) => void) => {
    // Only allow digits, max 6
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setter(cleaned);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-primary/20 rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-primary/20 to-secondary/20 pb-8 pt-10">
          <div className="flex justify-center mb-4">
            <img
              src="/brightminds-logo1.png"
              alt="BrightMinds"
              className="h-16 w-16 rounded-2xl"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {step === 'id-entry' && 'Welcome to BrightMinds 👋'}
            {step === 'create-pin' && 'Create Your PIN 🔐'}
            {step === 'enter-pin' && `Welcome Back, ${lookupResult?.fullName?.split(' ')[0]}! 👋`}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            {step === 'id-entry' && 'Enter your Student ID to get started'}
            {step === 'create-pin' && 'Choose a 6-digit PIN to secure your account'}
            {step === 'enter-pin' && 'Enter your 6-digit PIN to log in'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step: ID Entry */}
          {step === 'id-entry' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Student ID</label>
                <Input
                  type="text"
                  placeholder="e.g. BM-10293"
                  value={studentPublicId}
                  onChange={(e) => setStudentPublicId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="h-14 text-lg text-center font-mono rounded-2xl border-2 border-muted focus:border-primary"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleLookup}
                disabled={loading || !studentPublicId.trim()}
                className="w-full h-14 text-lg rounded-2xl font-semibold"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Continue
                  </>
                )}
              </Button>
              <div className="text-center">
                <button
                  onClick={() => toast.info("Ask your teacher for your Student ID")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <HelpCircle className="h-4 w-4" />
                  I don't know my Student ID
                </button>
              </div>
            </div>
          )}

          {/* Step: Create PIN */}
          {step === 'create-pin' && (
            <div className="space-y-6">
              {lookupResult && (
                <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-2xl p-3">
                  Setting up for <strong>{lookupResult.fullName}</strong>
                  {lookupResult.roomName && <> • {lookupResult.roomName}</>}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Create 6-Digit PIN</label>
                <div className="relative">
                  <Input
                    type={showPin ? 'text' : 'password'}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => handlePinInput(e.target.value, setPin)}
                    className="h-14 text-2xl text-center font-mono rounded-2xl border-2 border-muted focus:border-primary tracking-[0.5em]"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm PIN</label>
                <Input
                  type={showPin ? 'text' : 'password'}
                  placeholder="••••••"
                  value={confirmPin}
                  onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
                  className="h-14 text-2xl text-center font-mono rounded-2xl border-2 border-muted focus:border-primary tracking-[0.5em]"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
              {pin.length === 6 && confirmPin.length === 6 && pin === confirmPin && (
                <p className="text-center text-sm text-accent font-medium">✓ PINs match!</p>
              )}
              <Button
                onClick={handleCreatePin}
                disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                className="w-full h-14 text-lg rounded-2xl font-semibold"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <KeyRound className="h-5 w-5 mr-2" />
                    Save PIN
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleBack} className="w-full rounded-2xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* Step: Enter PIN */}
          {step === 'enter-pin' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your 6-Digit PIN</label>
                <div className="relative">
                  <Input
                    type={showPin ? 'text' : 'password'}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => handlePinInput(e.target.value, setPin)}
                    onKeyDown={(e) => e.key === 'Enter' && pin.length === 6 && handleLogin()}
                    className="h-14 text-2xl text-center font-mono rounded-2xl border-2 border-muted focus:border-primary tracking-[0.5em]"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading || pin.length !== 6}
                className="w-full h-14 text-lg rounded-2xl font-semibold"
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Login
                  </>
                )}
              </Button>
              <div className="text-center">
                <button
                  onClick={() => toast.info("Ask your teacher to reset your PIN")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <HelpCircle className="h-4 w-4" />
                  Forgot PIN?
                </button>
              </div>
              <Button variant="ghost" onClick={handleBack} className="w-full rounded-2xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentLoginPage;
