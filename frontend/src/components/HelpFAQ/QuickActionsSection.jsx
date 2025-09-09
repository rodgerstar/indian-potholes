import React from 'react';
import SectionHeader from './SectionHeader';
import QuickActionCard from './QuickActionCard';
import { quickActionsData } from '../../data/helpFAQData';
import './QuickActionsSection.css';

const QuickActionsSection = ({ onTourStart }) => {
  const handleActionClick = (action) => {
    if (action.onClick === 'handleStartTour' && onTourStart) {
      onTourStart();
    }
  };

  return (
    <section className="quick-actions-section">
      <div className="quick-actions-section__container">
        <SectionHeader 
          title="Quick Actions" 
          subtitle="Get started with common tasks"
        />
        <div className="quick-actions-section__grid">
          {quickActionsData.map((action, index) => (
            <QuickActionCard
              key={index}
              href={action.href}
              icon={action.icon}
              title={action.title}
              description={action.description}
              onClick={() => handleActionClick(action)}
              special={action.onClick === 'handleStartTour'}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActionsSection;