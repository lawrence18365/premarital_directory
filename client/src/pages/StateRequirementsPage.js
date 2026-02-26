import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEOHelmet from '../components/analytics/SEOHelmet';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { STATE_MARRIAGE_DATA } from '../data/stateMarriageData';
import { STATE_CONFIG } from '../data/locationConfig';

const STATE_NAMES = {
  'alabama': 'Alabama', 'alaska': 'Alaska', 'arizona': 'Arizona', 'arkansas': 'Arkansas',
  'california': 'California', 'colorado': 'Colorado', 'connecticut': 'Connecticut',
  'delaware': 'Delaware', 'florida': 'Florida', 'georgia': 'Georgia', 'hawaii': 'Hawaii',
  'idaho': 'Idaho', 'illinois': 'Illinois', 'indiana': 'Indiana', 'iowa': 'Iowa',
  'kansas': 'Kansas', 'kentucky': 'Kentucky', 'louisiana': 'Louisiana', 'maine': 'Maine',
  'maryland': 'Maryland', 'massachusetts': 'Massachusetts', 'michigan': 'Michigan',
  'minnesota': 'Minnesota', 'mississippi': 'Mississippi', 'missouri': 'Missouri',
  'montana': 'Montana', 'nebraska': 'Nebraska', 'nevada': 'Nevada',
  'new-hampshire': 'New Hampshire', 'new-jersey': 'New Jersey', 'new-mexico': 'New Mexico',
  'new-york': 'New York', 'north-carolina': 'North Carolina', 'north-dakota': 'North Dakota',
  'ohio': 'Ohio', 'oklahoma': 'Oklahoma', 'oregon': 'Oregon', 'pennsylvania': 'Pennsylvania',
  'rhode-island': 'Rhode Island', 'south-carolina': 'South Carolina',
  'south-dakota': 'South Dakota', 'tennessee': 'Tennessee', 'texas': 'Texas', 'utah': 'Utah',
  'vermont': 'Vermont', 'virginia': 'Virginia', 'washington': 'Washington',
  'west-virginia': 'West Virginia', 'wisconsin': 'Wisconsin', 'wyoming': 'Wyoming',
  'district-of-columbia': 'District of Columbia',
};

