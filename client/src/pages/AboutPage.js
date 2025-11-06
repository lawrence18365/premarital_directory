import React from 'react'
import { Link } from 'react-router-dom'
import SEOHelmet from '../components/analytics/SEOHelmet'

const AboutPage = () => {
  return (
    <div className="page-container about-page">
      <SEOHelmet
        title="About Wedding Counselors"
        description="Our mission is to help couples build strong foundations for marriage by connecting them with verified premarital counseling professionals."
        url="/about"
      />
      <div className="container">
        <div className="container-narrow">
          <div className="page-header">
            <h1>About Premarital Counseling Directory</h1>
            <p className="lead">
              Connecting couples with qualified professionals to build strong foundations for marriage
            </p>
          </div>

          <div className="content-section">
            <h2>Our Mission</h2>
            <p>
              We believe that strong marriages begin with proper preparation. Our directory connects 
              engaged couples with qualified premarital counseling professionals who specialize in 
              helping couples build communication skills, resolve conflicts, and establish healthy 
              foundations for their future together.
            </p>
            
            <h3>What We Offer</h3>
            <div className="feature-grid">
              <div>
                <h4>For Couples</h4>
                <ul>
                  <li>Find qualified therapists, coaches, and clergy</li>
                  <li>Search by location and specialty</li>
                  <li>Read detailed professional profiles</li>
                  <li>Connect directly with counselors</li>
                </ul>
              </div>
              <div>
                <h4>For Professionals</h4>
                <ul>
                  <li>Claim and customize your profile</li>
                  <li>Receive direct inquiries from couples</li>
                  <li>Showcase your specialties and approach</li>
                  <li>Grow your premarital counseling practice</li>
                </ul>
              </div>
            </div>

            <h3>Professional Standards</h3>
            <p>
              All professionals in our directory are qualified marriage and family therapists, 
              licensed clinical social workers, certified relationship coaches, or ordained clergy 
              with experience in premarital counseling. We verify credentials and maintain high 
              standards to ensure couples receive quality guidance.
            </p>

            <h3>Specialties We Cover</h3>
            <div className="mini-grid">
              <div>
                <h5>Communication & Conflict</h5>
                <ul>
                  <li>Communication Skills</li>
                  <li>Conflict Resolution</li>
                  <li>Emotional Intelligence</li>
                </ul>
              </div>
              <div>
                <h5>Evidence-Based Methods</h5>
                <ul>
                  <li>Gottman Method</li>
                  <li>EFT (Emotionally Focused Therapy)</li>
                  <li>Prepare/Enrich Assessment</li>
                </ul>
              </div>
              <div>
                <h5>Specialized Counseling</h5>
                <ul>
                  <li>Religious Counseling</li>
                  <li>Interfaith Relationships</li>
                  <li>LGBTQ+ Affirming</li>
                </ul>
              </div>
              <div>
                <h5>Life Planning</h5>
                <ul>
                  <li>Financial Planning</li>
                  <li>Family Planning</li>
                  <li>Blended Families</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-cta">
            <h2>Ready to Get Started?</h2>
            <p className="lead">
              Whether you're a couple seeking counseling or a professional wanting to join our directory
            </p>
            <div className="cta-actions">
              <Link to="/" className="btn btn-primary btn-large">
                Find Counselors
              </Link>
              <Link to="/claim-profile" className="btn btn-secondary btn-large">
                Join as Professional
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
