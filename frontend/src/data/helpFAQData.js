import { 
  RiLightbulbLine,
  RiImageLine,
  RiNotification4Line,
  RiUserSettingsLine,
  RiMapPin2Line,
  RiMailLine,
  RiGlobalLine,
  RiPlayCircleLine
} from 'react-icons/ri';

export const faqData = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: RiLightbulbLine,
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
    icon: RiImageLine,
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
    icon: RiNotification4Line,
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
    icon: RiUserSettingsLine,
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
    icon: RiMapPin2Line,
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

export const quickActionsData = [
  {
    href: '/upload',
    icon: RiImageLine,
    title: 'Report a Pothole',
    description: 'Submit a new pothole report with photos and location'
  },
  {
    href: '/gallery',
    icon: RiMapPin2Line,
    title: 'View Reports',
    description: 'Browse all pothole reports in your area'
  },
  {
    href: '/my-reports',
    icon: RiNotification4Line,
    title: 'My Reports',
    description: 'Check the status of your submitted reports'
  },
  {
    href: null,
    icon: RiPlayCircleLine,
    title: 'Take a Tour',
    description: 'Learn how to use the platform with a guided tour',
    onClick: 'handleStartTour'
  }
];

export const contactOptionsData = [
  {
    href: '/contact-us',
    icon: RiMailLine,
    title: 'Contact Us',
    description: 'Send us a message through our contact form'
  },
  {
    href: '/feedback',
    icon: RiLightbulbLine,
    title: 'Feedback',
    description: 'Share your suggestions to improve the platform'
  },
  {
    href: '/bug-report',
    icon: RiGlobalLine,
    title: 'Report a Bug',
    description: 'Let us know if you encounter any technical issues'
  }
];