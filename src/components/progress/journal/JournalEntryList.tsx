import React, { useState } from 'react';
import { format } from 'date-fns';
import { JournalEntry } from '@/types/journal';

interface JournalEntryListProps {
  entries: JournalEntry[];
  onSelectEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onShareEntry: (entryId: string, practitionerIds: string[]) => void;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({
  entries,
  onSelectEntry,
  onDeleteEntry,
  onShareEntry
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Group entries by month
  const groupedEntries = entries.reduce<Record<string, JournalEntry[]>>((groups, entry) => {
    const date = new Date(entry.date);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMMM yyyy');
    
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    
    groups[monthKey].push(entry);
    return groups;
  }, {});

  // Sort months in descending order
  const sortedMonths = Object.keys(groupedEntries).sort().reverse();

  // Handle entry selection
  const handleSelectEntry = (entryId: string) => {
    setSelectedEntryId(entryId);
    onSelectEntry(entryId);
  };

  // Handle entry deletion with confirmation
  const handleDeleteConfirm = (entryId: string) => {
    setShowDeleteConfirm(null);
    onDeleteEntry(entryId);
  };

  // Get preview text (limited to 100 chars)
  const getPreviewText = (content: string): string => {
    try {
      // Try parsing as JSON (Draft.js format)
      const contentObj = JSON.parse(content);
      if (contentObj.blocks && contentObj.blocks.length > 0) {
        const plainText = contentObj.blocks.map((block: any) => block.text).join(' ');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
      }
    } catch (e) {
      // If not JSON, return as is
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    }
    
    return '(No content)';
  };

  return (
    <div className="journal-entry-list" data-testid="journal-entry-list">
      {entries.length === 0 ? (
        <div className="no-entries">
          <p>No journal entries found.</p>
          <p>Create a new entry to get started!</p>
        </div>
      ) : (
        <div className="entries-by-month">
          {sortedMonths.map(monthKey => (
            <div key={monthKey} className="month-group">
              <h3 className="month-heading">{format(new Date(monthKey), 'MMMM yyyy')}</h3>
              
              <div className="entries-list">
                {groupedEntries[monthKey]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(entry => (
                    <div 
                      key={entry.id}
                      className={`entry-item ${selectedEntryId === entry.id ? 'selected' : ''} ${entry.isDraft ? 'draft' : ''}`}
                      onClick={() => handleSelectEntry(entry.id)}
                    >
                      <div className="entry-details">
                        <div className="entry-header">
                          <h4 className="entry-title">{entry.title}</h4>
                          <span className="entry-date">{format(new Date(entry.date), 'MMM d')}</span>
                        </div>
                        
                        <p className="entry-preview">
                          {getPreviewText(entry.content)}
                        </p>
                        
                        <div className="entry-footer">
                          <div className="entry-emotion" title={`Mood: ${entry.emotion}`}>
                            <span className={`emotion-indicator emotion-${entry.emotion.toLowerCase()}`}></span>
                            <span className="emotion-label">{entry.emotion}</span>
                          </div>
                          
                          {entry.tags.length > 0 && (
                            <div className="entry-tags">
                              {entry.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                              {entry.tags.length > 2 && <span className="tags-more">+{entry.tags.length - 2}</span>}
                            </div>
                          )}
                          
                          {entry.isDraft && <span className="draft-badge">Draft</span>}
                          {entry.isShared && <span className="shared-badge">Shared</span>}
                        </div>
                      </div>
                      
                      <div className="entry-actions">
                        <button 
                          className="entry-action-btn share-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareEntry(entry.id, []);
                          }}
                          aria-label="Share entry"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                        </button>
                        
                        <button 
                          className="entry-action-btn delete-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(entry.id);
                          }}
                          aria-label="Delete entry"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {showDeleteConfirm === entry.id && (
                          <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
                            <p>Delete this entry?</p>
                            <div className="delete-confirm-actions">
                              <button 
                                className="confirm-btn" 
                                onClick={() => handleDeleteConfirm(entry.id)}
                              >
                                Yes, delete
                              </button>
                              <button 
                                className="cancel-btn" 
                                onClick={() => setShowDeleteConfirm(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .journal-entry-list {
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        .no-entries {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
          text-align: center;
        }

        .entries-by-month {
          padding: 1rem;
        }

        .month-group {
          margin-bottom: 2rem;
        }

        .month-heading {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .entries-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .entry-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          border: 1px solid #e5e7eb;
        }

        .entry-item:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .entry-item.selected {
          border-color: #4f46e5;
          background-color: rgba(79, 70, 229, 0.05);
        }

        .entry-item.draft {
          border-style: dashed;
        }

        .entry-details {
          flex: 1;
          min-width: 0;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .entry-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entry-date {
          font-size: 0.75rem;
          color: #6b7280;
          white-space: nowrap;
          margin-left: 0.5rem;
        }

        .entry-preview {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0 0 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-height: 1.4;
        }

        .entry-footer {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .entry-emotion {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .emotion-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 0.25rem;
        }

        .emotion-joyful {
          background-color: #fbbf24;
        }

        .emotion-optimistic {
          background-color: #a3e635;
        }

        .emotion-content {
          background-color: #34d399;
        }

        .emotion-neutral {
          background-color: #60a5fa;
        }

        .emotion-fatigued {
          background-color: #818cf8;
        }

        .emotion-anxious {
          background-color: #a78bfa;
        }

        .emotion-frustrated {
          background-color: #f472b6;
        }

        .emotion-discouraged {
          background-color: #fb7185;
        }

        .emotion-label {
          text-transform: capitalize;
        }

        .entry-tags {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .tag {
          background-color: #e5e7eb;
          color: #4b5563;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }

        .tags-more {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .draft-badge, .shared-badge {
          font-size: 0.625rem;
          text-transform: uppercase;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }

        .draft-badge {
          background-color: #fef3c7;
          color: #92400e;
        }

        .shared-badge {
          background-color: #e0e7ff;
          color: #4338ca;
        }

        .entry-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-left: 0.5rem;
          position: relative;
        }

        .entry-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: none;
          border-radius: 50%;
          background-color: #f3f4f6;
          color: #4b5563;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .entry-action-btn:hover {
          background-color: #e5e7eb;
        }

        .entry-action-btn.share-btn:hover {
          color: #4f46e5;
        }

        .entry-action-btn.delete-btn:hover {
          color: #ef4444;
        }

        .delete-confirm {
          position: absolute;
          top: -20px;
          right: 0;
          width: 200px;
          padding: 0.75rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 10;
          border: 1px solid #e5e7eb;
        }

        .delete-confirm p {
          margin: 0 0 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        .delete-confirm-actions {
          display: flex;
          gap: 0.5rem;
        }

        .confirm-btn, .cancel-btn {
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
        }

        .confirm-btn {
          background-color: #ef4444;
          color: white;
          border: none;
        }

        .cancel-btn {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};

// Helper to map emotions to colors
const getEmotionColor = (emotion: string): string => {
  const emotionColors: Record<string, string> = {
    'joyful': '#fbbf24',
    'optimistic': '#a3e635',
    'content': '#34d399',
    'neutral': '#60a5fa',
    'fatigued': '#818cf8',
    'anxious': '#a78bfa',
    'frustrated': '#f472b6',
    'discouraged': '#fb7185'
  };
  
  return emotionColors[emotion] || '#9ca3af';
};

export default JournalEntryList;
