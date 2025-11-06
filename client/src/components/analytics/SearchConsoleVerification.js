import React from 'react'
import { Helmet } from 'react-helmet'

const SearchConsoleVerification = () => {
  // These will be added when you set up Google Search Console
  const GOOGLE_VERIFICATION = process.env.REACT_APP_GOOGLE_SITE_VERIFICATION
  const BING_VERIFICATION = process.env.REACT_APP_BING_SITE_VERIFICATION
  const YANDEX_VERIFICATION = process.env.REACT_APP_YANDEX_VERIFICATION

  return (
    <Helmet>
      {/* Google Search Console Verification */}
      {GOOGLE_VERIFICATION && (
        <meta name="google-site-verification" content={GOOGLE_VERIFICATION} />
      )}
      
      {/* Bing Webmaster Tools Verification */}
      {BING_VERIFICATION && (
        <meta name="msvalidate.01" content={BING_VERIFICATION} />
      )}
      
      {/* Yandex Verification */}
      {YANDEX_VERIFICATION && (
        <meta name="yandex-verification" content={YANDEX_VERIFICATION} />
      )}
      
      {/* Additional Search Engine Claims */}
      <meta name="alexaVerifyID" content="" />
      <meta name="pinterest-rich-pin" content="true" />
      
      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      
      {/* Preload Critical Resources */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* Core Web Vitals Optimization */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
    </Helmet>
  )
}

export default SearchConsoleVerification
