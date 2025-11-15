import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * One-click claim page for outreach emails
 * Allows providers to claim their profile with a single token
 */
const ClaimWithTokenPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('verify'); // verify, auth, success
  const [authMode, setAuthMode] = useState('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  useEffect(() => {
    // If user is already logged in, try to claim immediately
    if (user && profile && step === 'auth') {
      claimProfile();
    }
  }, [user, profile, step]);

  const verifyToken = async () => {
    setLoading(true);
    setError(null);

    try {
      // Find profile with this claim token
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('claim_token', token)
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired claim link. Please contact support.');
      }

      if (data.is_claimed) {
        throw new Error('This profile has already been claimed. Please sign in to your account.');
      }

      setProfile(data);

      // Pre-fill email if we have it
      if (data.email) {
        setFormData(prev => ({ ...prev, email: data.email }));
      }

      setStep('auth');
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

        // User should now be logged in, claim will happen via useEffect
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;

        // User should now be logged in, claim will happen via useEffect
      }
    } catch (err) {
      setError(err.message);
    }

    setAuthLoading(false);
  };

  const claimProfile = async () => {
    if (!user || !profile) return;

    try {
      // Update profile to mark as claimed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_id: user.id,
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          claim_token: null, // Invalidate token after use
          moderation_status: 'approved' // Auto-approve claimed profiles
        })
        .eq('id', profile.id)
        .eq('claim_token', token); // Double-check token

      if (updateError) throw updateError;

      // Track the claim
      await supabase.from('provider_outreach').upsert({
        provider_email: profile.email,
        provider_name: profile.full_name,
        city: profile.city,
        state: profile.state_province,
        last_contact: new Date().toISOString(),
        status: 'claimed',
        claimed_at: new Date().toISOString()
      }, {
        onConflict: 'provider_email'
      });

      setStep('success');
    } catch (err) {
      setError('Failed to claim profile. Please try again or contact support.');
    }
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
            <Link to="/claim-profile" className="btn btn-primary">
              Request New Claim Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
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
              ✓
            </div>
            <h2 style={{ color: 'var(--success)', marginBottom: 'var(--space-3)' }}>
              Profile Claimed Successfully!
            </h2>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              Welcome, <strong>{profile.full_name}</strong>!
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Your profile is now under your control. You can edit your bio, update your contact information, and view analytics.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Link to="/professional/dashboard" className="btn btn-primary">
                Go to Your Dashboard
              </Link>
              <Link to="/professional/profile/edit" className="btn btn-outline">
                Edit Your Profile
              </Link>
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
              <li>Upgrade for featured placement</li>
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
