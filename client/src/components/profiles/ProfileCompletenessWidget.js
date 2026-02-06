/**
 * Profile Completeness Widget
 * Shows counselors their progress in a positive, motivating way.
 * Frames completion as unlocking visibility, not fixing problems.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const ProfileCompletenessWidget = ({ profile }) => {
  if (!profile) return null;

  const checks = [
    {
      key: 'photo',
      label: 'Add a professional photo',
      complete: !!profile.photo_url,
      points: 10,
      impact: '3x more profile views'
    },
    {
      key: 'bio',
      label: 'Write a detailed bio (150+ words)',
      complete: profile.bio && profile.bio.length > 150,
      points: 15,
      impact: 'Helps couples connect with you'
    },
    {
      key: 'specialties',
      label: 'Select 3+ specialties',
      complete: profile.specialties && profile.specialties.length >= 3,
      points: 10,
      impact: 'Appear in more searches'
    },
    {
      key: 'certifications',
      label: 'Add certifications',
      complete: profile.certifications && profile.certifications.length > 0,
      points: 10,
      impact: 'Builds trust with couples'
    },
    {
      key: 'faith_tradition',
      label: 'Specify faith tradition',
      complete: !!profile.faith_tradition,
      points: 10,
      impact: 'Key search filter for couples'
    },
    {
      key: 'treatment_approaches',
      label: 'List treatment approaches',
      complete: profile.treatment_approaches && profile.treatment_approaches.length > 0,
      points: 10,
      impact: 'Shows your methods'
    },
    {
      key: 'session_types',
      label: 'Set session types',
      complete: profile.session_types && profile.session_types.length > 0,
      points: 10,
      impact: 'In-person, online, or both'
    },
    {
      key: 'pricing',
      label: 'Add pricing info',
      complete: !!(profile.session_fee_min || profile.pricing_range),
      points: 10,
      impact: 'Couples prefer transparent pricing'
    },
    {
      key: 'phone',
      label: 'Add phone number',
      complete: !!profile.phone,
      points: 5,
      impact: 'Direct contact option'
    },
    {
      key: 'website',
      label: 'Link your website',
      complete: !!profile.website,
      points: 5,
      impact: 'Drives traffic to your site'
    },
    {
      key: 'years_experience',
      label: 'Add years of experience',
      complete: !!profile.years_experience,
      points: 5,
      impact: 'Builds credibility'
    },
  ];

  const completedChecks = checks.filter(c => c.complete);
  const totalPoints = checks.reduce((sum, c) => sum + c.points, 0);
  const earnedPoints = completedChecks.reduce((sum, c) => sum + c.points, 0);
  const percentage = Math.round((earnedPoints / totalPoints) * 100);

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'Looking great', color: '#059669', bg: '#d1fae5' };
    if (pct >= 70) return { label: 'Almost there', color: '#0891b2', bg: '#cffafe' };
    if (pct >= 50) return { label: 'Good progress', color: '#7c3aed', bg: '#ede9fe' };
    if (pct >= 25) return { label: 'Getting started', color: '#d97706', bg: '#fef3c7' };
    return { label: 'Just created', color: '#6b7280', bg: '#f3f4f6' };
  };

  const grade = getGrade(percentage);
  const incompleteChecks = checks.filter(c => !c.complete);

  // Don't show the widget at all if profile is 100% complete
  if (percentage === 100) {
    return null;
  }

  // Find the single highest-impact next step
  const nextStep = incompleteChecks[0];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid var(--gray-200)',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem'
    }}>
      {/* Compact header with progress */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            Profile Strength
          </h3>
          <span style={{
            background: grade.bg,
            color: grade.color,
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontWeight: '600',
            fontSize: '0.8rem'
          }}>
            {percentage}% &mdash; {grade.label}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {completedChecks.length}/{checks.length} complete
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        background: 'var(--gray-100)',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: grade.color,
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Single next step — not a list of 11 things */}
      {nextStep && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.75rem 1rem',
          background: grade.bg,
          borderRadius: '8px'
        }}>
          <div>
            <span style={{ fontWeight: '500', fontSize: '0.9rem', color: grade.color }}>
              Next: {nextStep.label}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              &mdash; {nextStep.impact}
            </span>
          </div>
          <Link
            to="/professional/profile/edit"
            style={{
              padding: '0.4rem 0.85rem',
              background: grade.color,
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            Update
          </Link>
        </div>
      )}

      {/* Show remaining items count as expandable, not as a guilt list */}
      {incompleteChecks.length > 1 && (
        <details style={{ marginTop: '0.75rem' }}>
          <summary style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            {incompleteChecks.length - 1} more item{incompleteChecks.length - 1 !== 1 ? 's' : ''} to boost your visibility
          </summary>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginTop: '0.5rem',
            paddingLeft: '0.25rem'
          }}>
            {incompleteChecks.slice(1).map(check => (
              <div
                key={check.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem 0'
                }}
              >
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: '1.5px solid var(--gray-300)',
                  flexShrink: 0
                }} />
                <span>{check.label}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: '0.75rem' }}>
                  {check.impact}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default ProfileCompletenessWidget;
