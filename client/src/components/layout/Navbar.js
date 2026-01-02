// Navbar.js
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../../assets/css/premium-mobile-nav.css'
import '../../assets/css/navbar-transparent.css'

const Navbar = () => {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true); // Initially show the navbar
  const [solid, setSolid] = useState(false);
  
  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])
  
  

  const baseLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/premarital-counseling', label: 'Find Counselors' },
    { path: '/blog', label: 'Blog' },
  ]
  const isHome = ['/', '/therapists', '/coaches', '/clergy'].includes(location.pathname)
  const navLinks = isHome ? baseLinks.filter(l => l.path !== '/') : baseLinks

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) { // Scrolling down and past a threshold
        setShowNavbar(false);
      } else if (window.scrollY < lastScrollY) { // Scrolling up
        setShowNavbar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]); // Re-run effect when lastScrollY changes

  // Solid/transparent transition on home hero
  useEffect(() => {
    const onScroll = () => {
      const isHome = ['/', '/therapists', '/coaches', '/clergy'].includes(location.pathname)
      if (!isHome) { setSolid(true); return }
      const threshold = 160 // px before turning solid
      setSolid(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  // moved above when computing navLinks

  return (
    <nav className={`navbar ${isHome && !solid ? 'navbar--transparent' : ''} ${!showNavbar ? 'navbar-hidden' : ''}`}>
      <div className="container">
        <div className="navbar-content">

          {/* Left links */}
          <ul className="navbar-nav">
            {navLinks.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={
                    item.exact
                      ? (location.pathname === item.path ? 'active' : '')
                      : (location.pathname.startsWith(item.path) ? 'active' : '')
                  }
                >
                  {item.label}
                </Link>
              </li>
            ))}
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
                <Link to="/professional/signup" className="btn btn-primary">
                  Join Directory
                </Link>
                <Link to="/professional/login" className="btn btn-outline">
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
            {navLinks.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={
                    item.exact
                      ? (location.pathname === item.path ? 'active' : '')
                      : (location.pathname.startsWith(item.path) ? 'active' : '')
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            
            {/* Additional mobile-specific links */}
            <li>
              <Link to="/features" onClick={() => setMobileMenuOpen(false)}>
                <i className="fa fa-star" aria-hidden="true"></i>
                Features
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
                  <Link to="/professional/create" onClick={() => setMobileMenuOpen(false)}>
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
              <li className="mobile-auth-section">
                <Link
                  to="/professional/signup"
                  className="btn btn-primary btn-full mobile-auth-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fa fa-user-plus" aria-hidden="true"></i>
                  Create Free Profile
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
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar;
