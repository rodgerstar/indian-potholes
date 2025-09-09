# Pothole Reporting Frontend

A modern, responsive React application for the Indian Pothole Reporting System. Built with Vite, React 19, and Leaflet for interactive mapping, this frontend provides an intuitive user experience for reporting, viewing, and managing potholes across India.

## 🚀 Features

### Core Functionality
- **Interactive Map**: Leaflet-based mapping with real-time location services
- **Pothole Reporting**: Comprehensive form for submitting pothole reports with media uploads
- **User Authentication**: Secure login/register system with email verification
- **Real-time Updates**: Live notifications and status updates
- **Responsive Design**: Mobile-first design that works on all devices
- **Progressive Web App**: PWA capabilities for offline functionality

### Advanced Features
- **Media Management**: Image and video upload with preview and optimization
- **Geolocation Services**: GPS integration and address resolution
- **Social Sharing**: Share pothole reports on social media platforms
- **Heatmap Visualization**: Interactive heatmap showing pothole density and severity
- **Guided Tour**: Interactive onboarding experience for new users
- **Admin Dashboard**: Comprehensive administrative interface
- **Analytics Integration**: Google Analytics and performance tracking

### User Experience
- **Accessibility**: WCAG compliant with screen reader support
- **Performance**: Optimized loading with lazy loading and code splitting
- **SEO**: Search engine optimized with meta tags and structured data
- **Internationalization**: Ready for multi-language support
- **Dark/Light Mode**: Theme switching capability

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 19 with Vite build tool
- **Routing**: React Router DOM v6
- **State Management**: React Context API
- **Maps**: Leaflet with React-Leaflet
- **Forms**: React Hook Form with Yup validation
- **Styling**: Custom CSS with responsive design
- **Icons**: React Icons library
- **Notifications**: React Hot Toast
- **File Upload**: Custom implementation with R2 integration

### Project Structure
```
frontend/
├── public/              # Static assets and data files
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components and routing
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API services and utilities
│   ├── styles/         # CSS styles and themes
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   └── assets/         # Images and static assets
├── vercel.json         # Vercel deployment configuration
└── vite.config.js      # Vite build configuration
```

## 📋 Prerequisites

- Node.js 18+
- Modern web browser with ES6+ support
- Backend API running (see backend README)
- Google Maps API key (optional for enhanced geocoding)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pothole/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:

   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_BACKEND_URL=http://localhost:3000
   
   # Google Analytics
   VITE_GA_TRACKING_ID=your-ga-tracking-id
   
   # Google reCAPTCHA
   VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
   
   # Social Media Sharing
   VITE_SITE_URL=https://your-domain.com
   VITE_SITE_NAME=Indian Pothole Reporter
   
   # Feature Flags
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_TOUR=true
   VITE_ENABLE_NOTIFICATIONS=true
   ```

4. **Backend Setup**
   Ensure the backend API is running and accessible (see backend README for setup instructions).

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
The application will start on `http://localhost:5173` with hot module replacement.

### Production Build
```bash
npm run build
```
Creates optimized production build in the `dist` directory.

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing.

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality and consistency.

## 📱 Application Features

### User Interface Components

#### Core Components
- **Navbar**: Navigation with user authentication status
- **LeafletMap**: Interactive map with pothole markers
- **UploadPothole**: Comprehensive pothole reporting form
- **R2Image**: Optimized image display with lazy loading
- **NotificationBell**: Real-time notification system
- **GuidedTour**: Interactive user onboarding

#### Form Components
- **FormValidation**: Reusable form validation utilities
- **AccessibleButton**: Accessible button component
- **ConfirmationModal**: Confirmation dialogs
- **LoadingSpinner**: Loading states and indicators

#### Layout Components
- **ResponsiveContainer**: Responsive layout wrapper
- **Footer**: Application footer with links
- **Tooltip**: Enhanced tooltip system
- **ShareModal**: Social media sharing interface

### Pages

#### Public Pages
- **Home**: Landing page with map and statistics
- **Login/Register**: Authentication pages
- **Gallery**: Browse pothole reports
- **Roadmap**: Development roadmap
- **Changelog**: Version history
- **Legal Pages**: Privacy, Terms, Contact, Help

#### Protected Pages
- **Profile**: User profile management
- **MyReports**: User's submitted reports
- **Notifications**: User notification center
- **UploadPothole**: Submit new reports
- **ReportDetails**: Detailed pothole information

#### Admin Pages
- **AdminDashboard**: Administrative interface
- **Analytics**: System analytics and reports

## 🗺️ Map Integration

### Leaflet Configuration
- **Base Maps**: OpenStreetMap with custom styling
- **Markers**: Custom pothole markers with severity indicators
- **Clustering**: Marker clustering for performance
- **Geolocation**: GPS integration for user location
- **Search**: Address search and geocoding

### Heatmap Features
- **Density Visualization**: Color-coded heatmap showing pothole concentration
- **Severity Mapping**: Intensity based on pothole severity levels
- **Customizable Settings**: Adjustable radius, blur, and intensity
- **Real-time Updates**: Live heatmap updates as new reports are added
- **Filter Integration**: Heatmap responds to filters (city, status, severity)
- **Interactive Controls**: Toggle between heatmap and marker views

### Map Features
- **Interactive Markers**: Click to view pothole details
- **Filter Controls**: Filter by severity, status, date
- **Heatmap Visualization**: Interactive heatmap with customizable settings
- **Route Planning**: Navigation to pothole locations
- **Offline Support**: Cached map tiles for offline use

## 📊 State Management

### Context Providers
- **AuthContext**: User authentication and session management
- **NotificationContext**: Real-time notification system

### Custom Hooks
- **useApi**: Centralized API communication
- **useSessionTimeout**: Automatic session management
- **usePageTracking**: Analytics page view tracking
- **useTour**: Guided tour state management

## 🎨 Styling System

### CSS Architecture
- **Base Styles**: Global styles and CSS reset
- **Component Styles**: Modular CSS for components
- **Page Styles**: Page-specific styling
- **Responsive Design**: Mobile-first responsive layouts
- **Utility Classes**: Reusable utility classes

### Design System
- **Color Palette**: Consistent color scheme
- **Typography**: Typography scale and font families
- **Spacing**: Consistent spacing system
- **Breakpoints**: Responsive breakpoint definitions
- **Animations**: Smooth transitions and micro-interactions

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Automatic session timeout
- **Protected Routes**: Route-level access control
- **Token Refresh**: Automatic token refresh mechanism

### Data Protection
- **Input Sanitization**: XSS protection
- **File Upload Security**: Secure file handling
- **HTTPS Enforcement**: Secure communication
- **Content Security Policy**: CSP headers

## 📱 Progressive Web App

### PWA Features
- **Service Worker**: Offline functionality
- **App Manifest**: Installable web app
- **Push Notifications**: Real-time notifications
- **Background Sync**: Offline data synchronization

### Performance Optimization
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format and lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Caching Strategy**: Intelligent caching policies

## 🚀 Deployment

### Vercel Deployment
The application is configured for Vercel deployment with:
- **Automatic Builds**: CI/CD pipeline
- **Environment Variables**: Secure environment management
- **Custom Domains**: Domain configuration
- **Analytics**: Built-in performance monitoring

### Other Platforms
The application can be deployed to:
- **Netlify**: Static site hosting
- **GitHub Pages**: Free hosting option
- **AWS S3**: Static website hosting
- **Firebase Hosting**: Google's hosting platform

## 🧪 Testing

### Code Quality
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript Ready**: Type safety preparation

### Performance Monitoring
- **Google Analytics**: User behavior tracking
- **Core Web Vitals**: Performance metrics
- **Error Tracking**: Error monitoring and reporting

## 📊 Analytics & Monitoring

### Google Analytics Integration
- **Page Views**: Automatic page view tracking
- **Events**: Custom event tracking
- **User Behavior**: User journey analysis
- **Performance**: Core Web Vitals monitoring

### Error Tracking
- **Error Boundaries**: React error boundaries
- **Console Logging**: Development error logging
- **User Feedback**: Bug reporting system

## 🔧 Configuration

### Environment Variables
- **API Configuration**: Backend API endpoints
- **Analytics**: Google Analytics tracking
- **Features**: Feature flag configuration
- **Social Media**: Sharing configuration

### Build Configuration
- **Vite Config**: Build optimization settings
- **ESLint Config**: Code quality rules
- **Vercel Config**: Deployment settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow React best practices
- Maintain accessibility standards
- Write clean, documented code
- Test across different browsers
- Optimize for performance

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation and FAQ
- Contact the development team

---

**Note**: This frontend application is designed to work seamlessly with the Node.js backend API. Ensure both applications are properly configured and deployed for full functionality.
