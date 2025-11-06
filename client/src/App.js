import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StripeProvider } from './contexts/StripeContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/common/ScrollToTop'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PremiumLoader from './components/common/PremiumLoader'
import PageTransitionLoader from './components/common/PageTransitionLoader'

// CSS
import './assets/css/main.css'
import './assets/css/enhanced-hero.css'
import './assets/css/home-overrides.css'
import './assets/css/auth.css'
import './assets/css/professional.css'
import './assets/css/admin.css'
import './assets/css/pricing.css'
import './assets/css/features.css'
import './assets/css/support.css'
import './assets/css/guidelines.css'
import './assets/css/legal.css'
import './assets/css/breadcrumbs.css'
import './assets/css/faq.css'
import './assets/css/seo-content.css'

// Analytics Components
import { GoogleAnalytics, FacebookPixel, GoogleAds } from './components/analytics'
import LaunchTracker from './components/analytics/LaunchTracker'

// Critical pages - loaded immediately
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

// Lazy-loaded pages for better performance
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'))
const ClaimProfilePage = React.lazy(() => import('./pages/ClaimProfilePage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))
const ContactPage = React.lazy(() => import('./pages/ContactPage'))
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'))
const TermsPage = React.lazy(() => import('./pages/TermsPage'))
const PricingPage = React.lazy(() => import('./pages/PricingPage'))
const FeaturesPage = React.lazy(() => import('./pages/FeaturesPage'))
const SupportPage = React.lazy(() => import('./pages/SupportPage'))
const GuidelinesPage = React.lazy(() => import('./pages/GuidelinesPage'))
const StatePage = React.lazy(() => import('./pages/StatePage'))
const StatesIndexPage = React.lazy(() => import('./pages/StatesIndexPage'))
const CityOrProfilePage = React.lazy(() => import('./components/routing/CityOrProfilePage'))

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
const SubscriptionPage = React.lazy(() => import('./pages/professional/SubscriptionPage'))

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const CampaignDashboard = React.lazy(() => import('./pages/admin/CampaignDashboard'))
const SitemapGenerator = React.lazy(() => import('./pages/SitemapGenerator'))

// Missing pages that exist but weren't routed
const SitemapPage = React.lazy(() => import('./pages/SitemapPage'))
const ThankYouPage = React.lazy(() => import('./pages/ThankYouPage'))
const ProfessionalsPage = React.lazy(() => import('./pages/ProfessionalsPage'))
const ConfirmEmailPage = React.lazy(() => import('./pages/ConfirmEmailPage'))
const SEOContentPage = React.lazy(() => import('./pages/SEOContentPage'))

// Test functions for AI content generation (development only)
if (process.env.NODE_ENV === 'development') {
  import('./lib/testContentGeneration')
  import('./lib/testInBrowser')
}

function AppInner() {
  const location = useLocation()
  const isHome = ['/', '/therapists', '/coaches', '/clergy'].includes(location.pathname)
  return (
          <div className={`App ${isHome ? 'App--no-offset' : ''}`}>
            {/* Analytics Tracking */}
            <GoogleAnalytics />
            <FacebookPixel />
            <GoogleAds />
            <LaunchTracker />
            <ScrollToTop />
            <PageTransitionLoader />
            <a href="#main-content" className="skip-to-content">
              Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="main-content">
              <Suspense fallback={<PremiumLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/professionals" element={<Navigate to="/states" replace />} />
                <Route path="/professionals-list" element={<Navigate to="/professionals-search" replace />} />
                <Route path="/find-counselor" element={<Navigate to="/states" replace />} />
                <Route path="/find-counselors" element={<Navigate to="/states" replace />} />
                <Route path="/counselors" element={<Navigate to="/states" replace />} />
                <Route path="/states" element={<StatesIndexPage />} />
                <Route path="/professionals/:state" element={<StatePage />} />
                <Route path="/profile/:slugOrId" element={<ProfilePage />} />
                <Route path="/professionals/:state/:cityOrSlug" element={<CityOrProfilePage />} />
                <Route path="/professionals/:state/:city/:profileSlug" element={<ProfilePage />} />
                <Route path="/claim-profile" element={<ClaimProfilePage />} />
                <Route path="/claim-profile/:slugOrId" element={<ClaimProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/therapists" element={<HomePage />} />
                <Route path="/coaches" element={<HomePage />} />
                <Route path="/clergy" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/guidelines" element={<GuidelinesPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/seo/:slug" element={<SEOContentPage />} />
                <Route path="/sitemap" element={<SitemapPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
                <Route path="/professionals-search" element={<ProfessionalsPage />} />
                
                {/* Authentication Routes */}
                <Route path="/professional/login" element={<LoginForm />} />
                <Route path="/professional/signup" element={<SignupForm />} />
                <Route path="/professional/confirm-email" element={<ConfirmEmailPage />} />
                
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
                  path="/admin/sitemap" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <SitemapGenerator />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <StripeProvider>
        <Router>
          <AppInner />
        </Router>
      </StripeProvider>
    </AuthProvider>
  )
}

export default App
