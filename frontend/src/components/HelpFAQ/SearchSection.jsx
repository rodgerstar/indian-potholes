import React from 'react';
import { RiSearchLine } from 'react-icons/ri';
import './SearchSection.css';

const SearchSection = ({ searchQuery, onSearchChange, placeholder = "Search for answers..." }) => {
  return (
    <section className="search-section">
      <div className="search-section__container">
        <div className="search-section__input-wrapper">
          <RiSearchLine className="search-section__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-section__input"
            aria-label="Search FAQ"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="search-section__clear"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchSection;