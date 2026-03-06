import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '../../lib/supabaseClient';
import { SEOHelmet } from '../../components/analytics';
import Breadcrumbs, { generateBreadcrumbs } from '../../components/common/Breadcrumbs';
import '../../assets/css/blog.css';

const POSTS_PER_PAGE = 12;

const TONE_BY_CATEGORY = {
  Faith: 'faith',
  Guides: 'guide',
  Guide: 'guide',
  Resources: 'resource',
  Resource: 'resource',
};

const BLOG_STATE_GUIDES = [
  { slug: 'premarital-counseling-texas', label: 'Texas' },
  { slug: 'premarital-counseling-florida', label: 'Florida' },
  { slug: 'premarital-counseling-new-york', label: 'New York' },
  { slug: 'premarital-counseling-illinois', label: 'Illinois' },
  { slug: 'premarital-counseling-minnesota', label: 'Minnesota' },
  { slug: 'premarital-counseling-chicago', label: 'Chicago' },
  { slug: 'premarital-counseling-nashville', label: 'Nashville' },
  { slug: 'premarital-counseling-phoenix', label: 'Phoenix' },
];

const formatBlogDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const getPostMonogram = (post) => {
  const source = `${post?.category || ''} ${post?.title || ''}`.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
  const tokens = source.split(/\s+/).filter(Boolean);

  if (tokens.length >= 2) {
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }

  const fallback = source.replace(/\s+/g, '').slice(0, 2).toUpperCase();
  return fallback || 'WC';
};

const getTone = (category) => TONE_BY_CATEGORY[category] || 'general';

const BlogIndex = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category') || 'All';
  const activeQuery = searchParams.get('q') || '';
  const deferredQuery = useDeferredValue(activeQuery.trim().toLowerCase());
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false });

        if (fetchError) throw fetchError;
        setPosts(data || []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(posts.map((post) => post.category).filter(Boolean))];
    cats.sort();
    return ['All', ...cats];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const matchesCategory = activeCategory === 'All'
      ? posts
      : posts.filter((post) => post.category === activeCategory);

    if (!deferredQuery) return matchesCategory;

    return matchesCategory.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt,
        post.category,
        post.meta_description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(deferredQuery);
    });
  }, [activeCategory, deferredQuery, posts]);

  const paginatedPosts = useMemo(() => {
    if (currentPage === 1) {
      return filteredPosts.slice(0, POSTS_PER_PAGE);
    }

    const start = POSTS_PER_PAGE + (currentPage - 2) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, filteredPosts]);

  const actualTotalPages = useMemo(() => {
    if (filteredPosts.length === 0 || filteredPosts.length <= POSTS_PER_PAGE) return 1;
    return Math.ceil((filteredPosts.length - POSTS_PER_PAGE) / POSTS_PER_PAGE) + 1;
  }, [filteredPosts.length]);

  const newestPostDate = useMemo(() => {
    if (!posts.length) return '';
    return formatBlogDate(posts[0].updated_at || posts[0].date || posts[0].created_at);
  }, [posts]);

  const showFeatured = currentPage === 1 && paginatedPosts.length > 0;
  const featuredPost = showFeatured ? paginatedPosts[0] : null;
  const gridPosts = showFeatured ? paginatedPosts.slice(1) : paginatedPosts;
  const breadcrumbItems = generateBreadcrumbs.blogIndex();

  const setCategory = (category) => {
    const params = new URLSearchParams(searchParams);

    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }

    params.delete('page');
    setSearchParams(params);
  };

  const setQuery = (value) => {
    const params = new URLSearchParams(searchParams);

    if (value.trim()) {
      params.set('q', value);
    } else {
      params.delete('q');
    }

    params.delete('page');
    setSearchParams(params, { replace: true });
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

  const clearFilters = () => {
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="blog-index">
        <div className="container blog-loading-state">
          <div className="loading-spinner" />
          <p>Loading articles…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-index">
        <div className="container blog-loading-state">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-index">
      <SEOHelmet
        title="Marriage & Relationship Guidance Blog"
        description="Expert advice on premarital counseling, relationship preparation, and building strong marriages. Get insights from qualified professionals."
        url="/blog"
        breadcrumbs={breadcrumbItems}
      />
      <Helmet>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Wedding Counselors Blog RSS"
          href={`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/blog-rss`}
        />
      </Helmet>

      <div className="container">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="blog-header">
          <div className="blog-header-copy">
            <p className="blog-eyebrow">The Journal</p>
            <h1>Guides for couples who want more than generic marriage advice.</h1>
            <p className="blog-subtitle">
              Plain-English explainers on premarital counseling, church marriage prep, assessments,
              costs, and finding the right support before the wedding.
            </p>
          </div>

          <div className="blog-header-panels" aria-label="Blog overview">
            <div className="blog-stat-card">
              <span className="blog-stat-value">{posts.length}</span>
              <span className="blog-stat-label">Published guides</span>
            </div>
            <div className="blog-stat-card">
              <span className="blog-stat-value">{Math.max(categories.length - 1, 0)}</span>
              <span className="blog-stat-label">Core topics</span>
            </div>
            <div className="blog-stat-card">
              <span className="blog-stat-value">{newestPostDate || 'Recently'}</span>
              <span className="blog-stat-label">Latest refresh</span>
            </div>
          </div>
        </header>

        <section className="blog-tools" aria-label="Browse articles">
          <label className="blog-search">
            <span className="blog-search-label">Search guides</span>
            <input
              type="search"
              className="blog-search-input"
              value={activeQuery}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics like Pre-Cana, SYMBIS, pastor counseling..."
            />
          </label>

          {categories.length > 2 && (
            <div className="blog-filters" role="navigation" aria-label="Filter articles by category">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`blog-filter-chip${activeCategory === category ? ' active' : ''}`}
                  onClick={() => setCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="blog-results-bar" aria-live="polite">
            <p className="blog-results-copy">
              Showing <strong>{filteredPosts.length}</strong> guide{filteredPosts.length === 1 ? '' : 's'}
              {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
              {activeQuery ? ` for "${activeQuery}"` : ''}
            </p>
            {(activeCategory !== 'All' || activeQuery) && (
              <button className="blog-reset-link" onClick={clearFilters}>
                Reset filters
              </button>
            )}
          </div>
        </section>

        {paginatedPosts.length > 0 ? (
          <>
            {featuredPost && (
              <article className="blog-featured">
                <div className={`blog-featured-mark tone-${getTone(featuredPost.category)}`} aria-hidden="true">
                  <span>{getPostMonogram(featuredPost)}</span>
                </div>
                <div className="blog-featured-content">
                  <div className="blog-featured-header">
                    <p className="blog-featured-kicker">Featured guide</p>
                    <div className="blog-card-header">
                      <span className={`blog-category tone-${getTone(featuredPost.category)}`}>
                        {featuredPost.category}
                      </span>
                      <span className="blog-date">{formatBlogDate(featuredPost.date)}</span>
                    </div>
                  </div>

                  <h2 className="blog-featured-title">
                    <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>

                  {featuredPost.excerpt && (
                    <p className="blog-featured-excerpt">{featuredPost.excerpt}</p>
                  )}

                  <div className="blog-card-footer">
                    <span className="read-time">{featuredPost.read_time}</span>
                    <Link to={`/blog/${featuredPost.slug}`} className="read-more">
                      Read article
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {gridPosts.length > 0 && (
              <section className="blog-collection" aria-labelledby="latest-guides-heading">
                <div className="blog-collection-header">
                  <h2 id="latest-guides-heading">Latest guides</h2>
                  <p>Research-backed answers, practical frameworks, and faith-aware explainers.</p>
                </div>

                <div className="blog-grid">
                  {gridPosts.map((post, index) => (
                    <article key={post.id} className="blog-card">
                      <div className="blog-card-topline">
                        <div className={`blog-card-mark tone-${getTone(post.category)}`} aria-hidden="true">
                          {getPostMonogram(post)}
                        </div>
                        <span className="blog-card-count">
                          {String(index + 1 + (showFeatured ? 1 : 0) + Math.max(currentPage - 1, 0) * POSTS_PER_PAGE).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="blog-card-header">
                        <span className={`blog-category tone-${getTone(post.category)}`}>{post.category}</span>
                        <span className="blog-date">{formatBlogDate(post.date)}</span>
                      </div>

                      <h3 className="blog-title">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>

                      {post.excerpt && <p className="blog-excerpt">{post.excerpt}</p>}

                      <div className="blog-card-footer">
                        <span className="read-time">{post.read_time}</span>
                        <Link to={`/blog/${post.slug}`} className="read-more">
                          Read article
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

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
                {Array.from({ length: actualTotalPages }, (_, index) => index + 1).map((page) => (
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
          <div className="blog-empty-state">
            <div className="blog-empty-mark" aria-hidden="true">WC</div>
            <h2>No guides match that combination yet.</h2>
            <p>Try another category, clear your filters, or browse our latest articles instead.</p>
            <button className="btn btn-outline" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        )}

        <section className="blog-directory-panel">
          <div>
            <p className="blog-panel-eyebrow">Need more than an article?</p>
            <h2>Find a premarital counselor who matches your style, faith, and budget.</h2>
            <p>
              Browse licensed therapists, Christian counselors, and structured marriage-prep providers
              in your area.
            </p>
          </div>
          <div className="blog-directory-actions">
            <Link to="/premarital-counseling" className="btn btn-primary">
              Find Counselors
            </Link>
            <Link to="/quiz/relationship-readiness" className="btn btn-outline">
              Take the Readiness Quiz
            </Link>
          </div>
        </section>

        <section className="blog-state-links" aria-labelledby="blog-state-links-heading">
          <div className="blog-state-links-header">
            <p className="blog-panel-eyebrow">Regional guides</p>
            <h2 id="blog-state-links-heading">Popular state and city explainers</h2>
          </div>
          <div className="blog-state-links-grid">
            {BLOG_STATE_GUIDES.map((guide) => (
              <Link key={guide.slug} to={`/blog/${guide.slug}`} className="blog-state-link">
                {guide.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogIndex;
