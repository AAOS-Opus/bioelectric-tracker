import React, { useState, useRef, useEffect } from 'react';
import { format, subWeeks } from 'date-fns';
import { JournalFilter, Emotion } from '@/types/journal';
import { useUser } from '@/hooks/useUser';

interface JournalSearchProps {
  onFilterChange: (filter: JournalFilter) => void;
  currentFilter: JournalFilter;
}

const JournalSearch: React.FC<JournalSearchProps> = ({
  onFilterChange,
  currentFilter
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { phases } = useUser();

  // Predefined time periods
  const timePeriods = [
    { label: 'All time', value: null },
    { label: 'Last week', value: 'last-week' },
    { label: 'Last month', value: 'last-month' },
    { label: 'Last 3 months', value: 'last-3-months' },
    { label: 'Custom range', value: 'custom' }
  ];

  // Predefined emotions
  const emotions: Emotion[] = [
    'joyful',
    'optimistic', 
    'content', 
    'neutral', 
    'fatigued', 
    'anxious', 
    'frustrated', 
    'discouraged'
  ];

  // Initialize available tags
  useEffect(() => {
    // In a real app, you would fetch these from the API
    // For now, we'll use the phases and some common tags
    const tags = [
      'general',
      'milestone',
      'breakthrough',
      'setback',
      'reflection'
    ];
    
    // Add phase names to available tags if phases exist
    if (phases && phases.length > 0) {
      const phaseNames = phases.map(phase => phase.name);
      setAvailableTags([...new Set([...tags, ...phaseNames])]);
    } else {
      setAvailableTags(tags);
    }
  }, [phases]);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle text search
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...currentFilter,
      text: e.target.value
    });
  };

  // Handle time period change
  const handleTimePeriodChange = (periodValue: string | null) => {
    let dateRange = null;
    
    if (periodValue === 'last-week') {
      const end = new Date();
      const start = subWeeks(end, 1);
      dateRange = { start, end };
    } else if (periodValue === 'last-month') {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      dateRange = { start, end };
    } else if (periodValue === 'last-3-months') {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      dateRange = { start, end };
    } else if (periodValue === 'custom') {
      // Keep existing custom range if set
      dateRange = currentFilter.dateRange;
    }
    
    onFilterChange({
      ...currentFilter,
      dateRange
    });
  };

  // Handle custom date range
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      onFilterChange({
        ...currentFilter,
        dateRange: {
          start: new Date(startDate),
          end: new Date(endDate)
        }
      });
    }
  };

  // Handle emotion filter toggle
  const handleEmotionToggle = (emotion: Emotion) => {
    const emotions = [...currentFilter.emotions];
    const index = emotions.indexOf(emotion);
    
    if (index === -1) {
      emotions.push(emotion);
    } else {
      emotions.splice(index, 1);
    }
    
    onFilterChange({
      ...currentFilter,
      emotions
    });
  };

  // Handle tag filter toggle
  const handleTagToggle = (tag: string) => {
    const tags = [...currentFilter.tags];
    const index = tags.indexOf(tag);
    
    if (index === -1) {
      tags.push(tag);
    } else {
      tags.splice(index, 1);
    }
    
    onFilterChange({
      ...currentFilter,
      tags
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFilterChange({
      text: '',
      tags: [],
      emotions: [],
      dateRange: null
    });
  };

  // Count active filters
  const activeFiltersCount = (
    (currentFilter.tags?.length || 0) +
    (currentFilter.emotions?.length || 0) +
    (currentFilter.dateRange ? 1 : 0)
  );

  return (
    <div className="journal-search" data-testid="journal-search">
      <div className="search-bar">
        <div className="search-input-container">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="search-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search journal entries..."
            value={currentFilter.text}
            onChange={handleSearchInput}
            aria-label="Search journal entries"
          />
          {currentFilter.text && (
            <button 
              className="clear-search" 
              onClick={() => onFilterChange({...currentFilter, text: ''})}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        
        <button 
          className={`filter-button ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Show filters"
          aria-expanded={showFilters ? 'true' : 'false'}
          aria-controls="journal-filters"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="filter-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
            />
          </svg>
          {activeFiltersCount > 0 && (
            <span className="filters-badge">{activeFiltersCount}</span>
          )}
        </button>
      </div>
      
      {showFilters && (
        <div className="filters-panel" id="journal-filters" ref={filtersRef}>
          <div className="filters-header">
            <h3 className="filters-title">Filter Entries</h3>
            <button 
              className="close-filters" 
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>
          
          <div className="filters-content">
            <div className="filter-section">
              <h4 className="filter-section-title">Time Period</h4>
              <div className="time-periods">
                {timePeriods.map(period => (
                  <button
                    key={period.value || 'all'}
                    className={`time-period-btn ${
                      !currentFilter.dateRange && !period.value ? 'selected' : 
                      period.value === 'custom' && currentFilter.dateRange ? 'selected' : 
                      false
                    }`}
                    onClick={() => handleTimePeriodChange(period.value)}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
              
              {currentFilter.dateRange && (
                <div className="custom-date-range">
                  <div className="date-inputs">
                    <div className="date-input-group">
                      <label htmlFor="start-date">From</label>
                      <input
                        id="start-date"
                        type="date"
                        value={currentFilter.dateRange.start ? format(currentFilter.dateRange.start, 'yyyy-MM-dd') : ''}
                        onChange={(e) => handleDateRangeChange(e.target.value, format(currentFilter.dateRange?.end || new Date(), 'yyyy-MM-dd'))}
                      />
                    </div>
                    <div className="date-input-group">
                      <label htmlFor="end-date">To</label>
                      <input
                        id="end-date"
                        type="date"
                        value={currentFilter.dateRange.end ? format(currentFilter.dateRange.end, 'yyyy-MM-dd') : ''}
                        onChange={(e) => handleDateRangeChange(format(currentFilter.dateRange?.start || new Date(), 'yyyy-MM-dd'), e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-section">
              <h4 className="filter-section-title">Emotions</h4>
              <div className="emotion-filters">
                {emotions.map(emotion => (
                  <button
                    key={emotion}
                    className={`emotion-filter-btn ${currentFilter.emotions.includes(emotion) ? 'selected' : ''} emotion-${emotion.toLowerCase()}`}
                    onClick={() => handleEmotionToggle(emotion)}
                  >
                    <span className="emotion-color-dot"></span>
                    <span className="emotion-name">{emotion}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-section">
              <h4 className="filter-section-title">Tags</h4>
              <div className="tag-filters">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-btn ${currentFilter.tags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="filters-footer">
            <button 
              className="clear-filters-btn" 
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              Clear All Filters
            </button>
            <button 
              className="apply-filters-btn" 
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .journal-search {
          position: relative;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .search-input-container {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 2.5rem 0.625rem 2.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #1f2937;
          background-color: #fff;
        }

        .search-input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
        }

        .clear-search {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 1.25rem;
          background: none;
          border: none;
          cursor: pointer;
        }

        .filter-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background-color: #fff;
          color: #6b7280;
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-button:hover {
          background-color: #f9fafb;
        }

        .filter-button.has-filters {
          border-color: #4f46e5;
          color: #4f46e5;
        }

        .filter-icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        .filters-badge {
          position: absolute;
          top: -0.375rem;
          right: -0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          background-color: #4f46e5;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 9999px;
        }

        .filters-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 1rem;
          width: 20rem;
          background-color: white;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          z-index: 50;
        }

        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .filters-title {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-filters {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #6b7280;
          cursor: pointer;
        }

        .filters-content {
          padding: 1rem;
          max-height: 24rem;
          overflow-y: auto;
        }

        .filter-section {
          margin-bottom: 1.5rem;
        }

        .filter-section:last-child {
          margin-bottom: 0;
        }

        .filter-section-title {
          margin: 0 0 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .time-periods {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .time-period-btn {
          padding: 0.375rem 0.75rem;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-period-btn:hover {
          background-color: #f9fafb;
        }

        .time-period-btn.selected {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }

        .custom-date-range {
          margin-top: 0.75rem;
        }

        .date-inputs {
          display: flex;
          gap: 0.5rem;
        }

        .date-input-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .date-input-group label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .date-input-group input {
          padding: 0.375rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .emotion-filters {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .emotion-filter-btn {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emotion-filter-btn:hover {
          background-color: #f9fafb;
        }

        .emotion-filter-btn.selected {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }

        .emotion-filter-btn.emotion-joyful {
          --emotion-color: #fbbf24;
        }

        .emotion-filter-btn.emotion-optimistic {
          --emotion-color: #a3e635;
        }

        .emotion-filter-btn.emotion-content {
          --emotion-color: #34d399;
        }

        .emotion-filter-btn.emotion-neutral {
          --emotion-color: #60a5fa;
        }

        .emotion-filter-btn.emotion-fatigued {
          --emotion-color: #818cf8;
        }

        .emotion-filter-btn.emotion-anxious {
          --emotion-color: #a78bfa;
        }

        .emotion-filter-btn.emotion-frustrated {
          --emotion-color: #f472b6;
        }

        .emotion-filter-btn.emotion-discouraged {
          --emotion-color: #fb7185;
        }

        .emotion-color-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background-color: var(--emotion-color);
          margin-right: 0.375rem;
        }

        .emotion-name {
          text-transform: capitalize;
        }

        .tag-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag-filter-btn {
          padding: 0.375rem 0.75rem;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tag-filter-btn:hover {
          background-color: #f9fafb;
        }

        .tag-filter-btn.selected {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }

        .filters-footer {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .clear-filters-btn, .apply-filters-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-filters-btn {
          background-color: white;
          border: 1px solid #e5e7eb;
          color: #4b5563;
        }

        .clear-filters-btn:hover:not(:disabled) {
          background-color: #f9fafb;
        }

        .clear-filters-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .apply-filters-btn {
          background-color: #4f46e5;
          border: 1px solid #4f46e5;
          color: white;
        }

        .apply-filters-btn:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
};

export default JournalSearch;
