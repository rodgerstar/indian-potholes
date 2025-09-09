import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import SessionManager from './components/SessionManager';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import UploadPothole from './pages/UploadPothole';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import MyReports from './pages/MyReports';
import Notifications from './pages/Notifications';
import Roadmap from './pages/Roadmap';
import Changelog from './pages/Changelog';
import BugReport from './pages/BugReport';
import Feedback from './pages/Feedback';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import LegalDisclaimer from './pages/LegalDisclaimer';
import ContactUs from './pages/ContactUs';
import HelpFAQ from './pages/HelpFAQ';
import GuidedTour from './components/GuidedTour';
import { useTour } from './hooks/useTour';
import Footer from './components/Footer';
import './styles/main.css';
import ReportDetailsPage from './pages/ReportDetailsPage';
import { usePageTracking } from './hooks/usePageTracking';
import Blog, { BlogList, BlogPost } from './pages/Blog.jsx';
import HeatmapView from './pages/HeatmapView';
import Traffic from './pages/Traffic';
import ContributeMPMLA from './pages/ContributeMPMLA';
import MPMLALeaderboard from './pages/MPMLALeaderboard';
import ReportSubmitted from './pages/ReportSubmitted';

// New wrapper to use useTour inside AuthProvider
function TourWrapper() {
  const { showTour, closeTour, completeTour } = useTour();
  return (
    <GuidedTour 
      isOpen={showTour} 
      onClose={closeTour} 
      onComplete={completeTour} 
    />
  );
}

function App() {
  // Track page views
  usePageTracking();
  
  return (
    <AuthProvider>
      <NotificationProvider>
        <SessionManager>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register-success" 
                element={
                  <PublicRoute>
                    <RegisterSuccess />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/verify-email" 
                element={
                  <PublicRoute>
                    <VerifyEmail />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                } 
              />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/heatmap" element={<HeatmapView />} />
              <Route path="/traffic" element={<Traffic />} />
              <Route path="/contribute-mp-mla" element={<ContributeMPMLA />} />
              <Route path="/leaderboard" element={<MPMLALeaderboard />} />
              <Route 
                path="/upload" 
                element={
                  <UploadPothole />
                } 
              />
              <Route path="/report-submitted" element={<ReportSubmitted />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-reports" 
                element={
                  <ProtectedRoute>
                    <MyReports />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/bug-report" element={<ProtectedRoute><BugReport /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
              <Route path="/report/:id" element={<ReportDetailsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/legal-disclaimer" element={<LegalDisclaimer />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/help-faq" element={<HelpFAQ />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <TourWrapper />
          </div>
          <Footer />
        </SessionManager>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
