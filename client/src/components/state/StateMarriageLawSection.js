import React from 'react';
import { Link } from 'react-router-dom';
import { STATE_MARRIAGE_DATA } from '../../data/stateMarriageData';

const StateMarriageLawSection = ({ stateSlug, stateName }) => {
  const data = STATE_MARRIAGE_DATA[stateSlug];
  if (!data) return null;

  const hasDiscount = data.premaritalDiscount !== null;
  const hasCovenant = data.covenantMarriage === true;

  const cards = [
    {
      icon: 'fa-file-text',
      label: 'Marriage License Fee',
      value: data.marriageLicenseFee,
      detail: 'Apply at your county clerk\'s office',
    },
    {
      icon: 'fa-clock-o',
      label: 'Waiting Period',
      value: data.waitingPeriod,
      detail: data.waitingPeriod === 'None'
        ? 'No mandatory waiting period'
        : 'Between license issuance and ceremony',
    },
    {
      icon: 'fa-users',
      label: 'Annual Marriages',
      value: data.marriagesPerYear.toLocaleString(),
      detail: 'Approximate per year (CDC NVSS 2022)',
    },
    {
      icon: 'fa-heart',
      label: 'Median Age at First Marriage',
      value: `Men: ${data.medianAgeFirstMarriage.male} / Women: ${data.medianAgeFirstMarriage.female}`,
      detail: 'Census ACS 2022 estimates',
    },
    {
      icon: 'fa-gavel',
      label: 'Who Can Officiate',
      value: null,
      detail: data.officiantRequirements,
    },
  ];

  if (hasDiscount) {
    cards.splice(2, 0, {
      icon: 'fa-tag',
      label: 'Premarital Counseling Discount',
      value: `Save ${data.premaritalDiscount}`,
      detail: data.premaritalHoursRequired
        ? `Complete ${data.premaritalHoursRequired} hours of premarital education`
        : 'Complete a qualifying premarital education program',
      highlight: true,
      link: `/premarital-counseling/marriage-license-discount/${stateSlug}`,
    });
  }

  if (hasCovenant) {
    cards.push({
      icon: 'fa-shield',
      label: 'Covenant Marriage',
      value: 'Available',
      detail: `${stateName} is one of three states (with Arizona and Louisiana) offering covenant marriage, which requires premarital counseling and limits grounds for divorce.`,
    });
  }

  return (
    <section style={{
      padding: 'var(--space-12) 0',
      borderTop: '1px solid rgba(14, 94, 94, 0.08)',
    }}>
      <div style={{
        maxWidth: 'var(--container-2xl)',
        margin: '0 auto',
        padding: '0 var(--space-4)',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: 'var(--primary-dark)',
          marginBottom: 'var(--space-2)',
          textAlign: 'center',
        }}>
          Marriage Laws & Premarital Counseling in {stateName}
        </h3>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '1.05rem',
          maxWidth: '700px',
          margin: '0 auto var(--space-8)',
          lineHeight: 1.6,
        }}>
          Key marriage license requirements, fees, and premarital counseling information for {stateName}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-5)',
        }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: card.highlight ? 'linear-gradient(135deg, rgba(14, 94, 94, 0.06), rgba(14, 94, 94, 0.02))' : 'var(--white)',
              border: card.highlight ? '2px solid rgba(14, 94, 94, 0.2)' : '1px solid rgba(14, 94, 94, 0.1)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-3)',
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  background: card.highlight ? 'var(--primary)' : 'rgba(14, 94, 94, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i className={`fa ${card.icon}`} style={{
                    color: card.highlight ? 'white' : 'var(--primary)',
                    fontSize: '0.9rem',
                  }} />
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-secondary)',
                }}>
                  {card.label}
                </span>
              </div>

              {card.value && (
                <div style={{
                  fontSize: card.highlight ? '1.5rem' : '1.25rem',
                  fontWeight: 700,
                  color: card.highlight ? 'var(--primary)' : 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                  fontFamily: 'var(--font-display)',
                }}>
                  {card.value}
                </div>
              )}

              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {card.detail}
              </p>

              {card.link && (
                <Link to={card.link} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: 'var(--space-3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}>
                  See full requirements <i className="fa fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Provider types + statute info */}
        {hasDiscount && data.premaritalProviderTypes && (
          <div style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-6)',
            background: 'var(--white)',
            border: '1px solid rgba(14, 94, 94, 0.1)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              Who Can Provide the Premarital Course in {stateName}?
            </h4>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {data.premaritalProviderTypes}
              {data.discountStatute && (
                <span style={{ display: 'block', marginTop: 'var(--space-2)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  Source: {data.discountStatute}
                </span>
              )}
            </p>
            {data.certificateFormUrl && (
              <a
                href={data.certificateFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: 'var(--space-3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                <i className="fa fa-external-link" style={{ fontSize: '0.75rem' }} /> View official statute or certificate form
              </a>
            )}
          </div>
        )}

        {/* Link to state requirements hub */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--space-8)',
        }}>
          <Link to="/premarital-counseling/state-requirements" style={{
            fontSize: '0.9rem',
            color: 'var(--primary)',
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            Compare marriage laws across all 50 states <i className="fa fa-arrow-right" style={{ fontSize: '0.8rem' }} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StateMarriageLawSection;
