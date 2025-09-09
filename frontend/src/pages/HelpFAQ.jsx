import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '../hooks/useTour';
import { faqData } from '../data/helpFAQData';
import {
  HeroSection,
  SearchSection,
  QuickActionsSection,
  FAQSection,
  ContactSection
} from '../components/HelpFAQ';
import './HelpFAQ.css';

const HelpFAQ = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { resetTour, startTour } = useTour();
  const navigate = useNavigate();

  const handleStartTour = () => {
    // Navigate to home page first, then start the tour
    // The guided tour is designed to showcase main app features from the home page
    navigate('/');
    // Reset the tour state and start it after navigation
    resetTour();
    setTimeout(() => {
      startTour();
    }, 500); // Increased delay to allow for navigation
  };

  const handleToggleSection = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // If searching, close all sections to show filtered results clearly
    if (query) {
      setActiveSection(null);
    }
  };

  return (
    <div className="help-faq">
      <HeroSection />
      
      <main className="help-faq__main">
        <SearchSection 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
        
        <QuickActionsSection 
          onTourStart={handleStartTour}
        />
        
        <FAQSection 
          faqData={faqData}
          activeSection={activeSection}
          onToggleSection={handleToggleSection}
          searchQuery={searchQuery}
        />
        
        <ContactSection />
      </main>
    </div>
  );
};

export default HelpFAQ;