const StateRequirementsPage = () => {
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterDiscount, setFilterDiscount] = useState('all');

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Premarital Counseling', path: '/premarital-counseling' },
    { label: 'State Requirements' },
  ];

  const stateRows = useMemo(() => {
    return Object.entries(STATE_MARRIAGE_DATA)
      .map(([slug, data]) => ({
        slug,
        name: STATE_NAMES[slug] || slug,
        abbr: STATE_CONFIG[slug]?.abbr || '',
        fee: data.marriageLicenseFee,
        feeNumeric: parseFloat(data.marriageLicenseFee.replace(/[^0-9.]/g, '')) || 0,
        waitingPeriod: data.waitingPeriod,
        hasDiscount: data.premaritalDiscount !== null,
        discount: data.premaritalDiscount,
        hours: data.premaritalHoursRequired,
        providers: data.premaritalProviderTypes,
        covenant: data.covenantMarriage,
      }))
      .filter((row) => {
        if (filterDiscount === 'yes') return row.hasDiscount;
        if (filterDiscount === 'no') return !row.hasDiscount;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case 'name':
            cmp = a.name.localeCompare(b.name);
            break;
          case 'fee':
            cmp = a.feeNumeric - b.feeNumeric;
            break;
          case 'discount':
            cmp = (a.hasDiscount ? 1 : 0) - (b.hasDiscount ? 1 : 0);
            break;
          default:
            cmp = a.name.localeCompare(b.name);
        }
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [sortField, sortDir, filterDiscount]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return <i className="fa fa-sort" style={{ opacity: 0.3, marginLeft: 4 }} />;
    return sortDir === 'asc'
      ? <i className="fa fa-sort-asc" style={{ marginLeft: 4 }} />
      : <i className="fa fa-sort-desc" style={{ marginLeft: 4 }} />;
  };

  const discountStates = Object.entries(STATE_MARRIAGE_DATA).filter(([, d]) => d.premaritalDiscount !== null);

  const faqs = [
    {
      question: 'Which states offer a marriage license discount for premarital counseling?',
      answer: `Currently ${discountStates.length} states offer a discount: ${discountStates.map(([slug]) => STATE_NAMES[slug]).join(', ')}. The discount ranges from $5 to $75 off the marriage license fee when couples complete a qualifying premarital education program.`,
    },
    {
      question: 'Do I need premarital counseling to get married?',
      answer: 'No state requires premarital counseling for all couples. However, some states require counseling for minors getting married. Several states incentivize counseling through marriage license fee discounts or waiting period waivers.',
    },
    {
      question: 'What is covenant marriage?',
      answer: 'Covenant marriage is a legally distinct type of marriage available in Arizona, Arkansas, and Louisiana. It requires premarital counseling before the wedding and limits the grounds for divorce. Couples must choose covenant marriage at the time they apply for their license.',
    },
    {
      question: 'Who can officiate a wedding?',
      answer: 'Requirements vary by state, but most states allow ordained or licensed clergy, judges, justices of the peace, and certain public officials to officiate weddings. Some states allow online ordination, while others have stricter requirements.',
    },
  ];

  return (
    <>
      <SEOHelmet
        title="Premarital Counseling Requirements by State — Marriage License Fees, Discounts & Laws (2026)"
        description={`Compare marriage license fees, waiting periods, and premarital counseling discounts across all 50 states. ${discountStates.length} states offer fee discounts for completing premarital education.`}
        url="/premarital-counseling/state-requirements"
        keywords="premarital counseling requirements by state, marriage license fee by state, premarital counseling discount, state marriage laws, marriage license waiting period"
        breadcrumbs={breadcrumbItems}
        faqs={faqs}
        canonicalUrl="https://www.weddingcounselors.com/premarital-counseling/state-requirements"
      />

      <div style={{ background: 'var(--ivory)', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          position: 'relative',
          paddingBottom: 'var(--space-12)',
          background: 'transparent',
        }}>
          <div style={{
            position: 'absolute',
            top: '-20%', left: '-10%', right: '-10%', bottom: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(137, 181, 162, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            maxWidth: 'var(--container-2xl)',
            margin: '0 auto',
            padding: '0 var(--space-4)',
            position: 'relative',
            zIndex: 1,
          }}>
            <Breadcrumbs items={breadcrumbItems} variant="on-hero" />
            <div style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: 'var(--space-4)',
                letterSpacing: '-0.02em',
              }}>
                Premarital Counseling Requirements by State
              </h1>
              <p style={{
                fontSize: 'var(--text-xl)',
                lineHeight: 1.7,
                color: 'var(--slate)',
                fontWeight: 300,
                marginBottom: 'var(--space-6)',
              }}>
                Compare marriage license fees, waiting periods, and premarital counseling discounts across all 50 states. {discountStates.length} states currently offer fee reductions for couples who complete a premarital education program.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto var(--space-10)',
          padding: '0 var(--space-4)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {[
              { label: 'States With Discount', value: discountStates.length, icon: 'fa-tag' },
              { label: 'Covenant Marriage States', value: '3', icon: 'fa-shield' },
              { label: 'States With Waiting Period', value: Object.values(STATE_MARRIAGE_DATA).filter(d => d.waitingPeriod !== 'None').length, icon: 'fa-clock-o' },
              { label: 'Max Savings', value: '$75', icon: 'fa-piggy-bank' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(14, 94, 94, 0.1)',
                padding: 'var(--space-5)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <i className={`fa ${stat.icon}`} style={{ color: 'var(--primary)', fontSize: '1.3rem', marginBottom: 'var(--space-2)', display: 'block' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-dark)', fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto var(--space-6)',
          padding: '0 var(--space-4)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Filter:
            </label>
            {[
              { value: 'all', label: 'All States' },
              { value: 'yes', label: 'Discount States Only' },
              { value: 'no', label: 'No Discount' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterDiscount(opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: filterDiscount === opt.value ? '2px solid var(--primary)' : '1px solid rgba(14, 94, 94, 0.2)',
                  background: filterDiscount === opt.value ? 'rgba(14, 94, 94, 0.08)' : 'var(--white)',
                  color: filterDiscount === opt.value ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: filterDiscount === opt.value ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {stateRows.length} state{stateRows.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto var(--space-12)',
          padding: '0 var(--space-4)',
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(14, 94, 94, 0.1)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}>
                <thead>
                  <tr style={{ background: 'rgba(14, 94, 94, 0.04)' }}>
                    <th
                      onClick={() => handleSort('name')}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        borderBottom: '2px solid rgba(14, 94, 94, 0.1)',
                        userSelect: 'none',
                      }}
                    >
                      State {sortIcon('name')}
                    </th>
                    <th
                      onClick={() => handleSort('fee')}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        borderBottom: '2px solid rgba(14, 94, 94, 0.1)',
                        userSelect: 'none',
                      }}
                    >
                      License Fee {sortIcon('fee')}
                    </th>
                    <th style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      borderBottom: '2px solid rgba(14, 94, 94, 0.1)',
                    }}>
                      Waiting Period
                    </th>
                    <th
                      onClick={() => handleSort('discount')}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        borderBottom: '2px solid rgba(14, 94, 94, 0.1)',
                        userSelect: 'none',
                      }}
                    >
                      Discount {sortIcon('discount')}
                    </th>
                    <th style={{
                      padding: '14px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      borderBottom: '2px solid rgba(14, 94, 94, 0.1)',
                    }}>
                      Hours Req.
                    </th>
                    <th style={{
                      padding: '14px 16px',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      borderBottom: '2px solid rgba(14, 94, 94, 0.1)',
                    }}>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stateRows.map((row, i) => (
                    <tr
                      key={row.slug}
                      style={{
                        borderBottom: '1px solid rgba(14, 94, 94, 0.06)',
                        background: row.hasDiscount ? 'rgba(14, 94, 94, 0.02)' : (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)'),
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link to={`/premarital-counseling/${row.slug}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          {row.name}
                        </Link>
                        {row.covenant && (
                          <span style={{
                            marginLeft: 6,
                            fontSize: '0.65rem',
                            padding: '2px 5px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(147, 51, 234, 0.1)',
                            color: '#7c3aed',
                            fontWeight: 600,
                            verticalAlign: 'middle',
                          }}>
                            Covenant
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {row.fee}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {row.waitingPeriod}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {row.hasDiscount ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#16a34a',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}>
                            {row.discount}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {row.hours ? `${row.hours} hrs` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Link
                          to={`/premarital-counseling/${row.slug}`}
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          View <i className="fa fa-arrow-right" style={{ fontSize: '0.7rem' }} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Discount States Detail Section */}
        <div style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto var(--space-12)',
          padding: '0 var(--space-4)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--primary-dark)',
            marginBottom: 'var(--space-2)',
            textAlign: 'center',
          }}>
            States With Premarital Counseling Discounts
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-8)',
            maxWidth: 700,
            margin: '0 auto var(--space-8)',
            lineHeight: 1.6,
          }}>
            These {discountStates.length} states offer a marriage license fee reduction when couples complete a qualifying premarital education program before their wedding.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-5)',
          }}>
            {discountStates.map(([slug, data]) => (
              <div key={slug} style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(14, 94, 94, 0.1)',
                padding: 'var(--space-6)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
                    {STATE_NAMES[slug]}
                  </h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}>
                    Save {data.premaritalDiscount}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {data.premaritalHoursRequired && (
                    <p style={{ margin: '0 0 var(--space-1)' }}>
                      <strong>Hours required:</strong> {data.premaritalHoursRequired} hours
                    </p>
                  )}
                  {data.discountStatute && (
                    <p style={{ margin: '0 0 var(--space-1)' }}>
                      <strong>Statute:</strong> {data.discountStatute}
                    </p>
                  )}
                  <p style={{ margin: '0 0 var(--space-1)' }}>
                    <strong>License fee:</strong> {data.marriageLicenseFee}
                  </p>
                </div>
                <Link to={`/premarital-counseling/${slug}`} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 'var(--space-3)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}>
                  Find counselors in {STATE_NAMES[slug]} <i className="fa fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto var(--space-12)',
          padding: '0 var(--space-4)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--primary-dark)',
            marginBottom: 'var(--space-6)',
            textAlign: 'center',
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'grid',
            gap: 'var(--space-4)',
          }}>
            {faqs.map((faq, i) => (
              <details key={i} style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(14, 94, 94, 0.1)',
                overflow: 'hidden',
              }}>
                <summary style={{
                  padding: 'var(--space-4) var(--space-5)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  listStyle: 'none',
                  fontSize: '1rem',
                }}>
                  {faq.question}
                </summary>
                <div style={{
                  padding: '0 var(--space-5) var(--space-4)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  fontSize: '0.95rem',
                }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          maxWidth: 800,
          margin: '0 auto var(--space-16)',
          padding: '0 var(--space-4)',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid rgba(14, 94, 94, 0.1)',
            padding: 'var(--space-10)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              color: 'var(--primary-dark)',
              marginBottom: 'var(--space-3)',
            }}>
              Ready to Find a Premarital Counselor?
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-6)',
              lineHeight: 1.6,
            }}>
              Browse our directory of licensed therapists, faith-based counselors, and clergy offering premarital counseling across all 50 states.
            </p>
            <Link
              to="/premarital-counseling"
              className="btn btn-primary btn-large"
              style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', borderRadius: 'var(--radius-full)' }}
            >
              Browse Counselors by State
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default StateRequirementsPage;
