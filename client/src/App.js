import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/common/ScrollToTop'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PremiumLoader from './components/common/PremiumLoader'
import PageTransitionLoader from './components/common/PageTransitionLoader'
import { StateRedirect, CityRedirect, ProfileRedirect } from './components/routing/StateRedirect'
import SpecialtyOrStatePage from './components/routing/SpecialtyOrStatePage'

// CSS
import './assets/css/main.css'
import './assets/css/enhanced-hero.css'
import './assets/css/home-overrides.css'
import './assets/css/auth.css'
import './assets/css/professional.css'
import './assets/css/admin.css'
import './assets/css/features.css'
import './assets/css/support.css'
import './assets/css/guidelines.css'
import './assets/css/legal.css'
import './assets/css/breadcrumbs.css'
import './assets/css/faq.css'
import './assets/css/seo-content.css'
import './assets/css/enterprise-theme.css'

// Analytics Components
import { GoogleAnalytics, FacebookPixel, GoogleAds } from './components/analytics'
import LaunchTracker from './components/analytics/LaunchTracker'
import { captureAttribution } from './lib/attribution'

// Critical pages - loaded immediately
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

// Capture UTM params and referrer on app load
captureAttribution()

// Smart home route - redirects logged-in professionals to dashboard
const HomeOrDashboard = () => {
  const { user, profile, loading } = useAuth()

  // Show homepage while loading auth state
  if (loading) {
    return <HomePage />
  }

  // If user has incomplete onboarding, redirect to resume
  if (user && profile && !profile.onboarding_completed) {
    return <Navigate to="/professional/onboarding" replace />
  }

  // If user is logged in with a completed profile, redirect to dashboard
  if (user && profile && profile.onboarding_completed) {
    return <Navigate to="/professional/dashboard" replace />
  }

  // If user is logged in but no profile yet, redirect to onboarding
  if (user && !profile) {
    return <Navigate to="/professional/onboarding" replace />
  }

  // Not logged in - show homepage
  return <HomePage />
}

