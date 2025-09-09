import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { potholeAPI } from '../services/api';
import { 
  RiMapPinLine, 
  RiUploadLine, 
  RiUserLine, 
  RiAwardLine, 
  RiCameraLine, 
  RiGlobalLine,
  RiShieldCheckLine,
  RiHeartLine,
  RiArrowRightLine,
  RiCheckLine,
  RiRoadMapLine,
  RiTeamLine,
  RiLightbulbLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    totalPotholes: 0,
    uniqueCities: 0,
    totalUsers: 0,
    resolvedPotholes: 0,
    recentReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await potholeAPI.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        toast.error('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <RiCameraLine className="feature-icon" />,
      title: "Photo & Video Reports",
      description: "Upload clear photos or videos of potholes with exact location data to help authorities take action.",
    },
    {
      icon: <RiMapPinLine className="feature-icon" />,
      title: "GPS Location Tracking",
      description: "Automatically capture precise coordinates for accurate pothole mapping.",
    },
    {
      icon: <RiTeamLine className="feature-icon" />,
      title: "Authority Tracking",
      description: "Tag responsible officials including contractors, engineers, corporators, MLAs, and MPs for accountability.",
    },
    {
      icon: <RiGlobalLine className="feature-icon" />,
      title: "Public Gallery",
      description: "Browse all reported potholes in your area and stay updated on road conditions and repairs.",
    },
    {
      icon: <RiAwardLine className="feature-icon" />,
      title: "Recognition System",
      description: "Get recognized for your contributions to improving India's road infrastructure.",
    },
    {
      icon: <RiLightbulbLine className="feature-icon" />,
      title: "Easy Reporting",
      description: "Simple, user-friendly interface to report potholes quickly and efficiently.",
    }
  ];

  const statsData = [
    { 
      number: stats.totalPotholes, 
      label: "Potholes Reported",
      icon: <RiMapPinLine className="stat-icon" />
    },
    { 
      number: stats.uniqueCities, 
      label: "Cities Covered",
      icon: <RiGlobalLine className="stat-icon" />
    },
    { 
      number: stats.totalUsers, 
      label: "Registered Users",
      icon: <RiUserLine className="stat-icon" />
    },
    { 
      number: stats.resolvedPotholes, 
      label: "Fixed Roads",
      icon: <RiShieldCheckLine className="stat-icon" />
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-element floating-1"></div>
          <div className="floating-element floating-2"></div>
          <div className="floating-element floating-3"></div>
          <div className="floating-element floating-4"></div>
        </div>

        <div className="container hero-content">
          <div className="hero-text">
            {/* Logo Animation */}
            <div className="hero-logo">
              <div className="logo-container">
                <RiRoadMapLine className="logo-icon" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="hero-title">
              <span className="title-line-1">Report Potholes,</span>
              <span className="title-line-2">Build Better India</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              Join the movement to make India's roads safer. Upload photos, tag authorities, 
              and help create better infrastructure for everyone.
            </p>

            {/* Action Buttons */}
            <div className="hero-buttons">
              <Link to="/upload" className="btn btn-primary btn-hero">
                <RiUploadLine className="btn-icon" />
                Report a Pothole
                <RiArrowRightLine className="btn-arrow" />
              </Link>
              <Link to="/gallery" className="btn btn-secondary btn-hero">
                View Gallery
                <RiGlobalLine className="btn-icon" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="trust-indicators">
              <div className="trust-item">
                <RiShieldCheckLine className="trust-icon" />
                <span>100% Secure</span>
              </div>
              <div className="trust-item">
                <RiUserLine className="trust-icon" />
                <span>{loading ? 'Loading...' : `${stats.totalUsers.toLocaleString()}+ Users`}</span>
              </div>
              <div className="trust-item">
                <RiHeartLine className="trust-icon" />
                <span>Made in India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-line">
            <div className="scroll-dot"></div>
          </div>
        </div>
      </section>

      {/* Bug/Feedback Section */}
      <section className="bug-feedback-section">
        <div className="container bug-feedback-content">
          <h2 className="section-title">Found a Bug or Have Feedback?</h2>
          <p className="section-subtitle">Help us improve by reporting bugs or sharing your feedback.</p>
          {isAuthenticated ? (
            <div className="bug-feedback-buttons">
              <Link to="/bug-report" className="btn btn-secondary">
                Report a Bug
              </Link>
              <Link to="/feedback" className="btn btn-secondary">
                Send Feedback
              </Link>
            </div>
          ) : (
            <div className="bug-feedback-signin">
              <p>
                <strong>Sorry,</strong> you need to <Link to="/login">sign in</Link> to submit a bug or feedback report.<br/>
                We know this is inconvenient, and we're working on making it easier in the future. Thank you for your patience!
              </p>
              <Link to="/login" className="btn btn-primary">Sign In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Real Impact, Real Numbers</h2>
            <p className="section-subtitle">See the difference we're making together across India</p>
          </div>
          
          {loading ? (
            <div className="stats-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="stat-card loading">
                  <div className="loading-placeholder"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stats-grid">
              {statsData.map((stat, index) => (
                <Link key={index} to="/gallery" className="stat-card-link">
                  <div className="stat-card">
                    <div className="stat-icon-container">
                      {stat.icon}
                    </div>
                    <div className="stat-number">{stat.number.toLocaleString()}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-background"></div>
        
        <div className="container">
          <div className="section-header">
            <h2 className="section-title features-title">
              <span className="title-accent">Powerful Features for Maximum Impact</span>
            </h2>
            <p className="section-subtitle features-subtitle">
              Everything you need to report, track, and resolve infrastructure issues
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="cta-glow cta-glow-1"></div>
          <div className="cta-glow cta-glow-2"></div>
        </div>
        
        <div className="container cta-content">
          <h2 className="cta-title">Ready to Make a Difference?</h2>
          <p className="cta-subtitle">
            Join thousands of Indians working together to build better infrastructure. 
            Every report matters, every voice counts.
          </p>
          
          <div className="cta-buttons">
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-cta-primary">
                Start Reporting Today
                <RiArrowRightLine className="btn-arrow" />
              </Link>
            )}
            <Link to="/gallery" className="btn btn-cta-secondary">
              Explore Reports
              <RiGlobalLine className="btn-icon" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
