import React from 'react';
import { RiSearchLine } from 'react-icons/ri';

/**
 * Reusable filter controls component
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Object} props.options - Filter options configuration
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {boolean} props.showSearch - Whether to show search input
 * @param {string} props.className - Additional CSS classes
 */
const FilterControls = ({
  filters = {},
  onFilterChange,
  options = {},
  searchPlaceholder = "Search...",
  showSearch = true,
  className = ""
}) => {
  /**
   * Handle filter change
   * @param {string} key - Filter key
   * @param {string} value - Filter value
   */
  const handleChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange(key, value);
    }
  };

  return (
    <div className={`gallery-filters-modern ${className}`}>
      <div className="filter-row">
        {/* Search Input */}
        {showSearch && (
          <div className="gallery-search-group">
            <RiSearchLine className="search-icon-gallery" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={filters.search || filters.city || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="gallery-search-input"
            />
          </div>
        )}

        {/* Status Filter */}
        {options.statusOptions && (
          <div className="gallery-filter-group">
            <select
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="gallery-filter-select"
            >
              <option value="">All Status</option>
              {options.statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Filter */}
        {options.sortOptions && (
          <div className="gallery-filter-group">
            <select
              value={filters.sortBy || ''}
              onChange={(e) => handleChange('sortBy', e.target.value)}
              className="gallery-filter-select"
            >
              {options.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Order Filter */}
        {options.orderOptions && (
          <div className="gallery-filter-group">
            <select
              value={filters.order || ''}
              onChange={(e) => handleChange('order', e.target.value)}
              className="gallery-filter-select"
            >
              {options.orderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Filters */}
        {options.customFilters && options.customFilters.map((filter) => (
          <div key={filter.key} className="gallery-filter-group">
            <select
              value={filters[filter.key] || ''}
              onChange={(e) => handleChange(filter.key, e.target.value)}
              className="gallery-filter-select"
            >
              <option value="">{filter.placeholder || 'All'}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterControls;