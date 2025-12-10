import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import JournalEditor from './journal/JournalEditor';
import JournalTimeline from './journal/JournalTimeline';
import JournalEmotionTracker from './journal/JournalEmotionTracker';
import JournalEntryList from './journal/JournalEntryList';
import JournalSearch from './journal/JournalSearch';
import JournalVisualization from './journal/JournalVisualization';
import JournalSharingControls from './journal/JournalSharingControls';
import { JournalEntry, Emotion, JournalFilter } from '@/types/journal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUser } from '@/hooks/useUser';
import { useFetchWithCache } from '@/hooks/useFetchWithCache';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { encryptData, decryptData } from '@/utils/encryption';
import './ProgressJournal.css';

const AUTOSAVE_INTERVAL = 15000; // 15 seconds

const ProgressJournal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<JournalFilter>({ text: '', tags: [], emotions: [], dateRange: null });
  const [viewMode, setViewMode] = useState<'editor' | 'timeline' | 'list'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, phase } = useUser();
  const { cachedData, isOnline, syncStatus } = useOfflineSync();
  const { getStoredValue, setStoredValue } = useLocalStorage();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch journal entries from API
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/journal/entries');
      
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      
      const data = await response.json();
      const decryptedEntries = data.entries.map((entry: any) => ({
        ...entry,
        content: decryptData(entry.content, user.id), // Decrypt content
      }));
      
      setEntries(decryptedEntries);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError('Failed to load journal entries. Please try again.');
      setIsLoading(false);
      
      // Load from cache if available
      const cachedEntries = getStoredValue('journal_entries');
      if (cachedEntries) {
        setEntries(JSON.parse(cachedEntries));
      }
    }
  }, [user, getStoredValue]);

  // Initialize component
  useEffect(() => {
    fetchEntries();
    
    // Load draft from localStorage if exists
    const savedDraft = getStoredValue('journal_draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setCurrentEntry(draft);
      setIsDraft(true);
    }
    
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [fetchEntries, getStoredValue]);

  // Filter entries based on search criteria
  const filteredEntries = useCallback(() => {
    return entries.filter(entry => {
      // Text search
      if (filter.text && !entry.content.toLowerCase().includes(filter.text.toLowerCase()) && 
          !entry.title.toLowerCase().includes(filter.text.toLowerCase())) {
        return false;
      }
      
      // Tags filter
      if (filter.tags.length > 0 && !filter.tags.some(tag => entry.tags.includes(tag))) {
        return false;
      }
      
      // Emotions filter
      if (filter.emotions.length > 0 && !filter.emotions.includes(entry.emotion)) {
        return false;
      }
      
      // Date range filter
      if (filter.dateRange) {
        const entryDate = new Date(entry.date);
        if (entryDate < filter.dateRange.start || entryDate > filter.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }, [entries, filter]);

  // Handle creating a new entry
  const handleNewEntry = () => {
    const newEntry: JournalEntry = {
      id: `draft-${Date.now()}`,
      title: 'Untitled Entry',
      content: '',
      date: new Date().toISOString(),
      emotion: 'neutral',
      tags: [phase?.name || 'general'],
      isDraft: true,
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isShared: false,
      sharedWith: []
    };
    
    setCurrentEntry(newEntry);
    setIsEditing(true);
    setIsDraft(true);
    setViewMode('editor');
    
    // Save draft to localStorage
    setStoredValue('journal_draft', JSON.stringify(newEntry));
  };

  // Handle saving an entry
  const handleSaveEntry = async (entry: JournalEntry, publish: boolean = false) => {
    if (!user) return;
    
    try {
      const entryToSave = {
        ...entry,
        isDraft: !publish,
        updatedAt: new Date().toISOString(),
        content: encryptData(entry.content, user.id) // Encrypt content
      };
      
      if (publish) {
        entryToSave.createdAt = new Date().toISOString();
      }
      
      const method = entry.id.startsWith('draft-') ? 'POST' : 'PUT';
      const endpoint = entry.id.startsWith('draft-') 
        ? '/api/journal/entries' 
        : `/api/journal/entries/${entry.id}`;
      
      if (isOnline) {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entryToSave)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save journal entry');
        }
        
        const savedEntry = await response.json();
        
        if (publish) {
          // Remove from drafts
          localStorage.removeItem('journal_draft');
          setIsDraft(false);
          
          // Add to entries list
          setEntries(prev => [
            { 
              ...savedEntry, 
              content: decryptData(savedEntry.content, user.id) 
            }, 
            ...prev
          ]);
        } else {
          // Update entry in list if it exists
          setEntries(prev => prev.map(e => 
            e.id === savedEntry.id 
              ? { ...savedEntry, content: decryptData(savedEntry.content, user.id) } 
              : e
          ));
          
          // Save draft to localStorage
          setStoredValue('journal_draft', JSON.stringify({
            ...entry,
            updatedAt: new Date().toISOString()
          }));
        }
        
        setCurrentEntry(publish ? null : entry);
        if (publish) setIsEditing(false);
      } else {
        // Store offline changes to be synced later
        const offlineChanges = getStoredValue('journal_offline_changes') || '[]';
        const changes = JSON.parse(offlineChanges);
        changes.push({
          type: method,
          endpoint,
          data: entryToSave,
          timestamp: Date.now()
        });
        setStoredValue('journal_offline_changes', JSON.stringify(changes));
        
        // Update local entries
        if (publish) {
          // Generate temporary ID for new entry
          const tempEntry = {
            ...entry,
            id: `temp-${Date.now()}`,
            isDraft: false,
            updatedAt: new Date().toISOString()
          };
          
          setEntries(prev => [tempEntry, ...prev]);
          localStorage.removeItem('journal_draft');
          setIsDraft(false);
          setCurrentEntry(null);
          setIsEditing(false);
        } else {
          // Save draft to localStorage
          setStoredValue('journal_draft', JSON.stringify({
            ...entry,
            updatedAt: new Date().toISOString()
          }));
        }
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save journal entry. Your changes have been saved locally.');
      
      // Save to localStorage for offline recovery
      const offlineEntries = getStoredValue('journal_entries') || '[]';
      const updatedEntries = JSON.parse(offlineEntries);
      const entryIndex = updatedEntries.findIndex((e: JournalEntry) => e.id === entry.id);
      
      if (entryIndex >= 0) {
        updatedEntries[entryIndex] = entry;
      } else {
        updatedEntries.unshift(entry);
      }
      
      setStoredValue('journal_entries', JSON.stringify(updatedEntries));
    }
  };

  // Handle auto-saving drafts
  useEffect(() => {
    if (currentEntry && isDraft) {
      autosaveTimerRef.current = setInterval(() => {
        handleSaveEntry(currentEntry, false);
      }, AUTOSAVE_INTERVAL);
    }
    
    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [currentEntry, isDraft]);

  // Handle selecting an entry to view/edit
  const handleSelectEntry = (entryId: string) => {
    const selected = entries.find(entry => entry.id === entryId);
    if (selected) {
      setCurrentEntry(selected);
      setIsEditing(false);
      setIsDraft(selected.isDraft);
      setViewMode('editor');
    }
  };

  // Handle editing an entry
  const handleEditEntry = () => {
    if (currentEntry) {
      setIsEditing(true);
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    
    try {
      if (isOnline) {
        const response = await fetch(`/api/journal/entries/${entryId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete journal entry');
        }
      } else {
        // Store offline changes to be synced later
        const offlineChanges = getStoredValue('journal_offline_changes') || '[]';
        const changes = JSON.parse(offlineChanges);
        changes.push({
          type: 'DELETE',
          endpoint: `/api/journal/entries/${entryId}`,
          timestamp: Date.now()
        });
        setStoredValue('journal_offline_changes', JSON.stringify(changes));
      }
      
      // Update state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      if (currentEntry?.id === entryId) {
        setCurrentEntry(null);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error deleting journal entry:', err);
      setError('Failed to delete journal entry.');
    }
  };

  // Handle emotion selection
  const handleEmotionChange = (emotion: Emotion) => {
    if (currentEntry) {
      const updatedEntry = { ...currentEntry, emotion };
      setCurrentEntry(updatedEntry);
      
      if (isEditing) {
        handleSaveEntry(updatedEntry, false);
      }
    }
  };

  // Handle date selection from calendar/timeline
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Find entries for the selected date
    const entriesForDate = entries.filter(entry => 
      entry.date.substring(0, 10) === formattedDate
    );
    
    if (entriesForDate.length > 0) {
      setCurrentEntry(entriesForDate[0]);
      setIsEditing(false);
      setIsDraft(entriesForDate[0].isDraft);
    } else {
      // Create a new entry for this date
      handleNewEntry();
    }
  };

  // Export journal entries
  const handleExport = async (format: 'pdf' | 'markdown', entryIds?: string[]) => {
    try {
      const entriesToExport = entryIds 
        ? entries.filter(entry => entryIds.includes(entry.id))
        : entries;
      
      const response = await fetch('/api/journal/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entries: entriesToExport,
          format
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to export journal entries');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal-export-${format === 'pdf' ? 'pdf' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting journal entries:', err);
      setError('Failed to export journal entries.');
    }
  };

  // Share entry with practitioner
  const handleShareEntry = async (entryId: string, practitionerIds: string[]) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const updatedEntry = {
        ...entry,
        isShared: true,
        sharedWith: practitionerIds
      };
      
      const response = await fetch(`/api/journal/entries/${entryId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          practitionerIds
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to share journal entry');
      }
      
      // Update entry in list
      setEntries(prev => prev.map(e => 
        e.id === entryId ? updatedEntry : e
      ));
      
      if (currentEntry?.id === entryId) {
        setCurrentEntry(updatedEntry);
      }
    } catch (err) {
      console.error('Error sharing journal entry:', err);
      setError('Failed to share journal entry.');
    }
  };

  // Render the journal interface
  return (
    <div className="progress-journal" data-testid="progress-journal">
      <div className="journal-header">
        <h1>Progress Journal</h1>
        <div className="journal-actions">
          <button 
            className="new-entry-btn" 
            onClick={handleNewEntry}
            aria-label="Create new journal entry"
          >
            New Entry
          </button>
          <div className="view-toggles">
            <button 
              className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`} 
              onClick={() => setViewMode('list')}
              aria-label="Show journal entries list"
              aria-pressed={viewMode === 'list' ? 'true' : 'false'}
            >
              List
            </button>
            <button 
              className={`view-toggle ${viewMode === 'timeline' ? 'active' : ''}`} 
              onClick={() => setViewMode('timeline')}
              aria-label="Show journal timeline"
              aria-pressed={viewMode === 'timeline' ? 'true' : 'false'}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}
      
      {isLoading ? (
        <div className="loading-indicator" data-testid="loading-indicator">
          <div className="spinner"></div>
          <span>Loading journal entries...</span>
        </div>
      ) : (
        <div className="journal-content">
          {viewMode === 'list' && (
            <div className="entries-container">
              <JournalSearch 
                onFilterChange={setFilter} 
                currentFilter={filter}
              />
              <JournalEntryList 
                entries={filteredEntries()} 
                onSelectEntry={handleSelectEntry}
                onDeleteEntry={handleDeleteEntry}
                onShareEntry={handleShareEntry}
              />
            </div>
          )}
          
          {viewMode === 'timeline' && (
            <div className="timeline-container">
              <JournalTimeline 
                entries={entries}
                onSelectDate={handleDateSelect}
                selectedDate={selectedDate}
              />
              <JournalVisualization entries={entries} />
            </div>
          )}
          
          {viewMode === 'editor' && currentEntry && (
            <div className="editor-container">
              <div className="editor-sidebar">
                <div className="entry-metadata">
                  <p className="entry-date">
                    {format(new Date(currentEntry.date), 'MMMM d, yyyy')}
                  </p>
                  <div className="entry-tags">
                    {currentEntry.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <JournalEmotionTracker 
                  selectedEmotion={currentEntry.emotion}
                  onEmotionChange={handleEmotionChange}
                  readOnly={!isEditing}
                />
                <div className="editor-actions">
                  {!isEditing ? (
                    <button 
                      className="edit-btn" 
                      onClick={handleEditEntry}
                      aria-label="Edit this entry"
                    >
                      Edit Entry
                    </button>
                  ) : (
                    <>
                      <button 
                        className="save-draft-btn" 
                        onClick={() => handleSaveEntry(currentEntry, false)}
                        aria-label="Save as draft"
                      >
                        Save Draft
                      </button>
                      <button 
                        className="publish-btn" 
                        onClick={() => handleSaveEntry(currentEntry, true)}
                        aria-label="Publish entry"
                      >
                        Publish
                      </button>
                    </>
                  )}
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeleteEntry(currentEntry.id)}
                    aria-label="Delete this entry"
                  >
                    Delete
                  </button>
                </div>
                {!isEditing && (
                  <JournalSharingControls
                    entry={currentEntry}
                    onShareEntry={handleShareEntry}
                    onExportEntry={(format) => handleExport(format, [currentEntry.id])}
                  />
                )}
              </div>
              <div className="editor-main">
                <input
                  type="text"
                  className="entry-title-input"
                  value={currentEntry.title}
                  onChange={(e) => setCurrentEntry({...currentEntry, title: e.target.value})}
                  readOnly={!isEditing}
                  placeholder="Entry Title"
                  aria-label="Entry title"
                />
                <JournalEditor
                  content={currentEntry.content}
                  onChange={(content) => setCurrentEntry({...currentEntry, content})}
                  readOnly={!isEditing}
                />
              </div>
            </div>
          )}
          
          {viewMode === 'editor' && !currentEntry && (
            <div className="no-entry-selected">
              <p>No journal entry selected.</p>
              <button onClick={handleNewEntry}>Create New Entry</button>
            </div>
          )}
        </div>
      )}
      
      {!isOnline && (
        <div className="offline-indicator" role="status">
          You're currently offline. Changes will be synced when you reconnect.
        </div>
      )}
    </div>
  );
};

export default ProgressJournal;
