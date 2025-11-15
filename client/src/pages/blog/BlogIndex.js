import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { SEOHelmet } from '../../components/analytics';
import Breadcrumbs, { generateBreadcrumbs } from '../../components/common/Breadcrumbs';
import '../../assets/css/blog.css';

const BlogIndex = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        setPosts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="blog-index">
        <div className="container" style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <div className="loading-spinner" />
          <p>Loading articles…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-index">
        <div className="container" style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = generateBreadcrumbs.blogIndex()

  return (
    <div className="blog-index">
      <SEOHelmet
        title="Marriage & Relationship Guidance Blog"
        description="Expert advice on premarital counseling, relationship preparation, and building strong marriages. Get insights from qualified professionals."
        url="/blog"
        breadcrumbs={breadcrumbItems}
      />
      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="container">
        <header className="blog-header">
          <h1>Marriage & Relationship Guidance</h1>
          <p className="blog-subtitle">
            Expert insights and practical advice for couples preparing for marriage
          </p>
        </header>

        {posts.length > 0 ? (
          <>
            {/* Featured post */}
            <article className="blog-featured">
              <div className="blog-featured-banner" aria-hidden="true" />
              <div className="blog-featured-content">
                <div className="blog-card-header">
                  <span className="blog-category">{posts[0].category}</span>
                  <span className="blog-date">{new Date(posts[0].date).toLocaleDateString()}</span>
                </div>
                <h2 className="blog-featured-title">
                  <Link to={`/blog/${posts[0].slug}`}>{posts[0].title}</Link>
                </h2>
                {posts[0].excerpt && (
                  <p className="blog-featured-excerpt">{posts[0].excerpt}</p>
                )}
                <div className="blog-card-footer">
                  <span className="read-time">{posts[0].read_time}</span>
                  <Link to={`/blog/${posts[0].slug}`} className="read-more">
                    Read Article
                  </Link>
                </div>
              </div>
            </article>

            {/* Remaining posts grid */}
            <div className="blog-grid">
              {posts.slice(1).map((post) => (
                <article key={post.id} className="blog-card">
                  <div className="blog-card-banner" aria-hidden="true" />
                  <div className="blog-card-inner">
                    <div className="blog-card-header">
                      <span className="blog-category">{post.category}</span>
                      <span className="blog-date">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <h2 className="blog-title">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>
                    {post.excerpt && <p className="blog-excerpt">{post.excerpt}</p>}
                    <div className="blog-card-footer">
                      <span className="read-time">{post.read_time}</span>
                      <Link to={`/blog/${post.slug}`} className="read-more">
                        Read Article
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="no-posts">
            <p>No posts yet. Check back soon!</p>
          </div>
        )}

        <section className="blog-cta">
          <h3>Need Personalized Guidance?</h3>
          <p>Find qualified premarital counselors in your area</p>
          <Link to="/premarital-counseling" className="btn btn-primary">Find Counselors</Link>
        </section>
      </div>
      </div>
    );
};

export default BlogIndex;
