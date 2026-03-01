import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Helmet } from 'react-helmet';
import { SEOHelmet } from '../../components/analytics';
import Breadcrumbs, { generateBreadcrumbs } from '../../components/common/Breadcrumbs';
import '../../assets/css/blog.css';

const POSTS_PER_PAGE = 12;

const BlogIndex = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || 'All';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

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

  const categories = useMemo(() => {
    const cats = [...new Set(posts.map(p => p.category).filter(Boolean))];
    cats.sort();
    return ['All', ...cats];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return posts;
    return posts.filter(p => p.category === activeCategory);
  }, [posts, activeCategory]);

  // Page 1: featured + first POSTS_PER_PAGE-1 grid cards. Page 2+: POSTS_PER_PAGE grid cards.
  const paginatedPosts = useMemo(() => {
    if (currentPage === 1) {
      return filteredPosts.slice(0, POSTS_PER_PAGE);
    }
    const start = POSTS_PER_PAGE + (currentPage - 2) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const actualTotalPages = useMemo(() => {
    if (filteredPosts.length === 0) return 1;
    if (filteredPosts.length <= POSTS_PER_PAGE) return 1;
    return Math.ceil((filteredPosts.length - POSTS_PER_PAGE) / POSTS_PER_PAGE) + 1;
  }, [filteredPosts]);

  const setCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat === 'All') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    params.delete('page');
    setSearchParams(params);
  };

  const setPage = (page) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const showFeatured = currentPage === 1 && paginatedPosts.length > 0;
  const gridPosts = showFeatured ? paginatedPosts.slice(1) : paginatedPosts;

  return (
    <div className="blog-index">
      <SEOHelmet
        title="Marriage & Relationship Guidance Blog"
        description="Expert advice on premarital counseling, relationship preparation, and building strong marriages. Get insights from qualified professionals."
        url="/blog"
        breadcrumbs={breadcrumbItems}
      />
      <Helmet>
        <link rel="alternate" type="application/rss+xml" title="Wedding Counselors Blog RSS" href={`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/blog-rss`} />
      </Helmet>
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

        {/* Category filters */}
        {categories.length > 2 && (
          <div className="blog-filters" role="navigation" aria-label="Filter articles by category">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`blog-filter-chip${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {paginatedPosts.length > 0 ? (
          <>
            {/* Featured post (page 1 only) */}
            {showFeatured && (
              <article className="blog-featured">
                <div className="blog-featured-banner" aria-hidden="true" />
                <div className="blog-featured-content">
                  <div className="blog-card-header">
                    <span className="blog-category">{paginatedPosts[0].category}</span>
                    <span className="blog-date">{new Date(paginatedPosts[0].date).toLocaleDateString()}</span>
                  </div>
                  <h2 className="blog-featured-title">
                    <Link to={`/blog/${paginatedPosts[0].slug}`}>{paginatedPosts[0].title}</Link>
                  </h2>
                  {paginatedPosts[0].excerpt && (
                    <p className="blog-featured-excerpt">{paginatedPosts[0].excerpt}</p>
                  )}
                  <div className="blog-card-footer">
                    <span className="read-time">{paginatedPosts[0].read_time}</span>
                    <Link to={`/blog/${paginatedPosts[0].slug}`} className="read-more">
                      Read Article
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Posts grid */}
            {gridPosts.length > 0 && (
              <div className="blog-grid">
                {gridPosts.map((post) => (
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
            )}

            {/* Pagination */}
            {actualTotalPages > 1 && (
              <nav className="blog-pagination" aria-label="Blog pagination">
                <button
                  className="blog-pagination-btn"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                {Array.from({ length: actualTotalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`blog-pagination-btn${page === currentPage ? ' active' : ''}`}
                    onClick={() => setPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="blog-pagination-btn"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= actualTotalPages}
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="no-posts">
            <p>
              {activeCategory !== 'All'
                ? `No articles in "${activeCategory}" yet. Try another category.`
                : 'No posts yet. Check back soon!'}
            </p>
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
