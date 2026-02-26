import React from 'react';
import { Link } from 'react-router-dom';
import { STATE_MARRIAGE_DATA } from '../../data/stateMarriageData';

/**
 * Maps state slugs to relevant blog posts based on whether the state
 * has a premarital discount program, covenant marriage, or other features.
 */
const getRelatedPosts = (stateSlug, stateName) => {
  const data = STATE_MARRIAGE_DATA[stateSlug];
  const posts = [];

  // State-specific discount posts
  const stateDiscountPosts = {
    'florida': { slug: 'florida-marriage-license-discount', title: `Florida Marriage License Discount: Save $32.50 With Premarital Counseling` },
    'minnesota': { slug: 'minnesota-marriage-license-discount', title: `Minnesota Marriage License Discount: Save $75 With Premarital Education` },
    'georgia': { slug: 'georgia-marriage-license-discount', title: `Georgia Marriage License Discount: Save on Your License Fee` },
    'oklahoma': { slug: 'oklahoma-marriage-license-discount', title: `Oklahoma Marriage License Discount: Save $20 With Premarital Counseling` },
    'indiana': { slug: 'indiana-marriage-license-discount', title: `Indiana Marriage License Discount Guide` },
    'texas': { slug: 'twogether-in-texas', title: `Twogether in Texas: Save $60 on Your Marriage License` },
  };

  // Add state-specific discount post if available
  if (stateDiscountPosts[stateSlug]) {
    posts.push({
      slug: stateDiscountPosts[stateSlug].slug,
      title: stateDiscountPosts[stateSlug].title,
      category: 'Marriage License',
      readTime: '6 min',
    });
  }

  // For discount states without a specific post, link to the provider registration post
  if (data?.premaritalDiscount && !stateDiscountPosts[stateSlug]) {
    posts.push({
      slug: 'register-premarital-course-provider',
      title: 'How to Register as a Premarital Course Provider in Your State',
      category: 'For Professionals',
      readTime: '10 min',
    });
  }

  // Universal posts relevant to all states
  posts.push({
    slug: 'what-to-expect-premarital-counseling',
    title: 'What to Expect in Premarital Counseling: A Complete Guide',
    category: 'Getting Started',
    readTime: '8 min',
  });

  posts.push({
    slug: 'how-to-choose-premarital-counselor',
    title: `How to Choose a Premarital Counselor in ${stateName}`,
    category: 'Choosing a Counselor',
    readTime: '7 min',
  });

  // Faith-based post
  posts.push({
    slug: 'premarital-counseling-with-pastor',
    title: 'Premarital Counseling With Your Pastor: What to Expect',
    category: 'Faith-Based',
    readTime: '10 min',
  });

  // Cost post
  posts.push({
    slug: 'premarital-counseling-cost',
    title: `How Much Does Premarital Counseling Cost in ${stateName}?`,
    category: 'Cost & Insurance',
    readTime: '7 min',
  });

  // Return max 4 posts
  return posts.slice(0, 4);
};

const RelatedBlogPosts = ({ stateSlug, stateName }) => {
  const posts = getRelatedPosts(stateSlug, stateName);

  if (!posts || posts.length === 0) return null;

  return (
    <section style={{
      padding: 'var(--space-10) 0',
    }}>
      <div style={{
        maxWidth: 'var(--container-2xl)',
        margin: '0 auto',
        padding: '0 var(--space-4)',
      }}>
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid rgba(14, 94, 94, 0.1)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--primary-dark)',
            marginBottom: 'var(--space-2)',
          }}>
            Premarital Counseling Resources for {stateName} Couples
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            marginBottom: 'var(--space-6)',
            lineHeight: 1.6,
          }}>
            Guides and articles to help you prepare for marriage in {stateName}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {posts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'var(--space-5)',
                  background: 'var(--gray-50, #f9fafb)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(14, 94, 94, 0.08)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(14, 94, 94, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(14, 94, 94, 0.08)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primary)',
                  marginBottom: 'var(--space-2)',
                }}>
                  {post.category}
                </span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  flex: 1,
                }}>
                  {post.title}
                </span>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--space-3)',
                }}>
                  {post.readTime} read
                </span>
              </Link>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid rgba(14, 94, 94, 0.08)',
          }}>
            <Link to="/blog" style={{
              fontSize: '0.9rem',
              color: 'var(--primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              View all articles <i className="fa fa-arrow-right" style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RelatedBlogPosts;
