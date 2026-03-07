// Navbar.js
import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../../assets/css/premium-mobile-nav.css'
import '../../assets/css/navbar-transparent.css'

const SPECIALTY_LINKS = [
  { slug: 'christian', label: 'Christian Counseling' },
  { slug: 'catholic', label: 'Catholic Pre-Cana' },
  { slug: 'gottman', label: 'Gottman Method' },
  { slug: 'online', label: 'Online Counseling' },
  { slug: 'lgbtq', label: 'LGBTQ+ Affirming' },
  { slug: 'prepare-enrich', label: 'PREPARE/ENRICH' },
  { slug: 'affordable', label: 'Affordable Options' },
  { slug: 'interfaith', label: 'Interfaith Couples' },
]

const STATE_LINKS = [
  { slug: 'california', label: 'California' },
  { slug: 'texas', label: 'Texas' },
  { slug: 'florida', label: 'Florida' },
  { slug: 'new-york', label: 'New York' },
  { slug: 'georgia', label: 'Georgia' },
  { slug: 'illinois', label: 'Illinois' },
  { slug: 'ohio', label: 'Ohio' },
  { slug: 'north-carolina', label: 'North Carolina' },
  { slug: 'tennessee', label: 'Tennessee' },
  { slug: 'pennsylvania', label: 'Pennsylvania' },
]

const actionLinkStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
  fontWeight: 600,
  textDecoration: 'none'
}

