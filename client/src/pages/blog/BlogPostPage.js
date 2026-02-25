import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../lib/supabaseClient';
import { SEOHelmet } from '../../components/analytics';
import Breadcrumbs, { generateBreadcrumbs } from '../../components/common/Breadcrumbs';
import '../../assets/css/blog.css';

// Generate Article/BlogPosting structured data for SEO
const generateArticleStructuredData = (post) => {
  if (!post) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.excerpt || post.title,
    "datePublished": post.date ? new Date(post.date).toISOString() : new Date(post.created_at).toISOString(),
    "dateModified": post.updated_at ? new Date(post.updated_at).toISOString() : (post.date ? new Date(post.date).toISOString() : new Date(post.created_at).toISOString()),
    "author": {
      "@type": "Organization",
      "name": "Wedding Counselors",
      "url": "https://www.weddingcounselors.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Wedding Counselors",
      "url": "https://www.weddingcounselors.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.weddingcounselors.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.weddingcounselors.com/blog/${post.slug}`
    },
    "articleSection": post.category || "Relationship Guidance",
    "keywords": `premarital counseling, ${post.category?.toLowerCase() || 'marriage preparation'}, engaged couples, relationship advice`
  };
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          throw error;
        }

        setPost(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-post-page">
        <div className="container" style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <div className="loading-spinner" />
          <p>Loading article…</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-post-page">
        <div className="container" style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <div className="error-message">{error || 'Post not found'}</div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = generateBreadcrumbs.blogPost(post.title)
  const articleStructuredData = generateArticleStructuredData(post)

  return (
    <div className="blog-post-page">
      <SEOHelmet
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || `Read: ${post.title}`}
        url={`/blog/${post.slug}`}
        breadcrumbs={breadcrumbItems}
        structuredData={articleStructuredData}
      />

      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />
        <article className="blog-post">
          <div className="blog-post-hero" aria-hidden="true" />
          <header className="blog-post-header">
            <h1>{post.title}</h1>
            {post.excerpt && (
              <p className="blog-post-lead">{post.excerpt}</p>
            )}
            <div className="blog-post-meta">
              <span className="blog-category">{post.category}</span>
              <span className="blog-date">{new Date(post.date).toLocaleDateString()}</span>
              <span className="read-time">{post.read_time}</span>
            </div>
          </header>

          <div className="blog-post-content">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Internal links — SEO cross-linking to high-value pages */}
          <aside className="blog-post-cta" style={{
            marginTop: 'var(--space-12)',
            padding: 'var(--space-8)',
            background: 'var(--gray-50, #f9fafb)',
            borderRadius: 'var(--radius-lg, 12px)',
            borderLeft: '4px solid var(--primary, #4f46e5)'
          }}>
            <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: '1.1rem' }}>Ready to find a premarital counselor?</h3>
            <p style={{ margin: '0 0 var(--space-4) 0', color: 'var(--gray-600, #4b5563)', fontSize: '0.95rem' }}>
              Browse our directory of licensed therapists, faith-based counselors, and coaches in your area.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <Link to="/premarital-counseling" style={{
                display: 'inline-block',
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--primary, #4f46e5)',
                color: '#fff',
                borderRadius: 'var(--radius-md, 8px)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                Find Counselors Near You
              </Link>
              <Link to="/premarital-counseling/marriage-license-discount" style={{
                display: 'inline-block',
                padding: 'var(--space-2) var(--space-4)',
                border: '1px solid var(--gray-300, #d1d5db)',
                color: 'var(--gray-700, #374151)',
                borderRadius: 'var(--radius-md, 8px)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                Marriage License Discounts
              </Link>
            </div>
          </aside>
        </article>
      </div>

      {/* Sticky mobile CTA */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '10px 16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>
            Find a premarital counselor
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Licensed therapists & coaches near you
          </div>
        </div>
        <Link
          to="/premarital-counseling"
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap', padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
        >
          Browse Directory
        </Link>
      </div>
    </div>
  );
};

export default BlogPostPage;