// Lazy-loaded pages for better performance
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const ClaimProfilePage = React.lazy(() => import('./pages/ClaimProfilePage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))
const ContactPage = React.lazy(() => import('./pages/ContactPage'))
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'))
const TermsPage = React.lazy(() => import('./pages/TermsPage'))
const FeaturesPage = React.lazy(() => import('./pages/FeaturesPage'))
const PricingPage = React.lazy(() => import('./pages/PricingPage'))
const SupportPage = React.lazy(() => import('./pages/SupportPage'))
const GuidelinesPage = React.lazy(() => import('./pages/GuidelinesPage'))
const StatesIndexPage = React.lazy(() => import('./pages/StatesIndexPage'))
// const CityOrProfilePage = React.lazy(() => import('./components/routing/CityOrProfilePage'))
const Segment2Route = React.lazy(() => import('./components/routing/Segment2Route'))
const Segment3Route = React.lazy(() => import('./components/routing/Segment3Route'))
const MarriageLicenseDiscountPage = React.lazy(() => import('./pages/MarriageLicenseDiscountPage'))
const MarriageLicenseStatePage = React.lazy(() => import('./pages/MarriageLicenseStatePage'))
const BoostLandingPage = React.lazy(() => import('./pages/BoostLandingPage'))

// Blog pages
const BlogIndex = React.lazy(() => import('./pages/blog/BlogIndex'))
const BlogPostPage = React.lazy(() => import('./pages/blog/BlogPostPage'))

// Authentication Pages
const LoginForm = React.lazy(() => import('./components/auth/LoginForm'))
const SignupForm = React.lazy(() => import('./components/auth/SignupForm'))

// Professional Pages
const ProfessionalDashboard = React.lazy(() => import('./pages/professional/ProfessionalDashboard'))
const ProfileEditor = React.lazy(() => import('./pages/professional/ProfileEditor'))
const LeadsPage = React.lazy(() => import('./pages/professional/LeadsPage'))
const OnboardingPage = React.lazy(() => import('./pages/professional/onboarding/OnboardingPage'))
const ProfileCreatedPage = React.lazy(() => import('./pages/professional/ProfileCreatedPage'))
const ProfilePendingPage = React.lazy(() => import('./pages/professional/ProfilePendingPage'))
const AnalyticsDashboard = React.lazy(() => import('./pages/professional/AnalyticsDashboard'))
const SubscriptionPage = React.lazy(() => import('./pages/professional/SubscriptionPage'))

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const CampaignDashboard = React.lazy(() => import('./pages/admin/CampaignDashboard'))
const ClaimReviewDashboard = React.lazy(() => import('./pages/admin/ClaimReviewDashboard'))
const ProfileModerationDashboard = React.lazy(() => import('./pages/admin/ProfileModerationDashboard'))
const MetricsDashboard = React.lazy(() => import('./pages/admin/MetricsDashboard'))
const CityHealthDashboard = React.lazy(() => import('./pages/admin/CityHealthDashboard'))
const BadgeReviewDashboard = React.lazy(() => import('./pages/admin/BadgeReviewDashboard'))
const BenefitsReviewDashboard = React.lazy(() => import('./pages/admin/BenefitsReviewDashboard'))
const AdminLeadsPage = React.lazy(() => import('./pages/admin/AdminLeadsPage'))
const SitemapGenerator = React.lazy(() => import('./pages/SitemapGenerator'))

// Missing pages that exist but weren't routed
const SitemapPage = React.lazy(() => import('./pages/SitemapPage'))
const LocationsDirectoryPage = React.lazy(() => import('./pages/LocationsDirectoryPage'))
const ThankYouPage = React.lazy(() => import('./pages/ThankYouPage'))
const ProfessionalsPage = React.lazy(() => import('./pages/ProfessionalsPage'))
const ConfirmEmailPage = React.lazy(() => import('./pages/ConfirmEmailPage'))
const EmailVerifiedPage = React.lazy(() => import('./pages/EmailVerifiedPage'))
const SEOContentPage = React.lazy(() => import('./pages/SEOContentPage'))
const ClaimWithTokenPage = React.lazy(() => import('./pages/ClaimWithTokenPage'))
const ClaimSuccessPage = React.lazy(() => import('./pages/ClaimSuccessPage'))
const ClaimProgramPage = React.lazy(() => import('./pages/ClaimProgramPage'))
const ForChurchesPage = React.lazy(() => import('./pages/ForChurchesPage'))
const EmbedFindPage = React.lazy(() => import('./pages/EmbedFindPage'))
const HowItWorksPage = React.lazy(() => import('./pages/HowItWorksPage'))
const EditorialStandardsPage = React.lazy(() => import('./pages/EditorialStandardsPage'))
const CorrectionsPage = React.lazy(() => import('./pages/CorrectionsPage'))

// Test functions for AI content generation (development only)
if (process.env.NODE_ENV === 'development') {
  import('./lib/testContentGeneration')
  import('./lib/testInBrowser')
}

function AppInner() {
  const location = useLocation()
  const { user, profile, loading, isAdmin, profileLoadFailed } = useAuth()
  const isHome = ['/', '/therapists', '/coaches', '/clergy'].includes(location.pathname)
  const noChromePrefixes = [
    '/professional/onboarding',
    '/embed',
    '/go'
  ]
  const isNoChromeRoute = noChromePrefixes.some(
    (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  )
  const isOnboardingRoute = location.pathname.startsWith('/professional/onboarding')
  const hasIncompleteOnboarding =
    !loading &&
    user &&
    !isAdmin &&
    !profileLoadFailed &&
    (!profile || !profile.onboarding_completed)

  if (hasIncompleteOnboarding && !isOnboardingRoute) {
    return <Navigate to="/professional/onboarding" replace />
  }

  const showSiteChrome = !isNoChromeRoute

  return (
    <div className={`App ${isHome ? 'App--no-offset' : ''} ${isNoChromeRoute ? 'App--workspace' : ''}`}>
      {/* Analytics Tracking */}
      <GoogleAnalytics />
      <FacebookPixel />
      <GoogleAds />
      <LaunchTracker />
      <ScrollToTop />
      <PageTransitionLoader />
      {showSiteChrome && (
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
      )}
      {showSiteChrome && <Navbar />}
      <main
        id="main-content"
        className="main-content"
        style={!showSiteChrome ? { paddingTop: 0 } : undefined}
      >
        <Suspense fallback={<PremiumLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeOrDashboard />} />
            {/* Premarital Counseling Directory - SEO-optimized URLs */}
            <Route path="/premarital-counseling" element={<StatesIndexPage />} />
            <Route path="/premarital-counseling/marriage-license-discount" element={<MarriageLicenseDiscountPage />} />
            <Route path="/premarital-counseling/marriage-license-discount/:state" element={<MarriageLicenseStatePage />} />

            {/* Level 1: State OR Specialty */}
            <Route path="/premarital-counseling/:state" element={<SpecialtyOrStatePage />} />

            {/* Level 2: State/City OR Specialty/State */}
            <Route path="/premarital-counseling/:param1/:param2" element={<Segment2Route />} />

            {/* Level 3: State/City/Profile OR Specialty/State/City */}
            <Route path="/premarital-counseling/:param1/:param2/:param3" element={<Segment3Route />} />

            {/* Pre-Cana alias → Catholic specialty page */}
            <Route path="/pre-cana" element={<Navigate to="/premarital-counseling/catholic" replace />} />
            <Route path="/pre-cana/*" element={<Navigate to="/premarital-counseling/catholic" replace />} />

            {/* 301 Redirects: old URL patterns to new SEO-optimized structure */}
            <Route path="/states" element={<Navigate to="/premarital-counseling" replace />} />
            <Route path="/states/:state/:city/:profileSlug" element={<ProfileRedirect />} />
            <Route path="/states/:state/:cityOrSlug" element={<CityRedirect />} />
            <Route path="/states/:state" element={<StateRedirect />} />
            <Route path="/professionals" element={<Navigate to="/premarital-counseling" replace />} />
            <Route path="/professionals-list" element={<Navigate to="/professionals-search" replace />} />
            <Route path="/find-counselor" element={<Navigate to="/premarital-counseling" replace />} />
            <Route path="/find-counselors" element={<Navigate to="/premarital-counseling" replace />} />
            <Route path="/counselors" element={<Navigate to="/premarital-counseling" replace />} />
            <Route path="/professionals/:state/:city/:profileSlug" element={<ProfileRedirect />} />
            <Route path="/professionals/:state/:cityOrSlug" element={<CityRedirect />} />
            <Route path="/professionals/:state" element={<StateRedirect />} />
            <Route path="/profile/:slugOrId" element={<ProfilePage />} />
            <Route path="/claim-profile" element={<ClaimProfilePage />} />
            <Route path="/claim-profile/:slugOrId" element={<ClaimProfilePage />} />
            <Route path="/claim/:token" element={<ClaimWithTokenPage />} />
            <Route path="/claim-success" element={<ClaimSuccessPage />} />
            <Route path="/claim-program/:token" element={<ClaimProgramPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* /therapists, /coaches, /clergy → 301 to / via Vercel edge redirect */}
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/for-churches" element={<ForChurchesPage />} />
            <Route path="/embed/find" element={<EmbedFindPage />} />
            <Route path="/go/:profileSlug" element={<BoostLandingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/editorial-standards" element={<EditorialStandardsPage />} />
            <Route path="/corrections" element={<CorrectionsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/seo/:slug" element={<SEOContentPage />} />
            <Route path="/sitemap" element={<SitemapPage />} />
            <Route path="/locations" element={<LocationsDirectoryPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/professionals-search" element={<ProfessionalsPage />} />

            {/* Authentication Routes */}
            <Route path="/professional/login" element={<LoginForm />} />
            <Route path="/professional/signup" element={<SignupForm />} />
            <Route path="/professional/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/professional/email-verified" element={<EmailVerifiedPage />} />
            <Route
              path="/professional/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/profile-created"
              element={
                <ProtectedRoute>
                  <ProfileCreatedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/profile-pending"
              element={
                <ProtectedRoute>
                  <ProfilePendingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Professional Routes */}
            <Route
              path="/professional/dashboard"
              element={
                <ProtectedRoute>
                  <ProfessionalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/leads"
              element={
                <ProtectedRoute>
                  <LeadsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/professional/subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/campaigns"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CampaignDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/claims"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ClaimReviewDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/badges"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <BadgeReviewDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/benefits"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <BenefitsReviewDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ProfileModerationDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sitemap"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <SitemapGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/metrics"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <MetricsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLeadsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cities"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CityHealthDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {showSiteChrome && <Footer />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppInner />
      </Router>
    </AuthProvider>
  )
}

export default App
