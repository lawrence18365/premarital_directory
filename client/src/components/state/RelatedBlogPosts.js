import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

// Universal fallback slugs when fewer than 4 state-specific posts exist
const UNIVERSAL_SLUGS = [
  'what-to-expect-premarital-counseling',
  'how-to-choose-premarital-counselor',
  'premarital-counseling-with-pastor',
  'premarital-counseling-cost',
];

const MAX_POSTS = 4;

const RelatedBlogPosts = ({ stateSlug, stateName }) => {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!stateSlug && !stateName) return;

    const fetchRelated = async () => {
      try {
        // 1. Try to find state-specific posts (slug contains state name)
        const stateKey = (stateSlug || '').toLowerCase();
        const { data: allPublished } = await supabase
          .from('posts')
          .select('slug, title, excerpt, category, read_time')
          .eq('status', 'published')
          .order('date', { ascending: false });

        if (!allPublished) {
          setLoaded(true);
          return;
        }

        // Posts whose slug contains the state name (e.g. "florida-marriage-license-discount")
        const stateSpecific = allPublished.filter(p =>
          p.slug.includes(stateKey) && stateKey.length > 2
        );

        // Fill remaining slots with universal posts
        const usedSlugs = new Set(stateSpecific.map(p => p.slug));
        const universalPosts = UNIVERSAL_SLUGS
          .filter(slug => !usedSlugs.has(slug))
          .map(slug => allPublished.find(p => p.slug === slug))
          .filter(Boolean);

        const combined = [...stateSpecific, ...universalPosts].slice(0, MAX_POSTS);
        setPosts(combined);
      } catch {
        // Silently fail — this is a supplementary section
      } finally {
        setLoaded(true);
      }
    };

    fetchRelated();
  }, [stateSlug, stateName]);

  if (!loaded || posts.length === 0) return null;

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
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--primary-dark)',
            marginBottom: 'var(--space-2)',
          }}>
            Premarital Counseling Resources for {stateName} Couples
          </h2>
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
                  {post.read_time} read
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
