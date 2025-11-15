import React from 'react';

/**
 * Decision-help section that actually helps couples choose
 * Much more valuable than generic AI-generated content
 */
const HowToChooseSection = ({ cityName }) => {
  return (
    <section style={{
      marginTop: 'var(--space-12)',
      padding: 'var(--space-8)',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <h2 style={{
        fontSize: 'var(--text-2xl)',
        marginBottom: 'var(--space-6)',
        color: 'var(--text-primary)'
      }}>
        How to Choose a Premarital Counselor in {cityName}
      </h2>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{
          fontSize: 'var(--text-lg)',
          marginBottom: 'var(--space-3)',
          color: 'var(--text-primary)'
        }}>
          Therapist vs Clergy vs Coach
        </h3>
        <div style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
        }}>
          <div style={{
            background: 'white',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Licensed Therapist
            </strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              LMFT, LPC, or LCSW credentials. Deeper focus on communication patterns, conflict resolution, and mental health. Best for couples who want evidence-based approaches.
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Clergy / Faith-Based
            </strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Pastor, priest, or religious counselor. Aligned with your church's beliefs and marriage prep process. Often includes spiritual elements and community support.
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--gray-200)'
          }}>
            <strong style={{ color: 'var(--teal)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Certified Coach
            </strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Practical tools and exercises. Often more flexible scheduling, including online. Best for couples who want structured goal-setting and accountability.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{
          fontSize: 'var(--text-lg)',
          marginBottom: 'var(--space-3)',
          color: 'var(--text-primary)'
        }}>
          Questions to Ask Before You Book
        </h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 'var(--space-2)'
        }}>
          <li style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>1.</strong> How many sessions do you typically recommend for couples?
          </li>
          <li style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>2.</strong> Do you offer faith-based or non-religious sessions?
          </li>
          <li style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>3.</strong> Will you see us together, or sometimes individually?
          </li>
          <li style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>4.</strong> What topics do you cover in your typical premarital program?
          </li>
          <li style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>5.</strong> Do you use any assessments or structured curricula?
          </li>
        </ul>
      </div>
    </section>
  );
};

export default HowToChooseSection;
