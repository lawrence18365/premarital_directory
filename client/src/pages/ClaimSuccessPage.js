import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import SEOHelmet from '../components/analytics/SEOHelmet';

const ClaimSuccessPage = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('authenticating'); // authenticating, claiming, success, error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // 1. Wait for auth to settle (from the magic link hash or session)
        if (authLoading) return;

        if (!user) {
            // Magic link might have failed or expired
            setStatus('error');
            setErrorMsg('Authentication failed or link expired. Please try clicking the link in your email again.');
            return;
        }

        // 2. Extract token from URL
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (!token) {
            // If there's no token but they are logged in, just send them to dashboard
            navigate('/professional/dashboard?welcome=true');
            return;
        }

        // 3. Claim Profile
        claimProfile(token);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user, location.search, navigate]);

    const claimProfile = async (token) => {
        setStatus('claiming');
        try {
            const { data, error } = await supabase.functions.invoke('claim-profile', {
                body: { token }
            });

            if (error || !data?.success) {
                throw new Error(data?.error || 'Failed to claim profile');
            }

            setStatus('success');

            // Redirect to dashboard after a short delay so they can read the success message
            setTimeout(() => {
                navigate('/professional/dashboard?welcome=true&claimed=true');
            }, 3000);

        } catch (err) {
            console.error('Claim error:', err);
            // It's possible the profile is already claimed. Check if we have a profile.
            if (err.message === 'Profile already claimed' || profile) {
                navigate('/professional/dashboard');
            } else {
                setStatus('error');
                setErrorMsg(err.message || 'An error occurred while claiming your profile.');
            }
        }
    };

    return (
        <div className="auth-page">
            <SEOHelmet title="Claiming Profile..." noindex={true} />
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    {status === 'authenticating' && (
                        <>
                            <div className="loading-spinner"></div>
                            <h2 style={{ marginTop: 'var(--space-4)' }}>Securely Logging You In...</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Please wait a moment.</p>
                        </>
                    )}

                    {status === 'claiming' && (
                        <>
                            <div className="loading-spinner"></div>
                            <h2 style={{ marginTop: 'var(--space-4)' }}>Connecting Your Profile...</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Setting up your dashboard.</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'var(--ds-accent-soft)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-6)',
                                fontSize: '2rem',
                                color: 'var(--success)'
                            }}>
                                <i className="fa fa-check" aria-hidden="true"></i>
                            </div>
                            <h2 style={{ color: 'var(--success)', marginBottom: 'var(--space-3)' }}>
                                Profile Claimed Successfully!
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                                Welcome to WeddingCounselors.com. Redirecting you to your dashboard...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-6)',
                                fontSize: '1.5rem',
                                color: 'var(--error)'
                            }}>
                                <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                            </div>
                            <h2 style={{ color: 'var(--error)', marginBottom: 'var(--space-3)' }}>
                                Oops, something went wrong
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                                {errorMsg}
                            </p>
                            <button onClick={() => navigate('/claim-profile')} className="btn btn-primary">
                                Request a New Link
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClaimSuccessPage;
