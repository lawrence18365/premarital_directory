import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * One-click claim page for outreach emails
 * Allows providers to claim their profile with a single token
 *
 * SAFETY FEATURES:
 * - Token expiry check
 * - Logged-in user warning (no silent claims)
 * - Email mismatch notice
 * - Event logging for audit trail
 */
const ClaimWithTokenPage = () => {
  const { token } = useParams();
  const { user, signUp, signIn, signOut } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('verify'); // verify, logged_in_warning, auth, claiming, success
  const [authMode, setAuthMode] = useState('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-claim-token', {
        body: { token }
      })

      if (error || !data?.success) {
        throw new Error(data?.error || 'Invalid or expired claim link. Please contact support at hello@weddingcounselors.com.');
      }

      setProfile(data.profile);

      // Pre-fill email if we have it
      if (data.profile?.email) {
        setFormData(prev => ({ ...prev, email: data.profile.email }));
      }

      // If user is already logged in, show warning instead of auto-claiming
      if (user) {
        setStep('logged_in_warning');
      } else {
        setStep('auth');
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }

        const { error } = await signUp(formData.email, formData.password);
        if (error) throw error;

        // After signup, proceed to claim
        setStep('claiming');
        await claimProfile();
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;

        // After signin, proceed to claim
        setStep('claiming');
        await claimProfile();
      }
    } catch (err) {
      setError(err.message);
      setStep('auth');
    }

    setAuthLoading(false);
  };

  const handleLoggedInClaim = async () => {
    setAuthLoading(true);
    setError(null);
    setStep('claiming');

    try {
      await claimProfile();
    } catch (err) {
      setError(err.message);
      setStep('logged_in_warning');
    }

    setAuthLoading(false);
  };

  const handleSwitchAccount = async () => {
    await signOut();
    setStep('auth');
  };

  const claimProfile = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase.functions.invoke('claim-profile', {
        body: { token }
      })

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to claim profile')
      }

      setStep('success');
    } catch (err) {
      throw new Error('Failed to claim profile. Please try again or contact hello@weddingcounselors.com.');
    }
  };

  // Generate the public profile URL
  const getPublicProfileUrl = () => {
    if (!profile) return '';
    const stateSlug = profile.state_province?.toLowerCase().replace(/\s+/g, '-');
    const citySlug = profile.city?.toLowerCase().replace(/\s+/g, '-');
    return `https://www.weddingcounselors.com/premarital-counseling/${stateSlug}/${citySlug}/${profile.slug}`;
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="loading-spinner"></div>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            Verifying your claim link...
          </p>
        </div>
      </div>
    );
  }

  if (error && step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
              Claim Link Error
            </h2>
            <p style={{ marginBottom: 'var(--space-6)' }}>{error}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Need help? Email us at <a href="mailto:hello@weddingcounselors.com">hello@weddingcounselors.com</a>
            </p>
            <Link to="/claim-profile" className="btn btn-primary">
              Request New Claim Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'claiming') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="loading-spinner"></div>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            Claiming your profile...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const publicUrl = getPublicProfileUrl();

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#d1fae5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-6)',
              fontSize: '2rem'
            }}>
              <i className="fa fa-check" aria-hidden="true"></i>
            </div>
            <h2 style={{ color: 'var(--success)', marginBottom: 'var(--space-3)' }}>
              Profile Claimed Successfully!
            </h2>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              Welcome, <strong>{profile.full_name}</strong>!
            </p>

            {/* Public Profile URL */}
            <div style={{
              background: 'var(--gray-50)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: 'var(--space-2)' }}>
                Your Public Profile URL:
              </p>
              <div style={{
                background: 'white',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gray-200)',
                wordBreak: 'break-all',
                fontSize: '0.85rem'
              }}>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                  {publicUrl}
                </a>
              </div>
            </div>

            {/* What Couples See */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: 'var(--space-2)' }}>
                What couples see on your profile:
              </p>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li>Your name: {profile.full_name}</li>
                <li>Location: {profile.city}, {profile.state_province}</li>
                <li>Profession: {profile.profession || 'Not set'}</li>
                <li>Bio: {profile.bio ? `${profile.bio.substring(0, 50)}...` : 'Not set yet'}</li>
                <li>Contact info: {profile.email || 'Email'} {profile.phone ? '& Phone' : ''}</li>
              </ul>
            </div>

            {/* Next Steps */}
            <div style={{
              background: '#ede9fe',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
              textAlign: 'left',
              border: '1px solid #c4b5fd'
            }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: 'var(--space-2)', color: '#5b21b6' }}>
                Boost your visibility:
              </p>
              <ul style={{ margin: '0 0 0.5rem', paddingLeft: 'var(--space-4)', fontSize: '0.85rem', color: '#6d28d9' }}>
                <li style={{ marginBottom: '4px' }}>Add a professional photo (3x more views)</li>
                <li style={{ marginBottom: '4px' }}>Write a 150+ word bio</li>
                <li style={{ marginBottom: '4px' }}>Select your specialties and certifications</li>
              </ul>
              <p style={{ fontSize: '0.8rem', margin: 0, color: '#7c3aed' }}>
                Complete profiles get significantly more inquiries from couples.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link to="/professional/profile/edit" className="btn btn-primary">
                Complete Your Profile
              </Link>
              <Link to="/professional/dashboard" className="btn btn-outline">
                Go to Dashboard
              </Link>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ fontSize: '0.9rem' }}
              >
                View Public Profile →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in user warning screen
  if (step === 'logged_in_warning') {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ marginBottom: 'var(--space-2)' }}>
                Confirm Account
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Claiming profile for {profile?.full_name}
              </p>
            </div>

            <div style={{
              background: '#fef3c7',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)',
              border: '1px solid #fcd34d'
            }}>
              <p style={{ fontSize: '0.9rem', color: '#92400e', margin: 0 }}>
                <strong>You're currently logged in as:</strong><br />
                {user?.email}
              </p>
            </div>

            <p style={{ marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
              Claiming this profile will link it to your current account ({user?.email}).
              You'll be able to edit it and view analytics from this account.
            </p>

            {/* Email mismatch warning */}
            {profile?.email && profile.email !== user?.email && (
              <div style={{
                background: 'var(--bg-secondary)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-4)',
                fontSize: '0.85rem'
              }}>
                <strong>Note:</strong> The profile currently lists <strong>{profile.email}</strong> as the contact email.
                Your account email is <strong>{user?.email}</strong>.
                You can update the profile's contact email after claiming.
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: 'var(--space-3)',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button
                onClick={handleLoggedInClaim}
                disabled={authLoading}
                style={{
                  padding: '12px',
                  background: authLoading ? 'var(--gray-400)' : 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {authLoading ? 'Claiming...' : 'Continue and Link to This Account'}
              </button>

              <button
                onClick={handleSwitchAccount}
                disabled={authLoading}
                style={{
                  padding: '12px',
                  background: 'white',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Log Out and Use Different Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>
              Claim Your Profile
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {profile?.full_name} in {profile?.city}, {profile?.state_province}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)'
          }}>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              Create an account or sign in to claim this profile. Once claimed, you'll be able to:
            </p>
            <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-4)', fontSize: '0.9rem' }}>
              <li>Edit your profile information</li>
              <li>View analytics and inquiries</li>
              <li>Respond to couples directly</li>
              <li>Remove your listing anytime</li>
            </ul>
          </div>

          {/* Auth Mode Toggle */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)'
          }}>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              style={{
                flex: 1,
                padding: 'var(--space-2)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: authMode === 'signup' ? 'var(--color-primary)' : 'var(--gray-100)',
                color: authMode === 'signup' ? 'white' : 'var(--text-secondary)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              style={{
                flex: 1,
                padding: 'var(--space-2)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: authMode === 'signin' ? 'var(--color-primary)' : 'var(--gray-100)',
                color: authMode === 'signin' ? 'white' : 'var(--text-secondary)',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
              {/* Email mismatch notice */}
              {profile?.email && formData.email && formData.email !== profile.email && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Different from profile email ({profile.email}). You can update the profile email after claiming.
                </p>
              )}
            </div>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {authMode === 'signup' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: 'var(--space-3)',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: authLoading ? 'var(--gray-400)' : 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {authLoading
                ? 'Processing...'
                : authMode === 'signup'
                  ? 'Create Account & Claim Profile'
                  : 'Sign In & Claim Profile'
              }
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: 'var(--space-4)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            By claiming this profile, you confirm that you are {profile?.full_name} or authorized to manage this profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClaimWithTokenPage;