const Navbar = () => {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const [solid, setSolid] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null)
  }, [location.pathname])

  const isHome = ['/', '/therapists', '/coaches', '/clergy'].includes(location.pathname)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setShowNavbar(false);
      } else if (window.scrollY < lastScrollY) {
        setShowNavbar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Solid/transparent transition on home hero
  useEffect(() => {
    const onScroll = () => {
      const isHome = ['/', '/therapists', '/coaches', '/clergy'].includes(location.pathname)
      if (!isHome) { setSolid(true); return }
      const threshold = 160
      setSolid(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])


  return (
    <nav className={`navbar ${isHome && !solid ? 'navbar--transparent' : ''} ${!showNavbar ? 'navbar-hidden' : ''}`}>
      <div className="container">
        <div className="navbar-content">

          {/* Left links */}
          <ul className="navbar-nav" ref={dropdownRef}>
            {!isHome && (
              <li>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
              </li>
            )}

            {/* Find Counselors with dropdown */}
            <li className="nav-dropdown-parent">
              <Link
                to="/premarital-counseling"
                className={location.pathname.startsWith('/premarital-counseling') ? 'active' : ''}
                onMouseEnter={() => setOpenDropdown('counselors')}
              >
                Find Counselors <i className="fa fa-chevron-down" style={{ fontSize: '0.6em', marginLeft: 4, opacity: 0.6 }}></i>
              </Link>
              {openDropdown === 'counselors' && (
                <div
                  className="nav-mega-dropdown"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <div className="nav-mega-col">
                    <div className="nav-mega-heading">By Specialty</div>
                    {SPECIALTY_LINKS.map(item => (
                      <Link key={item.slug} to={`/premarital-counseling/${item.slug}`} className="nav-mega-link">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="nav-mega-col">
                    <div className="nav-mega-heading">By State</div>
                    {STATE_LINKS.map(item => (
                      <Link key={item.slug} to={`/premarital-counseling/${item.slug}`} className="nav-mega-link">
                        {item.label}
                      </Link>
                    ))}
                    <Link to="/premarital-counseling" className="nav-mega-link nav-mega-link--all">
                      All 50 states →
                    </Link>
                  </div>
                  <div className="nav-mega-col">
                    <div className="nav-mega-heading">Resources</div>
                    <Link to="/premarital-counseling/marriage-license-discount" className="nav-mega-link">Marriage License Discounts</Link>
                    <Link to="/how-it-works" className="nav-mega-link">How It Works</Link>
                    <Link to="/blog" className="nav-mega-link">Guides for Couples</Link>
                    <Link to="/locations" className="nav-mega-link">All Locations</Link>
                  </div>
                </div>
              )}
            </li>

            <li>
              <Link
                to="/blog"
                className={location.pathname.startsWith('/blog') ? 'active' : ''}
              >
                Blog
              </Link>
            </li>

            <li>
              <Link
                to="/how-it-works"
                className={location.pathname === '/how-it-works' ? 'active' : ''}
              >
                How It Works
              </Link>
            </li>

            <li>
              <Link
                to="/partners"
                className={location.pathname.startsWith('/partners') || location.pathname.startsWith('/for-officiants') || location.pathname.startsWith('/for-churches') ? 'active' : ''}
              >
                Partners
              </Link>
            </li>
          </ul>

          {/* Right login / logout */}
          <div className="navbar-actions">
            {user ? (
              <>
                <Link to="/professional/dashboard" className="btn btn-primary">
                  <i className="fa fa-dashboard" aria-hidden="true"></i> Dashboard
                </Link>
                <button onClick={signOut} className="btn btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/for-officiants" className="btn btn-primary">
                  For Officiants
                </Link>
                <Link to="/for-churches" className="btn btn-outline">
                  For Churches
                </Link>
                <Link to="/professional/signup" style={actionLinkStyle}>
                  Join Directory
                </Link>
                <Link to="/professional/login" style={actionLinkStyle}>
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger"></span>
            <span className="hamburger"></span>
            <span className="hamburger"></span>
          </button>
        </div>

        {/* Mobile backdrop */}
        <div
          className={`navbar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Premium Mobile Full-Screen Menu */}
        <div className={`navbar-mobile ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="mobile-menu-header">
            <div className="mobile-menu-logo">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                Wedding Counselors
              </Link>
            </div>
            <button
              className="mobile-menu-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <ul className="navbar-mobile-nav">
            {!isHome && (
              <li>
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              </li>
            )}
            <li>
              <Link to="/premarital-counseling" onClick={() => setMobileMenuOpen(false)}>
                Find Counselors
              </Link>
            </li>
            <li>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            </li>
            <li>
              <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            </li>
            <li>
              <Link to="/partners" onClick={() => setMobileMenuOpen(false)}>Partners</Link>
            </li>

            {/* Specialty links in mobile */}
            <li className="mobile-section-label" style={{ padding: '16px 0 4px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600 }}>
              By Specialty
            </li>
            {SPECIALTY_LINKS.slice(0, 6).map(item => (
              <li key={item.slug}>
                <Link to={`/premarital-counseling/${item.slug}`} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}

            {/* State links in mobile */}
            <li className="mobile-section-label" style={{ padding: '16px 0 4px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600 }}>
              Popular States
            </li>
            {STATE_LINKS.slice(0, 6).map(item => (
              <li key={item.slug}>
                <Link to={`/premarital-counseling/${item.slug}`} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              </li>
            ))}

            {/* Resources */}
            <li className="mobile-section-label" style={{ padding: '16px 0 4px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600 }}>
              Resources
            </li>
            <li>
              <Link to="/premarital-counseling/marriage-license-discount" onClick={() => setMobileMenuOpen(false)}>
                Marriage License Discounts
              </Link>
            </li>
            <li>
              <Link to="/locations" onClick={() => setMobileMenuOpen(false)}>
                All Locations
              </Link>
            </li>
            <li>
              <Link to="/features" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
            </li>

            <li className="mobile-section-label" style={{ padding: '16px 0 4px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600 }}>
              Partners
            </li>
            <li>
              <Link to="/for-officiants" onClick={() => setMobileMenuOpen(false)}>
                For Officiants
              </Link>
            </li>
            <li>
              <Link to="/for-churches" onClick={() => setMobileMenuOpen(false)}>
                For Churches
              </Link>
            </li>
            <li>
              <Link to="/partners" onClick={() => setMobileMenuOpen(false)}>
                Partner Tools
              </Link>
            </li>

            {user ? (
              <>
                <li className="mobile-user-section">
                  <Link to="/professional/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <i className="fa fa-dashboard" aria-hidden="true"></i>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/professional/onboarding" onClick={() => setMobileMenuOpen(false)}>
                    <i className="fa fa-plus-circle" aria-hidden="true"></i>
                    Create Profile
                  </Link>
                </li>
                <li>
                  <button onClick={() => { signOut(); setMobileMenuOpen(false) }} className="mobile-sign-out-btn">
                    <i className="fa fa-sign-out-alt" aria-hidden="true"></i>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="mobile-auth-section">
                  <Link
                    to="/for-officiants"
                    className="btn btn-primary btn-full mobile-auth-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fa fa-link" aria-hidden="true"></i>
                    For Officiants
                  </Link>
                  <Link
                    to="/for-churches"
                    className="btn btn-outline btn-full mobile-auth-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fa fa-church" aria-hidden="true"></i>
                    For Churches
                  </Link>
                </li>
                <li className="mobile-auth-section">
                  <Link
                    to="/professional/signup"
                    className="btn btn-outline btn-full mobile-auth-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fa fa-user-plus" aria-hidden="true"></i>
                    Join Directory
                  </Link>
                  <Link
                    to="/professional/login"
                    className="btn btn-outline btn-full mobile-auth-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="fa fa-sign-in-alt" aria-hidden="true"></i>
                    Professional Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar;
