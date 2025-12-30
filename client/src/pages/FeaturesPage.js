import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const FeaturesPage = () => {
  return (
    <div className="page-container features-page">
      <SEOHelmet
        title="Platform Features"
        description="Explore features that help couples find the right premarital counseling professional and help practitioners grow their practice."
        url="/features"
      />
      <div className="container">
        <div className="page-header">
          <h1>Platform Features</h1>
          <p className="lead">
            Discover how our comprehensive directory platform helps couples find the right 
            premarital counseling professionals and helps professionals grow their practice.
          </p>
        </div>

        <div className="content-section">
          <div className="features-hero">
            <h2>For Couples Seeking Counseling</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h3>Smart Search & Filtering</h3>
                <p>
                  Find counselors by location, specialty, profession type, and specific needs. 
                  Our advanced search helps you discover the perfect match for your relationship.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-map-marked-alt"></i>
                </div>
                <h3>Location-Based Discovery</h3>
                <p>
                  Search by city, state, or zip code to find local professionals. View distance 
                  and service areas to find convenient options near you.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h3>Diverse Professional Types</h3>
                <p>
                  Choose from licensed therapists, certified coaches, and clergy members. 
                  Each brings unique perspectives and approaches to premarital preparation.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <h3>Detailed Profiles</h3>
                <p>
                  View comprehensive profiles including credentials, specialties, approach, 
                  experience, and client testimonials to make informed decisions.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <h3>Direct Contact</h3>
                <p>
                  Connect directly with professionals through secure contact forms, phone, 
                  email, or website links. No middleman - just direct communication.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h3>Verified Professionals</h3>
                <p>
                  All professionals undergo verification of credentials and licensing to ensure 
                  you're connecting with qualified, legitimate counselors.
                </p>
              </div>
            </div>
          </div>

          <div className="features-hero">
            <h2>For Counseling Professionals</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>Increased Visibility</h3>
                <p>
                  Reach couples actively seeking premarital counseling. Our directory attracts 
                  motivated clients who are ready to invest in their relationship.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-bullseye"></i>
                </div>
                <h3>Targeted Client Matching</h3>
                <p>
                  Connect with clients who specifically need your expertise. Couples can filter 
                  by specialty, approach, and location to find the right fit.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <h3>Profile Analytics</h3>
                <p>
                  Track profile views, contact requests, and engagement metrics. Understand 
                  how couples discover and interact with your profile.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-trophy"></i>
                </div>
                <h3>Professional Credibility</h3>
                <p>
                  Showcase your credentials, experience, and specialties. Build trust with 
                  detailed profiles that highlight your expertise and approach.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
                <h3>Mobile-Optimized</h3>
                <p>
                  Your profile looks great on all devices. Couples can find and contact you 
                  whether they're on desktop, tablet, or mobile.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <div className="feature-icon">
                <i className="fas fa-speedometer"></i>
              </div>
                <h3>Easy Management</h3>
                <p>
                  Simple profile management tools let you update information, track inquiries, 
                  and manage your online presence with ease.
                </p>
              </div>
            </div>
          </div>

          <div className="features-technical">
            <h2>Technical Features</h2>
            <div className="tech-features">
              <div className="tech-feature">
                <h3><i className="fas fa-lock"></i> Secure & Private</h3>
                <p>
                  Enterprise-grade security protects your data. Contact forms are encrypted, 
                  and we never share personal information without consent.
                </p>
              </div>
              
              <div className="tech-feature">
                <h3>
                  <i className="fas fa-bolt"></i> Fast & Reliable
                </h3>
                <p>
                  Built with modern technology for speed and reliability. Search results load 
                  instantly, and the platform is available 24/7.
                </p>
              </div>
              
              <div className="tech-feature">
                <h3><i className="fas fa-mobile-alt"></i> Responsive Design</h3>
                <p>
                  Perfect experience on any device. Whether on smartphone, tablet, or desktop, 
                  the directory works seamlessly.
                </p>
              </div>
              
              <div className="tech-feature">
                <h3>
                  <i className="fas fa-search"></i> SEO Optimized
                </h3>
                <p>
                  Professional profiles are optimized for search engines, helping couples find 
                  counselors through Google and other search platforms.
                </p>
              </div>
            </div>
          </div>

          <div className="features-specialties">
            <h2>Specialty Support</h2>
            <p>Our directory supports professionals with various specialties and approaches:</p>
            <div className="specialties-grid">
              <div className="specialty-item">
                <h4>Relationship Therapy</h4>
                <p>Licensed therapists specializing in couples counseling and relationship dynamics</p>
              </div>
              
              <div className="specialty-item">
                <h4>Marriage Coaching</h4>
                <p>Certified coaches focusing on communication, conflict resolution, and goal setting</p>
              </div>
              
              <div className="specialty-item">
                <h4>Religious Counseling</h4>
                <p>Clergy and faith-based counselors offering spiritual guidance and preparation</p>
              </div>
              
              <div className="specialty-item">
                <h4>Financial Planning</h4>
                <p>Professionals helping couples navigate financial discussions and planning</p>
              </div>
              
              <div className="specialty-item">
                <h4>Communication Skills</h4>
                <p>Specialists in helping couples develop healthy communication patterns</p>
              </div>
              
              <div className="specialty-item">
                <h4>Conflict Resolution</h4>
                <p>Experts in teaching couples how to navigate disagreements constructively</p>
              </div>
            </div>
          </div>

          <div className="features-cta">
            <h2>Ready to Get Started?</h2>
            <p>
              Whether you're a couple seeking guidance or a professional looking to grow your practice, 
              our platform has the features you need.
            </p>
            <div className="cta-buttons">
              <Link to="/" className="btn btn-primary">
                Find Counselors
              </Link>
              <Link to="/claim-profile" className="btn btn-outline">
                List Your Practice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturesPage
