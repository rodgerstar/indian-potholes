import React from 'react';
import SectionHeader from './SectionHeader';
import FAQCategory from './FAQCategory';
import './FAQSection.css';

const FAQSection = ({ 
  faqData, 
  activeSection, 
  onToggleSection,
  searchQuery = '' 
}) => {
  // Filter FAQ data based on search query
  const filteredFAQ = faqData.map(section => ({
    ...section,
    questions: section.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  if (filteredFAQ.length === 0 && searchQuery) {
    return (
      <section className="faq-section">
        <div className="faq-section__container">
          <SectionHeader 
            title="Frequently Asked Questions" 
            subtitle="Find answers to common questions"
          />
          <div className="faq-section__no-results">
            <p>No results found for "{searchQuery}"</p>
            <p>Try searching with different keywords or browse all categories below.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="faq-section">
      <div className="faq-section__container">
        <SectionHeader 
          title="Frequently Asked Questions" 
          subtitle={searchQuery ? `Search results for "${searchQuery}"` : "Find answers to common questions"}
        />
        <div className="faq-section__categories">
          {filteredFAQ.map(section => (
            <FAQCategory
              key={section.id}
              id={section.id}
              title={section.title}
              icon={section.icon}
              questions={section.questions}
              isActive={activeSection === section.id}
              onToggle={onToggleSection}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;