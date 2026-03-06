import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../../lib/supabaseClient';
import { SEOHelmet } from '../../components/analytics';
import Breadcrumbs, { generateBreadcrumbs } from '../../components/common/Breadcrumbs';
import CoupleEmailCapture from '../../components/leads/CoupleEmailCapture';
import ShareButton from '../../components/common/ShareButton';
import '../../assets/css/blog.css';
import '../../assets/css/share-button.css';

const TONE_BY_CATEGORY = {
  Faith: 'faith',
  Guides: 'guide',
  Guide: 'guide',
  Resources: 'resource',
  Resource: 'resource',
};

const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const flattenNodeText = (children) => React.Children.toArray(children)
  .map((child) => {
    if (typeof child === 'string') return child;
    if (typeof child === 'number') return String(child);
    if (React.isValidElement(child)) return flattenNodeText(child.props.children);
    return '';
  })
  .join('');

const formatBlogDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
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

const buildHeadingList = (content) => {
  const seen = new Map();

  return (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line);
      if (!match) return null;

      const level = match[1].length;
      const title = match[2].trim();
      const baseSlug = slugify(title);
      const count = seen.get(baseSlug) || 0;
      seen.set(baseSlug, count + 1);

      return {
        id: count ? `${baseSlug}-${count}` : baseSlug,
        level,
        title,
      };
    })
    .filter(Boolean);
};

const generateArticleStructuredData = (post) => {
  if (!post) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.excerpt || post.title,
    datePublished: post.date ? new Date(post.date).toISOString() : new Date(post.created_at).toISOString(),
    dateModified: post.updated_at
      ? new Date(post.updated_at).toISOString()
      : (post.date ? new Date(post.date).toISOString() : new Date(post.created_at).toISOString()),
    author: {
      '@type': 'Organization',
      name: 'Wedding Counselors',
      url: 'https://www.weddingcounselors.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Wedding Counselors',
      url: 'https://www.weddingcounselors.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.weddingcounselors.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.weddingcounselors.com/blog/${post.slug}`,
    },
    articleSection: post.category || 'Relationship Guidance',
    keywords: `premarital counseling, ${post.category?.toLowerCase() || 'marriage preparation'}, engaged couples, relationship advice`,
  };
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (postError) throw postError;

        setPost(data);

        const { data: related } = await supabase
          .from('posts')
          .select('slug, title, excerpt, category, date, read_time')
          .eq('status', 'published')
          .neq('slug', slug)
          .order('date', { ascending: false })
          .limit(20);

        if (related) {
          const sameCategory = related.filter((candidate) => candidate.category === data.category);
          const others = related.filter((candidate) => candidate.category !== data.category);
          setRelatedPosts([...sameCategory, ...others].slice(0, 3));
        }
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const breadcrumbItems = useMemo(() => generateBreadcrumbs.blogPost(post?.title || 'Blog post'), [post?.title]);
  const articleStructuredData = useMemo(() => generateArticleStructuredData(post), [post]);
  const tableOfContents = useMemo(() => buildHeadingList(post?.content), [post?.content]);

  const markdownComponents = (() => {
    const seen = new Map();

    const renderHeading = (Tag, level) => function Heading({ children }) {
      const text = flattenNodeText(children).trim();
      const baseSlug = slugify(text) || `section-${level}`;
      const count = seen.get(baseSlug) || 0;
      seen.set(baseSlug, count + 1);
      const id = count ? `${baseSlug}-${count}` : baseSlug;

      return (
        <Tag id={id} className={`blog-heading blog-heading-${level}`}>
          <span>{children}</span>
          <a className="blog-heading-anchor" href={`#${id}`} aria-label={`Link to ${text}`}>
            #
          </a>
        </Tag>
      );
    };

    return {
      h2: renderHeading('h2', 2),
      h3: renderHeading('h3', 3),
      table: ({ children }) => (
        <div className="blog-table-wrap">
          <table>{children}</table>
        </div>
      ),
      hr: () => <hr className="blog-divider" />,
    };
  })();

  if (loading) {
    return (
      <div className="blog-post-page">
        <div className="container blog-loading-state">
          <div className="loading-spinner" />
          <p>Loading article…</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-post-page">
        <div className="container blog-loading-state">
          <div className="error-message">{error || 'Post not found'}</div>
        </div>
      </div>
    );
  }

  const tone = getTone(post.category);
  const publishedDate = formatBlogDate(post.date);
  const updatedDate = formatBlogDate(post.updated_at || post.date || post.created_at);
  const hasToc = tableOfContents.length >= 3;

  return (
    <div className="blog-post-page">
      <SEOHelmet
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt || `Read: ${post.title}`}
        url={`/blog/${post.slug}`}
        breadcrumbs={breadcrumbItems}
        structuredData={articleStructuredData}
      />

      <div className="container blog-post-page-container">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="blog-post-layout">
          <article className="blog-post">
            <header className="blog-post-header">
              <div className="blog-post-heading">
                <div className={`blog-post-mark tone-${tone}`} aria-hidden="true">
                  {getPostMonogram(post)}
                </div>

                <div className="blog-post-heading-copy">
                  <div className="blog-post-kicker-row">
                    <span className={`blog-category tone-${tone}`}>{post.category || 'Guide'}</span>
                    <span className="blog-post-updated">Updated {updatedDate}</span>
                  </div>

                  <h1>{post.title}</h1>

                  {post.excerpt && (
                    <p className="blog-post-lead">{post.excerpt}</p>
                  )}

                  <div className="blog-post-meta-strip">
                    <div className="blog-post-meta-card">
                      <span className="blog-post-meta-label">Published</span>
                      <span className="blog-post-meta-value">{publishedDate}</span>
                    </div>
                    <div className="blog-post-meta-card">
                      <span className="blog-post-meta-label">Read time</span>
                      <span className="blog-post-meta-value">{post.read_time}</span>
                    </div>
                    <div className="blog-post-meta-card">
                      <span className="blog-post-meta-label">Topic</span>
                      <span className="blog-post-meta-value">{post.category}</span>
                    </div>
                  </div>
                </div>

                <div className="blog-post-share">
                  <p className="blog-post-share-label">Share this guide</p>
                  <ShareButton
                    url={`/blog/${post.slug}`}
                    title={post.title}
                    text={post.excerpt || post.title}
                    variant="pill"
                  />
                </div>
              </div>

              {hasToc && (
                <nav className="blog-toc blog-toc-mobile" aria-label="On this page">
                  <p className="blog-toc-title">On this page</p>
                  <div className="blog-toc-list">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`blog-toc-link level-${heading.level}`}
                      >
                        {heading.title}
                      </a>
                    ))}
                  </div>
                </nav>
              )}
            </header>

            <div className={`blog-post-body${hasToc ? ' has-toc' : ''}`}>
              {hasToc && (
                <aside className="blog-toc blog-toc-desktop" aria-label="On this page">
                  <p className="blog-toc-title">On this page</p>
                  <div className="blog-toc-list">
                    {tableOfContents.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`blog-toc-link level-${heading.level}`}
                      >
                        {heading.title}
                      </a>
                    ))}
                  </div>
                </aside>
              )}

              <div className="blog-post-main">
                <div className="blog-post-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {post.content}
                  </ReactMarkdown>
                </div>

                <aside className="blog-post-cta">
                  <div>
                    <p className="blog-panel-eyebrow">Need personalized support?</p>
                    <h3>Find a premarital counselor near you.</h3>
                    <p>
                      Browse licensed therapists, faith-based counselors, and relationship coaches
                      who help couples prepare for marriage.
                    </p>
                  </div>
                  <div className="blog-directory-actions">
                    <Link to="/premarital-counseling" className="btn btn-primary">
                      Browse Directory
                    </Link>
                    <Link to="/quiz/relationship-readiness" className="btn btn-outline">
                      Take the Quiz
                    </Link>
                  </div>
                </aside>

                <CoupleEmailCapture sourcePage={`blog/${slug}`} />

                {relatedPosts.length > 0 && (
                  <nav className="blog-related-posts" aria-labelledby="keep-reading-heading">
                    <div className="blog-related-posts-header">
                      <p className="blog-panel-eyebrow">Keep reading</p>
                      <h2 id="keep-reading-heading">Related guides</h2>
                    </div>

                    <div className="blog-related-grid">
                      {relatedPosts.map((related) => (
                        <Link key={related.slug} to={`/blog/${related.slug}`} className="blog-related-card">
                          <span className={`blog-category tone-${getTone(related.category)}`}>{related.category}</span>
                          <div className="blog-related-title">{related.title}</div>
                          <p className="blog-related-excerpt">
                            {related.excerpt?.substring(0, 115)}
                            {related.excerpt?.length > 115 ? '…' : ''}
                          </p>
                          <span className="read-time">{related.read_time}</span>
                        </Link>
                      ))}
                    </div>
                  </nav>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>

      <div className="blog-mobile-bar">
        <div className="blog-mobile-bar-copy">
          <div className="blog-mobile-bar-title">Find a premarital counselor</div>
          <div className="blog-mobile-bar-text">Licensed therapists and faith-based support near you</div>
        </div>
        <Link to="/premarital-counseling" className="btn btn-primary blog-mobile-bar-button">
          Browse
        </Link>
      </div>
    </div>
  );
};

export default BlogPostPage;
