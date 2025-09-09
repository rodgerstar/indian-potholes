import React, { useState } from 'react';
import { 
  RiQuestionLine, 
  RiArrowDownSLine, 
  RiArrowUpSLine, 
  RiMapPin2Line, 
  RiImageLine, 
  RiNotification4Line, 
  RiUserSettingsLine, 
  RiPhoneLine, 
  RiMailLine, 
  RiGlobalLine,
  RiLightbulbLine,
  RiSearchLine,
  RiPlayCircleLine
} from 'react-icons/ri';
import { useTour } from '../hooks/useTour';
import './HelpFAQ.css';

const HelpFAQ = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { resetTour, startTour } = useTour();

  const handleStartTour = () => {
    // Reset the tour state and start it
    resetTour();
    setTimeout(() => {
      startTour();
    }, 100);
  };

  const faqData = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <RiLightbulbLine className="section-icon" />,
      questions: [
        {
          question: 'How do I report a pothole?',
          answer: 'To report a pothole, click the "Report Pothole" button in the navigation menu or on the home page. You\'ll need to provide a photo/video, location details, and description. Make sure to enable location services for accurate GPS coordinates.'
        },
        {
          question: 'Do I need to register to report potholes?',
          answer: 'No, you can report potholes anonymously without registering. However, creating an account allows you to track your reports, receive notifications about status updates, and build a reputation in the community.'
        },
        {
          question: 'What information do I need to provide when reporting?',
          answer: 'You need to provide: a clear photo or video of the pothole, the exact location (GPS coordinates are automatically detected), a brief description, and optionally tag relevant authorities like contractors, engineers, or local representatives.'
        }
      ]
    },
    {
      id: 'submissions',
      title: 'Managing Your Submissions',
      icon: <RiImageLine className="section-icon" />,
      questions: [
        {
          question: 'How can I view my submitted reports?',
          answer: 'After logging in, go to "My Reports" in the navigation menu. Here you can see all your submitted reports, their current status, and any updates from authorities.'
        },
        {
          question: 'Can I edit or delete my reports?',
          answer: 'You can delete your reports from the "My Reports" page if needed. However, editing is limited to protect data integrity. If you need to make corrections, consider submitting a new report with updated information.'
        },
        {
          question: 'How long does it take for authorities to respond?',
          answer: 'Response times vary depending on the severity of the issue and local authority capacity. Typically, acknowledgment happens within 3-7 days, while resolution can take weeks to months depending on the complexity.'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications & Updates',
      icon: <RiNotification4Line className="section-icon" />,
      questions: [
        {
          question: 'How do I get updates on my reports?',
          answer: 'Enable notifications in your account settings. You\'ll receive updates when authorities acknowledge your report, provide status updates, or mark the issue as resolved.'
        },
        {
          question: 'What do the different status levels mean?',
          answer: 'Status levels include: "Reported" (newly submitted), "Acknowledged" (authorities have seen it), "In Progress" (work has started), and "Resolved" (issue has been fixed).'
        },
        {
          question: 'Can I turn off notifications?',
          answer: 'Yes, you can manage notification preferences in your profile settings. You can choose to receive notifications for your own reports, community updates, or turn them off entirely.'
        }
      ]
    },
    {
      id: 'community',
      title: 'Community Features',
      icon: <RiUserSettingsLine className="section-icon" />,
      questions: [
        {
          question: 'How does the upvoting system work?',
          answer: 'Community members can upvote reports to show support and increase visibility. Reports with more upvotes are more likely to get attention from authorities. You can upvote reports in the Gallery section.'
        },
        {
          question: 'How can I view reports from my area?',
          answer: 'Use the Gallery page to browse all reports. You can filter by location, status, or date to find reports relevant to your area. The map view shows all reports geographically.'
        },
        {
          question: 'Can I share reports with others?',
          answer: 'Yes, each report has a share button that allows you to share via social media, email, or copy the direct link. This helps increase awareness and community engagement.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: <RiMapPin2Line className="section-icon" />,
      questions: [
        {
          question: 'The app is not detecting my location correctly. What should I do?',
          answer: 'Ensure location services are enabled in your browser settings. Try refreshing the page or clearing your browser cache. If the issue persists, you can manually adjust the location pin on the map.'
        },
        {
          question: 'My photos/videos are not uploading. How can I fix this?',
          answer: 'Check your internet connection and ensure the file size is under 10MB. Supported formats are JPG, PNG, MP4, and MOV. Clear your browser cache and try again. If issues persist, try using a different browser.'
        },
        {
          question: 'I\'m having trouble with the mobile version. Any tips?',
          answer: 'The app is optimized for mobile devices. Try using the latest version of Chrome or Safari. Ensure you have a stable internet connection. If problems persist, try accessing the desktop version.'
        }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const filteredFAQ = faqData.map(section => ({
    ...section,
    questions: section.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  return (
    <div className="help-faq-container">
      <div className="help-hero">
        <div className="hero-content">
          <RiQuestionLine className="hero-icon" />
          <h1>Help & FAQ</h1>
          <p>Find answers to common questions about reporting potholes and using the platform</p>
        </div>
      </div>

      <div className="help-content">
        <div className="container">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-container">
              <RiSearchLine className="search-icon" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <a href="/upload" className="quick-action-card">
                <RiImageLine className="action-icon" />
                <h3>Report a Pothole</h3>
                <p>Submit a new pothole report with photos and location</p>
              </a>
              <a href="/gallery" className="quick-action-card">
                <RiMapPin2Line className="action-icon" />
                <h3>View Reports</h3>
                <p>Browse all pothole reports in your area</p>
              </a>
              <a href="/my-reports" className="quick-action-card">
                <RiNotification4Line className="action-icon" />
                <h3>My Reports</h3>
                <p>Check the status of your submitted reports</p>
              </a>
              <button className="quick-action-card tour-trigger" onClick={handleStartTour}>
                <RiPlayCircleLine className="action-icon" />
                <h3>Take a Tour</h3>
                <p>Learn how to use the platform with a guided tour</p>
              </button>
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="faq-sections">
            <h2>Frequently Asked Questions</h2>
            {filteredFAQ.map(section => (
              <div key={section.id} className="faq-section">
                <button 
                  className={`section-header ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => toggleSection(section.id)}
                >
                  {section.icon}
                  <h3>{section.title}</h3>
                  <span className="section-count">({section.questions.length})</span>
                  {activeSection === section.id ? 
                    <RiArrowUpSLine className="chevron" /> : 
                    <RiArrowDownSLine className="chevron" />
                  }
                </button>
                
                {activeSection === section.id && (
                  <div className="section-content">
                    {section.questions.map((faq, index) => (
                      <div key={index} className="faq-item">
                        <h4 className="faq-question">{faq.question}</h4>
                        <p className="faq-answer">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="contact-section">
            <h2>Still Need Help?</h2>
            <p>If you couldn't find the answer you're looking for, we're here to help!</p>
            <div className="contact-options">
              <a href="/contact-us" className="contact-option">
                <RiMailLine className="contact-icon" />
                <div>
                  <h4>Contact Us</h4>
                  <p>Send us a message through our contact form</p>
                </div>
              </a>
              <a href="/feedback" className="contact-option">
                <RiLightbulbLine className="contact-icon" />
                <div>
                  <h4>Feedback</h4>
                  <p>Share your suggestions to improve the platform</p>
                </div>
              </a>
              <a href="/bug-report" className="contact-option">
                <RiGlobalLine className="contact-icon" />
                <div>
                  <h4>Report a Bug</h4>
                  <p>Let us know if you encounter any technical issues</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQ;