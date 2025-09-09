import React, { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './GuidedTour.css';

const GuidedTour = ({ isOpen, onClose, onComplete }) => {
  const tourRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Check if device is mobile (768px and below)
    const isMobile = window.innerWidth <= 768;

    // Initialize Shepherd tour
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        modalOverlayOpeningPadding: 4,
        modalOverlayOpeningRadius: 8,
        cancelIcon: {
          enabled: true,
        },
        buttons: [
          {
            text: 'Skip',
            classes: 'shepherd-button-secondary',
            action: () => tour.cancel()
          },
          {
            text: 'Next',
            classes: 'shepherd-button-primary',
            action: () => tour.next()
          }
        ]
      }
    });

    // Helper function to wait for element to be available
    const waitForElement = (selector, timeout = 2000) => {
      return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          resolve(element);
          return;
        }
        
        const observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            observer.disconnect();
            resolve(element);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
        
        // Timeout fallback
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    };

    // Define tour steps based on device type
    const steps = [
      {
        id: 'welcome',
        title: 'Welcome to Indian Potholes! 🇮🇳',
        text: 'Let\'s take a quick tour to help you get started with reporting potholes and making a difference in your community.',
        buttons: [
          {
            text: 'Skip Tour',
            classes: 'shepherd-button-secondary',
            action: () => tour.cancel()
          },
          {
            text: 'Start Tour',
            classes: 'shepherd-button-primary',
            action: () => tour.next()
          }
        ]
      },
      {
        id: 'navbar',
        title: isMobile ? 'Navigation Menu' : 'Navigation Menu',
        text: isMobile 
          ? 'Use the hamburger menu (☰) to access different sections of the app. Tap the menu button to see all available options.'
          : 'Use the navigation menu to access different sections of the app. The menu is responsive and works on all devices.',
        attachTo: {
          element: isMobile ? '.mobile-menu-btn' : '.navbar',
          on: isMobile ? 'bottom' : 'bottom'
        }
      },
      ...(isMobile ? [
        {
          id: 'mobile-menu-demo',
          title: 'Mobile Menu',
          text: 'Tap the menu button to see all available options. The menu includes Home, Gallery, Help, and authentication options.',
          attachTo: {
            element: '.mobile-menu-btn',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Skip',
              classes: 'shepherd-button-secondary',
              action: () => tour.cancel()
            },
            {
              text: 'Open Menu & Continue',
              classes: 'shepherd-button-primary',
              action: async () => {
                // Open mobile menu
                const menuBtn = document.querySelector('.mobile-menu-btn');
                if (menuBtn) {
                  menuBtn.click();
                  // Wait for menu to open, then continue
                  await waitForElement('.mobile-nav.open');
                  tour.next();
                } else {
                  tour.next();
                }
              }
            }
          ]
        },
        {
          id: 'mobile-gallery',
          title: 'Browse Reports',
          text: 'View all pothole reports from your area and the entire community. You can filter by location, status, and date.',
          attachTo: {
            element: '.mobile-nav-content a[href="/gallery"]',
            on: 'right'
          }
        },
        {
          id: 'mobile-help',
          title: 'Need Help?',
          text: 'Visit our Help & FAQ section for detailed guides, troubleshooting tips, and answers to common questions.',
          attachTo: {
            element: '.mobile-nav-content a[href="/help-faq"]',
            on: 'right'
          }
        }
      ] : [
        {
          id: 'report-button',
          title: 'Report a Pothole',
          text: 'Click here to report a new pothole. You can upload photos, add GPS coordinates, and tag relevant authorities.',
          attachTo: {
            element: 'a[href="/upload"]',
            on: 'bottom'
          }
        },
        {
          id: 'gallery',
          title: 'Browse Reports',
          text: 'View all pothole reports from your area and the entire community. You can filter by location, status, and date.',
          attachTo: {
            element: 'a[href="/gallery"]',
            on: 'bottom'
          }
        },
        {
          id: 'notifications',
          title: 'Stay Updated',
          text: 'Get notifications about status updates on your reports and community activities.',
          attachTo: {
            element: '.notification-bell',
            on: 'bottom'
          }
        },
        {
          id: 'profile',
          title: 'Your Account',
          text: 'Access your profile settings, view your submitted reports, and manage your account preferences.',
          attachTo: {
            element: '.user-profile-link',
            on: 'bottom'
          }
        },
        {
          id: 'help',
          title: 'Need Help?',
          text: 'Visit our Help & FAQ section for detailed guides, troubleshooting tips, and answers to common questions.',
          attachTo: {
            element: 'a[href="/help-faq"]',
            on: 'bottom'
          }
        }
      ]),
      {
        id: 'complete',
        title: 'You\'re All Set! 🎉',
        text: isMobile 
          ? 'You\'re now ready to start reporting potholes! Use the menu button to navigate and access all features. Thank you for being part of the solution!'
          : 'You\'re now ready to start reporting potholes and contributing to better infrastructure. Thank you for being part of the solution!',
        buttons: [
          {
            text: isMobile ? 'Close Menu & Start' : 'Start Reporting',
            classes: 'shepherd-button-primary',
            action: () => {
              // Close mobile menu if open
              if (isMobile) {
                const mobileNav = document.querySelector('.mobile-nav.open');
                if (mobileNav) {
                  const menuBtn = document.querySelector('.mobile-menu-btn');
                  if (menuBtn) menuBtn.click();
                }
              }
              tour.complete();
              window.location.href = '/upload';
            }
          },
          {
            text: 'Finish Tour',
            classes: 'shepherd-button-secondary',
            action: () => {
              // Close mobile menu if open
              if (isMobile) {
                const mobileNav = document.querySelector('.mobile-nav.open');
                if (mobileNav) {
                  const menuBtn = document.querySelector('.mobile-menu-btn');
                  if (menuBtn) menuBtn.click();
                }
              }
              tour.complete();
            }
          }
        ]
      }
    ];

    // Filter steps to only include those with valid elements or add them conditionally
    const validSteps = [];
    
    for (const step of steps) {
      if (!step.attachTo) {
        // Steps without attachTo are always valid
        validSteps.push(step);
      } else {
        // Check if element exists and is visible
        const element = document.querySelector(step.attachTo.element);
        if (element) {
          // Check if element is visible (not hidden by CSS)
          const style = window.getComputedStyle(element);
          if (style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null) {
            validSteps.push(step);
          }
        }
      }
    }

    // If no valid steps (all elements are hidden), show a simplified mobile tour
    if (validSteps.length <= 1 && isMobile) {
      const simplifiedSteps = [
        {
          id: 'welcome',
          title: 'Welcome to Indian Potholes! 🇮🇳',
          text: 'Let\'s take a quick tour to help you get started with reporting potholes and making a difference in your community.',
          buttons: [
            {
              text: 'Skip Tour',
              classes: 'shepherd-button-secondary',
              action: () => tour.cancel()
            },
            {
              text: 'Start Tour',
              classes: 'shepherd-button-primary',
              action: () => tour.next()
            }
          ]
        },
        {
          id: 'mobile-nav',
          title: 'Mobile Navigation',
          text: 'Use the hamburger menu (☰) to access all features: Home, Gallery, Help, and authentication options.',
          attachTo: {
            element: '.mobile-menu-btn',
            on: 'bottom'
          }
        },
        {
          id: 'complete-mobile',
          title: 'You\'re All Set! 🎉',
          text: 'You\'re now ready to start reporting potholes! Use the menu button to navigate and access all features. Thank you for being part of the solution!',
          buttons: [
            {
              text: 'Get Started',
              classes: 'shepherd-button-primary',
              action: () => {
                tour.complete();
                window.location.href = '/register';
              }
            },
            {
              text: 'Finish Tour',
              classes: 'shepherd-button-secondary',
              action: () => tour.complete()
            }
          ]
        }
      ];
      
      simplifiedSteps.forEach(step => tour.addStep(step));
    } else {
      // Add valid steps to tour
      validSteps.forEach(step => tour.addStep(step));
    }

    // Event handlers
    tour.on('complete', () => {
      onComplete?.();
      onClose?.();
    });

    tour.on('cancel', () => {
      onClose?.();
    });

    // Handle window resize to restart tour if needed
    const handleResize = () => {
      if (tourRef.current) {
        const currentIsMobile = window.innerWidth <= 768;
        if (currentIsMobile !== isMobile) {
          // Device orientation changed, restart tour
          tour.cancel();
          setTimeout(() => {
            if (onClose) onClose();
            if (onComplete) onComplete();
          }, 100);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Start the tour
    tour.start();

    // Store reference
    tourRef.current = tour;

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (tourRef.current) {
        tourRef.current.cancel();
      }
    };
  }, [isOpen, onClose, onComplete]);

  return null; // This component doesn't render anything
};

export default GuidedTour;