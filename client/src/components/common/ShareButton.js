import React, { useState } from 'react'

/**
 * ShareButton — Uses Web Share API with clipboard fallback.
 * Supports: profile pages, blog posts, marriage license discount page.
 */
const ShareButton = ({ url, title, text, variant = 'icon', className = '' }) => {
  const [copied, setCopied] = useState(false)

  const fullUrl = url?.startsWith('http')
    ? url
    : `https://www.weddingcounselors.com${url}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: fullUrl })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Final fallback
      const input = document.createElement('input')
      input.value = fullUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        className={`share-btn share-btn-icon ${className}`}
        aria-label="Share this page"
        title={copied ? 'Link copied!' : 'Share'}
      >
        {copied ? (
          <i className="fa fa-check" aria-hidden="true"></i>
        ) : (
          <i className="fa fa-share-alt" aria-hidden="true"></i>
        )}
      </button>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={handleShare}
        className={`share-btn share-btn-pill ${className}`}
      >
        {copied ? (
          <>
            <i className="fa fa-check" aria-hidden="true"></i>
            Link copied
          </>
        ) : (
          <>
            <i className="fa fa-share-alt" aria-hidden="true"></i>
            Share
          </>
        )}
      </button>
    )
  }

  // variant === 'inline' — text-style link
  return (
    <button
      onClick={handleShare}
      className={`share-btn share-btn-inline ${className}`}
    >
      {copied ? (
        <>
          <i className="fa fa-check" aria-hidden="true"></i>
          Copied!
        </>
      ) : (
        <>
          <i className="fa fa-share-alt" aria-hidden="true"></i>
          Share
        </>
      )}
    </button>
  )
}

/**
 * PostInquiryShare — Shown after a couple successfully contacts a counselor.
 * Encourages sharing the directory with other engaged couples.
 */
const PostInquiryShare = ({ professionalName }) => {
  const shareData = {
    title: 'Find a Premarital Counselor',
    text: 'We just connected with a premarital counselor — check out this free directory if you\'re engaged!',
    url: 'https://www.weddingcounselors.com?utm_source=share&utm_medium=post_inquiry'
  }

  return (
    <div className="post-inquiry-share">
      <p className="post-inquiry-share-text">
        Know another engaged couple? Share this directory with them.
      </p>
      <ShareButton
        url={shareData.url}
        title={shareData.title}
        text={shareData.text}
        variant="pill"
        className="post-inquiry-share-btn"
      />
    </div>
  )
}

export { PostInquiryShare }
export default ShareButton
