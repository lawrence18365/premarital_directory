import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
        </article>
      </div>
    </div>
  );
};

export default BlogPostPage;
