import React from 'react';
import './FAQItem.css';

const FAQItem = ({ question, answer, isLast = false }) => {
  return (
    <div className={`faq-item ${isLast ? 'faq-item--last' : ''}`}>
      <h4 className="faq-item__question">{question}</h4>
      <p className="faq-item__answer">{answer}</p>
    </div>
  );
};

export default FAQItem;