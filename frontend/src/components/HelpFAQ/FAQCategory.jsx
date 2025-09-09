import React from 'react';
import { RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import FAQItem from './FAQItem';
import './FAQCategory.css';

const FAQCategory = ({ 
  id, 
  title, 
  icon: Icon, 
  questions, 
  isActive, 
  onToggle 
}) => {
  return (
    <div className="faq-category">
      <button 
        className={`faq-category__header ${isActive ? 'faq-category__header--active' : ''}`}
        onClick={() => onToggle(id)}
        aria-expanded={isActive}
        aria-controls={`faq-content-${id}`}
      >
        <div className="faq-category__header-content">
          <Icon className="faq-category__icon" aria-hidden="true" />
          <h3 className="faq-category__title">{title}</h3>
          <span className="faq-category__count">({questions.length})</span>
        </div>
        {isActive ? 
          <RiArrowUpSLine className="faq-category__chevron" aria-hidden="true" /> : 
          <RiArrowDownSLine className="faq-category__chevron" aria-hidden="true" />
        }
      </button>
      
      {isActive && (
        <div 
          id={`faq-content-${id}`}
          className="faq-category__content"
          role="region"
          aria-labelledby={`faq-header-${id}`}
        >
          {questions.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isLast={index === questions.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQCategory;