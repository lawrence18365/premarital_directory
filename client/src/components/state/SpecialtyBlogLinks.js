import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

// Map specialty slugs to relevant blog search terms
const SPECIALTY_KEYWORDS = {
  'catholic': ['catholic', 'foccus', 'pre-cana', 'church', 'denomination'],
  'christian': ['christian', 'pastor', 'church', 'faith', 'denomination'],
  'gottman': ['gottman'],
  'online': ['online'],
  'affordable': ['cost', 'affordable', 'insurance'],
  'lgbtq': ['lgbtq', 'affirming', 'inclusive', 'same-sex', 'secular'],
  'prepare-enrich': ['prepare-enrich', 'prepare', 'enrich', 'assessment'],
  'symbis': ['symbis', 'assessment'],
};

const FALLBACK_SLUGS = [
  'what-to-expect-premarital-counseling',
  'how-to-choose-premarital-counselor',
  'premarital-counseling-cost',
  'is-premarital-counseling-worth-it',
];

const MAX_POSTS = 4;

const SpecialtyBlogLinks = ({ specialtySlug, specialtyName }) => {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!specialtySlug) return;

    const fetchRelated = async () => {
      try {
        const { data: allPublished } = await supabase
          .from('posts')
          .select('slug, title, category, read_time')
          .eq('status', 'published')
          .order('date', { ascending: false });

        if (!allPublished) { setLoaded(true); return; }

        const keywords = SPECIALTY_KEYWORDS[specialtySlug] || [];

        // Find posts matching specialty keywords in slug
        const matched = allPublished.filter(p =>
          keywords.some(kw => p.slug.includes(kw))
        );

        // Fill remaining with fallbacks
        const usedSlugs = new Set(matched.map(p => p.slug));
        const fallbacks = FALLBACK_SLUGS
          .filter(s => !usedSlugs.has(s))
          .map(s => allPublished.find(p => p.slug === s))
          .filter(Boolean);

        setPosts([...matched, ...fallbacks].slice(0, MAX_POSTS));
      } catch {
        // Supplementary — fail silently
      } finally {
        setLoaded(true);
      }
    };

    fetchRelated();
  }, [specialtySlug]);

  if (!loaded || posts.length === 0) return null;

  return (
    <div style={{
      marginTop: 'var(--space-8)',
      padding: 'var(--space-6)',
      background: 'var(--white)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid rgba(14, 94, 94, 0.1)',
    }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.2rem',
        color: 'var(--primary-dark)',
        marginBottom: 'var(--space-4)',
      }}>
        {specialtyName ? `${specialtyName} Counseling Resources` : 'Related Articles'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--gray-50, #f9fafb)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--gray-100, #f3f4f6)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--gray-50, #f9fafb)'; }}
          >
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}>
              {post.title}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              marginLeft: 'var(--space-3)',
            }}>
              {post.read_time}
            </span>
          </Link>
        ))}
      </div>
      <div style={{ textAlign: 'right', marginTop: 'var(--space-3)' }}>
        <Link to="/blog" style={{
          fontSize: '0.85rem',
          color: 'var(--primary)',
          fontWeight: 600,
          textDecoration: 'none',
        }}>
          View all articles →
        </Link>
      </div>
    </div>
  );
};

export default SpecialtyBlogLinks;
