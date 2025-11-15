import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

/**
 * Multi-provider inquiry form - the "money" feature
 * Sends one message to multiple counselors in a city
 */
const MultiProviderInquiryForm = ({ cityName, stateName, stateSlug, citySlug, providers }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredType: 'either',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Filter and select providers to contact
  const getMatchingProviders = () => {
    let filtered = [...providers];

    // Filter by preferred type if specified
    if (formData.preferredType === 'therapist') {
      filtered = filtered.filter(p =>
        p.profession?.toLowerCase().includes('therapist') ||
        p.profession?.toLowerCase().includes('lmft') ||
        p.profession?.toLowerCase().includes('lpc') ||
        p.profession?.toLowerCase().includes('lcsw')
      );
    } else if (formData.preferredType === 'clergy') {
      filtered = filtered.filter(p =>
        p.profession?.toLowerCase().includes('pastor') ||
        p.profession?.toLowerCase().includes('priest') ||
        p.profession?.toLowerCase().includes('clergy') ||
        p.profession?.toLowerCase().includes('minister')
      );
    }

    // Prioritize by tier, then take top 3-5
    const sorted = filtered.sort((a, b) => {
      const tierOrder = { 'area_spotlight': 1, 'local_featured': 2, 'community': 3 };
      return (tierOrder[a.tier] || 99) - (tierOrder[b.tier] || 99);
    });

    return sorted.slice(0, Math.min(5, Math.max(3, sorted.length)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const matchingProviders = getMatchingProviders();

      if (matchingProviders.length === 0) {
        throw new Error('No matching counselors found. Please try a different preference.');
      }

      const providerIds = matchingProviders.map(p => p.id);

      // Insert inquiry record
      const { data: inquiry, error: insertError } = await supabase
        .from('city_inquiries')
        .insert({
          couple_name: formData.name || null,
          couple_email: formData.email,
          couple_message: formData.message,
          preferred_type: formData.preferredType,
          city: cityName,
          state: stateName,
          provider_ids: providerIds,
          source: 'city_page'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger emails to providers (via Edge Function)
      for (const provider of matchingProviders) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: provider.email,
            subject: `New Inquiry from a Couple in ${cityName}`,
            template: 'inquiry_to_provider',
            data: {
              providerName: provider.full_name?.split(' ')[0] || 'there',
              city: cityName,
              state: stateName,
              coupleName: formData.name || 'A couple',
              coupleEmail: formData.email,
              message: formData.message,
              dashboardUrl: `https://www.weddingcounselors.com/professional/analytics`
            }
          }
        });
      }

      // Send confirmation to couple
      await supabase.functions.invoke('send-email', {
        body: {
          to: formData.email,
          subject: `Your Inquiry Has Been Sent to ${matchingProviders.length} Counselors`,
          template: 'inquiry_confirmation',
          data: {
            coupleName: formData.name || 'there',
            providerCount: matchingProviders.length,
            city: cityName,
            state: stateName,
            stateSlug,
            citySlug
          }
        }
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Inquiry submission error:', err);
      setError(err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        background: '#f0fdf4',
        padding: 'var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid #0d9488',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#0d9488', marginBottom: 'var(--space-3)' }}>
          Your Inquiry Has Been Sent
        </h3>
        <p style={{ marginBottom: 'var(--space-3)' }}>
          We've sent your message to {getMatchingProviders().length} premarital counselors in {cityName}.
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Check your email at <strong>{formData.email}</strong> for responses. Counselors typically reply within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%)',
      padding: 'var(--space-6)',
      borderRadius: 'var(--radius-lg)',
      border: '2px solid #0d9488',
      marginTop: 'var(--space-8)'
    }}>
      <h3 style={{
        color: '#0d9488',
        marginBottom: 'var(--space-2)',
        fontSize: 'var(--text-xl)'
      }}>
        Contact Multiple Counselors at Once
      </h3>
      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: 'var(--space-4)',
        fontSize: '0.95rem'
      }}>
        Send one message to 3-5 matching counselors in {cityName}. They'll reply directly to your email.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Your Name (optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Jane & John"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Your Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Preference
          </label>
          <select
            value={formData.preferredType}
            onChange={(e) => setFormData({ ...formData, preferredType: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.95rem',
              background: 'white'
            }}
          >
            <option value="either">Either Therapist or Clergy</option>
            <option value="therapist">Licensed Therapist (LMFT, LPC, etc.)</option>
            <option value="clergy">Clergy / Faith-Based</option>
          </select>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '0.9rem' }}>
            Your Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={4}
            placeholder="Tell counselors about your situation... When are you getting married? What are you looking for in premarital counseling? Any specific concerns?"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.95rem',
              resize: 'vertical'
            }}
          />
        </div>

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
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            background: isSubmitting ? '#9ca3af' : '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {isSubmitting ? 'Sending...' : `Send to ${getMatchingProviders().length} Counselors`}
        </button>

        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginTop: 'var(--space-2)',
          textAlign: 'center'
        }}>
          We'll send your message to counselors who match your preference. They'll reply directly to your email.
        </p>
      </form>
    </div>
  );
};

export default MultiProviderInquiryForm;
